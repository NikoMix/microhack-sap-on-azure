# C3 · B.2.1 — ACR Performance (SAP-eligible services)

**Goal:** use the Azure MCP server and the `annotate-acr` Copilot skill to isolate SAP-eligible
Azure Consumed Revenue, build a 3-month trend, and set up PAL attribution on a subscription —
producing the `B21_ACRBreakdown_v1` evidence artefact. **Time:** ~60 minutes.

> The full screenshot-rich walkthrough lives on the course site at **C3 · B.2.1 ACR Performance**.
> This README is the terminal-first quick-reference.

## Control

| Control | Requirement                                        | Evidence                    |
| ------- | -------------------------------------------------- | --------------------------- |
| B.2.1   | ≥ USD 100 K SAP-eligible ACR in trailing 12 months | Annotated breakdown + trend |

## SAP-eligible services (summary)

M/Mv2/Mv3 VMs · Azure NetApp Files · Premium SSD v2 · Ultra Disk · ExpressRoute ·
Azure Center for SAP solutions · Azure Monitor for SAP solutions · Azure Backup for SAP HANA

## Prerequisites

- C0 complete: Azure CLI authenticated, Azure MCP server active in Copilot.
- Either a sandbox subscription with SAP spend **or** use the sample data below.
- PAL **not yet set** on sandbox subscription (set it in Step 4).

## Steps

1. **Inspect sample data**

   ```bash
   head -6 labs/challenge-3-acr/sample-data/consumption-by-service.csv
   ```

2. **Pull consumption via Copilot + Azure MCP**

   Open Copilot Chat:

   ```text
   @moduleb-lab-coach Read labs/challenge-3-acr/sample-data/consumption-by-service.csv
   and summarise total cost per ServiceName for each month. Format as a markdown table.
   ```

3. **Annotate SAP-eligible spend**

   ```text
   @moduleb-lab-coach Run the annotate-acr skill on the table above. For each row:
   mark SAP-ELIGIBLE or NON-ELIGIBLE, compute the SAP-eligible subtotal,
   and estimate annualised ACR vs the USD 100,000 T12M threshold.
   ```

4. **Set up PAL**

   ```bash
   az managementpartner create --partner-id <YOUR_MPN_ID>
   az managementpartner show
   ```

   Or use **Azure Portal → All Services → Partner Admin Link → + Add**.

5. **Save the evidence file**

   ```bash
   mkdir -p labs/challenge-3-acr/evidence
   # Paste Copilot's annotated output into this file
   echo "# B.2.1 — ACR Breakdown" > labs/challenge-3-acr/evidence/B21_ACRBreakdown_v1.md
   ```

## Sample data

| File                                     | Description                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| `sample-data/consumption-by-service.csv` | 3-month fictitious consumption: M-series VMs, ANF, ExpressRoute, non-SAP services |

The data is seeded deterministically so that the SAP-eligible subtotal is ≈ USD 53,120 over
3 months (≈ USD 212 K annualised), comfortably above the B.2.1 threshold.

## Definition of done

- [ ] Annotated consumption table shows SAP-eligible vs non-eligible split.
- [ ] Annualised SAP-eligible ACR > USD 100 K (sample data).
- [ ] `az managementpartner show` returns your MPN ID.
- [ ] `labs/challenge-3-acr/evidence/B21_ACRBreakdown_v1.md` exists.

## Trainer notes

- Keep Step 4 (PAL) to 5 minutes — most trainees already have a PAL in the wild.
- The `annotate-acr` skill file lives in `.github/prompts/annotate-acr.prompt.md` (AI-tooling
  workstream). If it is missing, Copilot can still run an inline annotation using the service list
  in the module page.
- Common issue: trainees query a subscription with zero M-series VMs and get an all-NON-ELIGIBLE
  result. Point them to the sample CSV.
