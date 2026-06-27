# Copilot instructions — SAP on Azure · Module B microhack

This repository is **courseware**: a 1-day, classroom-led, Train-the-Trainer microhack that teaches
the six **Module B** controls of the _SAP on Microsoft Azure_ Advanced Specialization, with hands-on
labs where **GitHub Copilot custom agents, skills, and MCP servers** do the heavy lifting on Azure.
Audience: SAP Basis consultants who are newer to Azure — favour generous scaffolding (portal **and**
CLI) over terse instructions.

## What this repo is (and is not)

- It **is** a static Astro + Starlight site, Bicep IaC for a _simulated_ SAP landing zone, runnable
  lab assets, and generated PPTX decks.
- It **does not** deploy live Azure or SAP in CI. Validation is static: build, lint, type-check,
  `az bicep build`/`build-params`, internal link check, audit, secret scan, CodeQL.
- We do **not** build bespoke AI agents or a separate inference service. Labs use GitHub Copilot's
  own custom agents / skills / MCP servers as the in-lab coach.

## Project layout

| Path                                  | Purpose                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `site/`                               | Astro + Starlight courseware (student pages + trainer guide). Content in `site/src/content/docs/`. |
| `infra/`                              | Bicep landing zone (Azure Verified Modules where possible), `lab` vs `reference` sizing.           |
| `labs/`                               | Runnable lab assets, sample data, per-challenge READMEs.                                           |
| `slides/`                             | Generated PPTX facilitator decks (one per module).                                                 |
| `tools/`                              | Mock SAP data generators and validation scripts (license-free, our own code).                      |
| `.github/agents/`, `.github/prompts/` | Copilot custom agent(s) and skill/prompt files used in labs.                                       |

## Hard rules

1. **Base path:** the site is served from `/microhack-sap-on-azure/` on GitHub Pages.
   - In **Markdown**, write root-relative links normally (`/setup/`); the `rehype-base-links`
     plugin prefixes the base automatically.
   - In **MDX components** (e.g. `<LinkCard href>`), use `` `${import.meta.env.BASE_URL}path/` ``.
   - In **frontmatter** (splash hero `actions`), include the base literally.
   - Always run `npm run check:links` after content changes.
2. **Zero known vulnerabilities.** Keep deps current; `npm audit --audit-level=moderate` must be clean.
   Pin transitive fixes via root `overrides` rather than downgrading direct deps.
3. **License-free dependencies only.** If a capability needs a paid/vendor-licensed library, build it
   ourselves instead (see `.github/scripts/` and `tools/`).
4. **No secrets.** Use `.env.example` placeholders; gitleaks runs in CI.
5. **Every module page** carries student steps **and** a `Trainer notes` aside (timing, talk track,
   answer key, pitfalls). New pages must be added to the sidebar in `site/astro.config.mjs`.

## Conventions

- Node 22, npm workspaces (`site` is a workspace). Commands: `npm run dev | build | check | lint | check:links`.
- Conventional Commits (`feat:`, `fix:`, `docs:` …). Branch `feature/<topic>` or `fix/<topic>`.
- Evidence artefacts in labs follow the spec naming `[ControlRef]_[DocumentType]_v[N].pdf` under
  `Module B / B[ref] /`.
- Prose is checked by Vale (advisory). Prefer clear, instructional, second-person voice.

## When generating content

- Reference real Azure-for-SAP services accurately: M/Mv2/Mv3 VMs, Azure NetApp Files, Premium SSD v2,
  Availability Zones, ExpressRoute, **ACSS** (Azure Center for SAP solutions), Azure Monitor for SAP
  solutions, Azure Backup for SAP HANA, HSR, ASCS/ERS clustering (Pacemaker + SBD).
- Map each lab back to its Module B control and to the audit evidence it produces.
