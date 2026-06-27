# Slides

Projectable **PowerPoint (`.pptx`)** facilitator decks — one per course block — generated from the
course content. Decks are intentionally light (talk-track prompts, key diagrams, evidence "what good
looks like" cards, and trainer timing notes) so the hands-on labs stay the focus.

## How decks are produced

Decks are generated with an open-source, license-free toolchain ([`pptxgenjs`][pptxgenjs], MIT) so the
slide generator lives in the same Node/npm world as the rest of the repo — one lockfile, one
`npm audit`, Dependabot-governed. The generator is [`generate.js`](./generate.js); the produced `.pptx`
files are committed here so trainers can grab them without a build step.

`slides` is an npm **workspace** of the repo root, so its single dependency (`pptxgenjs`) is captured in
the root `package-lock.json` and covered by the root `npm audit` and Dependabot updates.

| Deck                             | Block | Module | Source page                       |
| -------------------------------- | ----- | ------ | --------------------------------- |
| `C0-setup.pptx`                  | C0    | —      | `setup/index`                     |
| `C1-b11-implementation.pptx`     | C1    | B.1.1  | `modules/b11-implementation`      |
| `C2-b42-onboarding.pptx`         | C2    | B.4.2  | `modules/b42-onboarding`          |
| `C3-b21-acr.pptx`                | C3    | B.2.1  | `modules/b21-acr`                 |
| `C4-b22-customer-diversity.pptx` | C4    | B.2.2  | `modules/b22-customer-diversity`  |
| `C5-b31-skilling.pptx`           | C5    | B.3.1  | `modules/b31-skilling`            |
| `C6-b41-audit-readiness.pptx`    | C6    | B.4.1  | `modules/b41-audit-readiness`     |
| `C7-redelivery-clinic.pptx`      | C7    | —      | `trainer-guide/redelivery-clinic` |

Each deck follows the same arc: title → objectives → concept/background → key diagram (recreated as
native shapes, not screenshots) → numbered lab steps → a Copilot skill code-card
(`@moduleb-lab-coach #skill`) → evidence "what good looks like" cards → a dark trainer-notes slide
with a minute-by-minute timing table and the answer key / common pitfalls.

### Copilot skill → control → evidence map

The skill code-cards in the decks match the lab content and the C6 evidence-index validation:

| Skill (`@moduleb-lab-coach #<skill>`) | Control | Block | Evidence artefact(s)                                                              |
| ------------------------------------- | ------- | ----- | --------------------------------------------------------------------------------- |
| `#draft-case-study`                   | B.1.1   | C1    | `B11_CaseStudy`, `B11_ArchitectureDiagram`, `B11_CapabilityStatement`             |
| `#generate-hld`                       | B.4.2   | C2    | `B42_HLD`, `B42_LLD`                                                              |
| `#generate-runbook`                   | B.4.2   | C2    | `B42_MigrationRunbook`, `B42_KTPlan`, `B42_HypercarePlan`, `B42_ACSSRegistration` |
| `#annotate-acr`                       | B.2.1   | C3    | `B21_ACRBreakdown`                                                                |
| `#build-customer-crossref`            | B.2.2   | C4    | `B22_CustomerList`                                                                |
| `#build-skilling-plan`                | B.3.1   | C5    | `B31_SkillingMapping`, `B31_AZ120Transcript`                                      |
| `#build-evidence-index`               | B.4.1   | C6    | `B41_EvidenceIndex`, `B41_PreAuditReview`                                         |

## Regenerate

The decks are fully reproducible. From the **repository root** (installs the workspace deps the first
time):

```bash
npm install
npm run slides:generate    # writes the 8 .pptx files into slides/
```

or from inside `slides/`:

```bash
cd slides
npm install
npm run generate
```

Edited a module page under `site/src/content/docs/`? Re-run the generator so the matching deck stays
in sync, then re-commit the updated `.pptx`.

### Visual check (optional)

To eyeball the rendered slides you need [LibreOffice][lo] (`soffice`) for PPTX → PDF, then any
PDF rasteriser (e.g. the Apache-licensed [`pypdfium2`][pdfium]) for PDF → images:

```bash
soffice --headless --convert-to pdf --outdir _build slides/*.pptx
python -c "import pypdfium2 as p, pathlib; [p.PdfDocument(str(f)).get_page(0) for f in pathlib.Path('_build').glob('*.pdf')]"
```

`_build/` and PowerPoint lock files (`~$*.pptx`) are git-ignored.

## Accessibility

Stat numbers and status text use a dark-amber accent (`#8A6A00`) that clears WCAG AA (≥ 4.5:1) on
white; secondary captions on white use `#5A6B7F` (≥ 4.5:1). The muted blue-grey (`#8A9BB2`) is only
used on the navy title band, where it also passes AA. Keep these in mind if you re-theme the palette in
`generate.js`.

[pptxgenjs]: https://gitbrent.github.io/PptxGenJS/
[lo]: https://www.libreoffice.org/
[pdfium]: https://pypi.org/project/pypdfium2/
