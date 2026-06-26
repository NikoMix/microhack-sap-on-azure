using '../main.bicep'

// Lab profile — cost-optimised SKUs for classroom use (~$0.31 USD/hr, ~$1.25 per 4-hour class).
// ✅ Safe to deploy and leave running during a class session.
//    Delete the resource group when the class ends to stop all billing:
//    az group delete --name rg-sapmh-lab --yes --no-wait
//
// To deploy:
//   az deployment sub create \
//     --location swedencentral \
//     --template-file infra/main.bicep \
//     --parameters @infra/params/lab.bicepparam \
//     --parameters adminSshPublicKey="$(cat ~/.ssh/id_rsa.pub)"
//
// To preview (what-if):
//   az deployment sub what-if \
//     --location swedencentral \
//     --template-file infra/main.bicep \
//     --parameters @infra/params/lab.bicepparam \
//     --parameters adminSshPublicKey="$(cat ~/.ssh/id_rsa.pub)"

param location = 'swedencentral'
param workloadName = 'sapmh'
param sizingProfile = 'lab'
param adminUsername = 'azureuser'
// adminSshPublicKey: for static CI validation, a non-empty placeholder is used via
// readEnvironmentVariable. At actual deployment time, override with your real key:
//   export ADMIN_SSH_PUBLIC_KEY="$(cat ~/.ssh/id_rsa.pub)"
//   az deployment sub create ... --parameters @infra/params/lab.bicepparam
//   OR: --parameters adminSshPublicKey="$(cat ~/.ssh/id_rsa.pub)"
// Deploying with the placeholder value will fail SSH login (not a valid public key).
param adminSshPublicKey = readEnvironmentVariable('ADMIN_SSH_PUBLIC_KEY', 'placeholder-replace-before-deploy')
param tags = {
  workload: 'sap-on-azure-microhack'
  module: 'module-b'
  costCenter: 'training'
  deleteAfter: 'class-end'
}
