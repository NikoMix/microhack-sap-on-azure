---
description: >-
  Assemble the complete Module B audit evidence index — a master spreadsheet
  (Markdown table) that maps every Module B control to its produced evidence
  artefacts, file paths, status, and auditor notes. Performs a gap analysis and
  flags missing evidence. Satisfies Module B control B.4.1 (Audit Readiness).
  Output: B41_EvidenceIndex_v[N].md → PDF.
argument-hint: >-
  Optionally specify which artefacts are already complete — e.g.
  "B11 case study done, B21 ACR done, B22 missing, B31 done, B42 in progress".
  Leave blank to scan labs/Module B/ automatically.
tools: [read, edit, search]
---

# Skill: Build Evidence Index (B.4.1)

Produce the master audit evidence index for Module B. This satisfies **B.4.1 —
Audit Readiness** and is typically the final deliverable assembled before the
audit submission window opens.

## Inputs

| Variable          | Source                             | Default                                       |
| ----------------- | ---------------------------------- | --------------------------------------------- |
| `scan_path`       | `labs/Module B/`                   | scanned automatically for `*.pdf` and `*.md`  |
| `status_override` | argument (optional free-text list) | none                                          |
| `version`         | argument or 1                      | `v1`                                          |
| `output_path`     | default                            | `labs/Module B/B41/B41_EvidenceIndex_v[N].md` |

## Module B evidence requirements

| Control | Description                            | Required artefacts                                                                               |
| ------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| B.1.1   | SAP on Azure Implementation Capability | `B11_CaseStudy_v[N].pdf`, `B11_ArchitectureDiagram_v[N].pdf`, `B11_CapabilityStatement_v[N].pdf` |
| B.2.1   | ACR Performance                        | `B21_ACRBreakdown_v[N].pdf` (3-month trend)                                                      |
| B.2.2   | Customer Diversity                     | `B22_CustomerList_v[N].pdf` (≥ 3 customers)                                                      |
| B.3.1   | SAP on Azure Skilling                  | `B31_SkillingMapping_v[N].pdf` (certs + learning plan)                                           |
| B.4.1   | Audit Readiness                        | `B41_EvidenceIndex_v[N].pdf` (this document)                                                     |
| B.4.2   | Customer Onboarding                    | `B42_MigrationRunbook_v[N].pdf`                                                                  |

## Workflow

### Step 1 — Scan the evidence directory

List all files under `labs/Module B/`. For each file matching the pattern
`[ControlRef]_[DocumentType]_v[N].(pdf|md)`, record:

- Control reference
- Document type
- Version number
- File path
- File extension (md = draft, pdf = final)

If `status_override` was provided, merge those statuses with the scan results.

### Step 2 — Determine status for each artefact

| Status         | Meaning                                          |
| -------------- | ------------------------------------------------ |
| ✅ Complete    | PDF file exists in the correct path              |
| 📝 Draft       | Markdown exists but no PDF yet                   |
| ❌ Missing     | No file found for this required artefact         |
| ⚠️ In Progress | Explicitly noted as in progress by user argument |

### Step 3 — Compute the readiness score

`````text
readiness_score = (complete_count / total_required) * 100
```text
Flag the overall status:

- ≥ 90%: 🟢 Audit Ready
- 70–89%: 🟡 Near Ready (minor gaps)
- < 70%: 🔴 Not Ready (significant gaps remain)

### Step 4 — Draft the evidence index

````markdown
# Module B Audit Evidence Index

**Document version:** v[N]
**Date:** [current date]
**Partner:** [name from sap-landscape.json or argument]
**Audit readiness score:** [score]% — [🟢/🟡/🔴 status]

---

## Evidence master table

| Control | Description               | Artefact file                    | Path                 | Version | Status   |
| ------- | ------------------------- | -------------------------------- | -------------------- | ------- | -------- |
| B.1.1   | Implementation Capability | `B11_CaseStudy_v[N].pdf`         | `labs/Module B/B11/` | v[N]    | [status] |
| B.1.1   | Implementation Capability | `B11_ArchitectureDiagram_v[N].pdf` | `labs/Module B/B11/` | v[N]    | [status] |
| B.1.1   | Implementation Capability | `B11_CapabilityStatement_v[N].pdf` | `labs/Module B/B11/` | v[N]    | [status] |
| B.2.1   | ACR Performance           | `B21_ACRBreakdown_v[N].pdf`         | `labs/Module B/B21/` | v[N]    | [status] |
| B.2.2   | Customer Diversity        | `B22_CustomerList_v[N].pdf`  | `labs/Module B/B22/` | v[N]    | [status] |
| B.3.1   | Skilling                  | `B31_SkillingMapping_v[N].pdf`      | `labs/Module B/B31/` | v[N]    | [status] |
| B.4.1   | Audit Readiness           | `B41_EvidenceIndex_v[N].pdf`     | `labs/Module B/B41/` | v[N]    | 📝 Draft |
| B.4.2   | Customer Onboarding       | `B42_MigrationRunbook_v[N].pdf` | `labs/Module B/B42/` | v[N]    | [status] |

---

## Gap analysis

[For each ❌ Missing or ⚠️ In Progress item:]

### Gap: [ControlRef] — [Artefact name]

**Status:** [Missing / In Progress]
**Required by:** [date or "before audit submission"]
**Skill to invoke:** `[skill-name]` — run `@moduleb-lab-coach #[skill-name]`
**Estimated effort:** [N] minutes

---

## Submission checklist

Before uploading artefacts to the Partner Center portal:

- [ ] All artefacts are in PDF format (not .md)
- [ ] File names follow `[ControlRef]_[DocumentType]_v[N].pdf`
- [ ] All PDFs are version-stamped (version number in the document header)
- [ ] PAL attribution confirmed for B.2.1 (run `az managementpartner show`)
- [ ] Customer names in B.2.2 are real customers (not mock data)
- [ ] Certifications in B.3.1 are current (not expired, not pending)
- [ ] Onboarding runbook in B.4.2 has been signed off by customer
- [ ] Evidence index (this document) exported to PDF and self-referencing

---

## Artefact file tree

```text
labs/
└── Module B/
    ├── B11/
    │   ├── B11_CaseStudy_v1.pdf   [status]
    │   └── B11_ArchitectureDiagram_v1.pdf [status]
    ├── B21/
    │   └── B21_ACRBreakdown_v1.pdf   [status]
    ├── B22/
    │   └── B22_CustomerList_v1.pdf  [status]
    ├── B31/
    │   └── B31_SkillingMapping_v1.pdf      [status]
    ├── B41/
    │   └── B41_EvidenceIndex_v1.pdf     [📝 this document]
    └── B42/
        └── B42_MigrationRunbook_v1.pdf [status]
```text
````text
---

_Control reference: Module B · B.4.1 — Audit Readiness_
_Evidence file: `B41_EvidenceIndex_v[N].pdf`_

```text
### Step 5 — Save and summarise

Create `labs/Module B/B41/` and write the file.

```text
✅ B.4.1 Evidence Index built
File : labs/Module B/B41/B41_EvidenceIndex_v1.md
Readiness score : [score]% [🟢/🟡/🔴]
Complete : [N]/[total] artefacts
Gaps : [list of missing controls]
Next : Close gaps with the relevant skills, then export this
index to PDF as B41_EvidenceIndex_v1.pdf.

```text
## Example invocations

Auto-scan (default):

```text
@moduleb-lab-coach #build-evidence-index

```text
With status overrides:

```text
@moduleb-lab-coach #build-evidence-index
B11 case study done, B21 ACR done, B22 in progress, B31 done, B42 missing.

```text
## References

- Evidence naming: `B41_EvidenceIndex_v[N].pdf`
- All other evidence artefact conventions: see each skill in `.github/prompts/`
- Control B.4.1: [NikoMix/specialization-sap-on-azure](https://github.com/NikoMix/specialization-sap-on-azure)
`````
