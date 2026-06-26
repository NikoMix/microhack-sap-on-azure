# Slides

Projectable **PowerPoint (`.pptx`)** facilitator decks — one per module — generated from the course
content. Decks are intentionally light (talk-track prompts, key diagrams, timing) so the hands-on
labs stay the focus.

## How decks are produced

Decks are generated with an open-source, license-free toolchain (`python-pptx`) driven by the
content in `site/src/content/docs/`. Generation scripts live in `tools/` and the generated `.pptx`
files are committed here so trainers can grab them without a build step.

| Deck                             | Module | Source page                      |
| -------------------------------- | ------ | -------------------------------- |
| `c1-b11-implementation.pptx`     | B.1.1  | `modules/b11-implementation`     |
| `c2-b42-onboarding.pptx`         | B.4.2  | `modules/b42-onboarding`         |
| `c3-b21-acr.pptx`                | B.2.1  | `modules/b21-acr`                |
| `c4-b22-customer-diversity.pptx` | B.2.2  | `modules/b22-customer-diversity` |
| `c5-b31-skilling.pptx`           | B.3.1  | `modules/b31-skilling`           |
| `c6-b41-audit-readiness.pptx`    | B.4.1  | `modules/b41-audit-readiness`    |

> Decks are generated after module content is finalised, so this folder fills in late in the build.
