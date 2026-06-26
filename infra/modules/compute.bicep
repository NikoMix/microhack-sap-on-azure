metadata name = 'SAP landing zone — compute'
metadata description = '''
Deploys two Linux VMs simulating the SAP application tier (ASCS/PAS) and the SAP HANA database tier.
No SAP software is installed — the VMs represent the Azure infrastructure footprint that pupils
document as Module B.1.1 (Implementation Capability) evidence.

Lab profile  : Standard_D2s_v5 (app) + Standard_D4s_v5 (db)  — cost-optimised for classroom use.
Reference    : Standard_E16ds_v5 (app) + Standard_M64ms (db)  — SAP-certified, documented only.
'''

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Short workload name used as a prefix in resource names.')
param workloadName string

@description('VM SKU for the SAP application tier (ASCS/PAS simulation).')
param appVmSku string = 'Standard_D2s_v5'

@description('VM SKU for the SAP HANA database tier simulation.')
param dbVmSku string = 'Standard_D4s_v5'

@description('Admin username for the simulated SAP VMs.')
param adminUsername string = 'azureuser'

@description('SSH public key for the VM admin. Provided at deployment time; never hard-coded.')
@secure()
param adminSshPublicKey string

@description('Resource ID of the application-tier subnet (snet-app).')
param appSubnetId string

@description('Resource ID of the database-tier subnet (snet-db).')
param dbSubnetId string

@description('Resource tags applied to all resources.')
param tags object = {}

// Ubuntu 22.04 LTS Gen2 — production SAP deployments would use SLES 15 SP5 or RHEL 8.x for SAP.
// 'latest' is used here to avoid maintenance burden in courseware; pin to a specific version in production.
var sapImage = {
  publisher: 'Canonical'
  offer: '0001-com-ubuntu-server-jammy'
  sku: '22_04-lts-gen2'
  version: 'latest'
}

// ─── SAP Application Tier VM ─────────────────────────────────────────────────
// Simulates ASCS (Central Services) + PAS (Primary Application Server) on one node.
module appVm 'br/public:avm/res/compute/virtual-machine:0.22.2' = {
  name: 'deploy-vm-app'
  params: {
    name: 'vm-${workloadName}-app'
    location: location
    tags: union(tags, { sapTier: 'application', sapRole: 'ASCS-PAS' })
    vmSize: appVmSku
    osType: 'Linux'
    availabilityZone: -1
    adminUsername: adminUsername
    disablePasswordAuthentication: true
    publicKeys: [
      {
        keyData: adminSshPublicKey
        path: '/home/${adminUsername}/.ssh/authorized_keys'
      }
    ]
    imageReference: sapImage
    osDisk: {
      caching: 'ReadWrite'
      diskSizeGB: 128
      managedDisk: {
        storageAccountType: 'Premium_LRS'
      }
    }
    nicConfigurations: [
      {
        nicSuffix: '-nic-01'
        enableAcceleratedNetworking: true
        deleteOption: 'Delete'
        ipConfigurations: [
          {
            name: 'ipconfig01'
            subnetResourceId: appSubnetId
            privateIPAllocationMethod: 'Dynamic'
          }
        ]
      }
    ]
  }
}

// ─── SAP HANA Database Tier VM ───────────────────────────────────────────────
// Simulates the primary SAP HANA node. Reference topology adds an HSR secondary (M64ms).
module dbVm 'br/public:avm/res/compute/virtual-machine:0.22.2' = {
  name: 'deploy-vm-db'
  params: {
    name: 'vm-${workloadName}-db'
    location: location
    tags: union(tags, { sapTier: 'database', sapRole: 'HANA-primary' })
    vmSize: dbVmSku
    osType: 'Linux'
    availabilityZone: -1
    adminUsername: adminUsername
    disablePasswordAuthentication: true
    publicKeys: [
      {
        keyData: adminSshPublicKey
        path: '/home/${adminUsername}/.ssh/authorized_keys'
      }
    ]
    imageReference: sapImage
    osDisk: {
      caching: 'ReadWrite'
      diskSizeGB: 256
      managedDisk: {
        storageAccountType: 'Premium_LRS'
      }
    }
    nicConfigurations: [
      {
        nicSuffix: '-nic-01'
        enableAcceleratedNetworking: true
        deleteOption: 'Delete'
        ipConfigurations: [
          {
            name: 'ipconfig01'
            subnetResourceId: dbSubnetId
            privateIPAllocationMethod: 'Dynamic'
          }
        ]
      }
    ]
  }
}

// ─── Outputs ─────────────────────────────────────────────────────────────────

@description('Resource ID of the SAP application-tier VM.')
output appVmId string = appVm.outputs.resourceId

@description('Name of the SAP application-tier VM.')
output appVmName string = appVm.outputs.name

@description('Resource ID of the SAP HANA database-tier VM.')
output dbVmId string = dbVm.outputs.resourceId

@description('Name of the SAP HANA database-tier VM.')
output dbVmName string = dbVm.outputs.name
