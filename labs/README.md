# Labs

Runnable assets for each challenge: setup scripts, Bicep parameter sets, mock SAP data, and
per-challenge instructions. The Starlight site (`site/`) is the primary student experience; these
folders hold the files students run and the artefacts they produce.

| Challenge                      | Module B control | Folder               |
| ------------------------------ | ---------------- | -------------------- |
| C0 · Setup                     | —                | `challenge-0-setup/` |
| C1 · Implementation Capability | B.1.1            | `challenge-1-b11/`   |
| C2 · Onboarding & Migration    | B.4.2            | `challenge-2-b42/`   |
| C3 · ACR Performance           | B.2.1            | `challenge-3-b21/`   |
| C4 · Customer Diversity        | B.2.2            | `challenge-4-b22/`   |
| C5 · Skilling                  | B.3.1            | `challenge-5-b31/`   |
| C6 · Audit Readiness           | B.4.1            | `challenge-6-b41/`   |

## Conventions

- Each challenge folder has a `README.md` (objective, steps, expected output, est. time) and a
  `solution/` or `answer-key.md` for trainers.
- Evidence artefacts follow the specialization naming convention: `[ControlRef]_[DocumentType]_v[N].pdf`
  organised as `Module B / B[ref] /`.
- Scripts are cross-platform where possible (Bash + PowerShell) and license-free.
- Real Azure work targets each pupil's **own** subscription; SAP is **simulated** (see `tools/`).
