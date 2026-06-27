#!/usr/bin/env python3
"""Generate the SAP-on-Azure Module B facilitator decks (one .pptx per module).

Reproducible, license-free deck generation driven entirely by python-pptx (BSD-3).
Run from the repository root:

    python -m pip install -r tools/requirements-slides.txt
    python tools/generate-slides.py            # writes slides/*.pptx
    python tools/generate-slides.py --check     # build + re-open validation only

The deck *content* mirrors the Starlight module pages under
site/src/content/docs/ so trainers can present without the site. Editing a module
page? Re-run this script to regenerate the matching deck.
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass, field
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

# --------------------------------------------------------------------------- #
# Brand system (Azure / Microsoft — topic-informed palette)
# --------------------------------------------------------------------------- #
NAVY = RGBColor(0x0B, 0x25, 0x45)  # dominant dark (title / dividers / notes)
NAVY_2 = RGBColor(0x10, 0x33, 0x5C)  # slightly lighter navy panel
AZURE = RGBColor(0x00, 0x78, 0xD4)  # Microsoft Azure primary blue
AZURE_DK = RGBColor(0x00, 0x5A, 0x9E)  # deeper azure
CYAN = RGBColor(0x50, 0xE6, 0xFF)  # bright accent (numbers / highlights)
AMBER = RGBColor(0xFF, 0xB9, 0x00)  # sharp accent (evidence / callouts) — fills & on-dark text
AMBER_TXT = RGBColor(0xA8, 0x52, 0x00)  # dark amber for emphasis TEXT on white (WCAG AA ~5.3:1)
GREEN = RGBColor(0x10, 0x7C, 0x10)  # pass / compliant
INK = RGBColor(0x24, 0x24, 0x24)  # body text on light
MUTED = RGBColor(0x60, 0x5E, 0x5C)  # captions / footers
CLOUD = RGBColor(0xF3, 0xF2, 0xF1)  # light card background
CLOUD_2 = RGBColor(0xE8, 0xEE, 0xF6)  # pale azure card background
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LINE = RGBColor(0xD2, 0xD0, 0xCE)

F_HEAD = "Segoe UI Semibold"
F_BODY = "Segoe UI"
F_MONO = "Consolas"

EMU_W = Inches(13.333)
EMU_H = Inches(7.5)
MARGIN = Inches(0.62)
CONTENT_W = EMU_W - 2 * MARGIN

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "slides"


# --------------------------------------------------------------------------- #
# Low-level helpers
# --------------------------------------------------------------------------- #
def _set_fill(shape, color):
    shape.fill.solid()
    shape.fill.fore_color.rgb = color


def _no_line(shape):
    shape.line.fill.background()


def _line(shape, color, width_pt=1.0):
    shape.line.color.rgb = color
    shape.line.width = Pt(width_pt)


def _no_shadow(shape):
    # python-pptx leaves the inherited preset shadow on autoshapes; strip it.
    sp = shape._element.spPr
    existing = sp.find(qn("a:effectLst"))
    if existing is None:
        sp.append(sp.makeelement(qn("a:effectLst"), {}))


def bg(slide, color):
    r = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, EMU_W, EMU_H)
    _set_fill(r, color)
    _no_line(r)
    _no_shadow(r)
    # Move to the back so all later shapes paint on top of it.
    spTree = slide.shapes._spTree
    spTree.remove(r._element)
    spTree.insert(2, r._element)
    return r


def rect(slide, left, top, width, height, fill=None, shape=MSO_SHAPE.RECTANGLE,
         line_color=None, line_w=1.0):
    s = slide.shapes.add_shape(shape, left, top, width, height)
    if fill is None:
        s.fill.background()
    else:
        _set_fill(s, fill)
    if line_color is None:
        _no_line(s)
    else:
        _line(s, line_color, line_w)
    _no_shadow(s)
    return s


def _apply_runs(p, runs, default_font, default_size, default_color, default_bold):
    """runs: str or list of (text, overrides-dict)."""
    if isinstance(runs, str):
        runs = [(runs, {})]
    for text, ov in runs:
        r = p.add_run()
        r.text = text
        r.font.name = ov.get("font", default_font)
        r.font.size = Pt(ov.get("size", default_size))
        r.font.bold = ov.get("bold", default_bold)
        r.font.italic = ov.get("italic", False)
        r.font.color.rgb = ov.get("color", default_color)


def text(slide, left, top, width, height, lines, *, font=F_BODY, size=16,
         color=INK, bold=False, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP,
         line_spacing=1.06, space_after=4, wrap=True):
    """lines: str | list. Each item is a paragraph: str OR (runs, para-overrides)."""
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.word_wrap = wrap
    tf.vertical_anchor = anchor
    for m in ("margin_left", "margin_right"):
        setattr(tf, m, Emu(0))
    tf.margin_top = Emu(0)
    tf.margin_bottom = Emu(0)
    if isinstance(lines, str):
        lines = [lines]
    for i, item in enumerate(lines):
        para_ov = {}
        runs = item
        if isinstance(item, tuple):
            runs, para_ov = item
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = para_ov.get("align", align)
        p.line_spacing = para_ov.get("line_spacing", line_spacing)
        p.space_before = Pt(para_ov.get("space_before", 0))
        p.space_after = Pt(para_ov.get("space_after", space_after))
        _apply_runs(
            p, runs,
            para_ov.get("font", font), para_ov.get("size", size),
            para_ov.get("color", color), para_ov.get("bold", bold),
        )
    return tb


def circle(slide, left, top, diameter, fill, label, *, txt_color=WHITE,
           size=18, font=F_HEAD):
    c = rect(slide, left, top, diameter, diameter, fill=fill, shape=MSO_SHAPE.OVAL)
    tf = c.text_frame
    tf.word_wrap = False
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = label
    r.font.name = font
    r.font.size = Pt(size)
    r.font.bold = True
    r.font.color.rgb = txt_color
    return c


def footer(slide, code):
    text(slide, MARGIN, EMU_H - Inches(0.5), Inches(9), Inches(0.3),
         "SAP on Azure · Module B Accelerator — Train-the-Trainer",
         size=9.5, color=MUTED)
    text(slide, EMU_W - MARGIN - Inches(2.4), EMU_H - Inches(0.5), Inches(2.4),
         Inches(0.3), code, size=9.5, color=AZURE, bold=True,
         align=PP_ALIGN.RIGHT)


def content_header(slide, kicker, title):
    """Light content slide header: thick azure left bar + kicker + title."""
    rect(slide, 0, 0, Inches(0.2), EMU_H, fill=AZURE)  # left motif bar
    text(slide, MARGIN, Inches(0.5), CONTENT_W, Inches(0.34),
         kicker.upper(), size=13, color=AZURE, bold=True, font=F_HEAD)
    text(slide, MARGIN, Inches(0.84), CONTENT_W, Inches(0.7),
         title, size=30, color=NAVY, bold=True, font=F_HEAD,
         line_spacing=1.0)


def blank(prs):
    return prs.slides.add_slide(prs.slide_layouts[6])


# --------------------------------------------------------------------------- #
# Slide builders
# --------------------------------------------------------------------------- #
def title_slide(prs, deck):
    s = blank(prs)
    bg(s, NAVY)
    # motif: layered azure corner blocks
    rect(s, EMU_W - Inches(3.7), 0, Inches(3.7), Inches(2.5), fill=NAVY_2)
    rect(s, EMU_W - Inches(2.1), 0, Inches(2.1), Inches(1.4), fill=AZURE_DK)
    rect(s, 0, EMU_H - Inches(0.28), EMU_W, Inches(0.28), fill=AZURE)
    rect(s, 0, EMU_H - Inches(0.28), Inches(4.4), Inches(0.28), fill=CYAN)

    text(s, MARGIN, Inches(1.05), CONTENT_W, Inches(0.4),
         "SAP ON MICROSOFT AZURE · ADVANCED SPECIALIZATION", size=14,
         color=CYAN, bold=True, font=F_HEAD)
    # module code chip
    chip = rect(s, MARGIN, Inches(1.7), Inches(2.4), Inches(0.66),
                fill=AZURE, shape=MSO_SHAPE.ROUNDED_RECTANGLE)
    chip.adjustments[0] = 0.5
    tf = chip.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    rr = p.add_run()
    rr.text = deck.code + ("  ·  " + deck.control if deck.control else "")
    rr.font.name = F_HEAD
    rr.font.size = Pt(18)
    rr.font.bold = True
    rr.font.color.rgb = WHITE

    text(s, MARGIN, Inches(2.7), CONTENT_W, Inches(2.0), deck.title,
         size=46, color=WHITE, bold=True, font=F_HEAD, line_spacing=1.02)
    text(s, MARGIN, Inches(4.7), Inches(10.6), Inches(1.0), deck.subtitle,
         size=19, color=CLOUD_2, line_spacing=1.12)
    # meta row
    meta = []
    if deck.duration:
        meta.append(("\u23f1  " + deck.duration, {}))
    meta.append(("   |   ", {"color": MUTED}))
    meta.append(("\U0001f9d1\u200d\U0001f3eb  Facilitator deck", {}))
    text(s, MARGIN, Inches(5.7), CONTENT_W, Inches(0.4), [meta],
         size=15, color=CYAN, bold=True, font=F_HEAD)
    return s


def section_divider(prs, kicker, title, body=None):
    s = blank(prs)
    bg(s, NAVY)
    rect(s, MARGIN, Inches(2.5), Inches(0.9), Inches(0.12), fill=CYAN)
    text(s, MARGIN, Inches(2.78), CONTENT_W, Inches(0.4), kicker.upper(),
         size=15, color=CYAN, bold=True, font=F_HEAD)
    text(s, MARGIN, Inches(3.2), CONTENT_W, Inches(1.4), title, size=40,
         color=WHITE, bold=True, font=F_HEAD, line_spacing=1.0)
    if body:
        text(s, MARGIN, Inches(4.7), Inches(10.5), Inches(1.2), body,
             size=18, color=CLOUD_2, line_spacing=1.15)
    rect(s, 0, EMU_H - Inches(0.22), EMU_W, Inches(0.22), fill=AZURE)
    return s


def objectives_slide(prs, deck, items):
    s = blank(prs)
    bg(s, WHITE)
    content_header(s, deck.code + " · learning objectives", "By the end of this lab you can\u2026")
    top = Inches(1.9)
    row_h = Inches(1.02)
    gap = Inches(0.16)
    n = len(items)
    avail = EMU_H - top - Inches(0.7)
    row_h = min(row_h, Emu(int((avail - gap * (n - 1)) / n)))
    for i, it in enumerate(items):
        y = Emu(int(top) + i * (int(row_h) + int(gap)))
        card = rect(s, MARGIN, y, CONTENT_W, row_h, fill=CLOUD,
                    shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        card.adjustments[0] = 0.08
        rect(s, MARGIN, y, Inches(0.12), row_h, fill=AZURE)
        d = Inches(0.5)
        circle(s, MARGIN + Inches(0.32), Emu(int(y) + int(row_h) // 2 - int(d) // 2),
               d, AZURE, str(i + 1), size=18)
        text(s, MARGIN + Inches(1.1), y, CONTENT_W - Inches(1.4), row_h, it,
             size=16.5, color=INK, anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.05)
    footer(s, deck.code)
    return s


def bullets_slide(prs, deck, kicker, title, intro, bullets, *, dot=AZURE):
    s = blank(prs)
    bg(s, WHITE)
    content_header(s, kicker, title)
    y = Inches(1.85)
    box_w = CONTENT_W - Inches(0.5)
    # Approx characters that fit on one wrapped line at the given point size in
    # box_w. Tuned for Segoe UI; intentionally conservative so we never under-
    # advance and overlap the next bullet.
    def _wrapped_lines(item, size, width_in):
        # Flatten the nested (paragraph -> runs) structure into a char count.
        nchars = 0
        paras = item if isinstance(item, list) else [item]
        for para in paras:
            if isinstance(para, tuple):
                para = para[0]
            if isinstance(para, str):
                nchars += len(para)
            else:
                for run in para:
                    nchars += len(run[0]) if isinstance(run, tuple) else len(str(run))
        cpl = max(10, int(width_in * 100 / size * 1.4))
        return max(len(paras), (nchars // cpl) + 1)

    if intro:
        text(s, MARGIN, y, CONTENT_W, Inches(1.0), intro, size=16,
             color=MUTED, line_spacing=1.12)
        intro_lines = _wrapped_lines(intro, 16, 12.0)
        y = Emu(int(y) + int(Inches(0.34)) * intro_lines + int(Inches(0.26)))
    line_h = Inches(0.34)
    for b in bullets:
        lines = b if isinstance(b, list) else [b]
        rect(s, MARGIN + Inches(0.04), Emu(int(y) + int(Inches(0.085))),
             Inches(0.16), Inches(0.16), fill=dot, shape=MSO_SHAPE.OVAL)
        wl = _wrapped_lines(lines, 16.5, 11.5)
        text(s, MARGIN + Inches(0.42), y, box_w, Emu(int(line_h) * wl + int(Inches(0.2))),
             lines, size=16.5, color=INK, line_spacing=1.1)
        y = Emu(int(y) + int(line_h) * wl + int(Inches(0.22)))
    footer(s, deck.code)
    return s


def icon_rows_slide(prs, deck, kicker, title, rows):
    """rows: list of (head, desc)."""
    s = blank(prs)
    bg(s, WHITE)
    content_header(s, kicker, title)
    top = Inches(1.95)
    n = len(rows)
    gap = Inches(0.18)
    avail = EMU_H - top - Inches(0.7)
    row_h = Emu(int((avail - gap * (n - 1)) / n))
    for i, (head, desc) in enumerate(rows):
        y = Emu(int(top) + i * (int(row_h) + int(gap)))
        d = Inches(0.62)
        circle(s, MARGIN, Emu(int(y) + int(row_h) // 2 - int(d) // 2), d, AZURE,
               str(i + 1), size=20)
        text(s, MARGIN + Inches(0.95), y + Inches(0.04), CONTENT_W - Inches(1.1),
             Inches(0.4), head, size=18, color=NAVY, bold=True, font=F_HEAD)
        text(s, MARGIN + Inches(0.95), y + Inches(0.46),
             CONTENT_W - Inches(1.1), row_h - Inches(0.46), desc, size=14.5,
             color=MUTED, line_spacing=1.06)
    footer(s, deck.code)
    return s


def steps_slide(prs, deck, kicker, title, steps):
    """steps: list of (head, desc). Two columns if > 4."""
    s = blank(prs)
    bg(s, WHITE)
    content_header(s, kicker, title)
    two_col = len(steps) > 4
    top = Inches(1.95)
    if two_col:
        col_w = Emu(int((CONTENT_W - Inches(0.5)) / 2))
        half = (len(steps) + 1) // 2
        cols = [(MARGIN, steps[:half], 0), (MARGIN + col_w + Inches(0.5), steps[half:], half)]
    else:
        col_w = CONTENT_W
        cols = [(MARGIN, steps, 0)]
    for cx, group, off in cols:
        n = max(len(group), 1)
        gap = Inches(0.16)
        avail = EMU_H - top - Inches(0.7)
        row_h = Emu(int((avail - gap * (n - 1)) / n))
        for j, (head, desc) in enumerate(group):
            y = Emu(int(top) + j * (int(row_h) + int(gap)))
            card = rect(s, cx, y, col_w, row_h, fill=CLOUD,
                        shape=MSO_SHAPE.ROUNDED_RECTANGLE)
            card.adjustments[0] = 0.07
            d = Inches(0.46)
            circle(s, cx + Inches(0.22), Emu(int(y) + int(row_h) // 2 - int(d) // 2),
                   d, NAVY, str(off + j + 1), size=16, txt_color=CYAN)
            tx = cx + Inches(0.85)
            tw = col_w - Inches(1.05)
            text(s, tx, y + Inches(0.12), tw, Inches(0.34), head, size=15.5,
                 color=NAVY, bold=True, font=F_HEAD)
            if desc:
                text(s, tx, y + Inches(0.46), tw, row_h - Inches(0.5), desc,
                     size=12.5, color=MUTED, line_spacing=1.03)
    footer(s, deck.code)
    return s


def table_slide(prs, deck, kicker, title, headers, rows, col_widths,
                intro=None, note=None, highlight_last=False):
    s = blank(prs)
    bg(s, WHITE)
    content_header(s, kicker, title)
    y = Inches(1.85)
    if intro:
        text(s, MARGIN, y, CONTENT_W, Inches(0.5), intro, size=14.5,
             color=MUTED, line_spacing=1.1)
        y = Inches(2.35)
    ncols = len(headers)
    nrows = len(rows) + 1
    total_w = sum(col_widths)
    tbl_shape = s.shapes.add_table(nrows, ncols, MARGIN, y, Emu(int(total_w)),
                                   Inches(0.4) * nrows)
    tbl = tbl_shape.table
    # disable banded styling we don't control
    tbl.first_row = False
    tbl.horz_banding = False
    for ci, w in enumerate(col_widths):
        tbl.columns[ci].width = Emu(int(w))
    for ci, htext in enumerate(headers):
        cell = tbl.cell(0, ci)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        cell.margin_left = Inches(0.1)
        cell.margin_right = Inches(0.08)
        cell.margin_top = Inches(0.04)
        cell.margin_bottom = Inches(0.04)
        p = cell.text_frame.paragraphs[0]
        r = p.add_run()
        r.text = htext
        r.font.name = F_HEAD
        r.font.size = Pt(12.5)
        r.font.bold = True
        r.font.color.rgb = WHITE
    for ri, row in enumerate(rows, start=1):
        last = highlight_last and ri == len(rows)
        for ci, val in enumerate(row):
            cell = tbl.cell(ri, ci)
            cell.fill.solid()
            if last:
                cell.fill.fore_color.rgb = CLOUD_2
            else:
                cell.fill.fore_color.rgb = WHITE if ri % 2 else CLOUD
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            cell.margin_left = Inches(0.1)
            cell.margin_right = Inches(0.08)
            cell.margin_top = Inches(0.03)
            cell.margin_bottom = Inches(0.03)
            p = cell.text_frame.paragraphs[0]
            mono = val.startswith("`") and val.endswith("`")
            disp = val.strip("`")
            r = p.add_run()
            r.text = disp
            r.font.name = F_MONO if mono else F_BODY
            r.font.size = Pt(11.5 if mono else 12.5)
            r.font.bold = bool(last and ci == 0)
            r.font.color.rgb = AZURE_DK if mono else INK
    if note:
        note_y = min(int(y) + int(Inches(0.5)) * nrows + int(Inches(0.24)),
                     int(EMU_H - Inches(0.92)))
        text(s, MARGIN, Emu(note_y), CONTENT_W, Inches(0.4), note,
             size=12.5, color=MUTED, line_spacing=1.05)
    footer(s, deck.code)
    return s


def code_card_slide(prs, deck, kicker, title, cards, caption=None):
    """cards: list of dicts {label, lines:[..], result?:str}. 1 or 2 cards."""
    s = blank(prs)
    bg(s, WHITE)
    content_header(s, kicker, title)
    top = Inches(1.95)
    bottom = EMU_H - Inches(0.7)
    if caption:
        text(s, MARGIN, top, CONTENT_W, Inches(0.45), caption, size=14.5,
             color=MUTED, line_spacing=1.1)
        top = Inches(2.45)
    n = len(cards)
    if n == 1:
        boxes = [(MARGIN, CONTENT_W)]
    else:
        cw = Emu(int((CONTENT_W - Inches(0.4)) / 2))
        boxes = [(MARGIN, cw), (MARGIN + cw + Inches(0.4), cw)]
    avail = int(bottom - top)
    max_lines = max(len(c["lines"]) for c in cards)
    has_result = any(c.get("result") for c in cards)
    needed = int(Inches(0.78)) + int(Inches(0.265)) * max_lines + int(Inches(0.28))
    if has_result:
        needed += int(Inches(0.66))
    h = Emu(min(avail, needed))
    card_top = Emu(top + (avail - int(h)) // 2)
    for (cx, cw), card in zip(boxes, cards, strict=True):
        panel = rect(s, cx, card_top, cw, h, fill=NAVY,
                     shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        panel.adjustments[0] = 0.04
        # label bar
        text(s, cx + Inches(0.3), card_top + Inches(0.22), cw - Inches(0.6),
             Inches(0.4), card["label"], size=14, color=CYAN, bold=True,
             font=F_HEAD)
        code_lines = card["lines"]
        text(s, cx + Inches(0.3), card_top + Inches(0.78), cw - Inches(0.6),
             h - Inches(1.6), code_lines, size=12.5, color=WHITE, font=F_MONO,
             line_spacing=1.18, space_after=1)
        if card.get("result"):
            ry = card_top + h - Inches(0.66)
            rb = rect(s, cx + Inches(0.3), ry, cw - Inches(0.6), Inches(0.46),
                      fill=AZURE_DK, shape=MSO_SHAPE.ROUNDED_RECTANGLE)
            rb.adjustments[0] = 0.3
            text(s, cx + Inches(0.5), ry, cw - Inches(1.0), Inches(0.46),
                 card["result"], size=12.5, color=WHITE, bold=True,
                 anchor=MSO_ANCHOR.MIDDLE)
    footer(s, deck.code)
    return s


def evidence_slide(prs, deck, kicker, title, cards, folder):
    """cards: list of (filename, desc). Amber-accented 'what good looks like'."""
    s = blank(prs)
    bg(s, WHITE)
    content_header(s, kicker, title)
    text(s, MARGIN, Inches(1.78), CONTENT_W, Inches(0.4),
         [[("Evidence folder:  ", {"color": MUTED}),
           (folder, {"font": F_MONO, "color": AZURE_DK, "bold": True})]],
         size=14)
    top = Inches(2.45)
    n = len(cards)
    gap = Inches(0.16)
    avail = EMU_H - top - Inches(0.7)
    row_h = min(Inches(1.0), Emu(int((avail - gap * (n - 1)) / max(n, 1))))
    for i, (fn, desc) in enumerate(cards):
        y = Emu(int(top) + i * (int(row_h) + int(gap)))
        card = rect(s, MARGIN, y, CONTENT_W, row_h, fill=CLOUD,
                    shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        card.adjustments[0] = 0.07
        rect(s, MARGIN, y, Inches(0.14), row_h, fill=AMBER)
        d = Inches(0.44)
        circle(s, MARGIN + Inches(0.34),
               Emu(int(y) + int(row_h) // 2 - int(d) // 2), d, AMBER,
               "\U0001f4c4", size=14, txt_color=NAVY)
        text(s, MARGIN + Inches(1.0), y + Inches(0.14), CONTENT_W - Inches(1.2),
             Inches(0.36), [[(fn, {"font": F_MONO, "bold": True})]], size=15,
             color=NAVY)
        text(s, MARGIN + Inches(1.0), y + Inches(0.5), CONTENT_W - Inches(1.2),
             row_h - Inches(0.5), desc, size=12.5, color=MUTED)
    footer(s, deck.code)
    return s


def trainer_notes_slide(prs, deck, timing, pitfalls, *, total=None):
    s = blank(prs)
    bg(s, NAVY)
    rect(s, 0, 0, Inches(0.2), EMU_H, fill=AMBER)
    text(s, MARGIN, Inches(0.5), CONTENT_W, Inches(0.34),
         "TRAINER NOTES", size=13, color=AMBER, bold=True, font=F_HEAD)
    title = "Timing & facilitation" + (f"  ·  total {total}" if total else "")
    text(s, MARGIN, Inches(0.84), CONTENT_W, Inches(0.6), title, size=28,
         color=WHITE, bold=True, font=F_HEAD)
    # left: timing table
    col_l = MARGIN
    col_w = Inches(6.0)
    text(s, col_l, Inches(1.9), col_w, Inches(0.34), "MINUTE-BY-MINUTE",
         size=12.5, color=CYAN, bold=True, font=F_HEAD)
    y = Inches(2.34)
    for activity, mins in timing:
        rb = rect(s, col_l, y, col_w, Inches(0.5), fill=NAVY_2,
                  shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        rb.adjustments[0] = 0.2
        text(s, col_l + Inches(0.2), y, col_w - Inches(1.4), Inches(0.5),
             activity, size=13, color=WHITE, anchor=MSO_ANCHOR.MIDDLE)
        text(s, col_l + col_w - Inches(1.25), y, Inches(1.1), Inches(0.5),
             mins, size=13, color=CYAN, bold=True, font=F_HEAD,
             anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.RIGHT)
        y = Emu(int(y) + int(Inches(0.58)))
    # right: pitfalls
    col_r = MARGIN + col_w + Inches(0.5)
    rcw = EMU_W - MARGIN - col_r
    text(s, col_r, Inches(1.9), rcw, Inches(0.34), "PITFALLS & ANSWER KEY",
         size=12.5, color=CYAN, bold=True, font=F_HEAD)
    y = Inches(2.34)
    for p in pitfalls:
        rect(s, col_r, Emu(int(y) + int(Inches(0.06))), Inches(0.16),
             Inches(0.16), fill=AMBER, shape=MSO_SHAPE.OVAL)
        text(s, col_r + Inches(0.34), y, rcw - Inches(0.34), Inches(1.0),
             p, size=13, color=CLOUD_2, line_spacing=1.08)
        # estimate height from char count
        approx = max(1, (len(p[0][0]) if isinstance(p, list) else len(p)) // 46 + 1)
        y = Emu(int(y) + int(Inches(0.36)) + int(Inches(0.26)) * (approx - 1))
    footer_dark(s, deck.code)
    return s


def footer_dark(slide, code):
    text(slide, MARGIN, EMU_H - Inches(0.46), Inches(9), Inches(0.3),
         "SAP on Azure · Module B Accelerator — Train-the-Trainer",
         size=9.5, color=RGBColor(0xB4, 0xC6, 0xDC))
    text(slide, EMU_W - MARGIN - Inches(2.4), EMU_H - Inches(0.46), Inches(2.4),
         Inches(0.3), code, size=9.5, color=CYAN, bold=True,
         align=PP_ALIGN.RIGHT)


def closing_slide(prs, deck, headline, points):
    s = blank(prs)
    bg(s, NAVY)
    rect(s, 0, EMU_H - Inches(0.28), EMU_W, Inches(0.28), fill=AZURE)
    rect(s, 0, EMU_H - Inches(0.28), Inches(4.4), Inches(0.28), fill=CYAN)
    text(s, MARGIN, Inches(1.1), CONTENT_W, Inches(0.4), deck.code.upper()
         + " · WRAP", size=14, color=CYAN, bold=True, font=F_HEAD)
    text(s, MARGIN, Inches(1.7), CONTENT_W, Inches(1.2), headline, size=38,
         color=WHITE, bold=True, font=F_HEAD, line_spacing=1.02)
    y = Inches(3.3)
    for p in points:
        rect(s, MARGIN + Inches(0.02), Emu(int(y) + int(Inches(0.08))),
             Inches(0.18), Inches(0.18), fill=AMBER, shape=MSO_SHAPE.OVAL)
        text(s, MARGIN + Inches(0.42), y, Inches(11.0), Inches(0.7), p,
             size=17, color=CLOUD_2, line_spacing=1.1)
        y = Emu(int(y) + int(Inches(0.66)))
    return s


# --------------------------------------------------------------------------- #
# Deck definition
# --------------------------------------------------------------------------- #
@dataclass
class Deck:
    code: str
    control: str
    title: str
    subtitle: str
    duration: str
    filename: str
    build: object = field(default=None)


def col(*fracs):
    return [Emu(int(CONTENT_W * f)) for f in fracs]


# ---- C0 · Setup ----------------------------------------------------------- #
def build_c0(prs, deck):
    title_slide(prs, deck)
    icon_rows_slide(prs, deck, "C0 · what you'll set up",
                    "Five things, then you're lab-ready", [
        ("GitHub Codespaces",
         "Open the repo in a Codespace — the devcontainer pre-installs az, bicep, gh, Node and Python. No local installs."),
        ("Azure sign-in",
         "az login and select your Owner subscription. Every pupil uses their own sandbox subscription."),
        ("GitHub Copilot + Module B Lab Coach",
         "Confirm Copilot is active, then load the @moduleb-lab-coach custom agent from .github/agents/."),
        ("MCP servers",
         "Verify the GitHub MCP and Azure MCP servers are connected so Copilot reads live repo + Azure context."),
        ("Smoke test",
         "Ask the Lab Coach to confirm your environment is ready before C1 begins."),
    ])
    code_card_slide(prs, deck, "C0 · in-lab AI", "Your coach for the whole day", [
        {"label": "GitHub MCP server",
         "lines": ["Reads the live repository:", "  · module pages & lab assets",
                   "  · .github/prompts skills", "  · evidence file naming",
                   "", "Grounds Copilot in *this* repo,",
                   "not generic SAP content."]},
        {"label": "Azure MCP server",
         "lines": ["Reads live Azure context:", "  · subscriptions & resources",
                   "  · Cost Management (ACR)", "  · resource graph queries",
                   "", "Used heavily in C3 to pull",
                   "consumption without leaving the IDE."]},
    ], caption="100% of the AI in this course is GitHub Copilot — custom agent + skills + MCP. You won't build agents; you'll drive them.")
    s = blank(prs)
    bg(s, WHITE)
    content_header(s, "C0 · ground rules", "Real Azure, simulated SAP")
    box = rect(s, MARGIN, Inches(2.1), CONTENT_W, Inches(1.5), fill=CLOUD_2,
               shape=MSO_SHAPE.ROUNDED_RECTANGLE)
    box.adjustments[0] = 0.06
    rect(s, MARGIN, Inches(2.1), Inches(0.14), Inches(1.5), fill=AMBER)
    text(s, MARGIN + Inches(0.5), Inches(2.34), CONTENT_W - Inches(1.0),
         Inches(1.1),
         [[("A real SAP system is NOT installed. ", {"bold": True, "color": NAVY}),
           ("SAP is represented by a simulated landscape and sample data under labs/. The Azure landing zone, management services and Copilot/MCP tooling are all real — that's where the audit evidence comes from.", {"color": INK})]],
         size=16.5, line_spacing=1.14)
    text(s, MARGIN, Inches(4.1), CONTENT_W, Inches(0.4),
         "You will need", size=13, color=AZURE, bold=True, font=F_HEAD)
    for i, (h, d) in enumerate([
        ("A GitHub account", "to open Codespaces and use Copilot"),
        ("An Azure subscription with Owner", "your own sandbox — nothing shared"),
    ]):
        x = MARGIN + i * (Emu(int((CONTENT_W - Inches(0.4)) / 2)) + Inches(0.4))
        cw = Emu(int((CONTENT_W - Inches(0.4)) / 2))
        c = rect(s, x, Inches(4.5), cw, Inches(1.2), fill=CLOUD,
                 shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        c.adjustments[0] = 0.08
        text(s, x + Inches(0.3), Inches(4.7), cw - Inches(0.6), Inches(0.4), h,
             size=17, color=NAVY, bold=True, font=F_HEAD)
        text(s, x + Inches(0.3), Inches(5.15), cw - Inches(0.6), Inches(0.5), d,
             size=13.5, color=MUTED)
    footer(s, deck.code)
    trainer_notes_slide(prs, deck, [
        ("Codespaces warm-up + repo tour", "15 min"),
        ("az login + subscription select", "10 min"),
        ("Copilot agent + MCP servers", "12 min"),
        ("Smoke test with Lab Coach", "8 min"),
    ], [
        [("Ask pupils to open the Codespace the evening before — image warm-up saves 5–10 min at the start.", {})],
        [("If the Azure MCP server doesn't appear, reopen the Codespace and check the devcontainer .mcp.json.", {})],
        [("Stress the simulated-SAP point now — it prevents \"where's the HANA box?\" questions all day.", {})],
    ], total="45 min")


# ---- C1 · B.1.1 ----------------------------------------------------------- #
def build_c1(prs, deck):
    title_slide(prs, deck)
    objectives_slide(prs, deck, [
        [[("Deploy an Azure landing zone for a simulated SAP landscape with Bicep/AVM — choosing ", {}), ("lab", {"bold": True, "color": AZURE_DK}), (" vs ", {}), ("reference", {"bold": True, "color": AZURE_DK}), (" sizing.", {})]],
        "Explain the SAP-on-Azure service surface auditors expect: M/Mv3 VMs, ANF, Availability Zones, ExpressRoute, ACSS, HSR, ASCS/ERS.",
        [[("Use the ", {}), ("@moduleb-lab-coach", {"font": F_MONO, "color": AZURE_DK, "bold": True}), (" agent + ", {}), ("#draft-case-study", {"font": F_MONO, "color": AZURE_DK, "bold": True}), (" to produce the case study, architecture diagram & capability statement.", {})]],
        [[("File evidence using the naming convention ", {}), ("[ControlRef]_[DocumentType]_v[N].pdf", {"font": F_MONO, "color": AZURE_DK}), (".", {})]],
    ])
    table_slide(prs, deck, "C1 · B.1.1 at a glance",
                "What the auditor wants to see",
                ["Evidence type", "Accepted artefact"], [
        ["Customer engagement proof", "Anonymised case study — customer, scope, outcome"],
        ["Technical architecture", "Diagram: Azure services, HANA tier, ASCS/ERS, ANF"],
        ["Partner capability statement", "Narrative mapping the practice to the specialization"],
        ["Deployment evidence", "Portal/CLI screenshots, Bicep logs, ACSS registration"],
    ], col(0.30, 0.70), intro="Control B.1.1 asks partners to demonstrate proven SAP-on-Azure implementation capability.")
    # reference architecture as tiers
    s = blank(prs)
    bg(s, WHITE)
    content_header(s, "C1 · reference architecture", "The topology you deploy & reference")
    tiers = [
        ("CONNECTIVITY", AZURE_DK, ["ExpressRoute / VPN Gateway", "Azure Firewall", "Azure Bastion"]),
        ("COMPUTE + HIGH AVAILABILITY", AZURE, ["HANA Primary — Mv3 (ref) / Dsv5 (lab)", "HANA Secondary — HSR sync (AZ2)", "ASCS/ERS — Pacemaker + SBD", "App servers — 2 × Edsv5"]),
        ("SHARED STORAGE", AZURE_DK, ["Azure NetApp Files (NFS 4.1)", "/sapmnt · /usr/trans · hana-data · hana-log"]),
        ("MANAGEMENT", NAVY_2, ["Azure Center for SAP Solutions (ACSS)", "Azure Monitor for SAP", "Azure Backup for HANA (Backint)"]),
    ]
    y = Inches(1.95)
    for label, clr, items in tiers:
        h = Inches(1.08)
        band = rect(s, MARGIN, y, CONTENT_W, h, fill=CLOUD,
                    shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        band.adjustments[0] = 0.06
        tag = rect(s, MARGIN, y, Inches(2.55), h, fill=clr,
                   shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        tag.adjustments[0] = 0.06
        text(s, MARGIN + Inches(0.2), y, Inches(2.2), h, label, size=13,
             color=WHITE, bold=True, font=F_HEAD, anchor=MSO_ANCHOR.MIDDLE,
             line_spacing=1.0)
        items_runs = [[(("•  " + it), {})] for it in items]
        # two columns of items if >2
        if len(items) > 2:
            mid = (len(items) + 1) // 2
            text(s, MARGIN + Inches(2.8), y, Inches(4.7), h,
                 [[("•  " + it, {})] for it in items[:mid]], size=12.5,
                 color=INK, anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.12)
            text(s, MARGIN + Inches(7.5), y, Inches(4.4), h,
                 [[("•  " + it, {})] for it in items[mid:]], size=12.5,
                 color=INK, anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.12)
        else:
            text(s, MARGIN + Inches(2.8), y, Inches(9.1), h, items_runs,
                 size=12.5, color=INK, anchor=MSO_ANCHOR.MIDDLE,
                 line_spacing=1.12)
        y = Emu(int(y) + int(h) + int(Inches(0.12)))
    footer(s, deck.code)
    table_slide(prs, deck, "C1 · service mapping",
                "Map services to the B.1.1 checklist",
                ["B.1.1 audit dimension", "Azure service(s)"], [
        ["SAP-certified HANA compute", "M / Mv2 / Mv3 VMs (HANA TDI certified)"],
        ["HA — HANA tier", "HSR sync replication across Availability Zones"],
        ["HA — app / ASCS tier", "Pacemaker + SBD on Dsv5, ASCS/ERS clustering"],
        ["Shared storage (global FS)", "Azure NetApp Files (NFS 4.1)"],
        ["Network connectivity", "ExpressRoute (primary) or VPN + Azure Firewall"],
        ["Management & operations", "ACSS · Azure Monitor for SAP · Azure Backup"],
        ["Security / identity", "Entra ID SAML SSO (Fiori) · PIM for Basis"],
    ], col(0.36, 0.64))
    code_card_slide(prs, deck, "C1 · Copilot skill", "Draft B.1.1 evidence with the Lab Coach", [
        {"label": "@moduleb-lab-coach  #draft-case-study",
         "lines": ["Context:", "  Partner: [YOUR COMPANY]",
                   "  Customer: ACME Mfg GmbH (anon.)",
                   "  Scope: S/4HANA 2023 greenfield, 2×AZ",
                   "         Mv3 HANA, ANF, ASCS/ERS",
                   "  Region: Sweden Central (AZ 1 & 2)",
                   "  Duration: 14 weeks",
                   "  Outcome: go-live; <2s HANA p99",
                   "Control: B.1.1"],
         "result": "\u2192 case study · arch diagram · capability stmt"},
    ], caption="One skill, three artefacts. The agent must be active for the #skill reference to resolve.")
    evidence_slide(prs, deck, "C1 · what good looks like",
                   "Three B.1.1 evidence artefacts", [
        ("B11_CaseStudy_v1.pdf", "Anonymised engagement — customer, scope, Azure services, measurable outcome, date."),
        ("B11_ArchitectureDiagram_v1.pdf", "Mermaid/diagram showing both Availability Zones, HANA tier, ASCS/ERS, ANF."),
        ("B11_CapabilityStatement_v1.pdf", "< 500-word practice narrative — deployments, regions, AZ-120 certs, specializations."),
    ], "Module B / B1.1 /")
    trainer_notes_slide(prs, deck, [
        ("C0 recap + scene-setting", "5 min"),
        ("Bicep compile + what-if", "10 min"),
        ("Service mapping exercise", "10 min"),
        ("Load Lab Coach agent", "5 min"),
        ("#draft-case-study + review", "15 min"),
        ("Arch diagram + capability stmt", "20 min"),
        ("File artefacts + verify", "10 min"),
    ], [
        [("If az bicep build fails with \"bicep not found\", run az bicep install first.", {})],
        [("Redirect pupils who want a live deploy to the what-if path — live deploy takes 20+ min and diverts focus.", {})],
        [("Common gap: missing measurable outcome. Prompt: \"What p99 latency? What RTO target?\"", {})],
        [("Answer key in labs/challenge-1-implementation/sample-answers/.", {})],
    ], total="75 min")


# ---- C2 · B.4.2 ----------------------------------------------------------- #
def build_c2(prs, deck):
    title_slide(prs, deck)
    objectives_slide(prs, deck, [
        "Map SAP Activate phases to the Azure migration workstream and the service introduced at each phase.",
        "Register the landscape with ACSS (VIS) and enable Azure Monitor for SAP and Azure Backup for HANA — portal & CLI.",
        [[("Use ", {}), ("#generate-hld", {"font": F_MONO, "color": AZURE_DK, "bold": True}), (" and ", {}), ("#generate-runbook", {"font": F_MONO, "color": AZURE_DK, "bold": True}), (" to produce a repeatable onboarding pack: HLD, LLD, runbook, KT, hypercare.", {})]],
        [[("File the onboarding pack as B.4.2 evidence using the ", {}), ("[ControlRef]_[DocumentType]_v[N].pdf", {"font": F_MONO, "color": AZURE_DK}), (" convention.", {})]],
    ])
    # SAP Activate -> Azure timeline
    s = blank(prs)
    bg(s, WHITE)
    content_header(s, "C2 · SAP Activate \u2192 Azure", "The migration backbone for your HLD")
    phases = [
        ("Discover", "Landscape assessment\nSAPS sizing for M/Mv3\nANF throughput plan"),
        ("Prepare", "Deploy Bicep landing zone\nExpressRoute / VPN\nACSS pre-registration"),
        ("Explore", "Dev migration (DMO)\nFirst ACSS VIS\nMonitor + HANA backup"),
        ("Realise", "QA + Prod migration\nHSR cutover playbook\nBackint verification"),
        ("Deploy", "HSR takeover (<30s)\nDNS / LB failover\nSID check"),
        ("Run", "4-week hypercare\nSLA monitoring\nKT sign-off"),
    ]
    n = len(phases)
    gap = Inches(0.24)
    pw = Emu(int((CONTENT_W - gap * (n - 1)) / n))
    y = Inches(2.7)
    head_h = Inches(0.62)
    body_h = Inches(2.35)
    # Connector rail drawn FIRST so the pills paint over it — the cyan only
    # shows through the gaps between pills, giving a joined-up timeline look.
    rail_y = Emu(int(y) + int(head_h) // 2 - int(Pt(1.6)))
    rect(s, MARGIN + Inches(0.3), rail_y, CONTENT_W - Inches(0.6), Pt(3.2),
         fill=CYAN)
    for i, (ph, body) in enumerate(phases):
        x = Emu(int(MARGIN) + i * (int(pw) + int(gap)))
        head = rect(s, x, y, pw, head_h, fill=AZURE if i % 2 == 0 else AZURE_DK,
                    shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        head.adjustments[0] = 0.16
        text(s, x, y, pw, head_h, [[(str(i + 1) + "  " + ph, {})]],
             size=14, color=WHITE, bold=True, font=F_HEAD,
             anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)
        body_box = rect(s, x, y + Inches(0.8), pw, body_h, fill=CLOUD,
                        shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        body_box.adjustments[0] = 0.06
        text(s, x + Inches(0.14), y + Inches(0.8), pw - Inches(0.28),
             body_h, [[(b, {})] for b in body.split("\n")], size=11.5,
             color=INK, line_spacing=1.2, align=PP_ALIGN.CENTER,
             anchor=MSO_ANCHOR.MIDDLE)
    footer(s, deck.code)
    table_slide(prs, deck, "C2 · reference services",
                "What turns on, and when",
                ["Phase", "Azure service / feature", "Purpose"], [
        ["Prepare", "Azure Center for SAP Solutions", "Guided deploy, VIS registration, insights"],
        ["Prepare", "Azure NetApp Files (NFS 4.1)", "/sapmnt, /usr/trans, HANA log + data"],
        ["Realise", "Azure Monitor for SAP", "HANA, OS, NetWeaver metrics + alerting"],
        ["Realise", "Azure Backup for HANA (Backint)", "Policy backups to Recovery Services Vault"],
        ["Deploy", "Availability Zones + HSR", "Zero-downtime cutover, RPO \u2248 0"],
        ["Run", "Azure Update Manager + ACSS", "Patch compliance, CPU/memory trending"],
    ], col(0.13, 0.37, 0.50))
    steps_slide(prs, deck, "C2 · guided Azure steps",
                "Wire up the management plane (portal + CLI)", [
        ("1 · Register with ACSS", "Create a Virtual Instance for SAP (VIS) for SID S4H via Register-existing flow. Capture the screenshot."),
        ("2 · Azure Monitor for SAP", "Create the Monitor resource, add the SAP HANA provider. az workloads monitor (workloads extension)."),
        ("3 · Azure Backup for HANA", "Recovery Services Vault rsv-sapmh-lab; Full + Log policy (daily full, log every 15 min → near-zero RPO)."),
        ("Simulated lab", "No real VM exists — walk the portal flow as a screenshot demo. Never hardcode passwords; use a Key Vault secret URI."),
    ])
    code_card_slide(prs, deck, "C2 · Copilot skills", "Generate the onboarding pack", [
        {"label": "@moduleb-lab-coach  #generate-hld",
         "lines": ["Customer: ACME Mfg (anon.)",
                   "Scope: S/4HANA 2023 greenfield",
                   "Region: Sweden Central, 2 AZ",
                   "HANA: Mv3, HSR sync",
                   "ASCS/ERS: Pacemaker + SBD",
                   "Storage: ANF · Net: ExpressRoute",
                   "", "mode: LLD  \u2192  Low-Level Design"],
         "result": "\u2192 B42_HLD_v1 · B42_LLD_v1"},
        {"label": "@moduleb-lab-coach  #generate-runbook",
         "lines": ["Type: cutover runbook",
                   "System: S/4HANA 2023 (SID S4H)",
                   "Approach: HSR takeover",
                   "Window: Sat 22:00 – Sun 06:00",
                   "+ go/no-go, rollback, on-call",
                   "", "Type: kt-plan   \u2192 KT sessions",
                   "Type: hypercare \u2192 SLA + exit"],
         "result": "\u2192 MigrationRunbook · KTPlan · Hypercare"},
    ])
    evidence_slide(prs, deck, "C2 · what good looks like",
                   "Six B.4.2 onboarding-pack artefacts", [
        ("B42_HLD_v1.pdf  ·  B42_LLD_v1.pdf", "High- and Low-Level Design — compute, storage, network, HA/DR, management."),
        ("B42_MigrationRunbook_v1.pdf", "Tested cutover runbook with per-step duration, go/no-go and rollback."),
        ("B42_KTPlan_v1.pdf  ·  B42_HypercarePlan_v1.pdf", "KT plan (audience, sessions) + hypercare (SLA tiers, exit criteria)."),
        ("B42_ACSSRegistration_v1.pdf", "Screenshot/export of the ACSS VIS registration for SID S4H."),
    ], "Module B / B4.2 /")
    trainer_notes_slide(prs, deck, [
        ("B.4.2 intro + Activate map", "10 min"),
        ("ACSS registration (portal+CLI)", "10 min"),
        ("Azure Monitor for SAP", "7 min"),
        ("Azure Backup enable", "8 min"),
        ("Onboarding pack (5 artefacts)", "25 min"),
        ("File + rename evidence", "5 min"),
        ("Buffer / Q&A", "10 min"),
    ], [
        [("Kick off Microsoft.Workloads provider registration early — it can take 5–10 min.", {})],
        [("In a fully simulated lab, show Monitor + Backup as portal screenshot demos only.", {})],
        [("Pupils skip the LLD — remind them it's a distinct audit artefact with concrete IP/sizing numbers.", {})],
        [("The agent keeps context in-session, so the LLD references the HLD automatically.", {})],
    ], total="75 min")


# ---- C3 · B.2.1 ----------------------------------------------------------- #
def build_c3(prs, deck):
    title_slide(prs, deck)
    objectives_slide(prs, deck, [
        "Use the Azure MCP server from Copilot to query trailing-3-month consumption without leaving the IDE.",
        "Isolate SAP-on-Azure-eligible spend and produce an annotated breakdown.",
        "Build a trend table showing monthly SAP-eligible ACR growth toward the threshold.",
        [[("Set up ", {}), ("PAL", {"bold": True, "color": AZURE_DK}), (" (Partner Admin Link) and produce ", {}), ("B21_ACRBreakdown_v1.pdf", {"font": F_MONO, "color": AZURE_DK}), (".", {})]],
    ])
    bullets_slide(prs, deck, "C3 · what is ACR", "Azure Consumed Revenue & why B.2.1 matters",
                  "ACR = billable Azure spend attributed to a partner. B.2.1 requires a minimum ACR threshold drawn from the SAP-eligible service set.",
                  [
        [[("Attribution: ", {"bold": True, "color": NAVY}), ("PAL (Partner Admin Link) · DPOR (Digital Partner of Record) · CSP (direct billing).", {})]],
        [[("Threshold: ", {"bold": True, "color": NAVY}), ("typically USD 100,000 trailing 12 months (T12M).", {})]],
        [[("Eligible only: ", {"bold": True, "color": NAVY}), ("M-series VMs, ANF, SSD v2/Ultra Disk, ExpressRoute, ACSS, Monitor, Backup.", {})]],
        [[("The trap: ", {"bold": True, "color": AMBER_TXT}), ("USD 2M of generic Azure spend with zero M-series or ANF does NOT pass B.2.1.", {})]],
    ])
    table_slide(prs, deck, "C3 · eligible services",
                "Only this spend counts toward B.2.1",
                ["Service", "Azure family", "SAP role"], [
        ["M8ms – M960ixs (M-series)", "Virtual Machines", "App server, HANA scale-up"],
        ["Mv2 / Mv3-series", "Virtual Machines", "Large / next-gen HANA certified"],
        ["Azure NetApp Files", "Storage", "HANA data/log (NFS 4.1)"],
        ["Premium SSD v2 · Ultra Disk", "Storage", "HANA persistent storage"],
        ["Azure ExpressRoute", "Networking", "SAP-to-on-premises connectivity"],
        ["ACSS · Monitor · Backup", "SAP management", "Lifecycle, telemetry, Backint"],
        ["ASCS/ERS infra (VMs + LB)", "Compute + LB", "HA SAP cluster"],
    ], col(0.34, 0.30, 0.36))
    code_card_slide(prs, deck, "C3 · Copilot + Azure MCP", "Annotate SAP-eligible spend", [
        {"label": "@moduleb-lab-coach  (Azure MCP)",
         "lines": ["Pull my trailing-3-month",
                   "consumption for subscription",
                   "${AZURE_SUBSCRIPTION_ID},",
                   "grouped by ServiceName.",
                   "",
                   "Then run #annotate-acr:",
                   "mark each row SAP-ELIGIBLE /",
                   "NON-ELIGIBLE, subtotal, and",
                   "annualised ACR vs USD 100K."],
         "result": "Sample: SAP-eligible 3-mo = USD 53,120"},
    ], caption="No live subscription? Point the skill at labs/challenge-3-acr/sample-data/consumption-by-service.csv.")
    # stat callout + PAL
    s = blank(prs)
    bg(s, WHITE)
    content_header(s, "C3 · the number & the fix", "Annualised ACR, then attribute it")
    # big stat
    statbox = rect(s, MARGIN, Inches(2.05), Inches(5.4), Inches(2.0), fill=NAVY,
                   shape=MSO_SHAPE.ROUNDED_RECTANGLE)
    statbox.adjustments[0] = 0.05
    text(s, MARGIN + Inches(0.4), Inches(2.25), Inches(4.6), Inches(0.4),
         "SAMPLE SAP-ELIGIBLE ACR (ANNUALISED)", size=12, color=CYAN,
         bold=True, font=F_HEAD)
    text(s, MARGIN + Inches(0.4), Inches(2.6), Inches(4.6), Inches(1.0),
         [[("\u2248 USD 212K", {})]], size=52, color=WHITE, bold=True,
         font=F_HEAD)
    text(s, MARGIN + Inches(0.4), Inches(3.62), Inches(4.6), Inches(0.4),
         "comfortably above the USD 100K T12M threshold", size=13,
         color=CLOUD_2)
    # PAL steps
    px = MARGIN + Inches(5.9)
    pw = EMU_W - MARGIN - px
    text(s, px, Inches(2.05), pw, Inches(0.4),
         "PAL — Partner Admin Link (fastest remediation)", size=15,
         color=NAVY, bold=True, font=F_HEAD)
    for i, st in enumerate([
        "Portal search \u2192 \"Link to a partner ID\" (PAL page).",
        "Enter your MPN ID (Microsoft Partner Network).",
        "Select Link — reflects in Partner Center within 24 h.",
        "CLI: az managementpartner create --partner-id <MPN>",
    ]):
        y = Emu(int(Inches(2.55)) + i * int(Inches(0.62)))
        circle(s, px, y, Inches(0.4), AZURE, str(i + 1), size=15)
        mono = st.startswith("CLI:")
        text(s, px + Inches(0.56), y, pw - Inches(0.56), Inches(0.56),
             [[(st, {"font": F_MONO, "size": 12} if mono else {})]],
             size=13.5, color=INK, anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.04)
    footer(s, deck.code)
    trainer_notes_slide(prs, deck, [
        ("ACR concept + attribution", "5 min"),
        ("Inspect sample consumption data", "5 min"),
        ("Azure MCP query", "10 min"),
        ("#annotate-acr + subtotal", "12 min"),
        ("Monthly trend table", "8 min"),
        ("PAL setup (portal + CLI)", "5 min"),
        ("Package evidence", "5 min"),
    ], [
        [("Trainees confuse total subscription ACR with SAP-eligible ACR — show the raw export beside the annotated view.", {})],
        [("PAL via a service principal that's later deleted stops ACR accruing — link via a durable user account.", {})],
        [("Sovereign clouds (Gov, China, Germany) don't contribute to commercial-cloud B.2.1 ACR.", {})],
        [("Re-delivery: if PAL is already in place, skip the setup and focus on the annotation + threshold maths.", {})],
    ], total="60 min")


# ---- C4 · B.2.2 ----------------------------------------------------------- #
def build_c4(prs, deck):
    title_slide(prs, deck)
    objectives_slide(prs, deck, [
        "Explain the three attribution types and identify which applies to each customer.",
        [[("Use ", {}), ("#build-customer-crossref", {"font": F_MONO, "color": AZURE_DK, "bold": True}), (" to turn a By-Customer export into an anonymised list + cross-reference table.", {})]],
        "Link each customer to a B.1.1 case study and a B.3.1 skilling holder.",
        "Identify and remediate ineligible attribution cases.",
    ])
    bullets_slide(prs, deck, "C4 · what B.2.2 requires", "Three or more unique SAP customers",
                  "\"Unique\" = distinct Azure tenants/subscriptions, each with a valid attribution link. One large customer split across many subscriptions still counts as one.",
                  [
        [[("Auditors cross-check ", {}), ("each customer back to a case study or DPOR record — ", {}), ("#build-customer-crossref", {"font": F_MONO, "color": AZURE_DK}), (" does that automatically.", {})]],
        [[("Watch-out: ", {"bold": True, "color": AMBER_TXT}), ("government/sovereign subs via PAL may not qualify; DPOR records > 24 months may be stale.", {})]],
        [[("Not three customers: ", {"bold": True, "color": AMBER_TXT}), ("the same tenant listed three times under different subscription names.", {})]],
    ])
    table_slide(prs, deck, "C4 · attribution types",
                "PAL · DPOR · CSP at a glance",
                ["Type", "Full name", "How it works", "Notes"], [
        ["PAL", "Partner Admin Link", "Partner user gets Owner/Contributor, links MPN ID", "Fastest; gov subs excluded"],
        ["DPOR", "Digital Partner of Record", "Nominated in Azure / Cloud Marketplace", "Set by customer or CSP admin"],
        ["CSP", "Cloud Solution Provider", "Partner is direct CSP reseller for the sub", "Via Partner Center data"],
    ], col(0.10, 0.24, 0.40, 0.26))
    code_card_slide(prs, deck, "C4 · Copilot skill", "Build the customer cross-reference", [
        {"label": "@moduleb-lab-coach  #build-customer-crossref",
         "lines": ["on customers.json — produce:",
                   "  1. anonymised customer list",
                   "     (alias, industry, attribution,",
                   "      SAP systems)",
                   "  2. cross-reference: each customer",
                   "     \u2192 B.1.1 case study + B.3.1 holder",
                   "  3. flag any ineligible attribution"],
         "result": "\u2192 B22_CustomerList_v1"},
        {"label": "Sample — 3 unique customers",
         "lines": ["Contoso Mfg   PAL   ECC 6.0 / Mv2",
                   "Fabrikam Retail  DPOR  S/4HANA PCE",
                   "Northwind Fin   CSP   BW/4HANA / SSDv2",
                   "",
                   "All three: valid, distinct",
                   "attribution \u2192 B.2.2 \u2713",
                   "",
                   "CSP is fully eligible for",
                   "commercial Azure."]},
    ])
    evidence_slide(prs, deck, "C4 · what good looks like",
                   "One B.2.2 evidence artefact", [
        ("B22_CustomerList_v1.pdf", "Anonymised customer list + attribution cross-reference linking each customer to a B.1.1 case study and B.3.1 skilling holder."),
    ], "Module B / B2.2 /")
    trainer_notes_slide(prs, deck, [
        ("B.2.2 intro + 3-customer model", "5 min"),
        ("Review By-Customer sample data", "7 min"),
        ("#build-customer-crossref", "12 min"),
        ("Verify attribution eligibility", "10 min"),
        ("Cross-ref to B.1.1 + remediation", "8 min"),
        ("Buffer / Q&A", "3 min"),
    ], [
        [("Answer key: sample data has 3 valid, distinct types (PAL, DPOR, CSP). CSP is eligible for commercial Azure.", {})],
        [("Remediation drill: PAL via a deleted service principal stops accruing — re-link via an active user + request a data refresh (24–48 h).", {})],
        [("Re-delivery: CSP-only audience? Focus Step 3 on the Partner Center CSP tab; show PAL/DPOR quickly for contrast.", {})],
    ], total="45 min")


# ---- C5 · B.3.1 ----------------------------------------------------------- #
def build_c5(prs, deck):
    title_slide(prs, deck)
    objectives_slide(prs, deck, [
        "Compare AZ-120 and the \"Run SAP on the Microsoft Cloud\" learning path for B.3.1 eligibility.",
        [[("Use ", {}), ("#build-skilling-plan", {"font": F_MONO, "color": AZURE_DK, "bold": True}), (" to generate a skilling mapping table from a team CSV.", {})]],
        "Produce a per-person Microsoft Learn study plan for team members with gaps.",
        [[("Identify stale AZ-120 certs (past 1-year validity) and produce ", {}), ("B31_SkillingMapping_v1.pdf", {"font": F_MONO, "color": AZURE_DK}), (".", {})]],
    ])
    table_slide(prs, deck, "C5 · the two routes",
                "Two staff must satisfy one route",
                ["", "AZ-120 certification", "Run SAP on MS Cloud (Learn)"], [
        ["Depth", "Full exam certification", "Self-paced path (~8 h)"],
        ["Validity", "1 yr (free online renewal)", "No expiry (badge on completion)"],
        ["Cost", "~USD 165 exam fee", "Free"],
        ["Audience", "SAP Basis + Azure admins", "SAP + Azure newcomers"],
        ["Evidence", "Cert transcript PDF", "MS Learn export / badge"],
        ["For B.3.1", "Highest credibility \u2713", "Accepted, fastest route \u2713"],
    ], col(0.18, 0.41, 0.41))
    code_card_slide(prs, deck, "C5 · Copilot skill", "Map the team, flag the gaps", [
        {"label": "@moduleb-lab-coach  #build-skilling-plan",
         "lines": ["on team-skilling.csv — produce:",
                   "  1. mapping: name \u2192 route \u2192",
                   "     completion \u2192 expiry / N/A",
                   "  2. status: COMPLIANT /",
                   "     EXPIRING SOON (<6mo) / GAP",
                   "  3. recommended action per gap"],
         "result": "\u2192 B31_SkillingMapping_v1"},
        {"label": "Answer key (sample 6-person team)",
         "lines": ["2 \u00d7 COMPLIANT (1 AZ-120,",
                   "          1 learning path)",
                   "Frank: AZ-120 lapsed  \u2192 GAP",
                   "Bob:   inside 6-mo window",
                   "       \u2192 EXPIRING SOON",
                   "",
                   "Fix: free AZ-120 online renewal",
                   "assessment — no exam needed."]},
    ])
    table_slide(prs, deck, "C5 · the study plan",
                "4-week plan for gap holders",
                ["Week", "Modules", "Daily", "Milestone"], [
        ["1", "Introduction + HANA on Azure", "30 min", "HANA module quiz passed"],
        ["2", "NetWeaver/S4 + Migration", "30 min", "Migration quiz passed"],
        ["3", "Monitoring + Operations", "30 min", "All modules complete"],
        ["4", "Review + badge claim", "20 min", "Completion badge issued"],
    ], col(0.08, 0.40, 0.14, 0.38),
       note="\u201cRun SAP on the Microsoft Cloud\u201d is the fastest route to compliance — free, no exam, badge on completion.")
    evidence_slide(prs, deck, "C5 · what good looks like",
                   "B.3.1 skilling evidence", [
        ("B31_SkillingMapping_v1.pdf", "Mapping table for the whole team + recommended actions and 4-week study plans for gap holders."),
        ("B31_AZ120Transcript_[Name]_v1.pdf", "Per-person cert transcript or MS Learn completion export — at least two COMPLIANT individuals."),
    ], "Module B / B3.1 /")
    trainer_notes_slide(prs, deck, [
        ("B.3.1 intro + route comparison", "8 min"),
        ("Review team skilling CSV", "5 min"),
        ("#build-skilling-plan", "12 min"),
        ("Study plan for gap holders", "10 min"),
        ("Export Learn evidence + validate", "10 min"),
    ], [
        [("SAP Basis audience usually has the SAP knowledge — point them at the \"SAP on Azure administration\" Learn module to fill the Azure gap fast.", {})],
        [("AZ-120 now has a free online renewal assessment — an EXPIRING SOON cert doesn't need a re-sit.", {})],
        [("Re-delivery: already-certified room? Shorten Step 3 to 10 min; focus on the mapping + compliance check.", {})],
    ], total="45 min")


# ---- C6 · B.4.1 ----------------------------------------------------------- #
def build_c6(prs, deck):
    title_slide(prs, deck)
    objectives_slide(prs, deck, [
        [[("Create the ", {}), ("Module B / B[ref] /", {"font": F_MONO, "color": AZURE_DK}), (" folder structure and populate it from C1–C5 artefacts.", {})]],
        [[("Use ", {}), ("#build-evidence-index", {"font": F_MONO, "color": AZURE_DK, "bold": True}), (" to generate an evidence index with one row per control.", {})]],
        "Validate naming convention and completeness using Copilot.",
        [[("Produce a pre-audit review record, appoint a SPOC, and file ", {}), ("B41_EvidenceIndex_v1.pdf", {"font": F_MONO, "color": AZURE_DK}), (".", {})]],
    ])
    # folder structure + naming rules side by side
    s = blank(prs)
    bg(s, WHITE)
    content_header(s, "C6 · the evidence pack", "Folder structure & naming rules")
    fx = MARGIN
    fw = Inches(6.0)
    panel = rect(s, fx, Inches(1.95), fw, Inches(4.6), fill=NAVY,
                 shape=MSO_SHAPE.ROUNDED_RECTANGLE)
    panel.adjustments[0] = 0.04
    tree = [
        ("Module B/", 0, CYAN),
        ("B.1.1/  B11_CaseStudy · B11_ArchitectureDiagram", 1, WHITE),
        ("B.2.1/  B21_ACRBreakdown", 1, WHITE),
        ("B.2.2/  B22_CustomerList", 1, WHITE),
        ("B.3.1/  B31_SkillingMapping · B31_AZ120Transcript", 1, WHITE),
        ("B.4.1/  B41_EvidenceIndex · B41_PreAuditReview", 1, AMBER),
        ("B.4.2/  B42_HLD · B42_LLD · B42_MigrationRunbook …", 1, WHITE),
    ]
    y = Inches(2.2)
    for label, depth, clr in tree:
        text(s, fx + Inches(0.35) + Inches(0.35) * depth, y, fw - Inches(0.6),
             Inches(0.5), [[(("\u2514\u2500 " if depth else "") + label, {})]],
             size=13 if depth else 15, color=clr,
             bold=(depth == 0), font=F_MONO)
        y = Emu(int(y) + int(Inches(0.58)))
    # naming rules
    rx = fx + fw + Inches(0.5)
    rw = EMU_W - MARGIN - rx
    text(s, rx, Inches(1.95), rw, Inches(0.4), "NAMING CONVENTION", size=13,
         color=AZURE, bold=True, font=F_HEAD)
    text(s, rx, Inches(2.36), rw, Inches(0.5),
         [[("[ControlRef]_[DocumentType]_v[N].pdf", {"font": F_MONO, "bold": True, "color": NAVY, "size": 16})]])
    rules = [
        ("[ControlRef]", "Two-digit, no dot — B21, B31"),
        ("[DocumentType]", "PascalCase, no spaces — CaseStudy"),
        ("v[N]", "Version integer from 1 — v1, v2"),
        (".pdf", "PDF for submissions"),
    ]
    y = Inches(3.0)
    for part, rule in rules:
        c = rect(s, rx, y, rw, Inches(0.8), fill=CLOUD,
                 shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        c.adjustments[0] = 0.1
        text(s, rx + Inches(0.25), y + Inches(0.1), rw - Inches(0.5),
             Inches(0.32), [[(part, {"font": F_MONO, "bold": True})]],
             size=14, color=AZURE_DK)
        text(s, rx + Inches(0.25), y + Inches(0.42), rw - Inches(0.5),
             Inches(0.32), rule, size=12.5, color=MUTED)
        y = Emu(int(y) + int(Inches(0.9)))
    footer(s, deck.code)
    code_card_slide(prs, deck, "C6 · Copilot skill", "Index, validate, review", [
        {"label": "@moduleb-lab-coach  #build-evidence-index",
         "lines": ["Scan Module B/ and produce:",
                   "  1. index: Control | Ref |",
                   "     DocumentType | File | Status",
                   "  2. completeness — any control",
                   "     with no artefact = MISSING",
                   "  3. naming validation —",
                   "     bad names = INVALID_NAME"],
         "result": "\u2192 B41_EvidenceIndex_v1"},
        {"label": "Then: pre-audit review + SPOC",
         "lines": ["Generate a pre-audit review:",
                   "  · date, attendees, checklist",
                   "  · SPOC (single point of contact)",
                   "    name · email · phone",
                   "  · outcome: READY / NOT READY",
                   "",
                   "SPOC = who the auditor contacts",
                   "(usually the Practice Lead)."],
         "result": "\u2192 B41_PreAuditReview_v1"},
    ])
    evidence_slide(prs, deck, "C6 · what good looks like",
                   "Two B.4.1 audit-readiness artefacts", [
        ("B41_EvidenceIndex_v1.pdf", "One row per control, completeness + naming validated, with a declaration statement."),
        ("B41_PreAuditReview_v1.pdf", "Dated review record, READY/NOT-READY outcome, and a named SPOC for the auditor."),
    ], "Module B / B4.1 /")
    trainer_notes_slide(prs, deck, [
        ("B.4.1 intro — auditor's first stop", "5 min"),
        ("Create folder structure", "8 min"),
        ("Copy / placeholder artefacts", "7 min"),
        ("#build-evidence-index + validate", "15 min"),
        ("Evidence index document", "10 min"),
        ("Pre-audit review + SPOC", "10 min"),
        ("Final completeness check", "5 min"),
    ], [
        [("A MISSING entry for B.4.1 early on is expected — pupils generate those artefacts in the final two steps.", {})],
        [("INVALID_NAME is a teaching moment: a file named \"case study final FINAL.pdf\" fails — rename to the convention.", {})],
        [("Folder structure + naming validation are non-negotiable: exactly what the Microsoft auditor checks first.", {})],
        [("Tight on time? Copilot can produce the index + review in one combined prompt.", {})],
    ], total="60 min")


# ---- C7 · Re-delivery Clinic ---------------------------------------------- #
def build_c7(prs, deck):
    title_slide(prs, deck)
    icon_rows_slide(prs, deck, "C7 · goals", "Leave able to re-deliver this", [
        ("Teach one module", "Each trainee picks a module and delivers its 2-minute talk track to the room."),
        ("Group debrief", "Timing risks, common pitfalls, and how to adapt for different audiences."),
        ("Fork & customise", "Agree how to fork the repo for your org — branding, sample data, region."),
        ("Map to the tracker", "Map every lab artefact back to the audit Evidence Tracker."),
    ])
    # customise dimensions
    s = blank(prs)
    bg(s, WHITE)
    content_header(s, "C7 · make it yours", "Three things to customise per delivery")
    cards = [
        ("Branding", "Swap the Azure theme for your partner brand in the Starlight site and the deck palette in tools/generate-slides.py."),
        ("Sample data", "Replace the mock landscape, consumption CSV and customer JSON with anonymised data from your own engagements."),
        ("Region & sizing", "Change the default region (Sweden Central) and lab/reference VM SKUs in infra/ to match pupil quota."),
    ]
    cw = Emu(int((CONTENT_W - Inches(0.8)) / 3))
    for i, (h, d) in enumerate(cards):
        x = Emu(int(MARGIN) + i * (int(cw) + int(Inches(0.4))))
        card = rect(s, x, Inches(2.1), cw, Inches(3.3), fill=CLOUD,
                    shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        card.adjustments[0] = 0.05
        rect(s, x, Inches(2.1), cw, Inches(0.16), fill=[AZURE, AMBER, AZURE_DK][i],
             shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        circle(s, x + Inches(0.3), Inches(2.5), Inches(0.7),
               [AZURE, AMBER, AZURE_DK][i], str(i + 1), size=22,
               txt_color=NAVY if i == 1 else WHITE)
        text(s, x + Inches(0.3), Inches(3.45), cw - Inches(0.6), Inches(0.5), h,
             size=20, color=NAVY, bold=True, font=F_HEAD)
        text(s, x + Inches(0.3), Inches(4.0), cw - Inches(0.6), Inches(1.3), d,
             size=14, color=INK, line_spacing=1.14)
    footer(s, deck.code)
    # map artefacts to tracker
    table_slide(prs, deck, "C7 · the through-line",
                "Every lab \u2192 a control \u2192 evidence",
                ["Lab", "Control", "Evidence artefact(s)"], [
        ["C1", "B.1.1", "`B11_CaseStudy · B11_ArchitectureDiagram · B11_CapabilityStatement`"],
        ["C2", "B.4.2", "`B42_HLD · B42_LLD · B42_MigrationRunbook · B42_KTPlan · …`"],
        ["C3", "B.2.1", "`B21_ACRBreakdown`"],
        ["C4", "B.2.2", "`B22_CustomerList`"],
        ["C5", "B.3.1", "`B31_SkillingMapping · B31_AZ120Transcript`"],
        ["C6", "B.4.1", "`B41_EvidenceIndex · B41_PreAuditReview`"],
    ], col(0.08, 0.12, 0.80))
    closing_slide(prs, deck, "You can now re-deliver Module B", [
        "Eight blocks, six controls, one audit-ready evidence pack.",
        "GitHub Copilot — agent + skills + MCP — did the toil; you reviewed and refined.",
        "Fork the repo, swap in your data, and teach it to your own team.",
    ])


# --------------------------------------------------------------------------- #
# Deck registry
# --------------------------------------------------------------------------- #
DECKS = [
    Deck("C0", "", "Environment Setup",
         "GitHub Codespaces, Azure sign-in, and Copilot wired up to the GitHub & Azure MCP servers and the Module B Lab Coach.",
         "~45 min", "c0-setup.pptx", build_c0),
    Deck("C1", "B.1.1", "SAP on Azure Implementation Capability",
         "Deploy a simulated SAP landing zone with Bicep/AVM; let Copilot draft the case study, architecture diagram and capability statement.",
         "~75 min", "c1-b11-implementation.pptx", build_c1),
    Deck("C2", "B.4.2", "Partner Onboarding & Migration",
         "Generate the HLD/LLD/runbook/KT/hypercare onboarding pack with Copilot and wire up ACSS, Azure Monitor for SAP and Azure Backup.",
         "~75 min", "c2-b42-onboarding.pptx", build_c2),
    Deck("C3", "B.2.1", "ACR Performance",
         "Pull Azure consumption with the Azure MCP server, isolate SAP-eligible spend, and let Copilot annotate the breakdown and trend.",
         "~60 min", "c3-b21-acr.pptx", build_c3),
    Deck("C4", "B.2.2", "Customer Diversity",
         "Model three unique SAP customers via PAL/DPOR/CSP and let Copilot build the customer list and cross-reference table.",
         "~45 min", "c4-b22-customer-diversity.pptx", build_c4),
    Deck("C5", "B.3.1", "Skilling (AZ-120 or Learning Path)",
         "Build a skilling plan and let Copilot map your team to AZ-120 / Run SAP on the Microsoft Cloud and flag gaps.",
         "~45 min", "c5-b31-skilling.pptx", build_c5),
    Deck("C6", "B.4.1", "Audit Readiness",
         "Assemble the Module B evidence pack and let Copilot validate folder structure, naming convention and completeness.",
         "~60 min", "c6-b41-audit-readiness.pptx", build_c6),
    Deck("C7", "", "Re-delivery Clinic & Wrap",
         "The closing Train-the-Trainer block — how to customise, re-deliver and assess this microhack with your own team.",
         "~45 min", "c7-redelivery-clinic.pptx", build_c7),
]


def make_presentation():
    prs = Presentation()
    prs.slide_width = EMU_W
    prs.slide_height = EMU_H
    return prs


def main(argv=None):
    ap = argparse.ArgumentParser(description="Generate Module B facilitator decks.")
    ap.add_argument("--out-dir", default=str(OUT_DIR),
                    help="output directory for .pptx files (default: slides/)")
    ap.add_argument("--check", action="store_true",
                    help="after writing, re-open each deck to validate it")
    args = ap.parse_args(argv)

    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)

    written = []
    for deck in DECKS:
        prs = make_presentation()
        # drop the default empty slide layout's blank first slide if any
        deck.build(prs, deck)
        path = out / deck.filename
        prs.save(str(path))
        written.append((deck, path, len(prs.slides._sldIdLst)))
        print(f"  wrote {path.name:32s} {len(prs.slides._sldIdLst):2d} slides")

    if args.check:
        print("\nValidation (re-open):")
        ok = True
        for _deck, path, _ in written:
            try:
                p = Presentation(str(path))
                n = len(p.slides._sldIdLst)
                empty = 0
                for sl in p.slides:
                    has_text = any(
                        sh.has_text_frame and sh.text_frame.text.strip()
                        for sh in sl.shapes
                    )
                    if not has_text:
                        empty += 1
                status = "OK" if n >= 5 and empty == 0 else "CHECK"
                if status != "OK":
                    ok = False
                print(f"  {path.name:32s} {n:2d} slides, {empty} empty  [{status}]")
            except Exception as exc:  # noqa: BLE001
                ok = False
                print(f"  {path.name:32s} FAILED to re-open: {exc}")
        if not ok:
            sys.exit(1)

    print(f"\n{len(written)} decks written to {out}/")


if __name__ == "__main__":
    main()
