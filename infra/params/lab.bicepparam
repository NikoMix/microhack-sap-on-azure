using '../main.bicep'

param location = 'swedencentral'
param workloadName = 'sapmh'
param sizingProfile = 'lab'
param tags = {
  workload: 'sap-on-azure-microhack'
  module: 'module-b'
  costCenter: 'training'
  deleteAfter: 'class-end'
}
