<!-- markdownlint-disable MD033 MD041 -->
<div align="center">

# 🟦 SAP on Azure — Module B Accelerator

<p><strong>A 1-day, classroom-led Train-the-Trainer microhack</strong></p>

**Master every Module B control of the _SAP on Microsoft Azure Advanced Specialization_ — accelerated by GitHub Copilot custom agents, skills & MCP servers, focused on Azure.**

[![Deploy Site](https://github.com/NikoMix/microhack-sap-on-azure/actions/workflows/deploy-site.yml/badge.svg)](https://github.com/NikoMix/microhack-sap-on-azure/actions/workflows/deploy-site.yml)
[![CI](https://github.com/NikoMix/microhack-sap-on-azure/actions/workflows/ci.yml/badge.svg)](https://github.com/NikoMix/microhack-sap-on-azure/actions/workflows/ci.yml)
[![CodeQL](https://github.com/NikoMix/microhack-sap-on-azure/actions/workflows/codeql.yml/badge.svg)](https://github.com/NikoMix/microhack-sap-on-azure/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

</div>

---

## 🎯 What this is

This repository is a **ready-to-deliver, 1-day instructor-led training** that takes SAP-experienced
consultants who are **newer to Azure** through **all six Module B controls** of the
[SAP on Microsoft Azure Advanced Specialization](https://github.com/NikoMix/specialization-sap-on-azure)
audit — using hands-on labs where **GitHub Copilot custom agents, skills, and MCP servers** do the
heavy lifting on Azure.

It is built **Train-the-Trainer**: every module ships with a student lab guide **and** a trainer
guide (timing, talk tracks, facilitation notes, answer keys, common pitfalls) plus a projectable
**PowerPoint deck**.

| Control   | Module                              | Focus                                                                                                                     |
| --------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **B.1.1** | C1 · Implementation Capability      | Deploy a simulated SAP landing zone on Azure (Bicep/AVM); Copilot drafts case study + architecture + capability statement |
| **B.4.2** | C2 · Partner Onboarding & Migration | Copilot generates HLD/LLD/runbook/KT/hypercare; ACSS, Azure Monitor for SAP, Azure Backup                                 |
| **B.2.1** | C3 · ACR Performance                | Azure Cost Management via MCP; tag SAP-eligible spend; PAL walkthrough                                                    |
| **B.2.2** | C4 · Customer Diversity             | Model 3 customers (PAL/DPOR/CSP); Copilot builds the cross-reference                                                      |
| **B.3.1** | C5 · Skilling                       | Skilling plan; map team → AZ-120 / _Run SAP on the Microsoft Cloud_                                                       |
| **B.4.1** | C6 · Audit Readiness                | Assemble the evidence pack; Copilot validates naming & completeness                                                       |

> ℹ️ A real SAP system is **not** deployed in one day — SAP is represented by a **simulated
> landscape + sample data**, while the Azure landing zone, management services, and Copilot/MCP
> tooling are real.

## 🧑‍🏫 Who it's for

- **Trainees:** SAP Basis / SAP consultants who are newer to Azure.
- **Trainers:** anyone re-delivering this content to their own teams or partner customers.
- **Prereqs:** a GitHub account and an **Azure subscription with Owner** rights. Everything else runs
  in **GitHub Codespaces**.

## 🚀 Quick start

```bash
# 1. Open in GitHub Codespaces (recommended) — Code ▸ Codespaces ▸ Create
# 2. Or run the docs site locally:
npm install
npm run dev        # Starlight site at http://localhost:4321
```

Then open the **C0 · Environment Setup** module and follow along.

## 📁 Repository layout

```text
.devcontainer/      GitHub Codespaces image (az, bicep, gh, node, python, Copilot MCP config)
.github/
  agents/           GitHub Copilot custom agents (Module B Lab Coach)
  prompts/          Copilot skills / reusable prompt files for lab tasks
  workflows/        CI, GitHub Pages deploy, CodeQL, audit-issue automation
site/               Astro + Starlight site — student & trainer guide (this is the courseware)
infra/              Bicep landing zone using Azure Verified Modules (lab vs reference SKUs)
labs/               challenge-0..6 — runnable lab assets, sample data, MCP config
slides/             Generated PowerPoint facilitator decks (one per module)
tools/              Mock SAP inventory/data generators, validation helpers
tests/              IaC + script validation
```

## 🤖 GitHub Copilot in the labs

This microhack uses **GitHub Copilot's own agent capabilities** — pupils do **not** build bespoke
agents. Three latest-feature pillars run throughout:

- **Custom agents** — the [`Module B Lab Coach`](.github/agents/) knows every control and the
  SAP-on-Azure surface, and walks pupils through each lab.
- **Skills / prompt files** — reusable `.prompt.md` tasks (draft a case study, build the evidence
  index, annotate ACR, generate an HLD).
- **MCP servers** — the **GitHub MCP** and **Azure MCP** servers let Copilot read live repo/Azure
  context during labs.

## 🛠️ Contributing & quality

CI enforces Markdown lint, Prettier formatting, Astro type-check, Bicep build/lint, link checking,
secret scanning (gitleaks), and CodeQL. Dependencies are kept current via Dependabot. See
[`CONTRIBUTING.md`](./CONTRIBUTING.md).

## 📄 License

[MIT](./LICENSE). Microsoft, Azure, and SAP product names are trademarks of their respective owners.
This courseware is provided for partner enablement and is not an official Microsoft offering.
