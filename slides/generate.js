/**
 * SAP on Azure Module B — PPTX Facilitator Deck Generator
 * Generates C0–C7 slide decks using PptxGenJS (MIT/ISC licence).
 *
 * Usage:  node generate.js
 * Output: slides/C0-setup.pptx … slides/C7-redelivery-clinic.pptx
 */

'use strict';

const pptxgen = require('pptxgenjs');
const path = require('path');

/* ─────────────────────────────────────────────
   Azure brand palette (Ocean Gradient / Midnight)
   ───────────────────────────────────────────── */
const C = {
  // Azure blues
  azureDeep: '0078D4', // Microsoft Azure signature blue
  azureMid: '106EBE', // Darker tone
  midnight: '003057', // Very dark navy (title BG)
  iceBlue: 'D0E8F8', // Very light blue
  // Accents
  accentCyan: '50E6FF', // Azure cyan accent
  accentGreen: '107C10', // Success / compliant
  accentAmber: '8A6A00', // Warning — dark amber, WCAG AA on white (5.1:1) for stat numbers + status text
  accentRed: 'D13438', // Error / gap
  // Neutrals
  white: 'FFFFFF',
  offWhite: 'F5F9FF',
  lightGrey: 'E8EDF4',
  midGrey: '8A9BB2', // muted blue-grey — legible on DARK/navy only (do not use on white)
  captionText: '5A6B7F', // accessible caption grey for secondary text on WHITE (5.5:1)
  charcoal: '1A2B3C',
  // Content slide BG
  contentBG: 'F0F5FB',
};

const FONT_TITLE = 'Segoe UI';
const FONT_BODY = 'Segoe UI';

const OUT_DIR = __dirname;

/* ─────────────────────────────────────────────
   Shared helpers
   ───────────────────────────────────────────── */

/** Create a fresh pptxgen instance with common metadata */
function newPres(title, subject) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = 'SAP on Azure Microhack (AI-generated facilitator deck)';
  pres.title = title;
  pres.subject = subject;
  return pres;
}

/**
 * Add the standard dark title slide.
 * @param {object} pres  - pptxgen instance
 * @param {string} topBadge  - e.g. "C0 · Environment Setup"
 * @param {string} titleLine1 - main title
 * @param {string} subtitle  - e.g. "SAP on Azure · Module B Advanced Specialization"
 * @param {string} duration  - e.g. "~45 min"
 * @param {string} control   - e.g. "" or "B.1.1"
 */
function addTitleSlide(pres, topBadge, titleLine1, subtitle, duration, control) {
  const slide = pres.addSlide();
  slide.background = { color: C.midnight };

  // Left accent bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 0.12,
    h: 5.625,
    fill: { color: C.azureDeep },
    line: { color: C.azureDeep },
  });

  // Top badge pill
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.32,
    y: 0.35,
    w: 3.0,
    h: 0.42,
    fill: { color: C.azureDeep },
    line: { color: C.azureDeep },
    rectRadius: 0.05,
  });
  slide.addText(topBadge, {
    x: 0.32,
    y: 0.35,
    w: 3.0,
    h: 0.42,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.white,
    bold: true,
    align: 'center',
    valign: 'middle',
    margin: 0,
  });

  // Control badge (right side) if provided
  if (control) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 9.1,
      y: 0.35,
      w: 0.7,
      h: 0.42,
      fill: { color: C.accentCyan, transparency: 20 },
      line: { color: C.accentCyan },
      rectRadius: 0.05,
    });
    slide.addText(control, {
      x: 9.1,
      y: 0.35,
      w: 0.7,
      h: 0.42,
      fontSize: 10,
      fontFace: FONT_BODY,
      color: C.midnight,
      bold: true,
      align: 'center',
      valign: 'middle',
      margin: 0,
    });
  }

  // Main title
  slide.addText(titleLine1, {
    x: 0.32,
    y: 1.1,
    w: 9.3,
    h: 1.6,
    fontSize: 40,
    fontFace: FONT_TITLE,
    color: C.white,
    bold: true,
    align: 'left',
    valign: 'middle',
  });

  // Horizontal rule
  slide.addShape(pres.shapes.LINE, {
    x: 0.32,
    y: 2.85,
    w: 9.3,
    h: 0,
    line: { color: C.azureDeep, width: 2 },
  });

  // Subtitle
  slide.addText(subtitle, {
    x: 0.32,
    y: 3.0,
    w: 7.5,
    h: 0.7,
    fontSize: 16,
    fontFace: FONT_BODY,
    color: C.iceBlue,
    align: 'left',
    valign: 'top',
  });

  // Duration pill (bottom right)
  if (duration) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 7.8,
      y: 4.85,
      w: 1.9,
      h: 0.45,
      fill: { color: C.azureMid },
      line: { color: C.azureMid },
      rectRadius: 0.05,
    });
    slide.addText('⏱ ' + duration, {
      x: 7.8,
      y: 4.85,
      w: 1.9,
      h: 0.45,
      fontSize: 12,
      fontFace: FONT_BODY,
      color: C.white,
      bold: true,
      align: 'center',
      valign: 'middle',
      margin: 0,
    });
  }

  // Footer
  slide.addText('SAP on Microsoft Azure · Advanced Specialization · Train-the-Trainer Microhack', {
    x: 0.32,
    y: 5.25,
    w: 7.5,
    h: 0.25,
    fontSize: 9,
    fontFace: FONT_BODY,
    color: C.midGrey,
    align: 'left',
    valign: 'middle',
  });

  return slide;
}

/**
 * Add a section divider slide.
 */
function addSectionSlide(pres, sectionLabel, title, subtitle) {
  const slide = pres.addSlide();
  slide.background = { color: C.azureDeep };

  // Right decorative block
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 7.5,
    y: 0,
    w: 2.5,
    h: 5.625,
    fill: { color: C.midnight },
    line: { color: C.midnight },
  });

  // Section label
  slide.addText(sectionLabel, {
    x: 0.5,
    y: 0.8,
    w: 6.8,
    h: 0.5,
    fontSize: 13,
    fontFace: FONT_BODY,
    color: C.accentCyan,
    bold: true,
    align: 'left',
  });

  // Title
  slide.addText(title, {
    x: 0.5,
    y: 1.4,
    w: 6.8,
    h: 2.0,
    fontSize: 34,
    fontFace: FONT_TITLE,
    color: C.white,
    bold: true,
    align: 'left',
    valign: 'top',
  });

  // Subtitle
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5,
      y: 3.55,
      w: 6.8,
      h: 0.9,
      fontSize: 15,
      fontFace: FONT_BODY,
      color: C.iceBlue,
      align: 'left',
      valign: 'top',
    });
  }

  return slide;
}

/**
 * Add a standard content slide with title bar and body area.
 * bodyItems: array of { text, bold?, sub?, bullet? }
 */
function addContentSlide(pres, title, bodyItems, opts = {}) {
  const slide = pres.addSlide();
  slide.background = { color: C.contentBG };

  // Title bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.85,
    fill: { color: C.midnight },
    line: { color: C.midnight },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0.85,
    w: 10,
    h: 0.04,
    fill: { color: C.azureDeep },
    line: { color: C.azureDeep },
  });
  slide.addText(title, {
    x: 0.35,
    y: 0,
    w: 9.3,
    h: 0.85,
    fontSize: 22,
    fontFace: FONT_TITLE,
    color: C.white,
    bold: true,
    align: 'left',
    valign: 'middle',
    margin: 0,
  });

  if (opts.twoCol) {
    // Two-column layout
    const { left, right } = opts.twoCol;
    _addBodyText(slide, pres, left, 0.3, 1.05, 4.55, 4.3);
    _addBodyText(slide, pres, right, 5.15, 1.05, 4.55, 4.3);

    // Vertical divider
    slide.addShape(pres.shapes.LINE, {
      x: 5.0,
      y: 1.1,
      w: 0,
      h: 4.2,
      line: { color: C.iceBlue, width: 1.5 },
    });
  } else if (opts.table) {
    // Table layout
    _addTable(slide, opts.table.headers, opts.table.rows, 0.3, 1.1, 9.4, opts.table.colW);
  } else {
    // Single column bullets
    _addBodyText(slide, pres, bodyItems, 0.3, 1.05, 9.4, 4.3);
  }

  // Page note (trainer note)
  if (opts.note) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0,
      y: 5.2,
      w: 10,
      h: 0.42,
      fill: { color: C.lightGrey },
      line: { color: C.lightGrey },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0,
      y: 5.2,
      w: 0.08,
      h: 0.42,
      fill: { color: C.azureMid },
      line: { color: C.azureMid },
    });
    slide.addText('🎓 ' + opts.note, {
      x: 0.15,
      y: 5.2,
      w: 9.7,
      h: 0.42,
      fontSize: 10,
      fontFace: FONT_BODY,
      color: C.charcoal,
      italic: true,
      align: 'left',
      valign: 'middle',
      margin: 0,
    });
  }

  return slide;
}

function _addBodyText(slide, pres, items, x, y, w, h) {
  if (!items || items.length === 0) return;
  const runs = [];
  items.forEach((item, i) => {
    const isLast = i === items.length - 1;
    if (typeof item === 'string') {
      runs.push({
        text: item,
        options: {
          bullet: true,
          breakLine: !isLast,
          fontSize: 14,
          fontFace: FONT_BODY,
          color: C.charcoal,
        },
      });
    } else if (item.spacer) {
      runs.push({ text: ' ', options: { breakLine: true, fontSize: 6 } });
    } else if (item.heading) {
      runs.push({
        text: item.heading,
        options: {
          bold: true,
          breakLine: true,
          fontSize: 16,
          fontFace: FONT_TITLE,
          color: C.azureMid,
        },
      });
    } else {
      const opts = {
        bullet: item.bullet !== false,
        indentLevel: item.sub ? 1 : 0,
        bold: item.bold || false,
        italic: item.italic || false,
        breakLine: !isLast,
        fontSize: item.small ? 12 : 14,
        fontFace: FONT_BODY,
        color: item.color || C.charcoal,
      };
      runs.push({ text: item.text, options: opts });
    }
  });
  slide.addText(runs, { x, y, w, h, valign: 'top', paraSpaceAfter: 2 });
}

function _addTable(slide, headers, rows, x, y, w, colW) {
  const headerRow = headers.map((h) => ({
    text: h,
    options: {
      bold: true,
      fontSize: 12,
      fontFace: FONT_TITLE,
      color: C.white,
      fill: { color: C.midnight },
      align: 'center',
    },
  }));
  const dataRows = rows.map((row) =>
    row.map((cell) => ({
      text: cell,
      options: { fontSize: 11, fontFace: FONT_BODY, color: C.charcoal },
    })),
  );
  const tableData = [headerRow, ...dataRows];
  slide.addTable(tableData, {
    x,
    y,
    w,
    colW: colW || Array(headers.length).fill(w / headers.length),
    border: { pt: 0.5, color: C.iceBlue },
    rowH: 0.38,
  });
}

/**
 * Add a "stat callout" slide with 2–4 large-number cards.
 */
function addStatSlide(pres, title, stats, note) {
  const slide = pres.addSlide();
  slide.background = { color: C.contentBG };

  // Title bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.85,
    fill: { color: C.midnight },
    line: { color: C.midnight },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0.85,
    w: 10,
    h: 0.04,
    fill: { color: C.azureDeep },
    line: { color: C.azureDeep },
  });
  slide.addText(title, {
    x: 0.35,
    y: 0,
    w: 9.3,
    h: 0.85,
    fontSize: 22,
    fontFace: FONT_TITLE,
    color: C.white,
    bold: true,
    align: 'left',
    valign: 'middle',
    margin: 0,
  });

  const n = stats.length;
  const cardW = n <= 3 ? 2.8 : 2.1;
  const gap = (10 - n * cardW - 0.6) / (n + 1);
  stats.forEach((s, i) => {
    const cx = 0.3 + gap + i * (cardW + gap);
    slide.addShape(pres.shapes.RECTANGLE, {
      x: cx,
      y: 1.15,
      w: cardW,
      h: 3.5,
      fill: { color: C.white },
      shadow: { type: 'outer', color: '000000', blur: 8, offset: 2, angle: 135, opacity: 0.1 },
      line: { color: C.lightGrey, width: 0.5 },
    });
    // Colored top band
    slide.addShape(pres.shapes.RECTANGLE, {
      x: cx,
      y: 1.15,
      w: cardW,
      h: 0.15,
      fill: { color: s.color || C.azureDeep },
      line: { color: s.color || C.azureDeep },
    });
    // Number
    slide.addText(s.value, {
      x: cx,
      y: 1.5,
      w: cardW,
      h: 1.3,
      fontSize: 52,
      fontFace: FONT_TITLE,
      color: s.color || C.azureDeep,
      bold: true,
      align: 'center',
      valign: 'middle',
      margin: 0,
    });
    // Label
    slide.addText(s.label, {
      x: cx + 0.1,
      y: 2.95,
      w: cardW - 0.2,
      h: 0.8,
      fontSize: 13,
      fontFace: FONT_BODY,
      color: C.charcoal,
      bold: true,
      align: 'center',
      valign: 'middle',
    });
    // Sub-label
    if (s.sub) {
      slide.addText(s.sub, {
        x: cx + 0.1,
        y: 3.75,
        w: cardW - 0.2,
        h: 0.65,
        fontSize: 11,
        fontFace: FONT_BODY,
        color: C.captionText,
        italic: true,
        align: 'center',
        valign: 'top',
      });
    }
  });

  if (note) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0,
      y: 5.2,
      w: 10,
      h: 0.42,
      fill: { color: C.lightGrey },
      line: { color: C.lightGrey },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0,
      y: 5.2,
      w: 0.08,
      h: 0.42,
      fill: { color: C.azureMid },
      line: { color: C.azureMid },
    });
    slide.addText('🎓 ' + note, {
      x: 0.15,
      y: 5.2,
      w: 9.7,
      h: 0.42,
      fontSize: 10,
      fontFace: FONT_BODY,
      color: C.charcoal,
      italic: true,
      align: 'left',
      valign: 'middle',
      margin: 0,
    });
  }

  return slide;
}

/**
 * Add a closing/wrap slide.
 */
function addClosingSlide(pres, title, bullets) {
  const slide = pres.addSlide();
  slide.background = { color: C.midnight };

  // Right decorative bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 9.88,
    y: 0,
    w: 0.12,
    h: 5.625,
    fill: { color: C.azureDeep },
    line: { color: C.azureDeep },
  });

  slide.addText('✓  Key Takeaways', {
    x: 0.5,
    y: 0.4,
    w: 9.0,
    h: 0.55,
    fontSize: 14,
    fontFace: FONT_BODY,
    color: C.accentCyan,
    bold: true,
    align: 'left',
  });
  slide.addText(title, {
    x: 0.5,
    y: 1.0,
    w: 9.0,
    h: 1.0,
    fontSize: 30,
    fontFace: FONT_TITLE,
    color: C.white,
    bold: true,
    align: 'left',
  });

  const runs = bullets.map((b, i) => ({
    text: b,
    options: {
      bullet: true,
      breakLine: i < bullets.length - 1,
      fontSize: 15,
      fontFace: FONT_BODY,
      color: C.iceBlue,
    },
  }));
  slide.addText(runs, { x: 0.5, y: 2.1, w: 9.0, h: 2.8, valign: 'top', paraSpaceAfter: 4 });

  // Bottom bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 5.2,
    w: 10,
    h: 0.42,
    fill: { color: C.azureDeep },
    line: { color: C.azureDeep },
  });
  slide.addText('SAP on Microsoft Azure · Advanced Specialization · Train-the-Trainer Microhack', {
    x: 0.35,
    y: 5.2,
    w: 9.3,
    h: 0.42,
    fontSize: 10,
    fontFace: FONT_BODY,
    color: C.white,
    align: 'center',
    valign: 'middle',
    margin: 0,
  });

  return slide;
}

/** Add agenda slide */
function addAgendaSlide(pres, steps) {
  const slide = pres.addSlide();
  slide.background = { color: C.contentBG };

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.85,
    fill: { color: C.midnight },
    line: { color: C.midnight },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0.85,
    w: 10,
    h: 0.04,
    fill: { color: C.azureDeep },
    line: { color: C.azureDeep },
  });
  slide.addText('Lab Steps — Agenda', {
    x: 0.35,
    y: 0,
    w: 9.3,
    h: 0.85,
    fontSize: 22,
    fontFace: FONT_TITLE,
    color: C.white,
    bold: true,
    align: 'left',
    valign: 'middle',
    margin: 0,
  });

  const perCol = Math.ceil(steps.length / 2);
  const col1 = steps.slice(0, perCol);
  const col2 = steps.slice(perCol);

  const renderCol = (items, xStart) => {
    items.forEach((s, i) => {
      const cy = 1.1 + i * 0.88;
      // Number circle
      slide.addShape(pres.shapes.OVAL, {
        x: xStart,
        y: cy + 0.05,
        w: 0.45,
        h: 0.45,
        fill: { color: C.azureDeep },
        line: { color: C.azureDeep },
      });
      slide.addText(String(s.num), {
        x: xStart,
        y: cy + 0.05,
        w: 0.45,
        h: 0.45,
        fontSize: 14,
        fontFace: FONT_TITLE,
        color: C.white,
        bold: true,
        align: 'center',
        valign: 'middle',
        margin: 0,
      });
      // Card BG
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xStart + 0.55,
        y: cy,
        w: 4.05,
        h: 0.65,
        fill: { color: C.white },
        line: { color: C.lightGrey, width: 0.5 },
      });
      slide.addText(s.label, {
        x: xStart + 0.65,
        y: cy,
        w: 3.85,
        h: 0.38,
        fontSize: 13,
        fontFace: FONT_TITLE,
        color: C.charcoal,
        bold: true,
        align: 'left',
        valign: 'middle',
      });
      slide.addText(s.time || '', {
        x: xStart + 0.65,
        y: cy + 0.33,
        w: 3.85,
        h: 0.28,
        fontSize: 10,
        fontFace: FONT_BODY,
        color: C.captionText,
        align: 'left',
        valign: 'middle',
      });
    });
  };

  renderCol(col1, 0.3);
  renderCol(col2, 5.1);

  return slide;
}

/* ═══════════════════════════════════════════════════════════════
   DECK GENERATORS
   ═══════════════════════════════════════════════════════════════ */

// ─── C0 · Environment Setup ───────────────────────────────────
function generateC0() {
  const pres = newPres('C0 · Environment Setup', 'SAP on Azure Module B Lab Environment');
  addTitleSlide(
    pres,
    'C0 · Environment Setup',
    'Lab Environment Setup',
    'SAP on Microsoft Azure · Advanced Specialization Microhack',
    '~45 min',
    '',
  );
  addContentSlide(
    pres,
    'What You Will Set Up',
    [
      { heading: 'Five steps to a ready lab environment:' },
      { spacer: true },
      {
        text: 'GitHub Codespaces  —  devcontainer pre-installs az, bicep, gh, Node 22, Python 3.12',
        bold: false,
      },
      {
        text: 'Azure sign-in  —  az login and select your Owner sandbox subscription',
        bold: false,
      },
      {
        text: 'GitHub Copilot  —  confirm active; load the Module B Lab Coach custom agent',
        bold: false,
      },
      { text: 'MCP servers  —  GitHub MCP + Azure MCP wired up in Copilot Chat', bold: false },
      {
        text: 'Smoke test  —  ask the Lab Coach to confirm your environment is ready',
        bold: false,
      },
    ],
    { note: 'Trainer: allow 5 min for Codespace spin-up before the session starts.' },
  );

  addContentSlide(pres, 'Key Tools at a Glance', null, {
    table: {
      headers: ['Tool', 'Purpose', 'How Loaded'],
      rows: [
        [
          'GitHub Codespaces',
          'Cloud dev environment – no local install needed',
          "Click 'Code → Codespaces'",
        ],
        ['Azure CLI (az)', 'Authenticate and run ARM operations', 'Pre-installed in devcontainer'],
        ['Bicep CLI', 'Compile and validate IaC', 'az bicep install (auto)'],
        ['GitHub Copilot', 'AI coach + skill runner in VS Code Chat', 'Marketplace extension'],
        ['Module B Lab Coach', 'Custom agent for Module B labs', '.github/agents/ auto-loaded'],
        ['GitHub MCP', 'Gives Copilot live repo context', '.mcp.json in devcontainer'],
        ['Azure MCP', 'Gives Copilot live Azure context', '.mcp.json in devcontainer'],
      ],
      colW: [2.0, 3.8, 3.6],
    },
  });

  addAgendaSlide(pres, [
    { num: 1, label: 'Open GitHub Codespace', time: '5 min' },
    { num: 2, label: 'az login → select subscription', time: '5 min' },
    { num: 3, label: 'Load Lab Coach agent', time: '10 min' },
    { num: 4, label: 'Verify MCP servers (GitHub + Azure)', time: '15 min' },
    { num: 5, label: 'Smoke test: @moduleb-lab-coach /help', time: '10 min' },
  ]);

  addContentSlide(
    pres,
    'Important Caveats',
    [
      { heading: 'No real SAP system is installed' },
      {
        text: 'SAP is represented by a simulated landscape + sample data under labs/',
        bold: false,
      },
      {
        text: 'Bicep IaC deploys to your sandbox subscription (lab profile = cheap Dsv5, no M-series quota needed)',
        bold: false,
      },
      { spacer: true },
      { heading: 'MCP Troubleshooting' },
      {
        text: "If MCP servers don't appear in Copilot: reopen the Codespace and reload the window",
        bold: false,
      },
      {
        text: 'GitHub MCP reads live repo context; Azure MCP reads live subscription data',
        bold: false,
      },
      {
        text: 'Both are wired via .devcontainer/.mcp.json — do not modify unless instructed',
        bold: false,
      },
    ],
    { note: "Trainer: confirm MCP servers appear green in Copilot's MCP panel before labs begin." },
  );

  addClosingSlide(pres, 'C0 Complete — Environment Ready', [
    'Codespace running with az, bicep, gh and Node 22 confirmed',
    'Azure subscription authenticated (az account show shows correct sub)',
    'Module B Lab Coach agent loaded and responding to @moduleb-lab-coach /help',
    'GitHub MCP and Azure MCP servers active in Copilot Chat',
    "You're ready to start C1 — SAP on Azure Implementation Capability",
  ]);

  return pres.writeFile({ fileName: path.join(OUT_DIR, 'C0-setup.pptx') });
}

// ─── C1 · B.1.1 Implementation ────────────────────────────────
function generateC1() {
  const pres = newPres(
    'C1 · B.1.1 Implementation Capability',
    'SAP on Azure Advanced Specialization B.1.1',
  );
  addTitleSlide(
    pres,
    'C1 · B.1.1 Implementation Capability',
    'SAP on Azure\nImplementation Capability',
    'Control B.1.1 — Proven deployment experience with M-series, ANF, HSR and ACSS',
    '~75 min',
    'B.1.1',
  );

  addContentSlide(pres, 'Learning Objectives', [
    {
      text: 'Deploy an Azure landing zone for a simulated SAP landscape using Bicep/AVM (lab vs reference sizing)',
      bold: false,
    },
    {
      text: 'Explain the SAP-on-Azure service surface an auditor expects: M/Mv3 VMs, ANF, AZs, ExpressRoute, ACSS, HSR, ASCS/ERS',
      bold: false,
    },
    {
      text: 'Use the Module B Lab Coach (draft-case-study skill) to produce case study, architecture diagram, capability statement',
      bold: false,
    },
    {
      text: 'File evidence using the naming convention  [ControlRef]_[DocumentType]_v[N].pdf',
      bold: false,
    },
  ]);

  addContentSlide(pres, 'B.1.1 — What Auditors Look For', null, {
    table: {
      headers: ['Evidence Type', 'Accepted Artefact', 'File Name'],
      rows: [
        [
          'Customer engagement proof',
          'Case study (anonymised) — customer name, scope, outcome',
          'B11_CaseStudy_v1.pdf',
        ],
        [
          'Technical architecture',
          'Architecture diagram — Azure services, HANA tier, ASCS/ERS, ANF',
          'B11_ArchitectureDiagram_v1.pdf',
        ],
        [
          'Capability statement',
          'Partner narrative mapping practice to specialization requirements',
          'B11_CapabilityStatement_v1.pdf',
        ],
        [
          'Deployment evidence',
          'Portal/CLI screenshots, ARM/Bicep logs, ACSS registration',
          '(included in case study)',
        ],
      ],
      colW: [2.8, 4.4, 2.2],
    },
    note: "Trainer: stress the file naming — auditors often flag files named 'case study final FINAL.pdf'.",
  });

  addContentSlide(
    pres,
    'Reference Architecture — SAP on Azure',
    [
      { heading: 'Key tiers in a B.1.1-compliant deployment:' },
      { spacer: true },
      {
        text: 'HANA Tier (AZ1): Mv3 primary → HSR sync replication → HANA secondary (AZ2)',
        bold: false,
      },
      { text: 'App Tier: 2 × Edsv5 Application Servers across Availability Zones', bold: false },
      { text: 'HA Cluster: ASCS/ERS on Dsv5 × 2, Pacemaker + SBD fencing', bold: false },
      {
        text: 'Shared Storage: Azure NetApp Files — /sapmnt, /usr/trans, hana-log/data (NFS 4.1)',
        bold: false,
      },
      {
        text: 'Connectivity: ExpressRoute (primary) + Azure Firewall + Azure Bastion',
        bold: false,
      },
      {
        text: 'Management: ACSS · Azure Monitor for SAP · Azure Backup for HANA (Backint)',
        bold: false,
      },
    ],
    {
      note: 'Trainer: lab profile uses Dsv5 VMs (no M-series quota), but Bicep code still references Mv3 for evidence narrative.',
    },
  );

  addContentSlide(pres, 'B.1.1 Audit Checklist', null, {
    table: {
      headers: ['Audit Dimension', 'Azure Service(s)', 'Lab Profile'],
      rows: [
        [
          'SAP-certified HANA compute',
          'M-series / Mv2 / Mv3 (HANA TDI certified)',
          'Dsv5 (simulated)',
        ],
        ['HA – HANA tier', 'HSR sync replication across Availability Zones', '✓ in Bicep'],
        ['HA – app/ASCS tier', 'Pacemaker + SBD on Dsv5, ASCS/ERS clustering', '✓ in Bicep'],
        [
          'Shared storage (global FS)',
          'Azure NetApp Files (NFS 4.1, /sapmnt, /usr/trans)',
          '✓ in Bicep',
        ],
        ['Network connectivity', 'ExpressRoute or VPN Gateway + Azure Firewall', '✓ in Bicep'],
        [
          'Management & operations',
          'ACSS, Azure Monitor for SAP, Azure Backup for HANA',
          '✓ in Bicep',
        ],
        ['Security / identity', 'Microsoft Entra ID SAML SSO for Fiori, PIM', '✓ in Bicep'],
      ],
      colW: [3.2, 4.0, 2.2],
    },
  });

  addAgendaSlide(pres, [
    { num: 1, label: 'Validate Bicep landing zone (az bicep build)', time: '10 min' },
    { num: 2, label: 'Map services to B.1.1 audit checklist', time: '10 min' },
    { num: 3, label: 'Load Module B Lab Coach agent', time: '5 min' },
    { num: 4, label: 'draft-case-study: generate case study', time: '15 min' },
    { num: 5, label: 'Generate architecture diagram (Mermaid)', time: '10 min' },
    { num: 6, label: 'Draft capability statement', time: '10 min' },
    { num: 7, label: 'File evidence artefacts + verify', time: '10 min' },
    { num: 8, label: 'Q&A / buffer', time: '5 min' },
  ]);

  addContentSlide(
    pres,
    'Step 1 — Validate the Bicep Landing Zone',
    [
      { heading: 'Compile-check only (no live deployment needed for audit):' },
      { spacer: true },
      { text: 'az bicep build --file infra/main.bicep', bold: true, color: C.azureMid },
      { spacer: true },
      { heading: 'Sizing profiles:' },
      {
        text: 'lab profile  →  sizingProfile=lab, workloadName=sapmh, location=swedencentral  (Dsv5, cheap)',
        bold: false,
      },
      {
        text: 'reference profile  →  sizingProfile=reference  (Mv3, production-grade — not deployed in class)',
        bold: false,
      },
      { spacer: true },
      {
        text: 'Optional what-if: az deployment sub what-if ... (shows what would be created, nothing deployed)',
        small: true,
      },
    ],
    {
      note: "Trainer: if 'bicep not found', run 'az bicep install' first. Skip what-if if quota/permissions issues arise.",
    },
  );

  addContentSlide(
    pres,
    'Steps 4–6 — Copilot Evidence Generation',
    [
      { heading: 'Step 4: Case Study' },
      {
        text: '@moduleb-lab-coach #draft-case-study  →  Partner, Customer (anonymised), scope, outcome, date',
        small: true,
        bold: false,
      },
      { spacer: true },
      { heading: 'Step 5: Architecture Diagram' },
      {
        text: '@moduleb-lab-coach #draft-case-study  →  Ask for Mermaid flowchart: 2 AZs, Mv3, HSR, ASCS/ERS, ANF, ExpressRoute',
        small: true,
        bold: false,
      },
      { spacer: true },
      { heading: 'Step 6: Capability Statement' },
      {
        text: '@moduleb-lab-coach #draft-case-study  →  Partner name, deployments in 24 months, certifications, regions, reference engagement',
        small: true,
        bold: false,
      },
      { spacer: true },
      {
        text: 'Include measurable outcomes: p99 HANA latency, RTO target, go-live date',
        bold: true,
        color: C.accentRed,
      },
    ],
    {
      note: "Trainer: common gap — students forget measurable outcomes. Prompt: 'What p99 latency did HANA achieve?'",
    },
  );

  addContentSlide(pres, 'Step 7 — File the Evidence Artefacts', null, {
    table: {
      headers: ['Artefact', 'File Name', 'Folder'],
      rows: [
        ['Case study', 'B11_CaseStudy_v1.pdf', 'Module B / B1.1 /'],
        ['Architecture diagram', 'B11_ArchitectureDiagram_v1.pdf', 'Module B / B1.1 /'],
        ['Capability statement', 'B11_CapabilityStatement_v1.pdf', 'Module B / B1.1 /'],
      ],
      colW: [3.2, 3.8, 2.4],
    },
    note: 'Convention: [ControlRef]_[DocumentType]_v[N].pdf — increment vN on each revision. No B11_HLD artefact exists for B.1.1.',
  });

  addClosingSlide(pres, 'C1 Complete — B.1.1 Evidence Produced', [
    'az bicep build exits 0 — landing zone Bicep compiles cleanly',
    'Case study (B11_CaseStudy_v1.pdf) includes measurable outcomes',
    'Architecture diagram (B11_ArchitectureDiagram_v1.pdf) shows both AZs',
    'Capability statement (B11_CapabilityStatement_v1.pdf) under 500 words',
    'All three files follow [ControlRef]_[DocumentType]_v[N].pdf convention',
  ]);

  return pres.writeFile({ fileName: path.join(OUT_DIR, 'C1-b11-implementation.pptx') });
}

// ─── C2 · B.4.2 Onboarding & Migration ───────────────────────
function generateC2() {
  const pres = newPres(
    'C2 · B.4.2 Onboarding & Migration',
    'SAP on Azure Advanced Specialization B.4.2',
  );
  addTitleSlide(
    pres,
    'C2 · B.4.2 Onboarding & Migration',
    'Partner Onboarding\n& Migration Methodology',
    'Control B.4.2 — Repeatable methodology with HLD/LLD/Runbook/KT/Hypercare + ACSS registration',
    '~75 min',
    'B.4.2',
  );

  addContentSlide(pres, 'Learning Objectives', [
    {
      text: 'Map SAP Activate phases to the Azure migration workstream and explain which Azure service is introduced at each phase',
      bold: false,
    },
    {
      text: 'Register the simulated landscape with ACSS and enable Azure Monitor for SAP and Azure Backup for SAP HANA',
      bold: false,
    },
    {
      text: 'Use Lab Coach skills (generate-hld, generate-runbook) to produce a repeatable onboarding pack (5 artefacts)',
      bold: false,
    },
    {
      text: 'File the onboarding pack as B.4.2 evidence using the [ControlRef]_[DocumentType]_v[N].pdf convention',
      bold: false,
    },
  ]);

  addContentSlide(pres, 'B.4.2 — What Auditors Look For', null, {
    table: {
      headers: ['Evidence Type', 'Accepted Artefact', 'File Name'],
      rows: [
        [
          'Methodology documentation',
          'HLD + LLD — one per engagement or anonymised template',
          'B42_HLD_v1.pdf / B42_LLD_v1.pdf',
        ],
        [
          'Migration execution artefact',
          'Runbook used during cutover (tested, timestamped steps)',
          'B42_MigrationRunbook_v1.pdf',
        ],
        ['Knowledge transfer', 'KT plan + sign-off / recorded session', 'B42_KTPlan_v1.pdf'],
        [
          'Hypercare / stabilisation',
          'Hypercare plan with SLA, escalation, exit criteria',
          'B42_HypercarePlan_v1.pdf',
        ],
        [
          'ACSS registration',
          'Screenshot/export of ACSS VIS registration',
          'B42_ACSSRegistration_v1.pdf',
        ],
      ],
      colW: [2.8, 4.0, 3.2],
    },
    note: 'Trainer: LLD is a distinct artefact from HLD — students often skip it. It must include concrete IP/sizing numbers.',
  });

  addContentSlide(
    pres,
    'SAP Activate → Azure Phase Map',
    [
      { heading: 'Discover' },
      {
        text: 'Landscape assessment · HANA HSR topology · App server count · Custom code/interfaces · ANF throughput planning',
        small: true,
        bold: false,
      },
      { spacer: true },
      { heading: 'Prepare' },
      {
        text: 'Deploy Bicep (infra/main.bicep) · ExpressRoute/VPN · ACSS pre-registration · RHEL/SLES SAP-certified images',
        small: true,
        bold: false,
      },
      { spacer: true },
      { heading: 'Explore → Realise' },
      {
        text: 'Dev system migration · First ACSS VIS · Azure Monitor for SAP alerts · HANA backup to Recovery Vault · QA+Prod migration · HSR cutover',
        small: true,
        bold: false,
      },
      { spacer: true },
      { heading: 'Deploy → Run' },
      {
        text: 'HSR takeover (< 30 s) · DNS failover · LB health probe check · SAP start · 4-week hypercare · KT sign-off',
        small: true,
        bold: false,
      },
    ],
    {
      note: 'Trainer: pause at Discover (sizing) and Deploy (HSR takeover) — these are where most audit questions arise.',
    },
  );

  addContentSlide(pres, 'B.4.2 — Azure Service Reference Set', null, {
    table: {
      headers: ['Phase', 'Azure Service / Feature', 'Purpose'],
      rows: [
        [
          'Prepare',
          'Azure Center for SAP Solutions (ACSS)',
          'Guided deployment, VIS registration, insights',
        ],
        ['Prepare', 'Azure NetApp Files (NFS 4.1)', '/sapmnt, /usr/trans, HANA log+data volumes'],
        ['Realise', 'Azure Monitor for SAP Solutions', 'HANA, OS, NetWeaver metrics + alerting'],
        [
          'Realise',
          'Azure Backup for SAP HANA (Backint)',
          'Policy-based backups to Recovery Services Vault',
        ],
        ['Deploy', 'AZs + HSR', 'Zero-downtime cutover, RPO ≈ 0'],
        [
          'Deploy',
          'Azure Load Balancer (Standard, HA ports)',
          'ASCS/ERS floating IP, HANA read-scale VIP',
        ],
        ['Run', 'Azure Update Manager + ACSS Insights', 'Patch compliance, CPU/memory trending'],
      ],
      colW: [1.4, 3.8, 4.2],
    },
  });

  addAgendaSlide(pres, [
    { num: 1, label: 'Register with ACSS (portal + CLI)', time: '10 min' },
    { num: 2, label: 'Enable Azure Monitor for SAP Solutions', time: '7 min' },
    { num: 3, label: 'Enable Azure Backup for SAP HANA', time: '8 min' },
    { num: 4, label: 'Generate onboarding pack (5 artefacts)', time: '25 min' },
    { num: 5, label: 'File + rename evidence artefacts', time: '5 min' },
    { num: 6, label: 'Q&A / buffer', time: '10 min' },
  ]);

  addContentSlide(
    pres,
    'Step 1 — Register with ACSS',
    [
      { heading: 'Portal: Azure Center for SAP Solutions → Create → Register Existing SAP System' },
      {
        text: 'SID: S4H · SAP Product: SAP S/4HANA 2023 · Environment: Non-Production',
        bold: false,
      },
      { text: 'Resource group: rg-sapmh-lab  (created in C1)', bold: false },
      { spacer: true },
      { heading: 'CLI equivalent:' },
      {
        text: 'az workloads sap-virtual-instance create --resource-group rg-sapmh-lab --name S4H --location swedencentral --environment NonProd --sap-product S4HANA --central-server-vm-id <vm-id>',
        small: true,
        color: C.azureMid,
        bold: true,
      },
      { spacer: true },
      {
        text: 'Register Microsoft.Workloads provider first if CLI fails: az provider register --namespace Microsoft.Workloads --wait',
        small: true,
      },
    ],
    {
      note: 'Trainer: ACSS not in all regions — Sweden Central, East US, West Europe are safe. Redirect to East US if needed.',
    },
  );

  addContentSlide(
    pres,
    'Step 4 — Generate the Onboarding Pack',
    [
      { heading: 'Five Copilot-generated artefacts:' },
      {
        text: '4a HLD   →  @moduleb-lab-coach #generate-hld  (compute, storage, network, HA/DR, management layers)',
        bold: false,
        small: true,
      },
      {
        text: '4b LLD   →  @moduleb-lab-coach #generate-hld mode:LLD  (VM SKUs, ANF layout, CIDR, LB rules, backup schedule)',
        bold: false,
        small: true,
      },
      {
        text: '4c Runbook  →  @moduleb-lab-coach #generate-runbook type:cutover  (HSR takeover, DNS, go/no-go, rollback)',
        bold: false,
        small: true,
      },
      {
        text: '4d KT Plan  →  @moduleb-lab-coach #generate-runbook type:KT plan  (4 sessions × 2h, topics, recorded sessions)',
        bold: false,
        small: true,
      },
      {
        text: '4e Hypercare →  @moduleb-lab-coach #generate-runbook type:hypercare  (4 weeks, SLA, escalation, exit criteria)',
        bold: false,
        small: true,
      },
    ],
    {
      note: 'Trainer: Lab Coach maintains context — LLD auto-references the HLD. Run prompts sequentially.',
    },
  );

  addClosingSlide(pres, 'C2 Complete — B.4.2 Evidence Produced', [
    'ACSS VIS created (or screenshot) for SID S4H',
    'Azure Monitor for SAP resource created with at least one provider',
    'Recovery Services Vault created with Full+Log backup policy',
    'Six artefacts filed: B42_HLD / B42_LLD / B42_MigrationRunbook / B42_KTPlan / B42_HypercarePlan / B42_ACSSRegistration',
    'Runbook includes go/no-go decision point and rollback procedure',
    'Hypercare plan lists exit criteria',
  ]);

  return pres.writeFile({ fileName: path.join(OUT_DIR, 'C2-b42-onboarding.pptx') });
}

// ─── C3 · B.2.1 ACR Performance ───────────────────────────────
function generateC3() {
  const pres = newPres('C3 · B.2.1 ACR Performance', 'SAP on Azure Advanced Specialization B.2.1');
  addTitleSlide(
    pres,
    'C3 · B.2.1 ACR Performance',
    'Azure Consumed Revenue\n(ACR) Performance',
    'Control B.2.1 — Prove ≥ USD 100K T12M from SAP-eligible services via PAL / DPOR / CSP',
    '~60 min',
    'B.2.1',
  );

  addContentSlide(pres, 'Learning Objectives', [
    {
      text: 'Use the Azure MCP server from Copilot to query trailing-3-month consumption without leaving the IDE',
      bold: false,
    },
    {
      text: 'Identify and isolate SAP-on-Azure-eligible spend and produce an annotated breakdown',
      bold: false,
    },
    {
      text: 'Build a trend table showing monthly SAP-eligible ACR growth toward the B.2.1 threshold',
      bold: false,
    },
    {
      text: 'Set up PAL on a subscription and explain when PAL attribution gaps occur',
      bold: false,
    },
    { text: 'Produce the B21_ACRBreakdown_v1.pdf evidence artefact', bold: false },
  ]);

  addStatSlide(
    pres,
    'B.2.1 — The Numbers That Matter',
    [
      { value: '$100K', label: 'T12M ACR threshold', sub: 'SAP-eligible only', color: C.azureDeep },
      { value: '3', label: 'Attribution types', sub: 'PAL · DPOR · CSP', color: C.azureMid },
      {
        value: '≥8.3K',
        label: 'Monthly run rate',
        sub: 'to meet T12M target',
        color: C.accentGreen,
      },
    ],
    'Trainer: stress that TOTAL subscription ACR ≠ SAP-eligible ACR. M-series VMs and ANF are the biggest eligible spend.',
  );

  addContentSlide(pres, 'SAP-Eligible Service Set', null, {
    table: {
      headers: ['Service', 'Azure Family', 'SAP Role'],
      rows: [
        ['M8ms – M960ixs (M-series)', 'Virtual Machines', 'App server, HANA scale-up'],
        ['Mv2-64ms – Mv2-416ms', 'Virtual Machines', 'Large HANA scale-up / scale-out'],
        ['Mv3-64ms – Mv3-176s', 'Virtual Machines', 'Next-gen HANA certified'],
        ['Azure NetApp Files (ANF)', 'Storage', 'HANA data/log volumes (NFS 4.1)'],
        ['Premium SSD v2 / Ultra Disk', 'Storage', 'HANA persistent storage alternative'],
        ['Azure ExpressRoute', 'Networking', 'SAP-to-on-premises connectivity'],
        [
          'ACSS · Monitor for SAP · Backup for HANA',
          'SAP Management',
          'Managed SAP lifecycle + monitoring',
        ],
      ],
      colW: [3.2, 2.2, 4.0],
    },
    note: 'Trainer: generic Azure spend (App Service, Storage blobs, etc.) does NOT count — only the services above.',
  });

  addContentSlide(
    pres,
    'Attribution Types at a Glance',
    [
      { heading: 'PAL — Partner Admin Link' },
      {
        text: 'Partner user gets Owner/Contributor on subscription and links MPN ID  ·  fastest to set up  ·  gov subs excluded',
        small: true,
        bold: false,
      },
      { spacer: true },
      { heading: 'DPOR — Digital Partner of Record' },
      {
        text: 'Nominated via Azure Marketplace / Cloud Marketplace  ·  usually set by customer or CSP admin  ·  check for 24-month expiry',
        small: true,
        bold: false,
      },
      { spacer: true },
      { heading: 'CSP — Cloud Solution Provider' },
      {
        text: 'Partner is direct CSP reseller for the subscription  ·  counted via Partner Center transaction data',
        small: true,
        bold: false,
      },
      { spacer: true },
      {
        text: 'PAL attribution stops if the linked user/SP loses access → re-link immediately',
        bold: true,
        color: C.accentRed,
      },
    ],
    {
      note: "Trainer: best practice — link PAL via a dedicated 'lighthouse' user account that stays active throughout engagement.",
    },
  );

  addAgendaSlide(pres, [
    { num: 1, label: 'Inspect sample consumption CSV', time: '5 min' },
    { num: 2, label: 'Query live consumption via Azure MCP', time: '10 min' },
    { num: 3, label: 'Annotate SAP-eligible spend (annotate-acr skill)', time: '15 min' },
    { num: 4, label: 'Build monthly ACR trend table', time: '10 min' },
    { num: 5, label: 'Set up PAL on sandbox subscription', time: '5 min' },
    { num: 6, label: 'Verify + package evidence artefact', time: '10 min' },
    { num: 7, label: 'Q&A / buffer', time: '5 min' },
  ]);

  addContentSlide(pres, 'Step 3 — Annotate SAP-Eligible Spend', null, {
    table: {
      headers: ['Service Name', '3-month Cost (USD)', 'SAP Eligible', 'Notes'],
      rows: [
        ['Virtual Machines — M-series', '42,500', '✅ YES', 'HANA certified'],
        ['Azure NetApp Files', '8,200', '✅ YES', 'HANA volumes'],
        ['ExpressRoute', '1,800', '✅ YES', 'Connectivity'],
        ['Azure Backup', '620', '✅ YES', 'Backint'],
        ['App Service', '340', '❌ NO', 'Not SAP-eligible'],
        ['SAP-eligible total', '53,120', '≈ USD 212K annualised', 'Threshold: 100K ✅'],
      ],
      colW: [3.0, 2.2, 1.8, 2.4],
    },
    note: 'Sample data answer key: annualised ≈ USD 212K — comfortably above threshold. Check CSV path if total is below.',
  });

  addContentSlide(
    pres,
    'Step 5 — Set Up PAL',
    [
      { heading: 'Portal method:' },
      {
        text: "portal.azure.com → search 'Partner' → Link to a partner ID → enter MPN ID → Link",
        small: true,
        bold: false,
      },
      { spacer: true },
      { heading: 'CLI method:' },
      {
        text: 'az managementpartner create --partner-id <YOUR_MPN_ID>',
        bold: true,
        color: C.azureMid,
        small: true,
      },
      { text: 'az managementpartner show', bold: true, color: C.azureMid, small: true },
      { spacer: true },
      { text: 'Attribution reflects in Partner Center within 24 hours', bold: false },
      {
        text: 'Sovereign clouds (Azure Gov, China, Germany) do NOT contribute to commercial B.2.1 ACR',
        bold: true,
        color: C.accentRed,
        small: true,
      },
    ],
    {
      note: 'Trainer: 5 min. PAL is per-user per-subscription. If a service principal that held PAL is deleted, ACR stops accruing.',
    },
  );

  addClosingSlide(pres, 'C3 Complete — B.2.1 Evidence Produced', [
    'Annotated consumption table produced — SAP-eligible vs non-eligible clearly split',
    'Monthly trend table shows 3 months of SAP-eligible ACR',
    'Annualised SAP-eligible ACR estimate exceeds USD 100K T12M threshold',
    'az managementpartner show returns MPN ID on sandbox subscription',
    'Evidence file B21_ACRBreakdown_v1.pdf ready for assembly in C6',
  ]);

  return pres.writeFile({ fileName: path.join(OUT_DIR, 'C3-b21-acr.pptx') });
}

// ─── C4 · B.2.2 Customer Diversity ────────────────────────────
function generateC4() {
  const pres = newPres(
    'C4 · B.2.2 Customer Diversity',
    'SAP on Azure Advanced Specialization B.2.2',
  );
  addTitleSlide(
    pres,
    'C4 · B.2.2 Customer Diversity',
    'Customer Diversity\n& Attribution Evidence',
    'Control B.2.2 — Three or more unique SAP customers on Azure, each with valid attribution',
    '~45 min',
    'B.2.2',
  );

  addContentSlide(pres, 'Learning Objectives', [
    {
      text: 'Explain the three attribution types (PAL / DPOR / CSP) and identify which applies to each customer',
      bold: false,
    },
    {
      text: 'Use the build-customer-crossref skill to produce an anonymised customer list and cross-reference table',
      bold: false,
    },
    { text: 'Link each customer to a B.1.1 case study and a B.3.1 skilling holder', bold: false },
    { text: 'Identify and remediate ineligible attribution cases', bold: false },
  ]);

  addStatSlide(
    pres,
    'B.2.2 — The Rule',
    [
      {
        value: '3+',
        label: 'Unique customers',
        sub: 'Distinct Azure tenants or billing subs',
        color: C.azureDeep,
      },
      { value: '3', label: 'Attribution types', sub: 'PAL · DPOR · CSP', color: C.azureMid },
      {
        value: '24',
        label: 'Months check',
        sub: 'DPOR records expire — verify in Partner Center',
        color: C.accentAmber,
      },
    ],
    'Trainer: listing the same tenant three times under different subscription names is NOT three customers.',
  );

  addContentSlide(pres, 'Sample Customer Data — Three Customers', null, {
    table: {
      headers: ['Customer Alias', 'Industry', 'Attribution', 'SAP Systems'],
      rows: [
        ['Contoso Manufacturing', 'Manufacturing', 'PAL', 'ECC 6.0 on Mv2, ANF'],
        ['Fabrikam Retail', 'Retail', 'DPOR', 'S/4HANA Cloud Private Edition on M-series'],
        ['Northwind Finance', 'Financial Services', 'CSP', 'BW/4HANA on Premium SSD v2'],
      ],
      colW: [2.4, 1.8, 1.4, 3.8],
    },
    note: 'Trainer: all three have valid distinct attribution types (PAL, DPOR, CSP) — answer key: all pass B.2.2.',
  });

  addContentSlide(pres, 'Attribution Types Compared', null, {
    table: {
      headers: ['Type', 'Full Name', 'How It Works', 'Notes'],
      rows: [
        [
          'PAL',
          'Partner Admin Link',
          'Partner user gets Owner/Contributor and links MPN ID',
          'Fastest; gov subs excluded',
        ],
        [
          'DPOR',
          'Digital Partner of Record',
          'Nominated in Azure Marketplace / Cloud Marketplace',
          'May expire after 24 months — check Partner Center',
        ],
        [
          'CSP',
          'Cloud Solution Provider',
          'Partner is direct CSP reseller for the subscription',
          'Counted via Partner Center transaction data',
        ],
      ],
      colW: [0.8, 2.4, 3.6, 2.6],
    },
  });

  addAgendaSlide(pres, [
    { num: 1, label: 'Review By-Customer sample data (JSON)', time: '10 min' },
    { num: 2, label: 'Build customer list + cross-reference (skill)', time: '10 min' },
    { num: 3, label: 'Verify attribution eligibility (portal/Partner Center)', time: '10 min' },
    { num: 4, label: 'Cross-reference to B.1.1 case studies', time: '5 min' },
    { num: 5, label: 'Fix ineligible cases (discussion exercise)', time: '5 min' },
    { num: 6, label: 'Q&A / buffer', time: '5 min' },
  ]);

  addContentSlide(
    pres,
    'Step 2 — build-customer-crossref Skill',
    [
      { heading: 'Prompt:' },
      {
        text: '@moduleb-lab-coach Run the build-customer-crossref skill on labs/challenge-4-customer-diversity/sample-data/customers.json',
        small: true,
        bold: false,
        color: C.azureMid,
      },
      { spacer: true },
      { heading: 'Expected output:' },
      {
        text: '1. Anonymised customer list table (alias, industry, attribution type, SAP systems)',
        bold: false,
      },
      {
        text: '2. Cross-reference table linking each customer to their B.1.1 case study ref and B.3.1 skilling holder',
        bold: false,
      },
      { text: '3. Flag for any customers whose attribution may be ineligible', bold: false },
      { spacer: true },
      {
        text: 'Save output to: labs/challenge-4-customer-diversity/evidence/B22_CustomerList_v1.md',
        small: true,
        italic: true,
      },
    ],
    {
      note: "Trainer: in the sample data, all three customers pass. Use Step 5 to explore the 'deleted SP' remediation scenario.",
    },
  );

  addContentSlide(
    pres,
    'Common Pitfalls & Remediation',
    [
      { heading: 'Pitfall: PAL linked via a service principal that was deleted' },
      {
        text: 'Impact: ACR stops accruing at deletion date. B.2.2 attribution count may drop below 3.',
        bold: false,
        color: C.accentRed,
        small: true,
      },
      {
        text: 'Fix: re-link PAL via an active user account → request Partner Center data refresh (24–48 h)',
        bold: false,
        small: true,
      },
      { spacer: true },
      { heading: 'Pitfall: DPOR records older than 24 months' },
      {
        text: 'Check Partner Center → Customers → [name] → Subscriptions for expiry date',
        bold: false,
        small: true,
      },
      { spacer: true },
      { heading: 'Pitfall: Government / sovereign subscriptions' },
      {
        text: 'Azure Government, China, Germany PAL attribution does NOT count toward commercial B.2.2',
        bold: false,
        color: C.accentRed,
        small: true,
      },
    ],
    {
      note: "Trainer: explore the deleted-SP scenario with Copilot: '@moduleb-lab-coach Customer X has PAL via a deleted SP...'",
    },
  );

  addClosingSlide(pres, 'C4 Complete — B.2.2 Evidence Produced', [
    'Three customers identified, each with a distinct attribution type (PAL / DPOR / CSP)',
    'Customer list table produced — anonymised, industry, attribution, SAP systems',
    'Cross-reference table links each customer to a B.1.1 case study ref',
    'No ineligible attribution flags remain unresolved',
    'Evidence file B22_CustomerList_v1.pdf ready for assembly in C6',
  ]);

  return pres.writeFile({ fileName: path.join(OUT_DIR, 'C4-b22-customer-diversity.pptx') });
}

// ─── C5 · B.3.1 Skilling ──────────────────────────────────────
function generateC5() {
  const pres = newPres('C5 · B.3.1 Skilling', 'SAP on Azure Advanced Specialization B.3.1');
  addTitleSlide(
    pres,
    'C5 · B.3.1 Skilling',
    'SAP on Azure Skilling\n& Certification',
    "Control B.3.1 — At least two staff certified via AZ-120 or 'Run SAP on the Microsoft Cloud'",
    '~45 min',
    'B.3.1',
  );

  addContentSlide(pres, 'Learning Objectives', [
    {
      text: "Compare AZ-120 and the 'Run SAP on the Microsoft Cloud' learning path for B.3.1 eligibility",
      bold: false,
    },
    {
      text: 'Use the build-skilling-plan skill to generate a skilling mapping table from a team CSV',
      bold: false,
    },
    {
      text: 'Produce a per-person Microsoft Learn study plan for team members with gaps',
      bold: false,
    },
    {
      text: 'Identify and resolve stale certifications (AZ-120 past its 1-year validity)',
      bold: false,
    },
    { text: 'Produce the B31_SkillingMapping_v1.pdf evidence artefact', bold: false },
  ]);

  addStatSlide(
    pres,
    'B.3.1 — The Rule',
    [
      {
        value: '2+',
        label: 'Individuals required',
        sub: 'AZ-120 or MS Learn path',
        color: C.azureDeep,
      },
      {
        value: '1 yr',
        label: 'AZ-120 validity',
        sub: 'Free online renewal available',
        color: C.accentAmber,
      },
      { value: '~8h', label: 'MS Learn path', sub: 'Free, no expiry', color: C.accentGreen },
    ],
    "Trainer: SAP Basis consultants know SAP — point them to the 'SAP on Azure administration' MS Learn module as fastest path.",
  );

  addContentSlide(pres, 'Route Comparison', null, {
    table: {
      headers: ['', 'AZ-120 Certification', 'Run SAP on the Microsoft Cloud (MS Learn)'],
      rows: [
        ['Depth', 'Full exam certification', 'Self-paced learning path (~8 h)'],
        ['Validity', '1 year (free online renewal)', 'No expiry (badge on completion)'],
        ['Cost', '~USD 165 exam fee', 'Free'],
        ['Audience', 'SAP Basis + Azure admins', 'SAP + Azure newcomers'],
        ['Evidence', 'Cert transcript PDF', 'MS Learn profile export / badge'],
        ['For B.3.1', '✅ Highest credibility', '✅ Accepted, fastest route'],
      ],
      colW: [1.5, 3.8, 4.1],
    },
    note: 'Trainer: both routes are accepted. AZ-120 carries more weight in competitive audit but the learning path is faster.',
  });

  addContentSlide(pres, 'AZ-120 Exam Domains', null, {
    table: {
      headers: ['Domain', 'Weight'],
      rows: [
        ['Plan and deploy SAP workloads on Azure', '20–25%'],
        ['Design and implement storage, networking, and compute', '25–30%'],
        ['Configure SAP HANA, NetWeaver, and S/4HANA', '25–30%'],
        ['Monitor, maintain, and migrate SAP workloads', '15–20%'],
      ],
      colW: [7.0, 2.4],
    },
  });

  addAgendaSlide(pres, [
    { num: 1, label: 'Review team skilling CSV', time: '5 min' },
    { num: 2, label: 'Generate skilling mapping table (skill)', time: '10 min' },
    { num: 3, label: 'Build personal study plan for gap holders', time: '10 min' },
    { num: 4, label: 'Export MS Learn / AZ-120 transcript evidence', time: '10 min' },
    { num: 5, label: 'Validate B.3.1 compliance (Copilot check)', time: '5 min' },
    { num: 6, label: 'Q&A / buffer', time: '5 min' },
  ]);

  addContentSlide(
    pres,
    'Step 2 — build-skilling-plan Skill Output',
    [
      { heading: 'Expected columns in the skilling mapping table:' },
      {
        text: 'Name  ·  Route  ·  Completion Date  ·  Expiry / N/A  ·  Status',
        bold: true,
        small: true,
        color: C.azureMid,
      },
      { spacer: true },
      { heading: 'Status values:' },
      {
        text: 'COMPLIANT  —  valid AZ-120 or completed MS Learn path',
        bold: false,
        color: C.accentGreen,
        small: true,
      },
      {
        text: 'EXPIRING SOON  —  AZ-120 within 6 months of expiry  →  action: free online renewal assessment',
        bold: false,
        color: C.accentAmber,
        small: true,
      },
      {
        text: 'GAP  —  no valid route  →  action: 4-week MS Learn plan',
        bold: false,
        color: C.accentRed,
        small: true,
      },
      { spacer: true },
      { heading: 'Sample data answer key:' },
      {
        text: '2 COMPLIANT (1× AZ-120, 1× learning path)  ·  Frank → GAP (lapsed)  ·  Bob → EXPIRING SOON (< 6 months)',
        small: true,
        bold: false,
      },
    ],
    {
      note: 'Trainer: Copilot flags both GAP and EXPIRING SOON automatically. The free renewal assessment needs no re-exam.',
    },
  );

  addContentSlide(pres, '4-Week Study Plan Template (Gap Holders)', null, {
    table: {
      headers: ['Week', 'Modules', 'Daily Time', 'Milestone'],
      rows: [
        [
          '1',
          'Introduction to SAP on Azure + HANA on Azure',
          '30 min/day',
          'HANA module quiz passed',
        ],
        ['2', 'NetWeaver/S4 + Migration to Azure', '30 min/day', 'Migration module quiz passed'],
        ['3', 'Monitoring and Operations', '30 min/day', 'All modules complete'],
        ['4', 'Review + badge claim', '20 min/day', 'Completion badge issued'],
      ],
      colW: [0.8, 4.2, 1.8, 2.6],
    },
    note: "Study plan is generated by Copilot: '@moduleb-lab-coach For gap holders, produce a 4-week study plan for the MS Learn path.'",
  });

  addClosingSlide(pres, 'C5 Complete — B.3.1 Evidence Produced', [
    'Skilling mapping table produced with all team members',
    'At least two entries marked COMPLIANT (AZ-120 or MS Learn path)',
    'GAP/EXPIRING SOON entries have a recommended action',
    '4-week study plan produced for gap holders',
    'Evidence file B31_SkillingMapping_v1.pdf ready for assembly in C6',
  ]);

  return pres.writeFile({ fileName: path.join(OUT_DIR, 'C5-b31-skilling.pptx') });
}

// ─── C6 · B.4.1 Audit Readiness ───────────────────────────────
function generateC6() {
  const pres = newPres('C6 · B.4.1 Audit Readiness', 'SAP on Azure Advanced Specialization B.4.1');
  addTitleSlide(
    pres,
    'C6 · B.4.1 Audit Readiness',
    'Audit Readiness\n& Evidence Assembly',
    'Control B.4.1 — Assemble, validate, and index the complete Module B evidence pack',
    '~60 min',
    'B.4.1',
  );

  addContentSlide(pres, 'Learning Objectives', [
    {
      text: 'Create the Module B / B[ref] / folder structure and populate from C1–C5 artefacts',
      bold: false,
    },
    {
      text: 'Use the build-evidence-index skill to generate an evidence index with one row per control',
      bold: false,
    },
    { text: 'Validate naming convention and completeness using Copilot', bold: false },
    { text: 'Produce a pre-audit review record and appoint a SPOC', bold: false },
    {
      text: 'Produce B41_EvidenceIndex_v1.pdf and B41_PreAuditReview_v1.pdf artefacts',
      bold: false,
    },
  ]);

  addContentSlide(
    pres,
    'B.4.1 — What Auditors Check First',
    [
      { heading: 'Four validation gates:' },
      { spacer: true },
      {
        text: '1. Every control (B.1.1, B.2.1, B.2.2, B.3.1, B.4.2) has at least one evidence artefact',
        bold: false,
      },
      {
        text: '2. All artefacts use naming convention [ControlRef]_[DocumentType]_v[N].pdf',
        bold: false,
      },
      {
        text: '3. Folder structure follows Module B / B[ref] / — no artefacts in the root',
        bold: false,
      },
      { text: '4. A dated pre-audit review record exists and a SPOC is named', bold: false },
      { spacer: true },
      {
        text: "A file named 'case study final FINAL.pdf' will fail naming validation at gate 2",
        bold: true,
        color: C.accentRed,
      },
    ],
    {
      note: "Trainer: B.4.1 is the auditor's first stop. Copilot's build-evidence-index skill catches naming issues before the auditor does.",
    },
  );

  addContentSlide(pres, 'Required Folder Structure', null, {
    table: {
      headers: ['Folder', 'Artefacts'],
      rows: [
        [
          'Module B / B.1.1 /',
          'B11_CaseStudy_v1.pdf · B11_ArchitectureDiagram_v1.pdf · B11_CapabilityStatement_v1.pdf',
        ],
        ['Module B / B.2.1 /', 'B21_ACRBreakdown_v1.pdf'],
        ['Module B / B.2.2 /', 'B22_CustomerList_v1.pdf'],
        ['Module B / B.3.1 /', 'B31_SkillingMapping_v1.pdf · B31_AZ120Transcript_[Name]_v1.pdf'],
        ['Module B / B.4.1 /', 'B41_EvidenceIndex_v1.pdf · B41_PreAuditReview_v1.pdf'],
        [
          'Module B / B.4.2 /',
          'B42_HLD_v1.pdf · B42_LLD_v1.pdf · B42_MigrationRunbook_v1.pdf · B42_KTPlan_v1.pdf · B42_HypercarePlan_v1.pdf · B42_ACSSRegistration_v1.pdf',
        ],
      ],
      colW: [2.8, 6.6],
    },
  });

  addContentSlide(pres, 'Naming Convention Rules', null, {
    table: {
      headers: ['Part', 'Rule', 'Example'],
      rows: [
        ['[ControlRef]', 'Two-digit control number, no dot', 'B21, B31, B42'],
        ['[DocumentType]', 'PascalCase, no spaces', 'CaseStudy, ACRBreakdown, MigrationRunbook'],
        ['v[N]', 'Version integer, starts at 1', 'v1, v2, v3'],
        ['Extension', '.pdf for submissions', '.pdf'],
      ],
      colW: [2.0, 4.8, 2.6],
    },
    note: 'Convention: [ControlRef]_[DocumentType]_v[N].pdf — there is NO B11_HLD artefact for B.1.1.',
  });

  addAgendaSlide(pres, [
    { num: 1, label: 'Create evidence pack folder structure', time: '5 min' },
    { num: 2, label: 'Copy / create placeholder artefacts from C1–C5', time: '10 min' },
    { num: 3, label: 'Generate evidence index (build-evidence-index skill)', time: '15 min' },
    { num: 4, label: 'Fix naming violations (if any)', time: '5 min' },
    { num: 5, label: 'Produce evidence index document', time: '10 min' },
    { num: 6, label: 'Conduct pre-audit review + appoint SPOC', time: '10 min' },
    { num: 7, label: 'Final completeness check', time: '5 min' },
  ]);

  addContentSlide(pres, 'Step 3 — build-evidence-index Expected Output', null, {
    table: {
      headers: ['Control', 'File', 'Version', 'Status'],
      rows: [
        ['B.1.1', 'B11_CaseStudy_v1.pdf', '1', '✅ VALID'],
        ['B.2.1', 'B21_ACRBreakdown_v1.pdf', '1', '✅ VALID'],
        ['B.2.2', 'B22_CustomerList_v1.pdf', '1', '✅ VALID'],
        ['B.3.1', 'B31_SkillingMapping_v1.pdf', '1', '✅ VALID'],
        ['B.4.2', 'B42_HLD_v1.pdf', '1', '✅ VALID'],
        ['B.4.1', '—', '—', '⚠️ MISSING → generate next'],
      ],
      colW: [1.4, 4.4, 1.2, 2.4],
    },
    note: 'Trainer: MISSING B.4.1 is expected at this point — it gets generated in Steps 5+6. INVALID_NAME is a teaching moment.',
  });

  addContentSlide(
    pres,
    'Step 6 — Pre-Audit Review & SPOC',
    [
      { heading: 'Copilot prompt:' },
      {
        text: '@moduleb-lab-coach Generate a pre-audit review record: date, attendees, SPOC (name/email/phone), review checklist, outcome: READY/NOT READY',
        small: true,
        bold: false,
        color: C.azureMid,
      },
      { spacer: true },
      { heading: 'SPOC responsibilities:' },
      {
        text: 'Primary contact for Microsoft auditor questions about specific artefacts',
        bold: false,
      },
      { text: 'Usually: Practice Lead or designated SAP on Azure technical lead', bold: false },
      { text: 'Must be reachable during the audit window (typically 2–4 weeks)', bold: false },
      { spacer: true },
      { heading: 'Output file:' },
      {
        text: 'Module B / B.4.1 / B41_PreAuditReview_v1.pdf',
        bold: true,
        color: C.azureMid,
        small: true,
      },
    ],
    {
      note: 'Trainer: if time is tight, combine Steps 5+6 — Copilot can produce both documents in a single prompt.',
    },
  );

  addClosingSlide(pres, 'C6 Complete — B.4.1 Evidence Produced', [
    'Folder structure Module B / B[ref] / created with six sub-folders',
    'At least one artefact in each of B.1.1, B.2.1, B.2.2, B.3.1, B.4.1, B.4.2',
    'All files pass naming convention validation [ControlRef]_[DocumentType]_v[N]',
    'B41_EvidenceIndex_v1.pdf generated and saved',
    'B41_PreAuditReview_v1.pdf generated with SPOC named',
    'Module B evidence pack is AUDIT READY 🎉',
  ]);

  return pres.writeFile({ fileName: path.join(OUT_DIR, 'C6-b41-audit-readiness.pptx') });
}

// ─── C7 · Re-delivery Clinic ───────────────────────────────────
function generateC7() {
  const pres = newPres('C7 · Re-delivery Clinic & Wrap', 'Train-the-Trainer Re-delivery');
  addTitleSlide(
    pres,
    'C7 · Re-delivery Clinic & Wrap',
    'Re-delivery Clinic\n& Wrap',
    'Train-the-Trainer — customise, re-deliver, and assess this microhack with your own team',
    '~45 min',
    'TTT',
  );

  addContentSlide(pres, 'Goals of C7', [
    {
      text: 'Each trainee picks one module and delivers its 2-minute talk track to the room',
      bold: false,
    },
    {
      text: 'Group debrief: timing risks, common pitfalls, and customisation for different audiences',
      bold: false,
    },
    {
      text: 'Agree how to fork and customise the repo for your organisation (branding, sample data, region)',
      bold: false,
    },
    { text: 'Wrap: map each lab artefact back to the audit Evidence Tracker', bold: false },
  ]);

  addContentSlide(pres, 'Full Microhack — Day at a Glance', null, {
    table: {
      headers: ['Session', 'Control', 'Topic', 'Time'],
      rows: [
        ['C0', '—', 'Environment Setup (Codespace, az login, Lab Coach)', '45 min'],
        ['C1', 'B.1.1', 'SAP on Azure Implementation Capability', '75 min'],
        ['C2', 'B.4.2', 'Partner Onboarding & Migration Methodology', '75 min'],
        ['—', '—', '☕ Break', '15 min'],
        ['C3', 'B.2.1', 'ACR Performance (SAP-eligible spend)', '60 min'],
        ['C4', 'B.2.2', 'Customer Diversity (PAL/DPOR/CSP)', '45 min'],
        ['C5', 'B.3.1', 'Skilling (AZ-120 / MS Learn)', '45 min'],
        ['C6', 'B.4.1', 'Audit Readiness — Evidence Pack Assembly', '60 min'],
        ['C7', 'TTT', 'Re-delivery Clinic & Wrap', '45 min'],
      ],
      colW: [1.0, 1.0, 5.2, 1.2],
    },
    note: 'Total: ~7h with breaks. Recommend starting at 09:00 for a comfortable finish by 16:30.',
  });

  addContentSlide(
    pres,
    '2-Minute Talk Track Practice',
    [
      { heading: "Exercise: each participant delivers one module's talk track" },
      { spacer: true },
      { text: 'Pick your module from C1–C6', bold: false },
      {
        text: 'You have 2 minutes — cover: control goal, key Azure service, one pitfall, one Copilot skill',
        bold: false,
      },
      { text: 'Group scores on: clarity, accuracy, timing, audience fit', bold: false },
      { spacer: true },
      { heading: 'Debrief questions:' },
      {
        text: 'Which module generated the most questions from your practice audience?',
        bold: false,
      },
      {
        text: 'Where did timing overrun — and what can be cut for a 45-min express delivery?',
        bold: false,
      },
      {
        text: 'What would you customise for a CSP-only audience? A greenfield-only audience?',
        bold: false,
      },
    ],
    {
      note: 'Trainer: time each 2-min talk with a phone timer. Gentle cutoffs reinforce the classroom discipline trainees will need.',
    },
  );

  addContentSlide(
    pres,
    'Customising the Repo for Re-delivery',
    [
      { heading: 'Fork the repo on GitHub' },
      {
        text: 'github.com/NikoMix/microhack-sap-on-azure → Fork → rename for your org',
        bold: false,
        small: true,
      },
      { spacer: true },
      { heading: 'Branding' },
      {
        text: 'Update site/astro.config.mjs: title, logo, socialLinks → rebuild with npm run build',
        bold: false,
        small: true,
      },
      { spacer: true },
      { heading: 'Sample data' },
      {
        text: 'Replace labs/*/sample-data/ CSVs/JSONs with your own anonymised customer data',
        bold: false,
        small: true,
      },
      { spacer: true },
      { heading: 'Region' },
      {
        text: 'Change swedencentral → your target region in infra/params/lab.bicepparam',
        bold: false,
        small: true,
      },
      { spacer: true },
      { heading: 'Agent / skills' },
      {
        text: 'Customise .github/agents/moduleb-lab-coach.md with partner-specific context',
        bold: false,
        small: true,
      },
    ],
    {
      note: 'Trainer: the site rebuilds automatically via GitHub Actions — just push to main and Pages deploys within ~2 min.',
    },
  );

  addContentSlide(pres, 'Evidence Tracker — Full Map', null, {
    table: {
      headers: ['Lab', 'Control', 'Artefact(s) Produced'],
      rows: [
        ['C1', 'B.1.1', 'B11_CaseStudy · B11_ArchitectureDiagram · B11_CapabilityStatement'],
        [
          'C2',
          'B.4.2',
          'B42_HLD · B42_LLD · B42_MigrationRunbook · B42_KTPlan · B42_HypercarePlan · B42_ACSSRegistration',
        ],
        ['C3', 'B.2.1', 'B21_ACRBreakdown'],
        ['C4', 'B.2.2', 'B22_CustomerList'],
        ['C5', 'B.3.1', 'B31_SkillingMapping · B31_AZ120Transcript_[Name]'],
        ['C6', 'B.4.1', 'B41_EvidenceIndex · B41_PreAuditReview'],
      ],
      colW: [0.8, 1.0, 7.6],
    },
    note: 'Convention: [ControlRef]_[DocumentType]_v[N].pdf in Module B / B[ref] / — NO B11_HLD artefact exists.',
  });

  addContentSlide(pres, 'Common Pitfalls — Master List', [
    { heading: 'C0' },
    { text: 'MCP servers not green → reopen Codespace, reload window', small: true, bold: false },
    { heading: 'C1' },
    {
      text: "'az bicep build' fails: az bicep install  ·  live deployment distracts from evidence flow — use what-if only",
      small: true,
      bold: false,
    },
    { heading: 'C2' },
    {
      text: 'ACSS provider reg takes 5–10 min — kick off early  ·  Backint pre-reg script needs real HANA VM OS',
      small: true,
      bold: false,
    },
    { heading: 'C3' },
    {
      text: 'PAL via deleted SP stops ACR  ·  sovereign cloud PAL ≠ commercial ACR  ·  total ACR ≠ SAP-eligible ACR',
      small: true,
      bold: false,
    },
    { heading: 'C4' },
    {
      text: 'DPOR records > 24 months may be stale  ·  same tenant ≠ multiple customers',
      small: true,
      bold: false,
    },
    { heading: 'C5' },
    {
      text: 'AZ-120 past 1-year validity = GAP (free renewal exam available, no re-sit needed)',
      small: true,
      bold: false,
    },
    { heading: 'C6' },
    {
      text: 'Mis-named files fail audit  ·  B.4.1 MISSING is expected before Steps 5+6',
      small: true,
      bold: false,
    },
  ]);

  addClosingSlide(pres, 'Module B Microhack Complete 🎉', [
    'Six Module B controls covered: B.1.1 · B.2.1 · B.2.2 · B.3.1 · B.4.1 · B.4.2',
    '14 evidence artefacts generated using GitHub Copilot custom agents and skills',
    'Evidence pack assembled in Module B / B[ref] / folder structure and validated',
    'Each participant has practised a 2-minute talk track delivery',
    'You can now fork, customise, and re-deliver this microhack for your own teams',
    'SAP on Microsoft Azure Advanced Specialization — Module B: AUDIT READY ✅',
  ]);

  return pres.writeFile({ fileName: path.join(OUT_DIR, 'C7-redelivery-clinic.pptx') });
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════ */

async function main() {
  console.log('Generating SAP on Azure Module B PPTX facilitator decks...\n');
  const decks = [
    { name: 'C0-setup.pptx', fn: generateC0 },
    { name: 'C1-b11-implementation.pptx', fn: generateC1 },
    { name: 'C2-b42-onboarding.pptx', fn: generateC2 },
    { name: 'C3-b21-acr.pptx', fn: generateC3 },
    { name: 'C4-b22-customer-diversity.pptx', fn: generateC4 },
    { name: 'C5-b31-skilling.pptx', fn: generateC5 },
    { name: 'C6-b41-audit-readiness.pptx', fn: generateC6 },
    { name: 'C7-redelivery-clinic.pptx', fn: generateC7 },
  ];

  for (const deck of decks) {
    try {
      await deck.fn();
      console.log(`  ✅  ${deck.name}`);
    } catch (err) {
      console.error(`  ❌  ${deck.name}  —  ${err.message}`);
      process.exit(1);
    }
  }

  console.log(`\nAll ${decks.length} decks written to:  ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
