using '../main.bicep'

// Reference profile — SAP-certified M-series topology for production documentation.
// ⚠️  This profile uses Standard_M64ms (SAP HANA) and Standard_E16ds_v5 (app tier).
//     Deploy ONLY for show-and-tell; use sizingProfile=lab for all classroom exercises.
//
// To perform a what-if against your subscription:
//   az deployment sub what-if \
//     --location swedencentral \
//     --template-file infra/main.bicep \
//     --parameters @infra/params/reference.bicepparam \
//     --parameters adminSshPublicKey="$(cat ~/.ssh/id_rsa.pub)"

param location = 'swedencentral'
param workloadName = 'sapmh'
param sizingProfile = 'reference'
param adminUsername = 'azureuser'
param tags = {
  workload: 'sap-on-azure-microhack'
  module: 'module-b'
  costCenter: 'training'
  deleteAfter: 'reference-review'
}
