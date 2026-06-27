metadata name = 'SAP landing zone — monitoring'
metadata description = 'Deploys a Log Analytics workspace used by Azure Monitor for SAP solutions (AMS) and VM diagnostics.'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Short workload name used as a prefix in resource names.')
param workloadName string

@description('Log retention in days. lab = 30; reference = 90.')
@minValue(30)
@maxValue(730)
param retentionDays int = 30

@description('Resource tags applied to all resources.')
param tags object = {}

module logAnalytics 'br/public:avm/res/operational-insights/workspace:0.15.1' = {
  name: 'deploy-law'
  params: {
    name: 'law-${workloadName}'
    location: location
    tags: tags
    skuName: 'PerGB2018'
    dataRetention: retentionDays
    // Must be false for a standalone workspace without a linked storage account.
    forceCmkForQuery: false
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ─── Outputs ─────────────────────────────────────────────────────────────────

@description('Resource ID of the Log Analytics workspace.')
output workspaceResourceId string = logAnalytics.outputs.resourceId

@description('Workspace ID (GUID) — used when configuring Azure Monitor data sources.')
output workspaceId string = logAnalytics.outputs.logAnalyticsWorkspaceId
