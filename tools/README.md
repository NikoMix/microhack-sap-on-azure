# Tools

License-free helper scripts used by the labs and the build. All generators are
**deterministic** (seeded) — the same seed always produces the same output, making
classroom exercises reproducible across every student environment.

## Quick start

````bash
# Generate all datasets (seed=42, default)
node tools/generate-sap-landscape.js
node tools/generate-consumption.js

# Validate generated data
node tools/validate-datasets.js

# Regenerate with a different seed
node tools/generate-sap-landscape.js --seed 99
node tools/generate-consumption.js --seed 99
```text
## Files

| File                        | Description                                                         |
| --------------------------- | ------------------------------------------------------------------- |
| `generate-sap-landscape.js` | Generates `tools/data/sap-landscape.json` — simulated SAP inventory |
| `generate-consumption.js`   | Generates `tools/data/consumption.csv` + `.json` — Azure spend data |
| `validate-datasets.js`      | Validates both data files against expected schemas (29 checks)      |
| `data/sap-landscape.json`   | Pre-generated SAP landscape inventory (seed=42)                     |
| `data/consumption.json`     | Pre-generated Azure consumption export, 3 months (seed=42)          |
| `data/consumption.csv`      | Same data as CSV (column headers + 69 data rows)                    |

## Generators

### `generate-sap-landscape.js`

Produces a simulated SAP-on-Azure landscape for one customer (Contoso AG by
default) with realistic systems, Azure resource mapping, network topology, and
a 5-customer diversity table for B.2.2.

**Output: `tools/data/sap-landscape.json`**

Key sections:

- `metadata` — seed, version, customer, region
- `systems[]` — 5 SAP systems (S4H-prod/qa/dev, BWP, SOL) with full Azure mapping:
  HANA VM SKU, SAPS, ANF tier, HA config, ACSS/AMS flags
- `azure_resources[]` — ExpressRoute GW, Azure Firewall, Key Vault, RSV, ACSS VIS, AMS monitor
- `network` — hub-spoke VNet layout with subnet CIDRs
- `customers[]` — 5 simulated customers with SAP products, PAL status, go-live date

**Used by labs:** C1 (B.1.1), C4 (B.2.2), C5 (B.3.1), C6 (B.4.1, B.4.2)

**CLI options:**

```text
--seed     N     PRNG seed (default: 42)
--out      FILE  Output JSON file (default: tools/data/sap-landscape.json)
--out-dir  DIR   Output directory; writes DIR/sap-landscape.json
```
### `generate-consumption.js`

Produces a 3-month simulated Azure consumption export for the SAP landing zone,
structured as both JSON (structured) and CSV (flat, import-ready).

**Output: `tools/data/consumption.json`, `tools/data/consumption.csv`**

Coverage:

- **SAP-eligible services** (≈95% of spend): M-series VMs, Azure NetApp Files,
  Azure Backup (HANA Backint), ExpressRoute, ACSS, Azure Monitor for SAP
- **Other services** (≈5%): Azure Firewall, Bastion, Key Vault, Log Analytics

Each row includes: `date`, `billing_period`, `subscription_id`, `service_name`,
`meter_category`, `meter_name`, `cost_eur`, `sap_eligible`, `pal_linked`, `mpn_id`

**Used by labs:** C3 (B.2.1 ACR)

**CLI options:**

```text
--seed     N     PRNG seed (default: 42)
--out-dir  PATH  Output directory (default: tools/data)
```
### `validate-datasets.js`

Runs 29 schema and consistency checks across both data files. Exits 0 on success,
1 on any failure. Checks include:

- File existence
- JSON parse validity
- Required fields and types
- B.2.2 diversity requirements (≥3 customers, ≥2 industries, ≥2 regions)
- SAP-eligible rows present in consumption
- 3-month coverage
- Determinism (re-generates and diffs)

**CLI options:**

```text
--data-dir  PATH  Data directory to validate (default: tools/data)
```text
## Principles

- **Zero external dependencies** — Node 22 stdlib only (`node:fs`, `node:path`,
  `node:crypto`, `node:child_process`, `node:url`).
- **Deterministic output** — xorshift32 PRNG seeded at 42; same seed → identical
  output on every platform and Node version.
- **License-free** — all code is original, MIT licensed with the repository.
- **Cross-platform** — works on Linux, macOS, and Windows (Node 22).

## Evidence naming convention

Artefacts produced by the Copilot skills (see `.github/prompts/`) follow:

```text
[ControlRef]_[DocumentType]_v[N].pdf
```text
Examples: `B11_CaseStudy_v1.pdf`, `B21_ACRBreakdown_v1.pdf`, `B41_EvidenceIndex_v1.pdf`

Artefacts go under `labs/Module B/B[ref]/`.
````
