# C2 · B.4.2 — Partner Onboarding & Migration

**Control:** B.4.2 — SAP on Azure Partner Onboarding & Migration Capability  
**Module B Specialization:** SAP on Microsoft Azure Advanced Specialization  
**Estimated time:** ~75 minutes

> The full click-by-click lab is on the course site at **[C2 · B.4.2 Onboarding & Migration](/modules/b42-onboarding/)**.  
> This README is the quick-start reference + verification you run in the terminal.

---

## Objective

Produce the five **B.4.2 evidence artefacts** and configure the three Azure management services
the specialization auditor checks:

| Artefact / service      | Evidence type                              |
| ----------------------- | ------------------------------------------ |
| High-Level Design (HLD) | `B42_HLD_v1.pdf`                           |
| Low-Level Design (LLD)  | `B42_LLD_v1.pdf`                           |
| Migration runbook       | `B42_MigrationRunbook_v1.pdf`              |
| Knowledge Transfer plan | `B42_KTPlan_v1.pdf`                        |
| Hypercare plan          | `B42_HypercarePlan_v1.pdf`                 |
| ACSS VIS registration   | Screenshot / `B42_ACSSRegistration_v1.pdf` |

The first five are generated with the **Module B Lab Coach** Copilot agent + skills. ACSS, Azure
Monitor for SAP, and Azure Backup are configured via portal and Azure CLI.

---

## Prerequisites

- C0 complete: Codespace running, `az account show` prints your subscription.
- C1 complete: `rg-sapmh-lab` resource group exists (used by ACSS + Monitor).
- Copilot Chat open, Module B Lab Coach agent active.
- `Microsoft.Workloads` provider registered (run if missing):

```bash
az provider register --namespace Microsoft.Workloads --wait
```

---

## Quick steps

### Step 1 — Register with ACSS

```bash
# Verify provider is registered
az provider show -n Microsoft.Workloads --query "registrationState" -o tsv

# Register a Virtual Instance for SAP (VIS)
az workloads sap-virtual-instance create \
  --name S4H \
  --resource-group rg-sapmh-lab \
  --location swedencentral \
  --environment NonProd \
  --sap-product S4HANA \
  --configuration '{"appLocation":"swedencentral","configurationType":"Deployment"}'
```

### Step 2 — Enable Azure Monitor for SAP Solutions

```bash
az monitor sap-monitor create \
  --name mon-sapmh-lab \
  --resource-group rg-sapmh-lab \
  --location swedencentral \
  --app-location swedencentral \
  --managed-resource-group-name rg-sapmh-lab-managed
```

### Step 3 — Create Recovery Services Vault (Backup)

```bash
az backup vault create \
  --name rsv-sapmh-lab \
  --resource-group rg-sapmh-lab \
  --location swedencentral

az backup vault backup-properties set \
  --name rsv-sapmh-lab \
  --resource-group rg-sapmh-lab \
  --soft-delete-feature-state Enable
```

### Step 4 — Generate onboarding pack with Copilot

Run these prompts in Copilot Chat (Module B Lab Coach active) — see the lab page for full prompt text:

- `@moduleb-lab-coach #generate-hld` → HLD
- `@moduleb-lab-coach #generate-hld mode:LLD` → LLD
- `@moduleb-lab-coach #generate-runbook type:cutover` → Migration runbook
- `@moduleb-lab-coach #generate-runbook type:kt-plan` → KT plan
- `@moduleb-lab-coach #generate-runbook type:hypercare` → Hypercare plan

---

## Evidence naming convention

| Artefact          | File name                     | Folder              |
| ----------------- | ----------------------------- | ------------------- |
| HLD               | `B42_HLD_v1.pdf`              | `Module B / B4.2 /` |
| LLD               | `B42_LLD_v1.pdf`              | `Module B / B4.2 /` |
| Migration runbook | `B42_MigrationRunbook_v1.pdf` | `Module B / B4.2 /` |
| KT plan           | `B42_KTPlan_v1.pdf`           | `Module B / B4.2 /` |
| Hypercare plan    | `B42_HypercarePlan_v1.pdf`    | `Module B / B4.2 /` |
| ACSS registration | `B42_ACSSRegistration_v1.pdf` | `Module B / B4.2 /` |

**Pattern:** `[ControlRef]_[DocumentType]_v[N].pdf`

---

## Verification

```bash
# Bash
bash labs/challenge-2-onboarding/verify.sh

# PowerShell
pwsh labs/challenge-2-onboarding/verify.ps1
```

### What the script checks

| Check                       | Pass condition                                              |
| --------------------------- | ----------------------------------------------------------- |
| ACSS provider registered    | `az provider show -n Microsoft.Workloads` = Registered      |
| ACSS VIS exists             | `az workloads sap-virtual-instance list` returns ≥ 1 result |
| Monitor resource exists     | `az monitor sap-monitor list` returns ≥ 1 result            |
| Backup vault exists         | `az backup vault list` returns ≥ 1 result                   |
| HLD file present            | `Module B/B4.2/B42_HLD_v1.*` exists                         |
| LLD file present            | `Module B/B4.2/B42_LLD_v1.*` exists                         |
| Runbook file present        | `Module B/B4.2/B42_MigrationRunbook_v1.*` exists            |
| KT plan file present        | `Module B/B4.2/B42_KTPlan_v1.*` exists                      |
| Hypercare plan file present | `Module B/B4.2/B42_HypercarePlan_v1.*` exists               |

---

## Definition of done

- [ ] `Microsoft.Workloads` provider registration state = `Registered`
- [ ] ACSS VIS `S4H` created in `rg-sapmh-lab`
- [ ] Azure Monitor for SAP resource created
- [ ] Recovery Services Vault created with soft-delete enabled
- [ ] Five onboarding-pack documents named `B42_*_v1.*`
- [ ] Runbook includes explicit go/no-go decision point
- [ ] Hypercare plan includes exit criteria (zero P1/P2 in last 7 days)

---

## Sample answers

Reference outputs are in [`sample-answers/`](./sample-answers/):

| File                       | Description                                  |
| -------------------------- | -------------------------------------------- |
| `sample-hld.md`            | Example High-Level Design from the Lab Coach |
| `sample-runbook.md`        | Example cutover runbook                      |
| `sample-hypercare-plan.md` | Example hypercare plan                       |

---

## Trainer notes

- Register `Microsoft.Workloads` provider **before** class — first registration takes 5–10 min.
- ACSS is not available in every region; Sweden Central, East US, and West Europe are reliable.
- The HANA Backup pre-registration script requires OS-level access — demo from portal in class.
- Answer key: `sample-answers/` folder above.
