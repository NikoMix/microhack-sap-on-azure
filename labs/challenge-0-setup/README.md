# C0 · Welcome & environment setup

**Goal:** every pupil leaves this challenge with a working Codespace, an authenticated Azure session
on their own subscription, and GitHub Copilot (agents, skills, MCP) wired up and verified — ready to
start C1. **Time:** ~45 minutes.

> The full, screenshot-rich version of this challenge lives on the course site at
> **C0 · Environment Setup**. This README is the quick checklist + verification you run in the
> terminal.

## Prerequisites

- A **GitHub account** with access to Copilot.
- An **Azure subscription** where you have the **Owner** role (use a personal/sandbox sub).
- A modern browser. No local installs are required — everything runs in **GitHub Codespaces**.

## Steps

1. **Open in Codespaces.** On the repo: **Code ▸ Codespaces ▸ Create codespace on `main`**. The
   devcontainer installs Node, the Azure CLI (with Bicep), the GitHub CLI, and Python automatically.
2. **Sign in to Azure** (device-code flow works well in Codespaces):

   ```bash
   az login --use-device-code
   az account set --subscription "<your-subscription-id>"
   az account show -o table
   ```

3. **Confirm tooling** is present and the site builds:

   ```bash
   node --version        # v22.x
   az version            # azure-cli 2.x
   az bicep version      # Bicep CLI
   gh --version          # GitHub CLI
   npm run build         # Starlight site builds
   ```

4. **Wire up Copilot.** Confirm the Copilot and Copilot Chat extensions are active, then open Copilot
   Chat and verify the course's custom agent and MCP servers are available (see the site's
   _Copilot Agents, Skills & MCP_ reference page). The Azure MCP server lets Copilot read your
   subscription's resources and cost data during later challenges.

5. **Copy environment placeholders:**

   ```bash
   cp .env.example .env      # then fill in AZURE_SUBSCRIPTION_ID / TENANT / LOCATION
   ```

## Definition of done

- [ ] `az account show` prints **your** subscription.
- [ ] `npm run build` completes without errors.
- [ ] Copilot Chat responds and the course agent + Azure MCP server are listed.
- [ ] `.env` created from `.env.example` (never commit it).

## Trainer notes

- Pre-flight the device-code login on the room Wi‑Fi; corporate networks sometimes block it.
- Have a spare sandbox subscription ready for anyone whose employer sub lacks Owner rights.
- Keep this to 45 min — park deep Copilot/MCP questions for the C1 lab where they pay off.
