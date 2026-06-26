---
description: >-
  Generate a High-Level Design (HLD) document for an SAP on Azure deployment.
  Produces a structured technical design covering logical architecture, Azure
  service mapping, HA/DR design, networking, security posture and sizing
  rationale. Primary evidence for control B.4.2 (onboarding HLD/LLD); also
  supports B.4.1 (audit readiness). Output saved as B42_HLD_v[N].md (or
  B42_LLD_v[N].md with mode:LLD) → PDF.
argument-hint: >-
  Describe the scope — e.g. "generate HLD for S/4HANA 2023 on Azure West Europe
  with HA across zones". Leave blank to use tools/data/sap-landscape.json.
tools: [read, edit, search]
---

# Skill: Generate High-Level Design (B.4.2, B.4.1)

Produce a complete High-Level Design document for an SAP on Azure landing zone.
The HLD is the primary technical evidence for **B.4.2** (onboarding) and a
supporting document for **B.4.1** (audit readiness).

## Inputs

| Variable         | Source                                 | Default                             |
| ---------------- | -------------------------------------- | ----------------------------------- |
| `landscape_json` | `tools/data/sap-landscape.json`        | read automatically                  |
| `customer`       | `landscape_json.metadata.customer`     | Contoso AG                          |
| `region`         | `landscape_json.metadata.azure_region` | westeurope                          |
| `version`        | argument or 1                          | `v1`                                |
| `output_path`    | argument or default                    | `labs/Module B/B42/B42_HLD_v[N].md` |

## Output

A Markdown HLD file at `output_path` structured for a Microsoft Partner
technical review.

## Workflow

### Step 1 — Read the landscape data

Read `tools/data/sap-landscape.json`. Extract systems, resources, networking
topology, HA configuration, and sizing data.

### Step 2 — Build the architecture overview table

Create a master table mapping each SAP system to its Azure footprint:

| SAP System | SID | Type | Tier | Azure VM SKU | vCPU | RAM (GB) | Storage | HA Config |
| ---------- | --- | ---- | ---- | ------------ | ---- | -------- | ------- | --------- |

[one row per system from landscape_json.systems]

### Step 3 — Draft the HLD

`````markdown
# High-Level Design: SAP on Azure — [Customer Name]

**Document version:** v[N]
**Date:** [current date]
**Classification:** Partner Confidential

---

## 1. Executive Overview

[2–3 sentences: purpose of this HLD, the SAP landscape scope, and the Azure
region strategy.]

## 2. Scope and Assumptions

### In scope

- [list of SAP SIDs from landscape_json]
- Azure landing zone (hub-spoke VNet, ExpressRoute connectivity)
- HA/DR to secondary Azure region

### Assumptions

- Customer has existing ExpressRoute or will provision prior to migration.
- Azure subscription has M-series quota approved in target regions.
- SAP HANA Tailored Datacenter Integration (TDI) certification applies.

## 3. Logical Architecture

[Describe hub-spoke topology: hub VNet (ExpressRoute GW, Azure Bastion, Azure
Firewall), spoke VNet (SAP subnets: DB, App, ASCS/ERS, Management). Include
Availability Zone pinning strategy.]

### 3.1 Network topology

| VNet           | Subnet          | CIDR        | Resources                     |
| -------------- | --------------- | ----------- | ----------------------------- |
| hub-vnet       | GatewaySubnet   | 10.0.0.0/27 | ExpressRoute GW (Ultra perf)  |
| hub-vnet       | AzureFirewallSn | 10.0.1.0/26 | Azure Firewall Premium        |
| sap-spoke-vnet | sn-hana         | 10.1.0.0/24 | HANA DB VMs (Zone 1 + Zone 2) |
| sap-spoke-vnet | sn-app          | 10.1.1.0/24 | App server VMs                |
| sap-spoke-vnet | sn-ascs         | 10.1.2.0/28 | ASCS/ERS cluster VMs          |
| sap-spoke-vnet | sn-mgmt         | 10.1.3.0/28 | Management / Bastion          |

### 3.2 SAP system placement (Availability Zones)

[Table showing which SID runs in which AZ, primary and secondary nodes.]

## 4. Compute Sizing

### Certified HANA sizing

| SID | Type | SAPS | RAM (GB) | Azure VM SKU | Certification |
| --- | ---- | ---- | -------- | ------------ | ------------- |

[from landscape_json.systems — map to SAP Note 1928533]

> **SAP Note 1928533** is the authoritative list of certified Azure VM types
> for SAP workloads. Always verify SKU certification before provisioning.

## 5. Storage Design

| Layer              | Service                | SKU / Tier | Sizing rationale          |
| ------------------ | ---------------------- | ---------- | ------------------------- |
| HANA data volume   | Azure NetApp Files     | Ultra      | ≥ 250 MB/s per HANA node  |
| HANA log volume    | Azure NetApp Files     | Ultra      | Latency < 1 ms (write)    |
| HANA backup        | Azure Blob (LRS → GRS) | Cool       | 30-day retention          |
| OS disks           | Premium SSD v2         | —          | < 1 ms latency for OS I/O |
| Shared (transport) | Azure NetApp Files     | Premium    | /usr/sap, /sapmnt         |

## 6. High Availability Design

### HANA System Replication (HSR)

- **Replication mode:** SYNC within the same Azure region (AZ-to-AZ).
- **Takeover:** automated via Pacemaker cluster with SBD fencing.
- **Topology:** Scale-up (primary + secondary in separate AZs).

### ASCS/ERS clustering

- Pacemaker + corosync on RHEL 8.x or SLES 15 SP4.
- SBD device hosted on Azure shared storage or iscsi-based fencing agent.
- Cluster resources: SAP_ASCS, SAP_ERS, IP, Filesystem.

### Availability Zone design

````text
Zone 1                Zone 2
──────────────────    ──────────────────
HANA-Primary          HANA-Secondary (HSR)
ASCS-Active           ERS-Active
App-Server-01..N      App-Server-N+1..M
ANF (multi-zonal)     ← shared across zones
```text
```
## 7. Disaster Recovery

- **RTO target:** 35 minutes (automated HANA takeover).
- **RPO target:** 15 minutes (HSR async to secondary region).
- **DR strategy:** HANA System Replication to secondary Azure region (async).
- **Azure Backup for SAP HANA:** Backint-certified, daily full + hourly log.

## 8. Security Posture

| Layer              | Control                                  |
| ------------------ | ---------------------------------------- |
| Identity           | Microsoft Entra ID + SAML for SAP Fiori  |
| Network            | Azure Firewall Premium (IDS/IPS)         |
| OS hardening       | CIS Azure Linux Benchmark Level 1        |
| Data at rest       | Azure Disk Encryption (ADE) on all disks |
| Data in transit    | TLS 1.3 for SAP GUI; private endpoints   |
| Key management     | Azure Key Vault (Premium HSM)            |
| Posture management | Microsoft Defender for Cloud (P2)        |

## 9. Management & Monitoring

| Tool                            | Purpose                                      |
| ------------------------------- | -------------------------------------------- |
| Azure Center for SAP solutions  | Deployment, health dashboard, quality checks |
| Azure Monitor for SAP solutions | SAP-aware metrics, alerting, log analytics   |
| Azure Update Manager            | OS patch compliance                          |
| Azure Backup                    | SAP HANA Backint policy                      |

## 10. Evidence artefacts produced

- `B42_HLD_v[N].pdf` — this document
- `B42_LLD_v[N].pdf` — re-run with `mode:LLD` (see `generate-hld` skill)

_Control references: Module B · B.4.2 — Partner Onboarding / Migration,
B.4.1 — Audit Readiness (supporting)_

```text
### Step 4 — Save the file

Create `labs/Module B/B42/` if needed. Write to `labs/Module B/B42/B42_HLD_v[version].md`.

### Step 5 — Summarise for the student

```
✅ B.4.2 High-Level Design generated
File : labs/Module B/B42/B42_HLD_v1.md
Lines : [N]
Next : Export to PDF and save as B42_HLD_v1.pdf in the same folder.
For the LLD, re-run with mode:LLD to produce B42_LLD_v1.

```text
## Example invocation

```
@moduleb-lab-coach #generate-hld

```text
With custom region override:

```
@moduleb-lab-coach #generate-hld S/4HANA 2023 in North Europe, DR to West Europe

```text
## References

- Evidence naming: `B42_HLD_v[N].pdf`
- Mock landscape: `tools/data/sap-landscape.json`
- SAP Note 1928533: certified Azure VM types for SAP
- SAP HANA TDI: [learn.microsoft.com/azure/sap/large-instances](https://learn.microsoft.com/en-us/azure/sap/large-instances/hana-overview-architecture)
- Controls: B.1.1, B.4.1 — [NikoMix/specialization-sap-on-azure](https://github.com/NikoMix/specialization-sap-on-azure)
````
`````
