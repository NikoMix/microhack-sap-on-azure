---
description: >-
  Draft a consulting-style SAP on Azure case study for Module B control B.1.1
  (Implementation Capability). Produces a structured narrative covering customer
  background, challenge, solution architecture, SAP-on-Azure service usage, and
  measurable business outcomes. Output can be refined and saved as
  B11_CaseStudy_v[N].pdf evidence.
argument-hint: >-
  Describe the customer scenario — e.g. "Contoso AG, German manufacturer,
  migrated 3-tier SAP ECC to S/4HANA on Azure M-series with ANF". Leave blank
  to use the mock data in tools/data/sap-landscape.json.
tools: [read, edit, search]
---

# Skill: Draft Case Study (B.1.1)

Produce a consulting-grade case study that satisfies Module B control **B.1.1 —
SAP on Azure Implementation Capability**. The output is a structured Markdown
document ready to be converted to a PDF evidence artefact.

## Inputs

| Variable          | Source                                               | Default                                   |
| ----------------- | ---------------------------------------------------- | ----------------------------------------- |
| `customer`        | argument or `tools/data/sap-landscape.json`.customer | Contoso AG                                |
| `landscape_json`  | `tools/data/sap-landscape.json`                      | read automatically                        |
| `systems`         | `landscape_json.systems`                             | all systems in the JSON                   |
| `azure_resources` | `landscape_json.azure_resources`                     | all resources in the JSON                 |
| `version`         | argument or 1                                        | `v1`                                      |
| `output_path`     | argument or default                                  | `labs/Module B/B11/B11_CaseStudy_v[N].md` |

## Output

A Markdown file at `output_path` with the following structure, saved to the
repository. The file name follows the evidence naming convention:
`B11_CaseStudy_v[N].pdf` (the Markdown is the source; the trainer exports to PDF).

## Workflow

### Step 1 — Load source data

Read `tools/data/sap-landscape.json`. Extract:

- `metadata.customer.name`, `metadata.customer.industry`, `metadata.customer.region`
- All items in `systems[]` (SID, type, tier, saps, azure_vm_sku, ha_config)
- All items in `azure_resources[]` (resource_type, sku, purpose)

If the user provided a custom scenario description, use it as the authoritative
context and supplement with the JSON for technical details.

### Step 2 — Identify key Azure services used

Map each system and resource to the SAP-on-Azure service reference set:

| Azure service                         | Evidence signal                              |
| ------------------------------------- | -------------------------------------------- |
| M/Mv2/Mv3-series VMs                  | Certified HANA and App server sizing         |
| Azure NetApp Files (Ultra/Premium)    | Shared NFS for HANA data/log and transport   |
| Premium SSD v2                        | Cost-optimised HANA log I/O                  |
| Availability Zones                    | 99.99% SLA, zone-pinned HANA + ASCS          |
| ExpressRoute                          | Low-latency on-prem to Azure connectivity    |
| Azure Center for SAP solutions (ACSS) | Managed deployment and lifecycle             |
| Azure Monitor for SAP solutions       | SAP-aware health monitoring and alerting     |
| Azure Backup for SAP HANA (Backint)   | Policy-based, Backint-certified HANA backups |
| Pacemaker + SBD (ASCS/ERS)            | High availability for SAP application tier   |

### Step 3 — Draft the case study

Produce the following sections:

`````markdown
# Case Study: [Customer Name] — SAP on Azure

## Executive Summary

[2–3 sentences: who the customer is, what they achieved, the headline business
outcome (e.g. "reduced TCO by 32 %, reduced RTO from 4 h to 35 min").]

## Customer Background

- **Industry:** [industry]
- **Region:** [region]
- **SAP Landscape:** [list of systems, e.g. "S/4HANA 2023 (P/Q/D), BW/4HANA 2024 (P)"]
- **Before Azure:** [brief on-premises or legacy cloud description]

## Challenge

[3–4 sentences: the business and technical challenge that drove the migration —
e.g. end-of-support for Oracle DB on-prem, HANA certification requirements,
HA/DR constraints.]

## Solution Architecture

[Describe the architecture referencing specific Azure services and VM SKUs from
Step 2. Include Availability Zones, ANF tiers, ExpressRoute, ACSS, AMS.]

### Architecture highlights

| Component | Azure service / SKU | Purpose |
| --------- | ------------------- | ------- |

[one row per azure_resource from the JSON]

## Implementation approach

[Describe the phased migration approach: assess → migrate → optimise. Reference
ACSS for deployment automation, Azure Migrate for discovery.]

## Business outcomes

| Metric            | Before             | After (Azure)          | Improvement       |
| ----------------- | ------------------ | ---------------------- | ----------------- |
| RTO               | 4 h                | 35 min                 | −85 %             |
| RPO               | 24 h               | 15 min                 | −99 %             |
| Monthly compute   | [on-prem baseline] | [Azure cost from JSON] | [% saving]        |
| SAP system uptime | 99.5 %             | 99.99 %                | +0.49 pp (AZ SLA) |

## Lessons learned & best practices

[3–5 bullets referencing SAP Notes, Azure SAP workload documentation, and
any microhack-specific insights.]

## Evidence artefacts produced

- `B11_CaseStudy_v1.pdf` — this document
- `B11_HLD_v1.pdf` — High-Level Design (see `generate-hld` skill)

_Control reference: Module B · B.1.1 — SAP on Azure Implementation Capability_

````text
### Step 4 — Save the file

Create the directory `labs/Module B/B11/` if it does not exist, then write the
Markdown to `labs/Module B/B11/B11_CaseStudy_v[version].md`.

Confirm the path and line count after saving.

### Step 5 — Summarise for the student

Print a short summary:

```text
✅ B.1.1 Case Study drafted
   File  : labs/Module B/B11/B11_CaseStudy_v1.md
   Lines : [N]
   Next  : run `generate-hld` to produce the architecture diagram and HLD.
           Export to PDF (File > Export as PDF in VS Code) and rename to
           B11_CaseStudy_v1.pdf before uploading to your evidence pack.
```
## Example invocation

```text
@moduleb-lab-coach #draft-case-study
```
Or with custom context:

```text
@moduleb-lab-coach #draft-case-study Contoso AG, automotive Tier-1 supplier,
migrated SAP ECC 6 EHP8 + BW to S/4HANA 2023 on Azure in West Europe.
Used M96s_v3 for HANA, ANF Ultra for data/log. 3 plants, 6000 concurrent users.
```
## References

- Evidence naming convention: `[ControlRef]_[DocumentType]_v[N].pdf`
- Mock landscape: `tools/data/sap-landscape.json`
- Module B control: B.1.1 — [NikoMix/specialization-sap-on-azure](https://github.com/NikoMix/specialization-sap-on-azure)
- SAP on Azure: [docs.microsoft.com/azure/sap](https://learn.microsoft.com/en-us/azure/sap/workloads/get-started)
````
`````
