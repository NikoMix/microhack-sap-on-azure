# Infrastructure (Bicep / Azure Verified Modules)

Bicep IaC for the **simulated SAP landing zone** the labs deploy. We use
[Azure Verified Modules (AVM)](https://aka.ms/avm) where possible for quality and supportability.

> A real SAP system is **not** deployed. These templates stand up the **Azure** landing zone,
> networking and management plane around a _simulated_ SAP landscape.

## Layout

```text
infra/
  main.bicep          Subscription-scoped entry point (creates the landing-zone resource group)
  bicepconfig.json    Bicep linter ruleset
  modules/            Composable modules (network, compute placeholders, management) — added in C1/C2
  params/             Example parameter files (lab vs reference profiles)
```

## Sizing profiles

| Profile     | Use                           | Compute                                                   |
| ----------- | ----------------------------- | --------------------------------------------------------- |
| `lab`       | Classroom — keep cost low     | Small/cheap SKUs                                          |
| `reference` | Show the audit-grade topology | SAP-certified **M-series** (documented; deploy with care) |

## Validate (no deployment required)

```bash
az bicep build --file infra/main.bicep
az bicep lint  --file infra/main.bicep

# Preview against a subscription (requires `az login`):
az deployment sub what-if \
  --location swedencentral \
  --template-file infra/main.bicep \
  --parameters sizingProfile=lab
```
