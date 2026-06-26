---
description: >-
  Build a customer diversity cross-reference table demonstrating that the
  partner has ≥ 3 active SAP on Azure customers with distinct workloads or
  industries. Reads from tools/data/sap-landscape.json and supplements with
  user-provided customer details. Satisfies Module B control B.2.2. Output:
  B22_CustomerCrossRef_v[N].md → PDF.
argument-hint: >-
  Optionally provide additional customer descriptions beyond the mock data —
  e.g. "add customer: Fabrikam GmbH, logistics, S/4HANA 2022, West Europe".
  Leave blank to generate from tools/data/sap-landscape.json.
tools: [read, edit, search]
---

# Skill: Build Customer Cross-Reference (B.2.2)

Produce a customer diversity cross-reference table that demonstrates the partner's
depth and breadth of SAP on Azure customer deployments. This satisfies **B.2.2 —
Customer Diversity**.

The table must show ≥ 3 distinct SAP-on-Azure customers with verifiable
deployment details, covering a range of industries, SAP products, and Azure
regions where possible.

## Inputs

| Variable          | Source                                     | Default                                          |
| ----------------- | ------------------------------------------ | ------------------------------------------------ |
| `landscape_json`  | `tools/data/sap-landscape.json`            | read automatically                               |
| `extra_customers` | argument (free-text customer descriptions) | none                                             |
| `version`         | argument or 1                              | `v1`                                             |
| `output_path`     | default                                    | `labs/Module B/B22/B22_CustomerCrossRef_v[N].md` |

## Minimum diversity requirements (B.2.2)

The cross-reference must demonstrate:

| Requirement                      | Minimum | Preferred          |
| -------------------------------- | ------- | ------------------ |
| Distinct SAP-on-Azure customers  | 3       | 5+                 |
| Different SAP products           | 2       | 3+ (S/4, BW, ECC…) |
| Different Azure regions          | 1       | 2+                 |
| Different industries             | 2       | 3+                 |
| Partner PAL-linked subscriptions | All     | —                  |

## Workflow

### Step 1 — Load customer data

Read `tools/data/sap-landscape.json`. The JSON includes a `customers[]` array
with simulated customer profiles. Each entry has:

- `name`, `industry`, `country`, `azure_region`
- `sap_products[]` (type, sid, version, deployment_type)
- `azure_resources[]` (vm_sku, storage, networking)
- `pal_linked`, `go_live_date`, `acss_managed`

If the user provided `extra_customers`, append them as additional entries.

### Step 2 — Check diversity requirements

For each requirement in the table above, evaluate the loaded data and record
Pass / Gap:

| Requirement             | Required | Actual | Status  |
| ----------------------- | -------- | ------ | ------- |
| Distinct customers      | ≥ 3      | [N]    | [✅/⚠️] |
| Different SAP products  | ≥ 2      | [N]    | [✅/⚠️] |
| Different Azure regions | ≥ 1      | [N]    | [✅/⚠️] |
| Different industries    | ≥ 2      | [N]    | [✅/⚠️] |
| All PAL-linked          | 100%     | [N/%]  | [✅/⚠️] |

If any requirement shows ⚠️, add an **Action required** note before the gap.

### Step 3 — Build the cross-reference table

`````markdown
# Customer Diversity Cross-Reference — [Partner Name]

**Document version:** v[N]
**Date:** [current date]
**Control:** Module B · B.2.2 — Customer Diversity

---

## Summary

| Metric                       | Value | Requirement | Status |
| ---------------------------- | ----- | ----------- | ------ |
| Total SAP-on-Azure customers | [N]   | ≥ 3         | ✅     |
| Distinct SAP products        | [N]   | ≥ 2         | ✅     |
| Azure regions covered        | [N]   | ≥ 1         | ✅     |
| Industries represented       | [N]   | ≥ 2         | ✅     |
| PAL-linked subscriptions     | [N/N] | 100%        | ✅     |

---

## Customer detail table

| #   | Customer | Industry | Region | SAP Products | SAP SIDs | VM SKU | HA/DR | Go-Live | PAL |
| --- | -------- | -------- | ------ | ------------ | -------- | ------ | ----- | ------- | --- |

[one row per customer from landscape_json.customers + extra_customers]

---

## Deployment narrative

### Customer 1 — [Name]

**Industry:** [industry]
**Azure region:** [region]
**SAP products deployed:** [list]
**Architecture highlights:** [2–3 sentences: VM SKUs, storage, HA design]
**Business outcome:** [1 sentence]
**PAL status:** [linked / MPN-ID: [ID]]

### Customer 2 — [Name]

[repeat structure]

### Customer N — [Name]

[repeat structure]

---

## Attestation

I confirm that the information in this cross-reference is accurate and that
all deployments listed are live SAP on Azure workloads where the partner holds
PAL attribution.

| Role                  | Name | Date |
| --------------------- | ---- | ---- |
| Partner Practice Lead |      |      |
| Microsoft CSA / CSM   |      |      |

---

_Control reference: Module B · B.2.2 — Customer Diversity_
_Evidence file: `B22_CustomerCrossRef_v[N].pdf`_

````text
### Step 4 — Save and summarise

Create `labs/Module B/B22/` and write the file.

```text
✅ B.2.2 Customer Cross-Reference built
   File       : labs/Module B/B22/B22_CustomerCrossRef_v1.md
   Customers  : [N]
   Diversity  : [N products] / [N industries] / [N regions]
   PAL status : [all linked / N gaps]
   Next       : Fill in real customer names (replace simulated data for
                submission), export as B22_CustomerCrossRef_v1.pdf.
```
## Example invocations

Using mock data only:

```text
@module-b-lab-coach #build-customer-crossref
```
Adding a real customer:

```text
@module-b-lab-coach #build-customer-crossref
add customer: Fabrikam GmbH, logistics, S/4HANA 2022, North Europe,
PAL linked MPN 1234567, go-live 2024-03
```
## References

- Evidence naming: `B22_CustomerCrossRef_v[N].pdf`
- Mock data: `tools/data/sap-landscape.json` — `customers[]` array
- PAL linking: `az managementpartner create --partner-id [MPN-ID]`
- Control B.2.2: [NikoMix/specialization-sap-on-azure](https://github.com/NikoMix/specialization-sap-on-azure)
````
`````
