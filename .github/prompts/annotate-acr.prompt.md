---
description: >-
  Annotate an Azure Consumption Report (ACR) to isolate SAP-on-Azure-eligible
  spend, build a 3-month trend, identify PAL attribution gaps, and produce the
  annotated breakdown that satisfies Module B control B.2.1. Reads from
  tools/data/consumption.csv (or live Azure MCP query). Output:
  B21_ACRReport_v[N].md → PDF.
argument-hint: >-
  Optionally specify the Azure subscription or a CSV path. Leave blank to use
  tools/data/consumption.csv as the data source.
tools: [read, edit, search, mcp/azure]
---

# Skill: Annotate ACR — Azure Consumption Report (B.2.1)

Analyse an Azure Consumption Report, isolate the SAP-eligible service spend,
produce a trend table, flag PAL gaps, and draft the annotated report that
satisfies **B.2.1 — ACR Performance**.

## Inputs

| Variable      | Source                                            | Default                                   |
| ------------- | ------------------------------------------------- | ----------------------------------------- |
| `data_source` | argument: `csv:<path>` or `mcp:<subscription_id>` | `csv:tools/data/consumption.csv`          |
| `months`      | derived from data or argument                     | last 3 months in the CSV                  |
| `version`     | argument or 1                                     | `v1`                                      |
| `output_path` | default                                           | `labs/Module B/B21/B21_ACRReport_v[N].md` |

## SAP-eligible Azure service list

The following services count toward ACR attribution for SAP on Azure Advanced
Specialization. Any consumption of these services in the data source is
**SAP-eligible spend**:

| Service category  | Specific services / meter names                                                               |
| ----------------- | --------------------------------------------------------------------------------------------- |
| Compute           | Virtual Machines: M8ms, M16ms, M32ms, M64ms, M128ms, M208s_v2, M416ms_v2, M96s_v3, M192ims_v2 |
| Storage           | Azure NetApp Files (Ultra, Premium, Standard), Premium SSD v2                                 |
| Networking        | ExpressRoute, Virtual Network Gateway (Ultra Performance)                                     |
| SAP management    | Azure Center for SAP solutions (ACSS) — preview/GA                                            |
| Monitoring        | Azure Monitor for SAP solutions                                                               |
| Backup            | Azure Backup (SAP HANA Backint protected items)                                               |
| High availability | Azure Shared Disk (SBD fencing), Load Balancer (HA ports)                                     |

## Workflow

### Step 1 — Load consumption data

If `data_source` starts with `csv:`, read the file at the given path.
If `data_source` starts with `mcp:`, use the Azure MCP server:

```text
mcp/azure: get cost breakdown for the last 3 months in subscription [id],
           group by ServiceName, MeterCategory, filter status=Active
```

Parse the data into an in-memory table with columns:
`Date`, `ServiceName`, `MeterCategory`, `ResourceName`, `Quantity`, `Cost_EUR`, `Currency`.

### Step 2 — Tag SAP-eligible rows

For each row, set `sap_eligible = true` if the `ServiceName` or `MeterCategory`
matches any entry in the SAP-eligible service list above. Otherwise `false`.

Compute per-month totals:

- `total_spend` — all services
- `sap_eligible_spend` — SAP-eligible services only
- `sap_eligible_pct` — `sap_eligible_spend / total_spend * 100`

### Step 3 — Build the 3-month trend table

```markdown
| Month      | Total Azure Spend | SAP-Eligible Spend | SAP % | MoM Δ |
| ---------- | ----------------- | ------------------ | ----- | ----- |
| [Month -2] | € [X]             | € [Y]              | [Z]%  | —     |
| [Month -1] | € [X]             | € [Y]              | [Z]%  | [±Δ]% |
| [Month 0]  | € [X]             | € [Y]              | [Z]%  | [±Δ]% |
```

Highlight the trend direction (⬆ / ⬇ / →) and note significant movements.

### Step 4 — Service breakdown (top 10 by SAP-eligible spend)

```markdown
| Rank | Service                     | 3-Month Total | % of SAP-Eligible |
| ---- | --------------------------- | ------------- | ----------------- |
| 1    | Virtual Machines (M-series) | € [X]         | [Y]%              |
| 2    | Azure NetApp Files          | € [X]         | [Y]%              |

...
```

### Step 5 — PAL attribution check

Check whether the consumption data includes a `PartnerName` or `PALTag` column.
If not, add a **PAL gap alert** section:

```markdown
## ⚠️ PAL Attribution Gap

No Partner Admin Link (PAL) association was detected in this consumption export.
PAL attribution is required for ACR to count toward the B.2.1 performance metric.

**Resolution steps:**

1. Link your Microsoft AI Cloud Partner Program ID (MPN ID) to the Azure
   subscription via PAL: `az managementpartner create --partner-id [YOUR-MPN-ID]`
2. Verify the link is active: `az managementpartner show`
3. Re-run this skill after 24–48 hours to confirm attribution appears in the
   next consumption export.
```

If PAL data is present, show:

```markdown
## ✅ PAL Attribution

Partner ID: [MPN_ID]
Attribution confirmed in [N] of [N] months.
```

### Step 6 — Draft the full report

```markdown
# Azure Consumption Report Annotation — [Customer Name]

**Document version:** v[N]
**Reporting period:** [start date] – [end date]
**Subscription:** [subscription_id or name]
**Generated:** [date]

---

## 1. Executive Summary

[2–3 sentences summarising SAP-eligible spend, trend direction, and any
PAL or attribution actions required.]

## 2. 3-Month Consumption Trend

[Insert trend table from Step 3]

## 3. SAP-Eligible Service Breakdown

[Insert service breakdown table from Step 4]

## 4. PAL Attribution Status

[Insert PAL section from Step 5]

## 5. Recommendations

- [Action 1: PAL if missing, VM right-sizing, ANF tier review, etc.]
- [Action 2]

## 6. Control mapping

This report satisfies **Module B · B.2.1 — ACR Performance**.
Evidence file: `B21_ACRReport_v[N].pdf`
```

### Step 7 — Save and summarise

Write to `labs/Module B/B21/B21_ACRReport_v[version].md`.

```text
✅ B.2.1 ACR Report annotated
   File           : labs/Module B/B21/B21_ACRReport_v1.md
   SAP-eligible % : [Z]%
   PAL status     : [active / gap detected]
   Next           : Export to PDF as B21_ACRReport_v1.pdf.
                    If PAL gap found, run az managementpartner create
                    with your MPN ID before finalising.
```

## Example invocations

Using mock data (default):

```text
@moduleb-lab-coach #annotate-acr
```

Using live Azure MCP query:

```text
@moduleb-lab-coach #annotate-acr mcp:00000000-0000-0000-0000-000000000000
```

Using a custom CSV:

```text
@moduleb-lab-coach #annotate-acr csv:labs/my-export.csv
```

## References

- Evidence naming: `B21_ACRReport_v[N].pdf`
- Mock consumption data: `tools/data/consumption.csv`, `tools/data/consumption.json`
- PAL docs: [learn.microsoft.com/partner-center/link-partner-id-for-azure-partner](https://learn.microsoft.com/en-us/partner-center/link-partner-id-for-azure-partner-admin-link)
- Control B.2.1: [NikoMix/specialization-sap-on-azure](https://github.com/NikoMix/specialization-sap-on-azure)
