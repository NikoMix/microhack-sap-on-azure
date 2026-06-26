# C6 · B.4.1 — Audit Readiness

**Goal:** assemble the complete Module B evidence pack, generate the evidence index and pre-audit
review using the `build-evidence-index` Copilot skill, and confirm all naming conventions are
correct — producing `B41_EvidenceIndex_v1` and `B41_PreAuditReview_v1`. **Time:** ~60 minutes.

> The full walkthrough lives on the course site at **C6 · B.4.1 Audit Readiness**.
> This README is the terminal-first quick-reference.

## Control

| Control | Requirement                                                 | Evidence              |
| ------- | ----------------------------------------------------------- | --------------------- |
| B.4.1   | Evidence pack complete, naming valid, pre-audit review done | Index + review record |

## Required folder structure

```text
Module B/
├── B.1.1/   B11_CaseStudy_v1.pdf
├── B.2.1/   B21_ACRBreakdown_v1.pdf
├── B.2.2/   B22_CustomerList_v1.pdf
├── B.3.1/   B31_SkillingMapping_v1.pdf  +  B31_AZ120Transcript_[Name]_v1.pdf
├── B.4.1/   B41_EvidenceIndex_v1.pdf    +  B41_PreAuditReview_v1.pdf
└── B.4.2/   B42_OnboardingPack_v1.pdf
```

Naming convention: `[ControlRef]_[DocumentType]_v[N].pdf`
(`ControlRef` = `B11`, `B21`, … no dot; `DocumentType` = PascalCase; `v[N]` = version integer)

## Prerequisites

- C1–C5 complete, or use placeholder artefacts from each challenge's `evidence/` folder.

## Steps

1. **Create the folder structure**

   ```bash
   mkdir -p \
     "labs/challenge-6-audit-readiness/evidence-pack/Module B/B.1.1" \
     "labs/challenge-6-audit-readiness/evidence-pack/Module B/B.2.1" \
     "labs/challenge-6-audit-readiness/evidence-pack/Module B/B.2.2" \
     "labs/challenge-6-audit-readiness/evidence-pack/Module B/B.3.1" \
     "labs/challenge-6-audit-readiness/evidence-pack/Module B/B.4.1" \
     "labs/challenge-6-audit-readiness/evidence-pack/Module B/B.4.2"
   ```

2. **Copy artefacts from C3–C5 (and C1/C2 if available)**

   ```bash
   cp labs/challenge-3-acr/evidence/B21_ACRBreakdown_v1.md \
     "labs/challenge-6-audit-readiness/evidence-pack/Module B/B.2.1/"
   cp labs/challenge-4-customer-diversity/evidence/B22_CustomerList_v1.md \
     "labs/challenge-6-audit-readiness/evidence-pack/Module B/B.2.2/"
   cp labs/challenge-5-skilling/evidence/B31_SkillingMapping_v1.md \
     "labs/challenge-6-audit-readiness/evidence-pack/Module B/B.3.1/"

   # Placeholders for B.1.1 and B.4.2 (replace with real artefacts after C1/C2)
   cp labs/challenge-6-audit-readiness/sample-data/B11_CaseStudy_placeholder.md \
     "labs/challenge-6-audit-readiness/evidence-pack/Module B/B.1.1/" 2>/dev/null || true
   cp labs/challenge-6-audit-readiness/sample-data/B42_OnboardingPack_placeholder.md \
     "labs/challenge-6-audit-readiness/evidence-pack/Module B/B.4.2/" 2>/dev/null || true
   ```

3. **Generate evidence index with Copilot**

   Open Copilot Chat:

   ```text
   @lab-coach Run the build-evidence-index skill. Scan all files under
   labs/challenge-6-audit-readiness/evidence-pack/Module B/ and produce:
   1. An evidence index table (Control, ControlRef, FileName, Version, Status)
   2. Flag MISSING controls (no artefact)
   3. Flag INVALID_NAME files (do not match [ControlRef]_[DocumentType]_v[N])
   ```

4. **Fix naming violations**

   ```bash
   # Example rename if needed:
   # mv "Module B/B.2.1/acr breakdown.md" "Module B/B.2.1/B21_ACRBreakdown_v1.md"
   ```

5. **Produce the evidence index document**

   ```text
   @lab-coach Format the evidence index as a formal document with partner name, MPN ID,
   date, and the evidence table. Save to:
   labs/challenge-6-audit-readiness/evidence-pack/Module B/B.4.1/B41_EvidenceIndex_v1.md
   ```

6. **Produce the pre-audit review record**

   ```text
   @lab-coach Generate a pre-audit review record with: date, attendees, SPOC name+email,
   B.4.1 checklist, and outcome (READY / NOT READY). Save to:
   labs/challenge-6-audit-readiness/evidence-pack/Module B/B.4.1/B41_PreAuditReview_v1.md
   ```

7. **Final completeness check**

   ```bash
   for ctrl in B.1.1 B.2.1 B.2.2 B.3.1 B.4.1 B.4.2; do
     count=$(find "labs/challenge-6-audit-readiness/evidence-pack/Module B/$ctrl" \
       -type f 2>/dev/null | wc -l)
     echo "$ctrl: $count file(s)"
   done
   ```

## Sample data

| File                                            | Description                                                            |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| `sample-data/evidence-checklist.json`           | Per-control evidence requirements for the `build-evidence-index` skill |
| `sample-data/B11_CaseStudy_placeholder.md`      | Placeholder artefact for B.1.1 (replace after C1)                      |
| `sample-data/B42_OnboardingPack_placeholder.md` | Placeholder artefact for B.4.2 (replace after C2)                      |

## Definition of done

- [ ] Folder structure created with six sub-folders.
- [ ] ≥ 1 artefact per control (B.1.1, B.2.1, B.2.2, B.3.1, B.4.1, B.4.2).
- [ ] All files pass naming validation.
- [ ] `B41_EvidenceIndex_v1.md` generated and saved.
- [ ] `B41_PreAuditReview_v1.md` generated with SPOC named.
- [ ] Final check shows ≥ 1 file per control.

## Trainer notes

- If trainees haven't completed C1/C2, the placeholder files let them practice the assembly
  workflow without being blocked.
- The `build-evidence-index` skill (`.github/prompts/build-evidence-index.prompt.md`) encodes the
  B.4.1 naming rules. If the skill file is missing, Copilot can run an inline validation using the
  naming convention documented in the module page.
- SPOC appointment: in a real partner, the SPOC is usually the SAP Practice Lead or a designated
  technical account manager. Stress that the SPOC must be reachable during the audit window.
