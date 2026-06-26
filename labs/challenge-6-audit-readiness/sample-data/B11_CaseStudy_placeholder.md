# B.1.1 — Case Study (Placeholder)

> **Note:** This is a placeholder artefact for the C6 Audit Readiness lab.
> Replace with the real case study produced in C1 · B.1.1 Implementation Capability.

## Customer overview

**Customer:** Contoso Manufacturing (anonymised)
**Industry:** Manufacturing
**Region:** West Europe

## SAP landscape deployed

| System                              | SID | VM SKU             | Storage            |
| ----------------------------------- | --- | ------------------ | ------------------ |
| SAP ECC 6.0 HANA DB (Primary)       | P01 | Standard_M208ms_v2 | Azure NetApp Files |
| SAP ECC 6.0 HANA DB (HSR Secondary) | P01 | Standard_M208ms_v2 | Azure NetApp Files |
| SAP Central Services (ASCS)         | P01 | Standard_D4s_v5    | Premium SSD v2     |
| SAP Enqueue Replication (ERS)       | P01 | Standard_D4s_v5    | Premium SSD v2     |
| SAP Application Servers (×3)        | P01 | Standard_E8s_v5    | Premium SSD v2     |

## Partner capability demonstrated

- Deployed SAP HANA Scale-Up on Mv2 VMs using Azure Verified Bicep modules.
- Configured HANA System Replication (HSR) with automatic failover via Pacemaker + SBD.
- Registered landscape with Azure Center for SAP solutions (ACSS).
- Enabled Azure Monitor for SAP solutions and Azure Backup for SAP HANA (Backint).

## Evidence file naming

`B11_CaseStudy_v1.pdf`
