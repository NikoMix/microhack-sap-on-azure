# Tests

Static validation for the infrastructure and tooling — no live Azure deployment.

- `infra/` — Bicep build/lint assertions and parameter validation. CI runs `az bicep build` and
  `az bicep build-params` across every template; deeper assertions (e.g. expected resources, tags,
  zone-redundancy) live here.
- Script tests for the generators in `tools/` (deterministic output, schema checks).

Run locally:

```bash
az bicep build --file infra/main.bicep
az bicep build-params --file infra/params/lab.bicepparam
npm run check:links
```
