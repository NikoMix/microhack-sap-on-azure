# Tools

License-free helper scripts used by the labs and the build:

- **Mock SAP data generators** — produce a believable but synthetic SAP landscape (systems, SIDs,
  sizing, SAPS, host inventory) so labs feel real without a live SAP system.
- **Evidence/validation helpers** — check evidence-pack folder structure and naming, build
  cross-reference tables, and assemble the audit index.
- **Deck generation** — build the per-module `.pptx` files in `slides/` from course content using
  `python-pptx` (BSD-licensed).

## Principles

- Cross-platform where practical (Python 3.12, plus PowerShell/Bash entry points).
- No paid/vendor-licensed dependencies. If we need a capability we can't get license-free, we build it.
- Deterministic output (seeded randomness) so labs are reproducible across a classroom.
