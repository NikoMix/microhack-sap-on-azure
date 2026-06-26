/**
 * generate-consumption.js
 *
 * Deterministic generator for a simulated Azure Consumption Export
 * (By-Service view) representing 3 months of SAP-on-Azure spend.
 * Zero external dependencies — Node 22 stdlib only.
 *
 * Usage:
 *   node tools/generate-consumption.js [--seed N] [--out-dir path]
 *
 * Defaults:
 *   --seed     42
 *   --out-dir  tools/data
 *
 * Outputs:
 *   tools/data/consumption.json  — structured JSON
 *   tools/data/consumption.csv   — flat CSV (UTF-8, comma-separated)
 *
 * The output is fully reproducible: the same seed always produces identical files.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CLI argument parsing ─────────────────────────────────────────────────────

const args = process.argv.slice(2);
const seedIdx = args.indexOf('--seed');
const outDirIdx = args.indexOf('--out-dir');
const SEED = seedIdx !== -1 ? parseInt(args[seedIdx + 1], 10) : 42;
const OUT_DIR = outDirIdx !== -1 ? resolve(args[outDirIdx + 1]) : resolve(__dirname, 'data');

// ── Seeded PRNG (xorshift32) — same implementation as generate-sap-landscape.js

class Rng {
  constructor(seed) {
    this.s = seed >>> 0 || 1;
  }
  next() {
    let s = this.s;
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    this.s = s >>> 0;
    return this.s / 0x100000000;
  }
  int(lo, hi) {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }
  float(lo, hi, dp = 2) {
    const v = lo + this.next() * (hi - lo);
    return Math.round(v * Math.pow(10, dp)) / Math.pow(10, dp);
  }
  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  }
}

// ── Reference data ───────────────────────────────────────────────────────────

const SUBSCRIPTION_ID = '00000000-1111-2222-3333-444444444444';
const SUBSCRIPTION_NAME = 'Contoso AG — SAP Production';
const RESOURCE_GROUP = 'rg-sap-moduleb-lab';
const MPN_ID = 'MPN4829571';
const PARTNER_NAME = 'Partner Demo Corp';

// SAP-eligible services with realistic monthly cost ranges (EUR)
const SAP_ELIGIBLE_SERVICES = [
  {
    service: 'Virtual Machines',
    meter_category: 'Compute',
    resources: [
      { name: 's4h-hana-primary', sku: 'Standard_M64ms', cost_range: [3800, 4200] },
      { name: 's4h-hana-secondary', sku: 'Standard_M64ms', cost_range: [3800, 4200] },
      { name: 'bwp-hana-primary', sku: 'Standard_M96s_v3', cost_range: [5200, 5700] },
      { name: 's4h-app-01', sku: 'Standard_E32s_v5', cost_range: [700, 850] },
      { name: 's4h-app-02', sku: 'Standard_E32s_v5', cost_range: [700, 850] },
      { name: 's4h-app-03', sku: 'Standard_E16s_v5', cost_range: [380, 440] },
      { name: 's4h-ascs-01', sku: 'Standard_D4s_v5', cost_range: [120, 140] },
      { name: 's4h-ascs-02', sku: 'Standard_D4s_v5', cost_range: [120, 140] },
    ],
    sap_eligible: true,
  },
  {
    service: 'Azure NetApp Files',
    meter_category: 'Storage',
    resources: [
      { name: 'anf-s4h-data-ultra', sku: 'ANF Ultra', cost_range: [1800, 2100] },
      { name: 'anf-s4h-log-ultra', sku: 'ANF Ultra', cost_range: [450, 550] },
      { name: 'anf-bwp-data-premium', sku: 'ANF Premium', cost_range: [900, 1100] },
      { name: 'anf-shared-premium', sku: 'ANF Premium', cost_range: [300, 380] },
    ],
    sap_eligible: true,
  },
  {
    service: 'Azure Backup',
    meter_category: 'Storage',
    resources: [
      { name: 'rsv-sap-sapmodb-backups', sku: 'Backup Protected Instance', cost_range: [120, 160] },
    ],
    sap_eligible: true,
  },
  {
    service: 'ExpressRoute',
    meter_category: 'Networking',
    resources: [
      { name: 'ergw-sapmodb-hub', sku: 'UltraPerformance Gateway', cost_range: [650, 720] },
      {
        name: 'er-circuit-amsterdam',
        sku: 'ExpressRoute Circuit Standard',
        cost_range: [380, 420],
      },
    ],
    sap_eligible: true,
  },
  {
    service: 'Azure Center for SAP solutions',
    meter_category: 'Management',
    resources: [
      { name: 'vis-s4h-acss', sku: 'ACSS Virtual Instance', cost_range: [80, 120] },
      { name: 'vis-bwp-acss', sku: 'ACSS Virtual Instance', cost_range: [60, 90] },
    ],
    sap_eligible: true,
  },
  {
    service: 'Azure Monitor for SAP solutions',
    meter_category: 'Monitoring',
    resources: [{ name: 'ams-sapmodb', sku: 'AMS Monitor', cost_range: [90, 130] }],
    sap_eligible: true,
  },
];

// Non-SAP-eligible services (also present in the export for realism)
const OTHER_SERVICES = [
  {
    service: 'Azure Firewall',
    meter_category: 'Networking',
    resources: [{ name: 'fw-sapmodb-hub', sku: 'Premium', cost_range: [720, 800] }],
    sap_eligible: false,
  },
  {
    service: 'Azure Bastion',
    meter_category: 'Networking',
    resources: [{ name: 'bastion-sapmodb-hub', sku: 'Standard', cost_range: [140, 170] }],
    sap_eligible: false,
  },
  {
    service: 'Key Vault',
    meter_category: 'Security',
    resources: [{ name: 'kv-sap-sapmodb', sku: 'Premium', cost_range: [20, 35] }],
    sap_eligible: false,
  },
  {
    service: 'Log Analytics',
    meter_category: 'Monitoring',
    resources: [{ name: 'law-sapmodb', sku: 'PerGB2018', cost_range: [80, 120] }],
    sap_eligible: false,
  },
  {
    service: 'Virtual Network',
    meter_category: 'Networking',
    resources: [{ name: 'vnet-peering-data-transfer', sku: 'Peering', cost_range: [40, 70] }],
    sap_eligible: false,
  },
];

const ALL_SERVICES = [...SAP_ELIGIBLE_SERVICES, ...OTHER_SERVICES];

// ── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the first and last days of a given year/month.
 * @param {number} year
 * @param {number} month 1-based
 * @returns {{ start: string, end: string }} ISO date strings
 */
function monthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // last day
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: start.toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
  };
}

/**
 * Returns the three months ending at the current month.
 */
function lastThreeMonths() {
  // Use a fixed reference date for determinism
  const ref = new Date('2026-06-01');
  const months = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(ref);
    d.setMonth(d.getMonth() - i);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return months;
}

// ── Generator ────────────────────────────────────────────────────────────────

function generate(seed) {
  const rng = new Rng(seed);
  const periods = lastThreeMonths();
  const rows = [];

  for (const { year, month } of periods) {
    const range = monthRange(year, month);

    for (const serviceGroup of ALL_SERVICES) {
      for (const resource of serviceGroup.resources) {
        const cost = rng.float(resource.cost_range[0], resource.cost_range[1], 2);
        const quantity = rng.float(1, 30, 4); // abstract quantity units

        rows.push({
          date: range.start, // first day of the billing month
          billing_period: range.label,
          subscription_id: SUBSCRIPTION_ID,
          subscription_name: SUBSCRIPTION_NAME,
          resource_group: RESOURCE_GROUP,
          resource_name: resource.name,
          service_name: serviceGroup.service,
          meter_category: serviceGroup.meter_category,
          meter_name: resource.sku,
          quantity,
          cost_eur: cost,
          currency: 'EUR',
          sap_eligible: serviceGroup.sap_eligible,
          partner_name: PARTNER_NAME,
          mpn_id: MPN_ID,
          pal_linked: true,
        });
      }
    }
  }

  // Sort by date, then service
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.service_name.localeCompare(b.service_name));

  return rows;
}

// ── CSV serialisation ────────────────────────────────────────────────────────

function toCSV(rows) {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);

  const escape = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n') + '\n';
}

// ── Summary ──────────────────────────────────────────────────────────────────

function summarise(rows) {
  const byMonth = {};
  for (const row of rows) {
    if (!byMonth[row.billing_period]) {
      byMonth[row.billing_period] = { total: 0, sap_eligible: 0, count: 0 };
    }
    byMonth[row.billing_period].total += row.cost_eur;
    if (row.sap_eligible) byMonth[row.billing_period].sap_eligible += row.cost_eur;
    byMonth[row.billing_period].count++;
  }
  return byMonth;
}

// ── Output ───────────────────────────────────────────────────────────────────

const rows = generate(SEED);
const csvContent = toCSV(rows);
const jsonContent =
  JSON.stringify(
    {
      metadata: {
        description: 'Simulated Azure Consumption Export for Module B microhack labs (C3–C6)',
        generated_at: new Date().toISOString(),
        seed: SEED,
        version: '1.0.0',
        subscription_id: SUBSCRIPTION_ID,
        subscription_name: SUBSCRIPTION_NAME,
        periods: lastThreeMonths().map(({ year, month }) => monthRange(year, month).label),
        currency: 'EUR',
      },
      rows,
    },
    null,
    2,
  ) + '\n';

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, 'consumption.json'), jsonContent, 'utf8');
writeFileSync(resolve(OUT_DIR, 'consumption.csv'), csvContent, 'utf8');

const summary = summarise(rows);
console.log(`✅ Consumption data generated → ${OUT_DIR}/`);
console.log(`   Seed  : ${SEED}`);
console.log(`   Rows  : ${rows.length}`);
console.log('');
console.log('   Monthly summary:');
for (const [period, stats] of Object.entries(summary)) {
  const pct = ((stats.sap_eligible / stats.total) * 100).toFixed(1);
  console.log(
    `     ${period.padEnd(18)} total=€${stats.total.toFixed(2).padStart(9)}  sap=€${stats.sap_eligible.toFixed(2).padStart(9)}  (${pct}%)`,
  );
}
