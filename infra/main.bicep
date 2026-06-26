targetScope = 'subscription'

metadata name = 'SAP on Azure — Module B Accelerator landing zone'
metadata description = '''
Skeleton landing zone for the simulated SAP landscape used by labs C1 (B.1.1) and C2 (B.4.2).
Full network / compute / management modules are layered in under infra/modules during the labs.
A real SAP system is NOT deployed — SAP is simulated. Choose sizingProfile=lab for a cheap classroom
deployment, or sizingProfile=reference to render the SAP-certified M-series topology (documented).
'''

@description('Azure region for the simulated SAP landing zone (must support Availability Zones + ANF for the reference profile).')
param location string = deployment().location

@description('Short workload name used as a prefix in resource names.')
@minLength(2)
@maxLength(8)
param workloadName string = 'sapmh'

@description('Deployment sizing profile. lab = cheap SKUs for the classroom; reference = SAP-certified M-series topology.')
@allowed([
  'lab'
  'reference'
])
param sizingProfile string = 'lab'

@description('Tags applied to every resource for cost attribution and clean-up.')
param tags object = {
  workload: 'sap-on-azure-microhack'
  module: 'module-b'
  costCenter: 'training'
  deleteAfter: 'class-end'
}

var resourceGroupName = 'rg-${workloadName}-${sizingProfile}'

resource rg 'Microsoft.Resources/resourceGroups@2024-11-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

@description('Resource ID of the landing-zone resource group.')
output resourceGroupId string = rg.id

@description('Name of the landing-zone resource group.')
output resourceGroupName string = rg.name

@description('Effective sizing profile for the deployment.')
output sizingProfile string = sizingProfile
