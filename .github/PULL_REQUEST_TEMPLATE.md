<!-- Thanks for contributing to the SAP on Azure · Module B microhack. -->

## What & why

<!-- One or two sentences. Link the issue this closes. -->

Closes #

## Workstream

<!-- e.g. C1 · B.1.1, Infra, AI tooling, Slides, Quality/CI -->

## Checklist

- [ ] `npm run lint` passes (Markdown + Prettier)
- [ ] `npm run check` passes (Astro type-check)
- [ ] `npm run build` succeeds
- [ ] `npm run check:links` passes (internal links resolve with the base path)
- [ ] `npm audit --audit-level=moderate` is clean
- [ ] Bicep changed? `az bicep build` / `az bicep build-params` succeed locally
- [ ] Module/lab changes include **student steps** and a **Trainer notes** aside
- [ ] No secrets committed; new env vars added to `.env.example`

## Notes for reviewers

<!-- Screenshots of the built page, decisions, follow-ups. -->
