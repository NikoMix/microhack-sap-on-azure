targetScope = 'subscription'

metadata name = 'SAP on Azure — Module B Accelerator landing zone'
metadata description = '''
Subscription-scoped landing zone for the simulated SAP landscape used by labs C1 (B.1.1) and C2 (B.4.2).
Composes Azure Verified Modules (AVM) to stand up network, storage, monitoring, backup, Key Vault and
compute representing an SAP NetWeaver + HANA footprint.

A real SAP system is NOT deployed — SAP is simulated.
  • sizingProfile=lab       → small/cheap SKUs, safe for a classroom budget (~$2–5 USD/hour).
  • sizingProfile=reference → SAP-certified M-series topology (documented; deploy only for show-and-tell).
'''

@description('Azure region for the simulated SAP landing zone.')
param location string = deployment().location

@description('Short workload name used as a prefix in resource names (2–8 chars).')
@minLength(2)
@maxLength(8)
param workloadName string = 'sapmh'

@description('Deployment sizing profile. lab = cheap SKUs; reference = SAP-certified M-series (documented).')
@allowed([
  'lab'
  'reference'
])
param sizingProfile string = 'lab'

@description('Admin username for the simulated SAP VMs.')
param adminUsername string = 'azureuser'

@description('SSH public key for the admin user on the simulated SAP VMs. Provided at deployment time — never hard-coded.')
@secure()
@minLength(1)
param adminSshPublicKey string

@description('Tags applied to every resource for cost attribution and clean-up.')
param tags object = {
  workload: 'sap-on-azure-microhack'
  module: 'module-b'
  costCenter: 'training'
  deleteAfter: 'class-end'
}

// ─── Sizing configuration ─────────────────────────────────────────────────────
// lab: cost-optimised SKUs for classroom use (D/E-series).
// reference: SAP-certified production SKUs (M-series) — use what-if to review, do not deploy in CI.
var sizing = {
  lab: {
    appVmSku: 'Standard_D2s_v5'
    dbVmSku: 'Standard_D4s_v5'
    storageSkuName: 'Standard_LRS'
    logRetentionDays: 30
    kvPurgeProtection: false
    kvSoftDeleteDays: 7
  }
  reference: {
    appVmSku: 'Standard_E16ds_v5'
    dbVmSku: 'Standard_D4s_v5'
    storageSkuName: 'Premium_ZRS'
    logRetentionDays: 90
    kvPurgeProtection: true
    kvSoftDeleteDays: 90
  }
}[sizingProfile]

var resourceGroupName = 'rg-${workloadName}-${sizingProfile}'

// ─── Resource Group ───────────────────────────────────────────────────────────
resource rg 'Microsoft.Resources/resourceGroups@2024-11-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// ─── Network (VNet + NSGs) ────────────────────────────────────────────────────
module network 'modules/network.bicep' = {
  name: 'deploy-network'
  scope: rg
  params: {
    location: location
    workloadName: workloadName
    tags: tags
  }
}

// ─── Shared Storage (Azure Files simulating /sapmnt) ──────────────────────────
module storage 'modules/storage.bicep' = {
  name: 'deploy-storage'
  scope: rg
  params: {
    location: location
    workloadName: workloadName
    skuName: sizing.storageSkuName
    tags: tags
  }
}

// ─── Monitoring (Log Analytics for Azure Monitor for SAP) ─────────────────────
module monitoring 'modules/monitoring.bicep' = {
  name: 'deploy-monitoring'
  scope: rg
  params: {
    location: location
    workloadName: workloadName
    retentionDays: sizing.logRetentionDays
    tags: tags
  }
}

// ─── Backup (Recovery Services vault + SAP HANA policy) ───────────────────────
module backup 'modules/backup.bicep' = {
  name: 'deploy-backup'
  scope: rg
  params: {
    location: location
    workloadName: workloadName
    tags: tags
  }
}

// ─── Key Vault (SAP certificate and secrets management) ───────────────────────
module keyvault 'modules/keyvault.bicep' = {
  name: 'deploy-keyvault'
  scope: rg
  params: {
    location: location
    workloadName: workloadName
    enablePurgeProtection: sizing.kvPurgeProtection
    softDeleteRetentionInDays: sizing.kvSoftDeleteDays
    tags: tags
  }
}

// ─── Compute (simulated SAP app + db VMs) ─────────────────────────────────────
module compute 'modules/compute.bicep' = {
  name: 'deploy-compute'
  scope: rg
  params: {
    location: location
    workloadName: workloadName
    appVmSku: sizing.appVmSku
    dbVmSku: sizing.dbVmSku
    adminUsername: adminUsername
    adminSshPublicKey: adminSshPublicKey
    appSubnetId: network.outputs.appSubnetId
    dbSubnetId: network.outputs.dbSubnetId
    tags: tags
  }
}

// ─── Outputs ─────────────────────────────────────────────────────────────────

@description('Resource ID of the landing-zone resource group.')
output resourceGroupId string = rg.id

@description('Name of the landing-zone resource group.')
output resourceGroupName string = rg.name

@description('Effective sizing profile for the deployment.')
output sizingProfile string = sizingProfile

@description('Resource ID of the VNet.')
output vnetId string = network.outputs.vnetId

@description('Resource ID of the Log Analytics workspace.')
output logAnalyticsWorkspaceId string = monitoring.outputs.workspaceResourceId

@description('URI of the Key Vault.')
output keyVaultUri string = keyvault.outputs.vaultUri

@description('Name of the SAP application-tier VM.')
output appVmName string = compute.outputs.appVmName

@description('Name of the SAP HANA database-tier VM.')
output dbVmName string = compute.outputs.dbVmName


