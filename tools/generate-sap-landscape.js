/**
 * generate-sap-landscape.js
 *
 * Deterministic generator for a simulated SAP-on-Azure landscape inventory.
 * Zero external dependencies — Node 22 stdlib only.
 *
 * Usage:
 *   node tools/generate-sap-landscape.js [--seed N] [--out FILE | --out-dir DIR]
 *
 * Defaults:
 *   --seed     42
 *   --out      tools/data/sap-landscape.json
 *   --out-dir  (alternative to --out) writes <DIR>/sap-landscape.json
 *
 * The output is fully reproducible: the same seed always produces the same JSON.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CLI argument parsing ────────────────────────────────────────────────────

const args = process.argv.slice(2);
const seedIdx = args.indexOf('--seed');
const outIdx = args.indexOf('--out');
const outDirIdx = args.indexOf('--out-dir');
const SEED = seedIdx !== -1 ? parseInt(args[seedIdx + 1], 10) : 42;
const OUT =
  outIdx !== -1
    ? resolve(args[outIdx + 1])
    : outDirIdx !== -1
      ? resolve(args[outDirIdx + 1], 'sap-landscape.json')
      : resolve(__dirname, 'data', 'sap-landscape.json');

// ── Seeded PRNG (xorshift32) ────────────────────────────────────────────────

class Rng {
  /** @param {number} seed Non-zero 32-bit integer seed */
  constructor(seed) {
    this.s = seed >>> 0 || 1;
  }

  /** Returns a pseudo-random float in [0, 1) */
  next() {
    let s = this.s;
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    this.s = s >>> 0;
    return this.s / 0x100000000;
  }

  /** Returns a pseudo-random integer in [lo, hi] inclusive */
  int(lo, hi) {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }

  /** Returns a pseudo-random float in [lo, hi] rounded to 2 dp */
  float(lo, hi) {
    return Math.round((lo + this.next() * (hi - lo)) * 100) / 100;
  }

  /** Picks a random element from an array */
  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  }

  /** Picks N unique random elements from an array */
  pickN(arr, n) {
    const copy = [...arr];
    const result = [];
    for (let i = 0; i < n && copy.length > 0; i++) {
      const idx = this.int(0, copy.length - 1);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  }
}

// ── Reference data ──────────────────────────────────────────────────────────

const VM_SKUS = [
  {
    sku: 'Standard_M64ms',
    vcpu: 64,
    ram_gb: 1792,
    saps: 43000,
    category: 'HANA DB',
    certified: true,
  },
  {
    sku: 'Standard_M96s_v3',
    vcpu: 96,
    ram_gb: 900,
    saps: 53000,
    category: 'HANA DB',
    certified: true,
  },
  {
    sku: 'Standard_M128ms',
    vcpu: 128,
    ram_gb: 3892,
    saps: 86000,
    category: 'HANA DB',
    certified: true,
  },
  {
    sku: 'Standard_M208s_v2',
    vcpu: 208,
    ram_gb: 2850,
    saps: 138000,
    category: 'HANA DB',
    certified: true,
  },
  {
    sku: 'Standard_E16s_v5',
    vcpu: 16,
    ram_gb: 128,
    saps: 14500,
    category: 'App Server',
    certified: true,
  },
  {
    sku: 'Standard_E32s_v5',
    vcpu: 32,
    ram_gb: 256,
    saps: 27000,
    category: 'App Server',
    certified: true,
  },
  {
    sku: 'Standard_D4s_v5',
    vcpu: 4,
    ram_gb: 16,
    saps: 5200,
    category: 'ASCS/ERS / Web',
    certified: true,
  },
  {
    sku: 'Standard_D8s_v5',
    vcpu: 8,
    ram_gb: 32,
    saps: 10200,
    category: 'ASCS/ERS / Web',
    certified: true,
  },
];

const HANA_VM_SKUS = VM_SKUS.filter((v) => v.category === 'HANA DB');
const APP_VM_SKUS = VM_SKUS.filter((v) => v.category === 'App Server');
const SMALL_VM_SKUS = VM_SKUS.filter((v) => v.category === 'ASCS/ERS / Web');

const ANF_TIERS = ['Ultra', 'Premium', 'Standard'];
const AZURE_REGIONS = ['westeurope', 'northeurope', 'germanywestcentral', 'swedencentral'];
const INDUSTRIES = ['Manufacturing', 'Retail', 'Automotive', 'Logistics', 'Chemicals', 'Utilities'];
const OS_IMAGES = ['SLES 15 SP5 for SAP', 'RHEL 8.8 for SAP Solutions'];
const HA_CONFIGS = ['HSR + Pacemaker (SYNC)', 'HSR + Pacemaker (ASYNC)', 'Standalone (no HA)'];

const SAP_SYSTEM_TYPES = [
  { type: 's4hana', label: 'SAP S/4HANA', versions: ['2023', '2022', '2021'] },
  { type: 'ecc', label: 'SAP ECC 6', versions: ['EHP8'] },
  { type: 'bw4hana', label: 'SAP BW/4HANA', versions: ['2.0', '2021'] },
  { type: 'solman', label: 'SAP Solution Manager', versions: ['7.2'] },
  { type: 'webdisp', label: 'SAP Web Dispatcher', versions: ['7.77'] },
];

const CUSTOMERS = [
  { name: 'Contoso AG', industry: 'Manufacturing', country: 'Germany', short: 'contoso' },
  { name: 'Fabrikam GmbH', industry: 'Automotive', country: 'Germany', short: 'fabrikam' },
  {
    name: 'Northwind Logistics BV',
    industry: 'Logistics',
    country: 'Netherlands',
    short: 'northwind',
  },
  { name: 'AdventureWorks SA', industry: 'Retail', country: 'France', short: 'adventure' },
  { name: 'Tailspin Chemicals NV', industry: 'Chemicals', country: 'Belgium', short: 'tailspin' },
];

// ── Generator functions ─────────────────────────────────────────────────────

function generateCustomer(rng) {
  const c = rng.pick(CUSTOMERS);
  return {
    name: c.name,
    industry: c.industry,
    country: c.country,
    short_name: c.short,
  };
}

function generateSystem(rng, sid, systemTypeDef, tier, index) {
  const typeObj = rng.pick(systemTypeDef.versions)
    ? {
        type: systemTypeDef.type,
        label: systemTypeDef.label,
        version: rng.pick(systemTypeDef.versions),
      }
    : null;
  const hanaVm = rng.pick(HANA_VM_SKUS);
  const appVm = rng.pick(APP_VM_SKUS);
  const ascsVm = rng.pick(SMALL_VM_SKUS);
  const appServerCount = rng.int(2, 6);
  const zone = rng.int(1, 3);
  const secondaryZone = zone === 3 ? 1 : zone + 1;

  return {
    sid,
    description: `${systemTypeDef.label} ${typeObj?.version ?? ''} — ${tier}`.trim(),
    landscape_tier: tier,
    sap_product: systemTypeDef.type,
    sap_product_label: systemTypeDef.label,
    sap_version: typeObj?.version ?? 'n/a',
    primary_az: `Zone ${zone}`,
    secondary_az: `Zone ${secondaryZone}`,
    ha_config:
      tier === 'production'
        ? rng.pick(['HSR + Pacemaker (SYNC)', 'HSR + Pacemaker (SYNC)'])
        : 'Standalone (no HA)',
    os_image: rng.pick(OS_IMAGES),
    hana_db: {
      vm_sku: hanaVm.sku,
      vcpu: hanaVm.vcpu,
      ram_gb: hanaVm.ram_gb,
      saps: hanaVm.saps,
      node_count: tier === 'production' ? 2 : 1,
      anf_tier: tier === 'production' ? 'Ultra' : 'Premium',
      anf_data_tib: rng.float(2, 8),
      anf_log_tib: rng.float(0.5, 2),
    },
    app_servers: {
      vm_sku: appVm.sku,
      vcpu: appVm.vcpu,
      ram_gb: appVm.ram_gb,
      count: tier === 'production' ? appServerCount : rng.int(1, 2),
    },
    ascs_ers: {
      vm_sku: ascsVm.sku,
      node_count: 2,
    },
    acss_managed: tier === 'production',
    ams_monitored: tier === 'production',
    backup_enabled: true,
    sap_note_1928533_certified: true,
  };
}

function generateAzureResources(rng, systems, region, prefix) {
  const resources = [];

  // ExpressRoute gateway
  resources.push({
    resource_type: 'expressroute_gateway',
    name: `ergw-${prefix}-hub`,
    sku: 'UltraPerformance',
    purpose: 'On-premises to Azure connectivity (< 10 ms latency)',
    bandwidth_gbps: rng.pick([1, 2, 10]),
  });

  // Azure Firewall
  resources.push({
    resource_type: 'azure_firewall',
    name: `fw-${prefix}-hub`,
    sku: 'Premium',
    purpose: 'East-west and north-south traffic control, IDS/IPS',
  });

  // Key Vault
  resources.push({
    resource_type: 'key_vault',
    name: `kv-sap-${prefix}`,
    sku: 'Premium',
    purpose: 'SAP HANA backup encryption keys, SBD secrets',
    hsm_enabled: true,
  });

  // Recovery Services Vault
  resources.push({
    resource_type: 'recovery_services_vault',
    name: `rsv-sap-${prefix}`,
    sku: 'Standard_LRS',
    purpose: 'SAP HANA Backint policy — daily full + hourly log',
    retention_days: 35,
  });

  // ACSS VIS per production system
  for (const sys of systems.filter((s) => s.acss_managed)) {
    resources.push({
      resource_type: 'acss_virtual_instance',
      name: `vis-${sys.sid.toLowerCase()}`,
      sid: sys.sid,
      purpose: `ACSS managed deployment and health for ${sys.sid}`,
    });
  }

  // AMS monitor
  resources.push({
    resource_type: 'azure_monitor_sap',
    name: `ams-${prefix}`,
    purpose: 'SAP-aware monitoring: HANA metrics, availability, performance alerts',
    providers: systems.filter((s) => s.ams_monitored).map((s) => s.sid),
  });

  return resources;
}

function generateNetwork(rng, region, prefix) {
  return {
    topology: 'hub-spoke',
    hub_vnet: {
      name: `vnet-hub-${prefix}`,
      address_space: '10.0.0.0/16',
      region,
      subnets: [
        { name: 'GatewaySubnet', cidr: '10.0.0.0/27', purpose: 'ExpressRoute / VPN gateway' },
        { name: 'AzureFirewallSubnet', cidr: '10.0.1.0/26', purpose: 'Azure Firewall' },
        { name: 'AzureBastionSubnet', cidr: '10.0.2.0/27', purpose: 'Azure Bastion' },
      ],
    },
    sap_spoke_vnet: {
      name: `vnet-sap-${prefix}`,
      address_space: '10.1.0.0/16',
      region,
      subnets: [
        { name: 'sn-hana', cidr: '10.1.0.0/24', purpose: 'HANA DB VMs' },
        { name: 'sn-app', cidr: '10.1.1.0/24', purpose: 'SAP App server VMs' },
        { name: 'sn-ascs', cidr: '10.1.2.0/28', purpose: 'ASCS/ERS cluster VMs' },
        { name: 'sn-webdisp', cidr: '10.1.3.0/28', purpose: 'SAP Web Dispatcher' },
        { name: 'sn-mgmt', cidr: '10.1.4.0/28', purpose: 'Management / Bastion targets' },
      ],
    },
    expressroute: {
      circuit_sku: 'Standard',
      bandwidth_mbps: rng.pick([500, 1000, 2000]),
      peering_location: 'Amsterdam',
    },
  };
}

function generateCustomers(rng) {
  const result = [];
  const used = new Set();

  for (let i = 0; i < 5; i++) {
    let c;
    let attempts = 0;
    do {
      c = rng.pick(CUSTOMERS);
      attempts++;
    } while (used.has(c.short) && attempts < 20);

    if (used.has(c.short)) continue;
    used.add(c.short);

    const region = rng.pick(AZURE_REGIONS);
    const products = rng.pickN(SAP_SYSTEM_TYPES, rng.int(1, 3));
    const goLiveYear = rng.int(2021, 2025);
    const goLiveMonth = String(rng.int(1, 12)).padStart(2, '0');

    result.push({
      name: c.name,
      industry: c.industry,
      country: c.country,
      azure_region: region,
      sap_products: products.map((p) => ({
        type: p.type,
        label: p.label,
        version: rng.pick(p.versions),
        sid: `${p.type.substring(0, 3).toUpperCase()}${rng.int(0, 9)}`,
        deployment_type: rng.pick(['Greenfield', 'Brownfield migration', 'System conversion']),
      })),
      azure_resources: {
        hana_vm_sku: rng.pick(HANA_VM_SKUS).sku,
        app_vm_sku: rng.pick(APP_VM_SKUS).sku,
        storage_tier: rng.pick(['Ultra', 'Premium']),
        ha_config: rng.pick(['HSR + Pacemaker (SYNC)', 'Standalone (no HA)']),
      },
      pal_linked: rng.next() > 0.15, // ~85% linked (realistic)
      mpn_id: `MPN${rng.int(1000000, 9999999)}`,
      go_live_date: `${goLiveYear}-${goLiveMonth}`,
      acss_managed: rng.next() > 0.3,
    });
  }

  return result;
}

// ── Main generation ─────────────────────────────────────────────────────────

function generate(seed) {
  const rng = new Rng(seed);
  const region = 'westeurope';
  const prefix = 'sapmodb';
  const customer = generateCustomer(rng);

  // Generate the primary landscape systems
  const systemDefs = [
    { typeDef: SAP_SYSTEM_TYPES[0], sid: 'S4H', tier: 'production' },
    { typeDef: SAP_SYSTEM_TYPES[0], sid: 'S4Q', tier: 'quality_assurance' },
    { typeDef: SAP_SYSTEM_TYPES[0], sid: 'S4D', tier: 'development' },
    { typeDef: SAP_SYSTEM_TYPES[2], sid: 'BWP', tier: 'production' },
    { typeDef: SAP_SYSTEM_TYPES[3], sid: 'SOL', tier: 'production' },
  ];

  const systems = systemDefs.map((d, i) => generateSystem(rng, d.sid, d.typeDef, d.tier, i));

  const azureResources = generateAzureResources(rng, systems, region, prefix);
  const network = generateNetwork(rng, region, prefix);
  const customers = generateCustomers(rng);

  return {
    metadata: {
      description: 'Simulated SAP-on-Azure landscape for Module B microhack labs (C1–C6)',
      generated_at: new Date().toISOString(),
      seed,
      version: '1.0.0',
      lab_prefix: prefix,
      azure_region: region,
      customer: {
        name: customer.name,
        industry: customer.industry,
        country: customer.country,
      },
    },
    systems,
    azure_resources: azureResources,
    network,
    customers,
  };
}

// ── Output ──────────────────────────────────────────────────────────────────

const data = generate(SEED);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n', 'utf8');

const sys = data.systems.length;
const cust = data.customers.length;
console.log(`✅ SAP landscape generated → ${OUT}`);
console.log(`   Seed       : ${SEED}`);
console.log(`   Systems    : ${sys}`);
console.log(`   Customers  : ${cust}`);
console.log(`   PAL-linked : ${data.customers.filter((c) => c.pal_linked).length}/${cust}`);
