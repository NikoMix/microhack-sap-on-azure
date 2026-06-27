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
// adminSshPublicKey is intentionally omitted — provide at deploy time:
//   --parameters adminSshPublicKey="$(cat ~/.ssh/id_rsa.pub)"
param tags = {
  workload: 'sap-on-azure-microhack'
  module: 'module-b'
  costCenter: 'training'
  deleteAfter: 'class-end'
}
