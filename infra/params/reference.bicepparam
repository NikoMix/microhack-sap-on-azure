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
// adminSshPublicKey: for static CI validation, a non-empty placeholder is used via
// readEnvironmentVariable. At actual deployment time, override with your real key:
//   export ADMIN_SSH_PUBLIC_KEY="$(cat ~/.ssh/id_rsa.pub)"
//   az deployment sub create ... --parameters @infra/params/reference.bicepparam
//   OR: --parameters adminSshPublicKey="$(cat ~/.ssh/id_rsa.pub)"
// Deploying with the placeholder value will fail SSH login (not a valid public key).
param adminSshPublicKey = readEnvironmentVariable('ADMIN_SSH_PUBLIC_KEY', 'placeholder-replace-before-deploy')
param tags = {
  workload: 'sap-on-azure-microhack'
  module: 'module-b'
  costCenter: 'training'
  deleteAfter: 'reference-review'
}
