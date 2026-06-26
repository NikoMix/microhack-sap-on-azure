// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import starlight from '@astrojs/starlight';
import rehypeBaseLinks from './rehype-base-links.mjs';

// GitHub Pages serves the project site from /<repo>/. Both values can be
// overridden with repository variables ASTRO_SITE / ASTRO_BASE if you fork.
const repo = 'microhack-sap-on-azure';
const owner = 'NikoMix';
const site = process.env.ASTRO_SITE ?? `https://${owner}.github.io`;
const base = process.env.ASTRO_BASE ?? `/${repo}`;

// https://astro.build/config
export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  markdown: {
    // Astro 7 replaced the deprecated `markdown.rehypePlugins` array with a unified
    // processor. `unified()` from @astrojs/markdown-remark bakes in Astro's defaults
    // (GFM, smartypants, Shiki, heading IDs) and lets us append our base-link plugin so
    // root-relative Markdown links (e.g. `/setup/`) become base-aware in dev AND build.
    processor: unified({ rehypePlugins: [[rehypeBaseLinks, { base }]] }),
  },
  integrations: [
    starlight({
      title: 'SAP on Azure · Module B Accelerator',
      tagline: '1-Day Train-the-Trainer microhack',
      description:
        'A 1-day, classroom-led Train-the-Trainer microhack covering every Module B control of the ' +
        'SAP on Microsoft Azure Advanced Specialization, accelerated by GitHub Copilot agents, skills & MCP.',
      lastUpdated: true,
      editLink: {
        baseUrl: `https://github.com/${owner}/${repo}/edit/main/site/`,
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: `https://github.com/${owner}/${repo}`,
        },
      ],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Start Here',
          items: [
            { label: 'Welcome', link: '/' },
            { label: 'C0 · Environment Setup', link: '/setup/' },
          ],
        },
        {
          label: 'Module B Labs',
          items: [
            { label: 'C1 · B.1.1 Implementation Capability', link: '/modules/b11-implementation/' },
            { label: 'C2 · B.4.2 Onboarding & Migration', link: '/modules/b42-onboarding/' },
            { label: 'C3 · B.2.1 ACR Performance', link: '/modules/b21-acr/' },
            { label: 'C4 · B.2.2 Customer Diversity', link: '/modules/b22-customer-diversity/' },
            { label: 'C5 · B.3.1 Skilling', link: '/modules/b31-skilling/' },
            { label: 'C6 · B.4.1 Audit Readiness', link: '/modules/b41-audit-readiness/' },
          ],
        },
        {
          label: 'Trainer Guide',
          items: [
            { label: 'Overview', link: '/trainer-guide/' },
            { label: 'Facilitation & Timing', link: '/trainer-guide/facilitation/' },
            { label: 'C7 · Re-delivery Clinic', link: '/trainer-guide/redelivery-clinic/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            {
              label: 'Copilot Agents, Skills & MCP',
              link: '/reference/copilot-agents-skills-mcp/',
            },
            { label: 'SAP on Azure Architecture', link: '/reference/sap-on-azure-architecture/' },
            { label: 'Resources & Glossary', link: '/reference/resources/' },
          ],
        },
      ],
    }),
  ],
});
