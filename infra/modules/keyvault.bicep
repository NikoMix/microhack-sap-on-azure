metadata name = 'SAP landing zone — Key Vault'
metadata description = 'Deploys a Key Vault using RBAC authorization for SAP certificate and secrets management.'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Short workload name used as a prefix in resource names.')
param workloadName string

@description('Enable purge protection. lab = false (allows vault deletion); reference = true (production hardening).')
param enablePurgeProtection bool = false

@description('Soft-delete retention in days. Minimum 7 (lab); 90 for reference profile.')
@minValue(7)
@maxValue(90)
param softDeleteRetentionInDays int = 7

@description('Resource tags applied to all resources.')
param tags object = {}

// Key Vault names: 3-24 chars, alphanumeric and hyphens.
var kvName = take('kv-${workloadName}-${uniqueString(resourceGroup().id)}', 24)

module keyVault 'br/public:avm/res/key-vault/vault:0.13.3' = {
  name: 'deploy-keyvault'
  params: {
    name: kvName
    location: location
    tags: tags
    // RBAC authorization: manage access via role assignments, not access policies.
    enableRbacAuthorization: true
    // ⚠️ AVM default is enablePurgeProtection = true — must be explicit here.
    enablePurgeProtection: enablePurgeProtection
    enableSoftDelete: true
    softDeleteRetentionInDays: softDeleteRetentionInDays
    sku: 'standard'
    publicNetworkAccess: 'Enabled'
    // Allow Azure VMs to retrieve certificates (required for SAP certificate management).
    enableVaultForDeployment: true
    enableVaultForTemplateDeployment: true
    enableVaultForDiskEncryption: false
    createMode: 'default'
  }
}

// ─── Outputs ─────────────────────────────────────────────────────────────────

@description('Resource ID of the Key Vault.')
output vaultId string = keyVault.outputs.resourceId

@description('URI of the Key Vault (https://<name>.vault.azure.net/).')
output vaultUri string = keyVault.outputs.uri

@description('Name of the Key Vault.')
output vaultName string = keyVault.outputs.name
