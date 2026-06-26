metadata name = 'SAP landing zone — backup'
metadata description = 'Deploys a Recovery Services vault with a SAP HANA database backup policy. Pupils map this to Module B control B.4.2 (backup and recovery).'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Short workload name used as a prefix in resource names.')
param workloadName string

@description('Resource tags applied to all resources.')
param tags object = {}

module rsv 'br/public:avm/res/recovery-services/vault:0.11.3' = {
  name: 'deploy-rsv'
  params: {
    name: 'rsv-${workloadName}'
    location: location
    tags: tags
    // Soft delete protects against accidental or malicious backup deletion.
    softDeleteSettings: {
      softDeleteState: 'Enabled'
      softDeleteRetentionPeriodInDays: 14
      enhancedSecurityState: 'Enabled'
    }
    // SAP HANA database backup policy — maps to ACSS backup recommendations.
    backupPolicies: [
      {
        name: 'policy-sap-hana-daily'
        properties: {
          backupManagementType: 'AzureWorkload'
          workloadType: 'SAPHanaDatabase'
          settings: {
            isCompression: false
            issqlcompression: false
            timeZone: 'UTC'
          }
          subProtectionPolicy: [
            {
              policyType: 'Full'
              retentionPolicy: {
                retentionPolicyType: 'LongTermRetentionPolicy'
                dailySchedule: {
                  retentionDuration: {
                    count: 30
                    durationType: 'Days'
                  }
                  retentionTimes: ['2000-01-01T22:00:00Z']
                }
                weeklySchedule: {
                  daysOfTheWeek: ['Sunday']
                  retentionDuration: {
                    count: 12
                    durationType: 'Weeks'
                  }
                  retentionTimes: ['2000-01-01T22:00:00Z']
                }
              }
              schedulePolicy: {
                schedulePolicyType: 'SimpleSchedulePolicy'
                scheduleRunFrequency: 'Daily'
                scheduleRunTimes: ['2000-01-01T22:00:00Z']
              }
            }
            {
              policyType: 'Log'
              retentionPolicy: {
                retentionPolicyType: 'SimpleRetentionPolicy'
                retentionDuration: {
                  count: 15
                  durationType: 'Days'
                }
              }
              schedulePolicy: {
                schedulePolicyType: 'LogSchedulePolicy'
                scheduleFrequencyInMins: 120
              }
            }
          ]
        }
      }
    ]
  }
}

// ─── Outputs ─────────────────────────────────────────────────────────────────

@description('Resource ID of the Recovery Services vault.')
output vaultId string = rsv.outputs.resourceId

@description('Name of the Recovery Services vault.')
output vaultName string = rsv.outputs.name
