---
description: >-
  Build an SAP on Azure skilling plan and evidence matrix that maps team members
  to required certifications, completed training, and planned learning paths.
  Satisfies Module B control B.3.1 (SAP on Azure Skilling). Output:
  B31_SkillingPlan_v[N].md → PDF.
argument-hint: >-
  Optionally describe your team — e.g. "5-person team: 2 SAP Basis (AZ-900 +
  AZ-120 certified), 1 Azure Architect (AZ-305), 2 consultants (no Azure cert
  yet)". Leave blank to use a realistic template with the mock data.
tools: [read, edit, search]
---

# Skill: Build Skilling Plan (B.3.1)

Produce an SAP on Azure skilling plan and evidence matrix for the partner team.
This satisfies **B.3.1 — SAP on Azure Skilling**, which requires demonstrated
Azure and SAP-on-Azure certification coverage across the practice.

## Inputs

| Variable      | Source                           | Default                                      |
| ------------- | -------------------------------- | -------------------------------------------- |
| `team`        | argument (free-text) or template | 5-person simulated team                      |
| `version`     | argument or 1                    | `v1`                                         |
| `output_path` | default                          | `labs/Module B/B31/B31_SkillingPlan_v[N].md` |

## B.3.1 certification requirements

To satisfy B.3.1, the practice must demonstrate:

| Tier       | Exam / cert                                        | Description                             | Required count  |
| ---------- | -------------------------------------------------- | --------------------------------------- | --------------- |
| Foundation | AZ-900                                             | Azure Fundamentals                      | All members     |
| Associate  | AZ-104                                             | Azure Administrator                     | ≥ 2             |
| Associate  | AZ-120                                             | Planning and Administering SAP on Azure | ≥ 2             |
| Expert     | AZ-305                                             | Azure Solutions Architect Expert        | ≥ 1             |
| Expert     | DP-600 or AZ-104 + AZ-120 combo                    | Additional SAP data / advanced track    | optional        |
| SAP        | SAP Certified Technology Associate (HANA or Basis) | SAP-side depth                          | ≥ 1 per cluster |

## Workflow

### Step 1 — Define the team

If the user provided team details via argument-hint, parse them into a team
member list. Otherwise use this simulated team from the mock landscape:

````json
[
  {
    "name": "Alex Schmidt",
    "role": "SAP Basis Lead",
    "certs": ["AZ-900", "AZ-120", "SAP Basis Associate"]
  },
  { "name": "Maria Nguyen", "role": "Azure Architect", "certs": ["AZ-900", "AZ-104", "AZ-305"] },
  { "name": "James Okonkwo", "role": "SAP Basis Consultant", "certs": ["AZ-900", "AZ-120"] },
  { "name": "Priya Sharma", "role": "Azure DevOps Engineer", "certs": ["AZ-900", "AZ-104"] },
  { "name": "Lucas Müller", "role": "Junior Consultant", "certs": ["AZ-900"] }
]
```text
### Step 2 — Map certifications to requirements

For each requirement in the table above, count how many team members satisfy it.
Flag any gaps (requirements not met).

### Step 3 — Build learning paths for gaps

For each team member without the required certifications, suggest the Microsoft
Learn learning path and estimated time:

| Exam   | Microsoft Learn Path                                                                   | Est. hours |
| ------ | -------------------------------------------------------------------------------------- | ---------- |
| AZ-900 | Azure Fundamentals (learn.microsoft.com/certifications/azure-fundamentals)             | 6h         |
| AZ-104 | Azure Administrator (learn.microsoft.com/certifications/azure-administrator-associate) | 40h        |
| AZ-120 | SAP on Azure (learn.microsoft.com/certifications/azure-for-sap-workloads-specialty)    | 30h        |
| AZ-305 | Azure Solutions Architect Expert                                                       | 50h        |

### Step 4 — Draft the skilling plan document

```markdown
# SAP on Azure Skilling Plan — [Partner Name]

**Document version:** v[N]
**Date:** [current date]
**Practice lead:** [name or TBD]
**Team size:** [N]

---

## 1. Current certification coverage

### Team certification matrix

| Team Member | Role | AZ-900 | AZ-104 | AZ-120 | AZ-305 | SAP Cert | Status |
| ----------- | ---- | :----: | :----: | :----: | :----: | :------: | ------ |

[one row per team member — ✅ if certified, ⬜ if in progress, ❌ if gap]

### Coverage summary

| Requirement                          | Required | Actual  | Status  |
| ------------------------------------ | -------- | ------- | ------- |
| AZ-900 — all members                 | [N]/[N]  | [N]/[N] | [✅/⚠️] |
| AZ-120 — at least 2 members          | 2        | [N]     | [✅/⚠️] |
| AZ-104 — at least 2 members          | 2        | [N]     | [✅/⚠️] |
| AZ-305 — at least 1 member           | 1        | [N]     | [✅/⚠️] |
| SAP Certified Associate — at least 1 | 1        | [N]     | [✅/⚠️] |

---

## 2. Gap analysis and learning plan

[For each gap, one subsection:]

### Gap: [Exam name] — [Team member(s)]

**Current state:** [description]
**Target certification:** [exam + level]
**Microsoft Learn path:** [URL]
**Estimated hours:** [N] hours
**Target completion date:** [YYYY-MM-DD]
**Study resource:** [free learning path / practice exam link]

---

## 3. Planned certifications (next 6 months)

| Team Member | Exam | Target date | Study plan | Cost (approx.) |
| ----------- | ---- | ----------- | ---------- | -------------- |

[one row per planned certification]

---

## 4. Completed certifications (evidence links)

| Team Member                                                                      | Exam | Completion date | Cert ID / transcript URL |
| -------------------------------------------------------------------------------- | ---- | --------------- | ------------------------ |
| [one row per completed cert — transcript URL should point to Credly or MS Learn] |

---

## 5. SAP certification evidence

| Team Member | SAP Cert | Exam date | Badge / ID |
| ----------- | -------- | --------- | ---------- |

[one row per SAP cert — from team input]

---

## 6. Attestation

I confirm that the certifications listed in §4 are valid and verifiable via
the Microsoft Certification dashboard or Credly/Acclaim.

| Role                  | Name | Date |
| --------------------- | ---- | ---- |
| Partner Practice Lead |      |      |
| L&D Manager           |      |      |

---

_Control reference: Module B · B.3.1 — SAP on Azure Skilling_
_Evidence file: `B31_SkillingPlan_v[N].pdf`_
```text
### Step 5 — Save and summarise

Create `labs/Module B/B31/` and write the file.

```text
✅ B.3.1 Skilling Plan built
   File        : labs/Module B/B31/B31_SkillingPlan_v1.md
   Team size   : [N]
   Gaps found  : [N certs missing]
   Next steps  : Fill in real team members and transcript URLs. Export as
                 B31_SkillingPlan_v1.pdf. Include cert screenshots / Credly
                 links in your evidence pack.
```text
## Example invocations

Using the default template:

```text
@moduleb-lab-coach #build-skilling-plan
```text
With a real team:

```text
@moduleb-lab-coach #build-skilling-plan
Team: Alex (AZ-900, AZ-120), Maria (AZ-900, AZ-104, AZ-305),
James (AZ-900, AZ-120), Priya (AZ-900), Lucas (no certs yet).
```text
## References

- Evidence naming: `B31_SkillingPlan_v[N].pdf`
- AZ-120 learning path: [learn.microsoft.com/en-us/credentials/certifications/azure-for-sap-workloads-specialty](https://learn.microsoft.com/en-us/credentials/certifications/azure-for-sap-workloads-specialty/)
- Control B.3.1: [NikoMix/specialization-sap-on-azure](https://github.com/NikoMix/specialization-sap-on-azure)
````
