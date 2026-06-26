metadata name = 'SAP landing zone — shared storage'
metadata description = 'Deploys an Azure Files storage account simulating the SAP shared file system (/sapmnt). In a production reference topology this would be Azure NetApp Files (ANF) Premium tier.'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Short workload name used as a prefix in resource names.')
param workloadName string

@description('Storage SKU. lab = Standard_LRS; reference = Premium_ZRS (to simulate ANF-grade redundancy).')
@allowed([
  'Standard_LRS'
  'Standard_ZRS'
  'Premium_LRS'
  'Premium_ZRS'
])
param skuName string = 'Standard_LRS'

@description('Resource tags applied to all resources.')
param tags object = {}

// Storage account names must be 3-24 lowercase alphanumeric; uniqueString gives 13 chars.
var storageAccountName = take(toLower('st${workloadName}${uniqueString(resourceGroup().id)}'), 24)

module storageAccount 'br/public:avm/res/storage/storage-account:0.32.1' = {
  name: 'deploy-storage-sapmnt'
  params: {
    name: storageAccountName
    location: location
    tags: tags
    kind: 'StorageV2'
    skuName: skuName
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    requireInfrastructureEncryption: true
    // Azure Files share named 'sapmnt' simulates the SAP shared directory.
    // Production: Azure NetApp Files Premium with NFS v4.1 (see reference profile docs).
    fileServices: {
      shares: [
        {
          name: 'sapmnt'
          shareQuota: 100
          accessTier: 'TransactionOptimized'
        }
      ]
      shareDeleteRetentionPolicy: {
        enabled: true
        days: 7
      }
    }
  }
}

// ─── Outputs ─────────────────────────────────────────────────────────────────

@description('Resource ID of the storage account.')
output storageAccountId string = storageAccount.outputs.resourceId

@description('Name of the storage account.')
output storageAccountName string = storageAccount.outputs.name
