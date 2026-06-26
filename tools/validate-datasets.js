/**
 * validate-datasets.js
 *
 * Validates the generated datasets in tools/data/ against expected schemas and
 * constraints. Exits with code 0 on success, 1 on any validation failure.
 * Zero external dependencies — Node 22 stdlib only.
 *
 * Usage:
 *   node tools/validate-datasets.js [--data-dir path]
 *
 * Checks:
 *   1. Both data files exist (sap-landscape.json, consumption.csv, consumption.json)
 *   2. sap-landscape.json — schema: metadata, systems (≥1), customers (≥3),
 *      azure_resources, network
 *   3. Systems have required fields: sid, sap_product, landscape_tier, hana_db,
 *      app_servers, sap_note_1928533_certified
 *   4. Customers: ≥3, at least 2 distinct industries, at least 2 distinct regions
 *   5. consumption.json — metadata, rows (≥1)
 *   6. consumption.csv — parseable, at least the rows in consumption.json
 *   7. SAP-eligible rows present in consumption data
 *   8. Determinism check: re-running generators produces identical outputs
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const dataDirIdx = args.indexOf('--data-dir');
const DATA_DIR = dataDirIdx !== -1 ? resolve(args[dataDirIdx + 1]) : resolve(__dirname, 'data');

// ── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function pass(msg) {
  console.log(`  ✅ ${msg}`);
  passed++;
}

function fail(msg) {
  console.error(`  ❌ ${msg}`);
  failed++;
}

function check(condition, passMsg, failMsg) {
  if (condition) pass(passMsg);
  else fail(failMsg);
}

// ── 1. File existence ────────────────────────────────────────────────────────

console.log('\n📂 Checking file existence…');

const LANDSCAPE_PATH = resolve(DATA_DIR, 'sap-landscape.json');
const CONSUMPTION_JSON_PATH = resolve(DATA_DIR, 'consumption.json');
const CONSUMPTION_CSV_PATH = resolve(DATA_DIR, 'consumption.csv');

check(existsSync(LANDSCAPE_PATH), 'sap-landscape.json exists', 'sap-landscape.json NOT FOUND');
check(existsSync(CONSUMPTION_JSON_PATH), 'consumption.json exists', 'consumption.json NOT FOUND');
check(existsSync(CONSUMPTION_CSV_PATH), 'consumption.csv exists', 'consumption.csv NOT FOUND');

if (failed > 0) {
  console.log('\n⚠️  Missing files — run generators first:');
  console.log('   node tools/generate-sap-landscape.js');
  console.log('   node tools/generate-consumption.js');
  process.exit(1);
}

// ── 2. Parse JSON files ──────────────────────────────────────────────────────

console.log('\n🔍 Parsing JSON files…');

let landscape, consumption;

try {
  landscape = JSON.parse(readFileSync(LANDSCAPE_PATH, 'utf8'));
  pass('sap-landscape.json parses as valid JSON');
} catch (e) {
  fail(`sap-landscape.json JSON parse error: ${e.message}`);
}

try {
  consumption = JSON.parse(readFileSync(CONSUMPTION_JSON_PATH, 'utf8'));
  pass('consumption.json parses as valid JSON');
} catch (e) {
  fail(`consumption.json JSON parse error: ${e.message}`);
}

// ── 3. sap-landscape.json schema ─────────────────────────────────────────────

console.log('\n🏗️  Validating sap-landscape.json schema…');

if (landscape) {
  check(!!landscape.metadata, 'metadata section present', 'metadata section MISSING');
  check(!!landscape.metadata?.seed, 'metadata.seed present', 'metadata.seed MISSING');
  check(!!landscape.metadata?.version, 'metadata.version present', 'metadata.version MISSING');
  check(Array.isArray(landscape.systems), 'systems is an array', 'systems is NOT an array');
  check(
    Array.isArray(landscape.systems) && landscape.systems.length >= 1,
    `systems has ≥1 entries (found ${landscape.systems?.length})`,
    `systems has fewer than 1 entry (found ${landscape.systems?.length})`,
  );
  check(Array.isArray(landscape.customers), 'customers is an array', 'customers is NOT an array');
  check(
    Array.isArray(landscape.customers) && landscape.customers.length >= 3,
    `customers has ≥3 entries (found ${landscape.customers?.length})`,
    `customers requires ≥3 for B.2.2 (found ${landscape.customers?.length})`,
  );
  check(
    Array.isArray(landscape.azure_resources),
    'azure_resources is an array',
    'azure_resources MISSING',
  );
  check(!!landscape.network, 'network section present', 'network section MISSING');
}

// ── 4. System field validation ───────────────────────────────────────────────

console.log('\n⚙️  Validating system entries…');

if (Array.isArray(landscape?.systems)) {
  const required = [
    'sid',
    'sap_product',
    'landscape_tier',
    'hana_db',
    'app_servers',
    'sap_note_1928533_certified',
  ];
  let systemErrors = 0;

  for (const sys of landscape.systems) {
    for (const field of required) {
      if (sys[field] === undefined || sys[field] === null) {
        fail(`System ${sys.sid ?? '?'} missing field: ${field}`);
        systemErrors++;
      }
    }
    // Check HANA DB sub-fields
    if (sys.hana_db) {
      for (const f of ['vm_sku', 'vcpu', 'ram_gb', 'saps', 'anf_tier']) {
        if (sys.hana_db[f] === undefined) {
          fail(`System ${sys.sid} hana_db missing field: ${f}`);
          systemErrors++;
        }
      }
    }
  }

  if (systemErrors === 0) {
    pass(`All ${landscape.systems.length} systems have required fields`);
  }
}

// ── 5. Customer diversity check (B.2.2) ──────────────────────────────────────

console.log('\n🌍 Validating customer diversity (B.2.2 requirements)…');

if (Array.isArray(landscape?.customers)) {
  const industries = new Set(landscape.customers.map((c) => c.industry));
  const regions = new Set(landscape.customers.map((c) => c.azure_region));

  check(
    industries.size >= 2,
    `Customers span ≥2 industries (${industries.size}: ${[...industries].join(', ')})`,
    `Customers must span ≥2 industries (found ${industries.size})`,
  );
  check(
    regions.size >= 2,
    `Customers span ≥2 Azure regions (${regions.size}: ${[...regions].join(', ')})`,
    `Customers should span ≥2 Azure regions (found ${regions.size})`,
  );

  const palLinked = landscape.customers.filter((c) => c.pal_linked).length;
  check(
    palLinked >= 1,
    `≥1 customer PAL-linked (${palLinked}/${landscape.customers.length})`,
    `No customers are PAL-linked — B.2.1 attribution will fail`,
  );
}

// ── 6. consumption.json validation ──────────────────────────────────────────

console.log('\n💰 Validating consumption.json…');

if (consumption) {
  check(!!consumption.metadata, 'metadata section present', 'metadata section MISSING');
  check(Array.isArray(consumption.rows), 'rows is an array', 'rows is NOT an array');
  check(
    Array.isArray(consumption.rows) && consumption.rows.length >= 1,
    `rows has entries (found ${consumption.rows?.length})`,
    'rows array is empty',
  );

  if (Array.isArray(consumption.rows) && consumption.rows.length > 0) {
    const requiredRowFields = [
      'date',
      'billing_period',
      'subscription_id',
      'service_name',
      'meter_category',
      'cost_eur',
      'currency',
      'sap_eligible',
    ];
    const sample = consumption.rows[0];
    const missing = requiredRowFields.filter((f) => sample[f] === undefined);
    check(
      missing.length === 0,
      'Rows have all required fields',
      `Rows missing fields: ${missing.join(', ')}`,
    );

    const sapEligibleRows = consumption.rows.filter((r) => r.sap_eligible === true);
    check(
      sapEligibleRows.length >= 1,
      `SAP-eligible rows present (${sapEligibleRows.length}/${consumption.rows.length})`,
      'No SAP-eligible rows found — annotate-acr skill will fail',
    );

    const months = new Set(consumption.rows.map((r) => r.billing_period));
    check(
      months.size >= 3,
      `Consumption spans ≥3 months (${months.size}: ${[...months].join(', ')})`,
      `Consumption should span ≥3 months (found ${months.size})`,
    );
  }
}

// ── 7. consumption.csv validation ───────────────────────────────────────────

console.log('\n📊 Validating consumption.csv…');

try {
  const csvContent = readFileSync(CONSUMPTION_CSV_PATH, 'utf8');
  const csvLines = csvContent.trim().split('\n');
  check(
    csvLines.length >= 2,
    `CSV has header + ≥1 data rows (${csvLines.length} lines)`,
    'CSV is empty or header-only',
  );

  const header = csvLines[0].split(',');
  const requiredCsvCols = ['date', 'service_name', 'cost_eur', 'sap_eligible'];
  const missingCols = requiredCsvCols.filter((col) => !header.includes(col));
  check(
    missingCols.length === 0,
    'CSV has required columns',
    `CSV missing columns: ${missingCols.join(', ')}`,
  );

  if (consumption?.rows) {
    // CSV rows (minus header) should match JSON rows
    const csvDataRows = csvLines.length - 1;
    const jsonDataRows = consumption.rows.length;
    check(
      csvDataRows === jsonDataRows,
      `CSV row count matches JSON row count (${csvDataRows})`,
      `CSV row count (${csvDataRows}) ≠ JSON row count (${jsonDataRows})`,
    );
  }
} catch (e) {
  fail(`consumption.csv read/parse error: ${e.message}`);
}

// ── 8. Determinism check ─────────────────────────────────────────────────────

console.log('\n🔁 Checking determinism (re-generate and compare)…');

try {
  // Re-run generators into a temp location
  const tmpDir = resolve(DATA_DIR, '__validate_tmp__');
  execSync(
    `node "${resolve(__dirname, 'generate-sap-landscape.js')}" --out "${resolve(tmpDir, 'sap-landscape.json')}"`,
    { stdio: 'pipe' },
  );
  execSync(`node "${resolve(__dirname, 'generate-consumption.js')}" --out-dir "${tmpDir}"`, {
    stdio: 'pipe',
  });

  // Compare JSON content (excluding generated_at timestamp)
  const cleanJson = (obj) => {
    if (obj && typeof obj === 'object') {
      const copy = Array.isArray(obj) ? [] : {};
      for (const key of Object.keys(obj)) {
        if (key === 'generated_at') continue; // skip timestamp
        copy[key] = cleanJson(obj[key]);
      }
      return copy;
    }
    return obj;
  };

  const origLandscape = cleanJson(JSON.parse(readFileSync(LANDSCAPE_PATH, 'utf8')));
  const regnLandscape = cleanJson(
    JSON.parse(readFileSync(resolve(tmpDir, 'sap-landscape.json'), 'utf8')),
  );
  check(
    JSON.stringify(origLandscape) === JSON.stringify(regnLandscape),
    'sap-landscape.json is deterministic',
    'sap-landscape.json DIFFERS on re-generation — seed is not deterministic',
  );

  const origConsump = cleanJson(JSON.parse(readFileSync(CONSUMPTION_JSON_PATH, 'utf8')));
  const regnConsump = cleanJson(
    JSON.parse(readFileSync(resolve(tmpDir, 'consumption.json'), 'utf8')),
  );
  check(
    JSON.stringify(origConsump) === JSON.stringify(regnConsump),
    'consumption.json is deterministic',
    'consumption.json DIFFERS on re-generation — seed is not deterministic',
  );

  // Clean up temp dir
  execSync(
    `node -e "require('node:fs').rmSync('${tmpDir.replace(/\\/g, '\\\\')}', { recursive: true, force: true })"`,
    {
      stdio: 'pipe',
    },
  );
} catch (e) {
  fail(`Determinism check failed: ${e.message}`);
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n🟢 All validations passed — datasets are ready for lab use.\n');
  process.exit(0);
} else {
  console.log('\n🔴 Validation failures detected. Fix the issues above and re-run.\n');
  process.exit(1);
}
