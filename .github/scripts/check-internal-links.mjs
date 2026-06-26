// @ts-check
/**
 * Dependency-free internal link & base-path validator for the built Starlight site.
 *
 * Why custom: Astro/Starlight do not fail the build on broken internal links, and our
 * GitHub Pages base path (/microhack-sap-on-azure/) is a common regression source. This
 * script crawls the generated HTML in `site/dist`, extracts every internal href/src, and
 * verifies each one resolves to a real file — catching dead links AND missing base prefixes
 * offline, with zero third-party dependencies (keeps the supply chain minimal).
 *
 * Usage:  node .github/scripts/check-internal-links.mjs [distDir] [base]
 * Exit:   0 = all internal links resolve, 1 = one or more broken links.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';

const distDir = process.argv[2] ?? 'site/dist';
const base = (process.argv[3] ?? '/microhack-sap-on-azure').replace(/\/+$/, '');

if (!existsSync(distDir)) {
  console.error(`✗ dist directory not found: ${distDir} (run "npm run build" first)`);
  process.exit(1);
}

/** Recursively collect every *.html file under a directory. */
function htmlFiles(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** True if the on-disk target for a site-absolute path exists. */
function resolves(urlPath) {
  // Strip query string and fragment.
  let p = urlPath.split('#')[0].split('?')[0];
  if (p === '') return true; // pure fragment / query on same page
  // Must live under the configured base when one is set.
  if (base) {
    if (p === base) p = '/';
    else if (p.startsWith(`${base}/`)) p = p.slice(base.length);
    else return false; // internal absolute link missing the base prefix
  }
  const rel = decodeURIComponent(p.replace(/^\/+/, ''));
  const candidates =
    rel.endsWith('/') || rel === ''
      ? [join(distDir, rel, 'index.html')]
      : [join(distDir, rel), join(distDir, `${rel}.html`), join(distDir, rel, 'index.html')];
  return candidates.some((c) => existsSync(c) && statSync(c).isFile());
}

const linkAttr = /(?:href|src)\s*=\s*"([^"]+)"/gi;
/** @type {{file: string, link: string}[]} */
const broken = [];
let checked = 0;

for (const file of htmlFiles(distDir)) {
  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(linkAttr)) {
    const link = match[1];
    // Only validate site-internal absolute links; skip external/protocol/mailto/anchors/data.
    if (!link.startsWith('/') || link.startsWith('//')) continue;
    checked++;
    if (!resolves(link))
      broken.push({ file: relative(distDir, file).split(sep).join(posix.sep), link });
  }
}

if (broken.length > 0) {
  console.error(`✗ ${broken.length} broken internal link(s) found (checked ${checked}):\n`);
  for (const { file, link } of broken) console.error(`  ${file}  →  ${link}`);
  console.error(
    `\nHint: internal links must include the base path "${base}". In MDX use ` +
      '`import.meta.env.BASE_URL`; in Markdown the rehype-base-links plugin handles it automatically.',
  );
  process.exit(1);
}

console.log(`✓ all ${checked} internal links resolve under base "${base || '/'}".`);
