# Slides

Projectable **PowerPoint (`.pptx`)** facilitator decks — one per course block — generated from the
course content. Decks are intentionally light (talk-track prompts, key diagrams, evidence "what good
looks like" cards, and trainer timing notes) so the hands-on labs stay the focus.

## How decks are produced

Decks are generated with an open-source, license-free toolchain ([`python-pptx`][pptx], BSD-3-Clause)
driven by the content in `site/src/content/docs/`. The generator lives in
[`tools/generate-slides.py`](../tools/generate-slides.py) and the generated `.pptx` files are
committed here so trainers can grab them without a build step.

| Deck                             | Block | Module | Source page                       |
| -------------------------------- | ----- | ------ | --------------------------------- |
| `c0-setup.pptx`                  | C0    | —      | `setup/index`                     |
| `c1-b11-implementation.pptx`     | C1    | B.1.1  | `modules/b11-implementation`      |
| `c2-b42-onboarding.pptx`         | C2    | B.4.2  | `modules/b42-onboarding`          |
| `c3-b21-acr.pptx`                | C3    | B.2.1  | `modules/b21-acr`                 |
| `c4-b22-customer-diversity.pptx` | C4    | B.2.2  | `modules/b22-customer-diversity`  |
| `c5-b31-skilling.pptx`           | C5    | B.3.1  | `modules/b31-skilling`            |
| `c6-b41-audit-readiness.pptx`    | C6    | B.4.1  | `modules/b41-audit-readiness`     |
| `c7-redelivery-clinic.pptx`      | C7    | —      | `trainer-guide/redelivery-clinic` |

Each deck follows the same arc: title → objectives → concept/background → key diagram (recreated as
native shapes, not screenshots) → numbered lab steps → a Copilot skill code-card
(`@moduleb-lab-coach #skill`) → evidence "what good looks like" cards → a dark trainer-notes slide
with a minute-by-minute timing table and the answer key / common pitfalls.

## Regenerate

The decks are fully reproducible. From the **repository root**:

```bash
python -m pip install -r tools/requirements-slides.txt
python tools/generate-slides.py            # writes the 8 .pptx files into slides/
python tools/generate-slides.py --check    # also re-opens each deck to validate it
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

[pptx]: https://python-pptx.readthedocs.io/
[lo]: https://www.libreoffice.org/
[pdfium]: https://pypi.org/project/pypdfium2/
