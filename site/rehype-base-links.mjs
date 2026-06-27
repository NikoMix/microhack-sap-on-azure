// @ts-check
/**
 * Rehype plugin: prefix root-relative internal links and assets with the configured
 * Astro `base` so Markdown/MDX content resolves correctly when the site is served from
 * a GitHub Pages project subpath (e.g. /microhack-sap-on-azure/).
 *
 * Starlight already makes its own navigation (sidebar, header, pagination) base-aware,
 * and Starlight component props such as <LinkCard href> must be authored with
 * `import.meta.env.BASE_URL`. This plugin covers the remaining surface: plain Markdown
 * links (`[text](/path/)`) and raw `<a>` / `<img>` tags in content, so authors can write
 * natural root-relative links without remembering the base path.
 *
 * Self-contained (no external AST-walker dependency) to keep the supply chain minimal.
 *
 * @param {{ base?: string }} [options]
 */
export default function rehypeBaseLinks({ base = '' } = {}) {
  const normalizedBase = base.replace(/\/+$/, '');
  if (!normalizedBase) return () => {};

  /** @type {Record<string, string>} */
  const attrByTag = { a: 'href', area: 'href', img: 'src', source: 'src' };

  /** @param {unknown} value */
  const shouldPrefix = (value) =>
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    value !== normalizedBase &&
    !value.startsWith(`${normalizedBase}/`);

  /** @param {any} node */
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'element' && node.properties) {
      const attr = attrByTag[node.tagName];
      if (attr && shouldPrefix(node.properties[attr])) {
        node.properties[attr] = `${normalizedBase}${node.properties[attr]}`;
      }
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child);
    }
  };

  return (/** @type {any} */ tree) => walk(tree);
}
