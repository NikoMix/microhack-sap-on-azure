# C5 · B.3.1 — Skilling (AZ-120 or Learning Path)

**Goal:** use the `build-skilling-plan` Copilot skill to generate a skilling mapping table from
team data, identify gaps, and build study plans — producing the `B31_SkillingMapping_v1` artefact.
**Time:** ~45 minutes.

> The full walkthrough lives on the course site at **C5 · B.3.1 Skilling**.
> This README is the terminal-first quick-reference.

## Control

| Control | Requirement                                                                 | Evidence               |
| ------- | --------------------------------------------------------------------------- | ---------------------- |
| B.3.1   | ≥ 2 individuals with AZ-120 cert or "Run SAP on Microsoft Cloud" completion | Skilling mapping table |

## Eligible routes

| Route         | Description                                                         | Evidence                      |
| ------------- | ------------------------------------------------------------------- | ----------------------------- |
| AZ-120        | Planning and Administering Microsoft Azure for SAP Workloads (exam) | Certificate PDF               |
| MS Learn path | "Run SAP on the Microsoft Cloud" (free, ~8 h)                       | Completion badge / transcript |

## Prerequisites

- C0 complete.
- Sample data in `labs/challenge-5-skilling/sample-data/team-skilling.csv`.

## Steps

1. **Review team skilling data**

   ```bash
   cat labs/challenge-5-skilling/sample-data/team-skilling.csv
   ```

2. **Generate the skilling mapping table**

   Open Copilot Chat:

   ```text
   @moduleb-lab-coach Run the build-skilling-plan skill on
   labs/challenge-5-skilling/sample-data/team-skilling.csv.
   Produce:
   1. A skilling mapping table (Name, route, completion date, expiry, status)
   2. COMPLIANT / EXPIRING SOON / GAP status for each person
   3. Recommended action for GAP / EXPIRING SOON entries
   ```

3. **Build a study plan for gap holders**

   ```text
   @moduleb-lab-coach For team members with GAP status, produce a 4-week study plan
   for the "Run SAP on the Microsoft Cloud" Microsoft Learn path.
   ```

4. **Save the evidence file**

   ```bash
   mkdir -p labs/challenge-5-skilling/evidence
   echo "# B.3.1 — Skilling Mapping" \
     > labs/challenge-5-skilling/evidence/B31_SkillingMapping_v1.md
   # Paste Copilot's skilling table here
   ```

5. **Confirm B.3.1 compliance**

   ```text
   @moduleb-lab-coach Confirm B.3.1 compliance: does the team have at least 2 COMPLIANT individuals?
   Output PASS or FAIL with a brief reason.
   ```

## Sample data

| File                            | Description                                                        |
| ------------------------------- | ------------------------------------------------------------------ |
| `sample-data/team-skilling.csv` | 6-person team with a mix of AZ-120, learning path, and gap entries |

The sample is deterministic: 2 COMPLIANT, 1 EXPIRING SOON, 3 GAP — to exercise the full Copilot
skill workflow.

## Definition of done

- [ ] Skilling mapping table produced for all 6 team members.
- [ ] At least 2 COMPLIANT entries (B.3.1 threshold met).
- [ ] 4-week study plan produced for gap holders.
- [ ] `labs/challenge-5-skilling/evidence/B31_SkillingMapping_v1.md` exists.

## Trainer notes

- If trainees have actual AZ-120 certs, walk through the cert transcript export from
  `learn.microsoft.com/en-us/credentials` as an exercise in evidence preparation.
- The MS Learn path "Run SAP on the Microsoft Cloud" URL:
  `https://learn.microsoft.com/en-us/training/paths/run-sap-microsoft-cloud/`
- AZ-120 is valid for 1 year and renewed for free via a short online assessment (the renewal window
  opens 6 months before expiry). Flag "EXPIRING SOON" as a real risk for specialization renewal audits.
