# Contributing

Thanks for improving the **SAP on Azure — Module B Accelerator** microhack. This is an innersource
courseware repo: trainers who deliver the day are encouraged to contribute fixes, new sample data,
and lessons learned back via pull request.

## Ground rules

- **Track work via GitHub Issues.** Every module and workstream has an issue — comment there and link
  your PR. Do not add local task trackers.
- **Keep the build green.** CI runs Markdown lint, Prettier, Astro type-check, Bicep build/lint, link
  check, secret scan, and CodeQL. Run `npm run lint` and `npm run build` before pushing.
- **License-free dependencies only.** If a capability needs a paid/vendor-licensed library, build it
  ourselves instead. Pin versions and keep them current (Dependabot is enabled).
- **No secrets, ever.** Use `.env.example` placeholders. `gitleaks` will block accidental commits.

## Local setup

```bash
npm install            # installs root + site workspace
npm run dev            # Starlight site on http://localhost:4321
npm run build          # production build (what CI checks)
npm run lint           # markdownlint + prettier
```

Bicep:

```bash
az bicep build --file infra/main.bicep        # build/validate
az bicep lint  --file infra/main.bicep        # lint
```

## Branch & commit conventions

- Branch: `feature/<short-topic>` or `fix/<short-topic>`.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`…).
- Keep PRs scoped to one module/workstream where possible — it keeps reviews fast and avoids conflicts.

## Authoring conventions

- Courseware lives in `site/src/content/docs/`. Each module page carries both **student** steps and a
  **Trainer notes** aside.
- Lab assets (scripts, IaC, sample data) live under `labs/` and `infra/`; the site links to them.
- Use British/American English consistently within a page; prose is checked by Vale (warnings only).
