metadata name = 'SAP landing zone — network'
metadata description = 'Deploys VNet (10.1.0.0/16) with three subnets (app / db / mgmt) and their NSGs following SAP-on-Azure security guidance.'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Short workload name used as a prefix in resource names.')
param workloadName string

@description('Resource tags applied to all resources.')
param tags object = {}

// ─── NSG: Application tier ────────────────────────────────────────────────────
// Allows SAP ports from within the VNet; management SSH from mgmt subnet only.
module nsgApp 'br/public:avm/res/network/network-security-group:0.5.3' = {
  name: 'deploy-nsg-app'
  params: {
    name: 'nsg-${workloadName}-app'
    location: location
    tags: tags
    securityRules: [
      {
        name: 'Allow-SAP-MsgSrv-Inbound'
        properties: {
          access: 'Allow'
          direction: 'Inbound'
          priority: 100
          protocol: 'Tcp'
          sourceAddressPrefix: 'VirtualNetwork'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '3600'
          description: 'SAP message server (ASCS/ERS)'
        }
      }
      {
        name: 'Allow-SAP-GUI-Inbound'
        properties: {
          access: 'Allow'
          direction: 'Inbound'
          priority: 110
          protocol: 'Tcp'
          sourceAddressPrefix: 'VirtualNetwork'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '3200'
          description: 'SAP GUI dispatcher port (instance 00)'
        }
      }
      {
        name: 'Allow-ICM-HTTPS-Inbound'
        properties: {
          access: 'Allow'
          direction: 'Inbound'
          priority: 120
          protocol: 'Tcp'
          sourceAddressPrefix: 'VirtualNetwork'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '443'
          description: 'SAP Web Dispatcher / ICM HTTPS'
        }
      }
      {
        name: 'Allow-SSH-FromMgmt'
        properties: {
          access: 'Allow'
          direction: 'Inbound'
          priority: 200
          protocol: 'Tcp'
          sourceAddressPrefix: '10.1.3.0/24'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '22'
          description: 'SSH from management subnet only'
        }
      }
      {
        name: 'Deny-All-Inbound'
        properties: {
          access: 'Deny'
          direction: 'Inbound'
          priority: 4095
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
          description: 'Deny all other inbound traffic'
        }
      }
    ]
  }
}

// ─── NSG: Database tier ────────────────────────────────────────────────────────
// Allows HANA ports from app subnet only; HSR replication within the DB subnet.
module nsgDb 'br/public:avm/res/network/network-security-group:0.5.3' = {
  name: 'deploy-nsg-db'
  params: {
    name: 'nsg-${workloadName}-db'
    location: location
    tags: tags
    securityRules: [
      {
        name: 'Allow-HANA-MDC-FromApp'
        properties: {
          access: 'Allow'
          direction: 'Inbound'
          priority: 100
          protocol: 'Tcp'
          sourceAddressPrefix: '10.1.1.0/24'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRanges: [
            '30013'
            '30015'
            '30040'
            '30041'
            '30042'
          ]
          description: 'SAP HANA MDC system DB and tenant DB ports from app subnet'
        }
      }
      {
        name: 'Allow-SAPHostAgent-FromApp'
        properties: {
          access: 'Allow'
          direction: 'Inbound'
          priority: 110
          protocol: 'Tcp'
          sourceAddressPrefix: '10.1.1.0/24'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRanges: [
            '1128'
            '1129'
          ]
          description: 'SAP Host Agent HTTP/HTTPS from app subnet'
        }
      }
      {
        name: 'Allow-HSR-IntraDB'
        properties: {
          access: 'Allow'
          direction: 'Inbound'
          priority: 120
          protocol: 'Tcp'
          sourceAddressPrefix: '10.1.2.0/24'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRanges: [
            '40000'
            '40001'
            '40002'
          ]
          description: 'SAP HANA System Replication (HSR) within DB subnet'
        }
      }
      {
        name: 'Allow-SSH-FromMgmt'
        properties: {
          access: 'Allow'
          direction: 'Inbound'
          priority: 200
          protocol: 'Tcp'
          sourceAddressPrefix: '10.1.3.0/24'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '22'
          description: 'SSH from management subnet only'
        }
      }
      {
        name: 'Deny-All-Inbound'
        properties: {
          access: 'Deny'
          direction: 'Inbound'
          priority: 4095
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
          description: 'Deny all other inbound traffic'
        }
      }
    ]
  }
}

// ─── NSG: Management subnet ───────────────────────────────────────────────────
module nsgMgmt 'br/public:avm/res/network/network-security-group:0.5.3' = {
  name: 'deploy-nsg-mgmt'
  params: {
    name: 'nsg-${workloadName}-mgmt'
    location: location
    tags: tags
    securityRules: [
      {
        name: 'Allow-SSH-Inbound'
        properties: {
          access: 'Allow'
          direction: 'Inbound'
          priority: 100
          protocol: 'Tcp'
          sourceAddressPrefix: 'VirtualNetwork'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '22'
          description: 'SSH for jump host management'
        }
      }
      {
        name: 'Allow-HTTPS-Inbound'
        properties: {
          access: 'Allow'
          direction: 'Inbound'
          priority: 110
          protocol: 'Tcp'
          sourceAddressPrefix: 'VirtualNetwork'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '443'
          description: 'HTTPS management access'
        }
      }
    ]
  }
}

// ─── Virtual Network ──────────────────────────────────────────────────────────
// Subnets reference NSGs via output resource IDs — Bicep resolves the dependency.
module vnet 'br/public:avm/res/network/virtual-network:0.9.0' = {
  name: 'deploy-vnet'
  params: {
    name: 'vnet-${workloadName}'
    location: location
    tags: tags
    addressPrefixes: ['10.1.0.0/16']
    subnets: [
      {
        name: 'snet-app'
        addressPrefix: '10.1.1.0/24'
        networkSecurityGroupResourceId: nsgApp.outputs.resourceId
      }
      {
        name: 'snet-db'
        addressPrefix: '10.1.2.0/24'
        networkSecurityGroupResourceId: nsgDb.outputs.resourceId
      }
      {
        name: 'snet-mgmt'
        addressPrefix: '10.1.3.0/24'
        networkSecurityGroupResourceId: nsgMgmt.outputs.resourceId
      }
    ]
  }
}

// ─── Outputs ─────────────────────────────────────────────────────────────────

@description('Resource ID of the deployed VNet.')
output vnetId string = vnet.outputs.resourceId

@description('Resource ID of the SAP application-tier subnet (snet-app).')
output appSubnetId string = vnet.outputs.subnetResourceIds[0]

@description('Resource ID of the SAP HANA database-tier subnet (snet-db).')
output dbSubnetId string = vnet.outputs.subnetResourceIds[1]

@description('Resource ID of the management subnet (snet-mgmt).')
output mgmtSubnetId string = vnet.outputs.subnetResourceIds[2]
