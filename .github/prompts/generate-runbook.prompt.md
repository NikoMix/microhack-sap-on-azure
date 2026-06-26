---
description: >-
  Generate a production-grade SAP on Azure operational runbook for the customer
  onboarding and day-2 operations workflow. Covers initial landing zone setup,
  SAP system deployment via ACSS, ongoing operations procedures (backup, patch,
  monitoring, failover testing), and decommission. Satisfies Module B control
  B.4.2 (Customer Onboarding). Output: B42_OnboardingRunbook_v[N].md → PDF.
argument-hint: >-
  Describe the scope — e.g. "runbook for S/4HANA 2023 onboarding to West Europe
  with ACSS". Leave blank to use tools/data/sap-landscape.json.
tools: [read, edit, search]
---

# Skill: Generate Operational Runbook (B.4.2)

Produce a detailed operational runbook for SAP on Azure customer onboarding.
This satisfies **B.4.2 — Customer Onboarding** and provides the day-2 operations
reference for the SAP Basis team.

## Inputs

| Variable         | Source                                 | Default                                           |
| ---------------- | -------------------------------------- | ------------------------------------------------- |
| `landscape_json` | `tools/data/sap-landscape.json`        | read automatically                                |
| `customer`       | `landscape_json.metadata.customer`     | Contoso AG                                        |
| `region`         | `landscape_json.metadata.azure_region` | westeurope                                        |
| `prefix`         | `landscape_json.metadata.lab_prefix`   | sapmodb                                           |
| `version`        | argument or 1                          | `v1`                                              |
| `output_path`    | default                                | `labs/Module B/B42/B42_OnboardingRunbook_v[N].md` |

## Output

A Markdown runbook with numbered procedures, CLI commands, and expected outputs.

## Workflow

### Step 1 — Read the landscape data

Read `tools/data/sap-landscape.json`. Extract the customer name, region,
resource group prefix, systems list, and Azure resource SKUs.

### Step 2 — Draft the runbook

`````markdown
# Operational Runbook: SAP on Azure Onboarding — [Customer Name]

**Runbook version:** v[N]
**Date:** [current date]
**Applies to:** All SAP systems in `[LAB_RESOURCE_GROUP]`
**Owned by:** SAP Platform Team (primary), Azure Operations (secondary)

---

## Runbook quick-reference

| Procedure                    | Section | Estimated time | Who          |
| ---------------------------- | ------- | -------------- | ------------ |
| 1. Pre-flight checklist      | §1      | 30 min         | Basis Lead   |
| 2. Landing zone provisioning | §2      | 60 min         | Platform Eng |
| 3. SAP deployment via ACSS   | §3      | 90 min         | Basis Lead   |
| 4. Post-deploy validation    | §4      | 45 min         | Basis + QA   |
| 5. Backup policy activation  | §5      | 20 min         | Platform Eng |
| 6. Monitoring setup          | §6      | 30 min         | Platform Eng |
| 7. HA failover test          | §7      | 60 min         | Basis Lead   |
| 8. Handover sign-off         | §8      | 20 min         | All          |

---

## §1 Pre-flight checklist

Before beginning the onboarding, verify every item below. Record actual values
in the **Status** column and sign off.

| #   | Item                                             | Expected           | Status |
| --- | ------------------------------------------------ | ------------------ | ------ |
| 1   | Azure subscription quota for M-series VMs        | Approved           |        |
| 2   | ExpressRoute circuit provisioned and authorised  | Connected          |        |
| 3   | Azure AD / Entra ID tenant confirmed             | Tenant ID recorded |        |
| 4   | PAL linked to Microsoft AI Cloud Partner Program | PAL active         |        |
| 5   | Resource group naming prefix agreed (`[prefix]`) | [prefix]           |        |
| 6   | OS image subscription active (RHEL / SLES)       | Active             |        |
| 7   | ANF capacity pool provisioned (≥ 4 TiB Ultra)    | Provisioned        |        |
| 8   | DNS resolver configured for SAP hostnames        | Resolvable         |        |

## §2 Landing zone provisioning

### 2.1 Login and set subscription

````bash
az login
az account set --subscription "$AZURE_SUBSCRIPTION_ID"
az account show --query "{name:name, id:id}"
```text
```
### 2.2 Create resource group

```bash
az group create \
  --name "$LAB_RESOURCE_GROUP" \
  --location "$AZURE_LOCATION" \
  --tags workload=SAP environment=production controlRef=B42
```
### 2.3 Deploy the landing zone (Bicep)

```bash
# What-if first (dry-run)
az deployment sub what-if \
  --name "sap-landing-zone" \
  --location "$AZURE_LOCATION" \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam

# Deploy
az deployment sub create \
  --name "sap-landing-zone" \
  --location "$AZURE_LOCATION" \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam
```
**Expected output:** Deployment state: `Succeeded`. Note the deployment ID.

### 2.4 Verify network resources

```bash
az network vnet list \
  --resource-group "$LAB_RESOURCE_GROUP" \
  --output table
az network vnet peering list \
  --vnet-name "vnet-sap-$LAB_PREFIX" \
  --resource-group "$LAB_RESOURCE_GROUP" \
  --output table
```
## §3 SAP deployment via Azure Center for SAP solutions (ACSS)

### 3.1 Register the ACSS resource provider

```bash
az provider register --namespace Microsoft.Workloads --wait
az provider show --namespace Microsoft.Workloads \
  --query "registrationState" -o tsv
```
### 3.2 Create ACSS Virtual Instance for SAP (VIS)

```bash
az workloads sap-virtual-instance create \
  --resource-group "$LAB_RESOURCE_GROUP" \
  --name "[SID]" \
  --location "$AZURE_LOCATION" \
  --environment Production \
  --sap-product S4HANA \
  --configuration @infra/acss/[SID]-config.json
```
> Repeat for each SID in the landscape. Monitor progress in the Azure portal
> under **Azure Center for SAP solutions > Virtual instances for SAP**.

### 3.3 Monitor ACSS deployment

```bash
watch -n 30 az workloads sap-virtual-instance show \
  --resource-group "$LAB_RESOURCE_GROUP" \
  --name "[SID]" \
  --query "properties.status" -o tsv
```
Expected final status: `Running`.

## §4 Post-deploy validation

### 4.1 Check SAP system health via ACSS

```bash
az workloads sap-virtual-instance show \
  --resource-group "$LAB_RESOURCE_GROUP" \
  --name "[SID]" \
  --query "properties.health"
```
### 4.2 Validate HANA replication

Log in to the primary HANA DB VM and run:

```bash
# As HANA admin (e.g. s4hadm)
hdbnsutil -sr_state
```
Expected: `mode: primary`, `site id: 1`, `site name: primary`.

### 4.3 Validate ASCS/ERS cluster

```bash
crm_mon -1 -r
```
Expected: All cluster resources `Started`, no `Failed` or `Stopped`.

## §5 Backup policy activation

### 5.1 Create Recovery Services Vault

```bash
az backup vault create \
  --name "rsv-sap-$LAB_PREFIX" \
  --resource-group "$LAB_RESOURCE_GROUP" \
  --location "$AZURE_LOCATION"
```
### 5.2 Enable SAP HANA Backint backup

```bash
az backup protection enable-for-vm \
  --resource-group "$LAB_RESOURCE_GROUP" \
  --vault-name "rsv-sap-$LAB_PREFIX" \
  --vm "[HANA-VM-NAME]" \
  --policy-name "SAP-HANA-Policy-Daily"
```
> Default policy: daily full backup at 22:00 UTC + hourly log backups.
> Retention: 35 days full, 7 days log.

## §6 Monitoring setup (Azure Monitor for SAP solutions)

### 6.1 Create AMS monitor

```bash
az workloads monitor create \
  --resource-group "$LAB_RESOURCE_GROUP" \
  --name "ams-sap-$LAB_PREFIX" \
  --location "$AZURE_LOCATION" \
  --app-location "$AZURE_LOCATION" \
  --managed-resource-group-name "mrg-ams-$LAB_PREFIX"
```
### 6.2 Add HANA provider

```bash
az workloads monitor provider-instance create \
  --resource-group "$LAB_RESOURCE_GROUP" \
  --monitor-name "ams-sap-$LAB_PREFIX" \
  --provider-instance-name "[SID]-hana" \
  --provider-settings '{"providerType":"SapHana","hostname":"[HANA_HOST]","dbPort":"30015","dbUsername":"SYSTEM","dbPasswordUri":"[KV_SECRET_URI]","sapSid":"[SID]"}'
```
## §7 HA failover test

> **🔴 Planned maintenance window required.**
> Notify all stakeholders before proceeding.

### 7.1 Test HANA failover

```bash
# On the primary HANA node — trigger a takeover
su - [sid]adm -c "hdbnsutil -sr_takeover"
```
Expected: Secondary node becomes primary within 35 minutes.
Verify: `hdbnsutil -sr_state` on the new primary shows `mode: primary`.

### 7.2 Test ASCS failover

```bash
crm resource migrate msl_SAPHana_[SID]_HDB00 [secondary-node]
```
Monitor: `crm_mon -1 -r` until all resources are `Started` on the new node.

### 7.3 Document results

Record actual RTO and RPO in the test report:

| Test          | Target RTO | Actual RTO | Target RPO  | Actual RPO | Pass/Fail |
| ------------- | ---------- | ---------- | ----------- | ---------- | --------- |
| HANA failover | 35 min     |            | 15 min      |            |           |
| ASCS failover | 10 min     |            | 0 (no data) | N/A        |           |

## §8 Handover sign-off

| Role                | Name | Signature | Date |
| ------------------- | ---- | --------- | ---- |
| SAP Basis Lead      |      |           |      |
| Azure Platform Eng  |      |           |      |
| Customer IT Manager |      |           |      |
| Microsoft CSA       |      |           |      |

---

## Appendix A — Emergency contacts

| Contact           | Role                         | Phone / alias    |
| ----------------- | ---------------------------- | ---------------- |
| [Partner name]    | SAP on Azure Lead            |                  |
| Microsoft Support | SAP on Azure Unified Support | +1-800-xxx       |
| Azure Status      | Platform health              | status.azure.com |

## Appendix B — Key CLI variables

```bash
# Copy to your .env and source before running any procedure:
export AZURE_SUBSCRIPTION_ID="[your-subscription-id]"
export AZURE_TENANT_ID="[your-tenant-id]"
export AZURE_LOCATION="westeurope"
export LAB_PREFIX="sapmodb"
export LAB_RESOURCE_GROUP="rg-sap-moduleb-lab"
```
---

_Control reference: Module B · B.4.2 — Customer Onboarding_
_Evidence file: `B42_OnboardingRunbook_v[N].pdf`_

```text
### Step 3 — Save and summarise

Write the file to `labs/Module B/B42/B42_OnboardingRunbook_v[version].md`.

```
✅ B.4.2 Onboarding Runbook generated
File : labs/Module B/B42/B42_OnboardingRunbook_v1.md
Next : Review each procedure, fill in site-specific values (SID, hostnames),
then export to PDF as B42_OnboardingRunbook_v1.pdf.

```text
## Example invocation

```
@moduleb-lab-coach #generate-runbook

```text
## References

- Evidence naming: `B42_OnboardingRunbook_v[N].pdf`
- Mock landscape: `tools/data/sap-landscape.json`
- ACSS docs: [learn.microsoft.com/azure/sap/center-sap-solutions](https://learn.microsoft.com/en-us/azure/sap/center-sap-solutions/overview)
- Control B.4.2: [NikoMix/specialization-sap-on-azure](https://github.com/NikoMix/specialization-sap-on-azure)
````
`````
