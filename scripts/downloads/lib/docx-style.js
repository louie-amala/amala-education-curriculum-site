/* Shared docx house style for the Learning Bridge+ (Cox's Bazar) offline pack.
   ONE source of truth: the component generators (generate-rp.js, generate-ail.js, generate-docx.js)
   and the one-stop Educator Guide all render through these helpers, so a change to the house style
   lands everywhere at once and the standalone downloads can never drift from the combined guide.

   The style itself was designed and proved on the Research Project pack (August 2026) and moved here
   afterwards. Its four constraints are documented on the HOUSE STYLE block below; read that before
   changing any measurement, because most of the numbers are answering published guidance rather than
   taste. */
const fs = require('fs');
const path = require('path');
const {
  Document, Paragraph, TextRun, AlignmentType, ImageRun, Footer, PageNumber, TableOfContents,
  Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak, HeadingLevel,
  TabStopType, LeaderType,
} = require('docx');

// Brand assets live in the repo so every generated document is reproducible from source.
const BRAND = path.resolve(__dirname, '..', '..', '..', 'public', 'brand');
const LOGO = path.join(BRAND, 'amala-logo.png');
const icon = (name) => path.join(BRAND, 'icons', `${name}.png`);
const imgRun = (file, width, height) => new ImageRun({ data: fs.readFileSync(file), type: 'png', transformation: { width, height } });
const image = (file, width, height, opts = {}) => new Paragraph({
  children: [imgRun(file, width, height)],
  alignment: opts.align,
  spacing: { before: opts.before || 0, after: opts.after == null ? 140 : opts.after },
});
const iconLine = (name, text, opts = {}) => new Paragraph({
  children: [imgRun(icon(name), opts.px || 26, opts.px || 26), new TextRun({ text: '  ' + text, size: opts.size || 22, bold: opts.bold, color: opts.color })],
  spacing: { before: opts.before || 0, after: opts.after == null ? 80 : opts.after },
});

// ============================================================ HOUSE STYLE
// Rebuilt (August 2026) for readability and print cost. Four constraints shaped every choice:
//   1. ACCESSIBLE PRINT. Emergent readers, reading a second script. British Dyslexia Association
//      style guide: 12-14pt body, ~1.5 line spacing, 60-70 characters a line, left-aligned, and NO
//      italics or underlining (they make text run together) - emphasis is bold. Headings at least
//      20% larger than body.
//   2. CHEAP TO PRINT. Every page is paper and toner, and the learner book is printed once PER
//      LEARNER. So: A4 (not US Letter - nobody in Cox's Bazar prints Letter), designed for a mono
//      laser and double-sided, no large filled panels (a tint over a page costs real toner - a rule
//      costs almost none), no images, and nothing that only works in colour.
//   3. GREYSCALE-SAFE. The brand colours survive for anyone who prints in colour, but no distinction
//      EVER depends on hue: page types are told apart by size, weight, rule and position, because
//      plum and olive are the same grey on a mono printer.
//   4. NAVIGABLE. A fixed page architecture - locator strip, title, purpose line - so a facilitator
//      or learner can find a page by flicking, plus a contents list Word fills with real page numbers.
const NAVY = '1F3A5F', PLUM = '7A3B69', GREY = '5A6473', OLIVE = '6E7A2E', LINE = 'B9B3A6', RULE = '9A9384';

// ---- page ----
// A4 with 2.5cm side margins: a 6.3in text column, ~70 characters at 12pt. Mirrored via `gutter` so
// the pack can be printed double-sided and bound without swallowing the inside edge.
const PAGE = {
  size: { width: 11906, height: 16838 },
  margin: { top: 1134, right: 1418, bottom: 1021, left: 1418, header: 624, footer: 510 },
};
const COL = 11906 - 1418 - 1418; // 9070 twips of text column
// Existing tables were laid out against a 10800 column. Rescale any width array to the real column
// so declared widths and the printed page finally agree.
const scaleW = (ws) => { const t = ws.reduce((x, y) => x + y, 0); return ws.map((w) => Math.floor((w / t) * COL)); };

// ---- type scale (half-points: 24 = 12pt) ----
const NOTES_LINES = 22;  // lines in a full-page notes area - tuned so it fills one A4 sheet exactly
const BOOK = 24;   // learner workbook body - BDA's 12pt floor
const GUIDE = 22;  // facilitator reference body - 11pt, an adult reading a manual, not a learner
const LEAD_BOOK = 340;   // ~1.4 line spacing. 1.5 reads best; 1.4 buys back a page in eight.
const LEAD_GUIDE = 300;  // ~1.25

const plain = (s) => String(s == null ? '' : s)
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1');
const toParas = (s) => plain(s).trim().split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);

// NOTE ON ITALICS: opts.italics is accepted but deliberately ignored - the BDA guidance is explicit
// that italics make text run together for the readers this pack is for. Callers asking for emphasis
// get bold instead, so no call site had to change to get the accessibility win.
const P = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text: plain(text), size: opts.size || GUIDE, bold: opts.bold || opts.italics, color: opts.color })],
  spacing: { after: opts.after == null ? 140 : opts.after, before: opts.before || 0, line: opts.line || LEAD_GUIDE },
  alignment: opts.align, border: opts.border, keepNext: opts.keepNext,
});
const runs = (arr) => new Paragraph({ children: arr, spacing: { after: 140, line: LEAD_GUIDE } });
const body = (s) => toParas(s).map((t) => P(t, { after: 140 }));
const bullet = (text, level = 0, size) => new Paragraph({
  children: [new TextRun({ text: plain(text), size: size || GUIDE })],
  bullet: { level }, spacing: { after: 80, line: LEAD_GUIDE },
});
const label = (lab, text) => new Paragraph({
  children: [new TextRun({ text: lab + ' ', bold: true, size: GUIDE, color: PLUM }), new TextRun({ text: plain(text), size: GUIDE })],
  spacing: { after: 140, line: LEAD_GUIDE },
});
// ---- outline levels ----
// A heading carries two separate things: how big it LOOKS, and how deep it sits in the document
// outline (which is what a contents page is built from). Inside the one-stop Educator Guide the
// component packs are nested one level down - a component's phase is a section of a Part, not a peer
// of it - but it should still look the same as it does in the standalone download. So the shift moves
// the outline level only; sizes never change.
let HEADING_SHIFT = 0;
const setHeadingShift = (n) => { HEADING_SHIFT = n || 0; };
const OUTLINE = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5];
const lvl = (base) => OUTLINE[Math.min(base - 1 + HEADING_SHIFT, OUTLINE.length - 1)];

// Headings: each step is >=20% larger than the one below, so the hierarchy survives greyscale.
const H1 = (t) => new Paragraph({ heading: lvl(1), spacing: { before: 320, after: 140 }, keepNext: true,
  children: [new TextRun({ text: plain(t), bold: true, size: 36, color: NAVY })] });
const H2 = (t, br) => new Paragraph({ heading: lvl(2), spacing: { before: 280, after: 100 }, keepNext: true, pageBreakBefore: !!br,
  children: [new TextRun({ text: plain(t), bold: true, size: 28, color: PLUM })] });
const H3 = (t) => new Paragraph({ heading: lvl(3), spacing: { before: 220, after: 80 }, keepNext: true,
  children: [new TextRun({ text: plain(t), bold: true, size: 24, color: NAVY })] });
// A small labelled lead-in. Was bold + italic; now bold + letterspaced small caps, which stays legible.
const mini = (t) => new Paragraph({
  children: [new TextRun({ text: plain(t).toUpperCase(), bold: true, size: 17, color: OLIVE, characterSpacing: 24 })],
  spacing: { before: 180, after: 60 }, keepNext: true,
});
const hr = () => new Paragraph({ text: '', border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE } }, spacing: { before: 60, after: 180 } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// ---- table chrome ----
// Default docx tables draw a full black grid: heavy on the eye and on toner. Everything here is
// either borderless or a single hairline.
const NO_BORDERS = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } };
const HAIRLINE = { top: { style: BorderStyle.SINGLE, size: 2, color: LINE }, bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE }, left: { style: BorderStyle.SINGLE, size: 2, color: LINE }, right: { style: BorderStyle.SINGLE, size: 2, color: LINE }, insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: LINE }, insideVertical: { style: BorderStyle.SINGLE, size: 2, color: LINE } };
// An accent bar down the left edge - the cheap-to-print replacement for a filled panel.
const accentLeft = (color) => Object.assign({}, NO_BORDERS, { left: { style: BorderStyle.SINGLE, size: 18, color } });




// minimal markdown -> docx blocks (headings, bullets, paragraphs) for resource content
// ---- CAPTURE CONTROLS AND PAGE FURNITURE ----------------------------------
// The workbook must scaffold a pre-literate learner who is alone with the page (facilitator stepped
// back, or a session missed). So every page carries a persistent model and a structure to fill IN
// PLACE - a worked example, sentence stems on a line, labelled slots, sort-mats, checklists - never a
// bare "draw here" box. Literacy-free: draw/mark, or say it and the teacher scribes.

// A standing line, so no learner is stuck because they cannot write.
// The standing "you may draw or speak your answer" reminder. It used to be reprinted, in italics, on
// every page: two lines of toner x ~30 pages, and italics is the one thing BDA says not to do. It now
// lives once on the opening page and permanently in the page footer, so it costs nothing per page.
const scribe = () => null;

// "Like this:" - a shaded worked example that persists as a model (shaded so it does not read as a
// place to write). Lines are short and concrete; parenthesised bits are drawing cues.
const example = (lines, labelText) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [COL], borders: accentLeft(OLIVE),
  rows: [new TableRow({ children: [new TableCell({
    width: { size: COL, type: WidthType.DXA },
    margins: { top: 100, bottom: 100, left: 200, right: 120 },
    children: [
      new Paragraph({ children: [new TextRun({ text: String(labelText || 'Like this').toUpperCase(), bold: true, size: 17, color: OLIVE, characterSpacing: 24 })], spacing: { after: 80 } }),
      ...lines.map((l) => new Paragraph({ children: [new TextRun({ text: l, size: 21, color: '3F4A34' })], spacing: { after: 60, line: 280 } })),
    ],
  })] })],
});

// A shaded note box with its own label - the sibling of example(), for the teaching pages
// ("New words", "Try it first"). Shaded so it does not read as a place to write.
const noteBox = (labelText, lines) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [COL], borders: accentLeft(NAVY),
  rows: [new TableRow({ children: [new TableCell({
    width: { size: COL, type: WidthType.DXA },
    margins: { top: 100, bottom: 100, left: 200, right: 120 },
    children: [
      new Paragraph({ children: [new TextRun({ text: plain(labelText).replace(/:$/, '').toUpperCase(), bold: true, size: 17, color: NAVY, characterSpacing: 24 })], spacing: { after: 80 } }),
      ...lines.map((l) => new Paragraph({ children: [new TextRun({ text: l, size: 21 })], spacing: { after: 60, line: 280 } })),
    ],
  })] })],
});

// An authored activity visual (spec type "zones"), rendered FILLED for the facilitator guide - the
// same diagram the site shows, so a facilitator working from paper sees the sort mat and the finished
// output rather than a description of them. Only "zones" is rendered; other spec types are skipped.
const visualTable = (v) => {
  const out = [];
  const zs = v.spec && v.spec.type === 'zones' ? v.spec.zones || [] : null;
  if (!zs || !zs.length) return out;
  out.push(mini(`${v.kind === 'setup' ? 'How to set it up' : 'What it looks like when it is working'} - ${v.title}`));
  if (v.caption) out.push(P(toParas(v.caption).join(' '), { size: 20, color: GREY, italics: true, after: 80 }));
  const w = Math.floor(COL / zs.length);
  out.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: zs.map(() => w), rows: [
    new TableRow({ children: zs.map((z) => new TableCell({ width: { size: w, type: WidthType.DXA }, shading: { fill: 'F1EEE6' }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [
      new Paragraph({ children: [new TextRun({ text: z.label, bold: true, size: 18, color: NAVY })] }),
      ...(z.sublabel ? [new Paragraph({ children: [new TextRun({ text: z.sublabel, size: 15, color: GREY })] })] : []),
    ] })) }),
    new TableRow({ children: zs.map((z) => new TableCell({ width: { size: w, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: (z.cards && z.cards.length ? z.cards : ['']).map((cd) => new Paragraph({ children: [new TextRun({ text: cd ? '\u2022  ' + cd : '', size: 18 })], spacing: { after: 40 } })) })) }),
  ] }));
  return out;
};

// A sentence stem with a writing line: "Before, ______".
// A writing line. Was a typed run of underscores that never reached the margin and wrapped on long
// labels. Now a right tab stop with an underscore leader: one clean rule to the exact column edge,
// with room above it to actually write.
const stem = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text: plain(text) + '  ', size: opts.size || BOOK, bold: true, color: NAVY }), new TextRun({ text: '\t' })],
  tabStops: [{ type: TabStopType.RIGHT, position: COL, leader: LeaderType.UNDERSCORE }],
  spacing: { before: opts.before == null ? 100 : opts.before, after: opts.after == null ? 240 : opts.after, line: 300 },
});
// The lined area itself, without a label - so the same control can be a two-line answer slot or a
// whole page of open space.
const linedArea = (nLines) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [COL],
  // the box edge reads stronger than the guide rules inside it, so the box is the shape you see
  // first and the lines are a help rather than an instruction
  borders: {
    top: { style: BorderStyle.SINGLE, size: 6, color: LINE },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE },
    left: { style: BorderStyle.SINGLE, size: 6, color: LINE },
    right: { style: BorderStyle.SINGLE, size: 6, color: LINE },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E2DED3' },
    insideVertical: { style: BorderStyle.NONE },
  },
  rows: Array.from({ length: nLines }, () => new TableRow({
    height: { value: 460, rule: 'atLeast' },
    children: [new TableCell({
      width: { size: COL, type: WidthType.DXA }, margins: { top: 40, bottom: 40, left: 140, right: 140 },
      children: [new Paragraph({ text: '', spacing: { after: 0 } })],
    })],
  })),
});

// A WRITE BOX: an open area with feint lines inside it. The default capture control for anything a
// learner might answer with a drawing - which, in a cohort largely not yet literate, is most things.
// A bare ruled line silently says "write words, on a line"; an empty box gives no help to someone who
// IS writing in a second script. The feint lines do both: draw straight across them, or write on them.
// Reserve stem() (a single ruled line) for genuinely short factual answers - a count, a place, a name.
const writeBox = (labelText, nLines = 2) => [
  new Paragraph({
    children: [new TextRun({ text: plain(labelText), size: BOOK, bold: true, color: NAVY })],
    spacing: { before: 220, after: 60 }, keepNext: true,
  }),
  linedArea(nLines),
];

// An extra blank ruled line, for answers that need more than one.
const ruled = (n = 1) => Array.from({ length: n }, () => new Paragraph({
  children: [new TextRun({ text: '\t' })],
  tabStops: [{ type: TabStopType.RIGHT, position: COL, leader: LeaderType.UNDERSCORE }],
  spacing: { after: 240, line: 300 },
}));

// Choices to circle (literacy-light decision aid): "( ) poster  ( ) talk  ( ) role-play".
const choices = (label, options) => new Paragraph({ children: [
  ...(label ? [new TextRun({ text: label + '   ', bold: true, size: BOOK })] : []),
  ...options.flatMap((o) => [new TextRun({ text: '○  ', size: BOOK, color: PLUM }), new TextRun({ text: o + '     ', size: BOOK })]),
], spacing: { after: 160, line: 300 } });

// A tick-box line for a checklist / captured tool.
const check = (text) => new Paragraph({ children: [
  new TextRun({ text: '□   ', size: BOOK, color: PLUM }), new TextRun({ text: plain(text), size: BOOK }),
], spacing: { after: 120, line: 300 } });

// A labelled slot to fill IN PLACE (a titled box tall enough to draw or write in).
// A slot is a write box that carries its own label INSIDE the top of the box - for pages that repeat
// the same shape several times and cannot afford a label line above each one. Same feint rules.
const gap = (h = 90) => new Paragraph({ children: [new TextRun({ text: '', size: 8 })], spacing: { after: h } });
const slot = (labelText, nLines = 2) => [gap(), slotTable(labelText, nLines)];
const slotTable = (labelText, nLines = 2) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [COL],
  borders: {
    top: { style: BorderStyle.SINGLE, size: 6, color: LINE },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE },
    left: { style: BorderStyle.SINGLE, size: 6, color: LINE },
    right: { style: BorderStyle.SINGLE, size: 6, color: LINE },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E2DED3' },
    insideVertical: { style: BorderStyle.NONE },
  },
  rows: [
    new TableRow({ children: [new TableCell({
      width: { size: COL, type: WidthType.DXA }, margins: { top: 70, bottom: 20, left: 140, right: 140 },
      children: [new Paragraph({ children: [new TextRun({ text: plain(labelText), size: 18, bold: true, color: PLUM })], spacing: { line: 260, after: 0 } })],
    })] }),
    ...Array.from({ length: nLines }, () => new TableRow({
      height: { value: 460, rule: 'atLeast' },
      children: [new TableCell({
        width: { size: COL, type: WidthType.DXA }, margins: { top: 40, bottom: 40, left: 140, right: 140 },
        children: [new Paragraph({ text: '', spacing: { after: 0 } })],
      })],
    })),
  ],
});

// An open capture area, sized in twips for callers that think in heights. Every one of these carries
// the same feint guide lines as a write box: an unlined box quietly says "draw", and we do not mean
// that - a learner may draw OR write in any of them, and one who is writing in a second script needs
// the baseline. Drawing across a feint line costs nothing.
const box = (h, labelText) => {
  const n = Math.max(1, Math.round(h / 460));
  return labelText ? slotTable(labelText, n) : linedArea(n);
};


// A sort-mat: labelled columns (shaded header), each a tall cell to fill.
const zones = (labels, h = 2600) => {
  const w = Math.floor(COL / labels.length);
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: labels.map(() => w), borders: HAIRLINE, rows: [
    new TableRow({ children: labels.map((l) => new TableCell({ width: { size: w, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: l, bold: true, size: 19, color: NAVY })], spacing: { line: 260 } })] })) }),
    new TableRow({ height: { value: h, rule: 'atLeast' }, children: labels.map(() => new TableCell({ width: { size: w, type: WidthType.DXA }, children: [new Paragraph('')] })) }),
  ] });
};

// A tally mat: the learner writes or draws the answers people can choose into the column headers, then
// puts one mark per person underneath. The columns are the ANSWERS to our question, not a fixed mood
// scale - a survey can only be counted if the marks stand for the choices the question actually offers.
const tallyMat = (n = 3, hRaw = 3000) => {
  const h = hRaw;
  const w = Math.floor(COL / n);
  const cols = Array.from({ length: n }, (_, i) => i);
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: cols.map(() => w), borders: HAIRLINE, rows: [
    new TableRow({ height: { value: 900, rule: 'atLeast' }, children: cols.map((i) => new TableCell({ width: { size: w, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [
      new Paragraph({ children: [new TextRun({ text: `Answer ${i + 1}`, bold: true, size: 19, color: NAVY })], spacing: { after: 40 } }),
      new Paragraph({ children: [new TextRun({ text: 'write it, or draw it', size: 16, color: GREY })] }),
    ] })) }),
    new TableRow({ height: { value: h, rule: 'atLeast' }, children: cols.map(() => new TableCell({ width: { size: w, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [
      new Paragraph({ children: [new TextRun({ text: 'one mark for each person', size: 15, color: LINE })] }),
    ] })) }),
  ] });
};

// A grid page (evidence log / gathering record) with a filled worked example row.
const grid = (cols, colW, exampleRow, nRows) => {
  const W = scaleW(colW);
  const head = new TableRow({ tableHeader: true, children: cols.map((t, i) => new TableCell({ width: { size: W[i], type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 19, color: NAVY })], spacing: { line: 260 } })] })) });
  const ex = new TableRow({ children: exampleRow.map((t, i) => new TableCell({ width: { size: W[i], type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: (i === 0 ? 'Like this:  ' : '') + t, size: 17, color: '3F4A34' })], spacing: { line: 260 } })] })) });
  const rows = [head, ex];
  for (let r = 0; r < nRows; r++) rows.push(new TableRow({ height: { value: 1000, rule: 'atLeast' }, children: cols.map((_, i) => new TableCell({ width: { size: W[i], type: WidthType.DXA }, children: [new Paragraph('')] })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: W, borders: HAIRLINE, rows });
};

// A whole page of open, lined space after every activity. The scaffolded pages ask for particular
// things in particular slots - which is what makes them usable alone, but it also means there is
// nowhere to put anything the page did not ask for: a drawing that explains it better, a word worth
// remembering, something an elder said that fits no box. This is that place. Deliberately unlabelled:
// nothing here is asked for, so nothing here can be wrong.
const notesPage = (activityTitle, br = true) => [
  eyebrow(activityTitle, br),
  title('My notes and drawings'),
  P('Anything you want to keep from this step. Words, marks, or a drawing - it is your page, and no one marks it.', { size: BOOK, line: 300, after: 160 }),
  linedArea(NOTES_LINES),
];


const eyebrow = (t, br) => new Paragraph({
  pageBreakBefore: !!br,
  children: [new TextRun({ text: plain(t).toUpperCase(), bold: true, size: 16, color: PLUM, characterSpacing: 30 })],
  spacing: { after: 60 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
  keepNext: true,
});
// A locator strip with a page-TYPE chip on the left. The chip is reversed (light text on a solid
// block) so the two kinds of page are told apart at a glance, at arm's length, without reading the
// words and without depending on colour - a solid block and an empty one look different in greyscale
// and to someone who cannot yet read either label.
const eyebrowChip = (chip, t, br) => new Paragraph({
  pageBreakBefore: !!br,
  children: [
    new TextRun({ text: `  ${chip.toUpperCase()}  `, bold: true, size: 16, color: 'FFFFFF', characterSpacing: 30, shading: { type: 'clear', fill: PLUM } }),
    new TextRun({ text: `   ${plain(t).toUpperCase()}`, bold: true, size: 16, color: PLUM, characterSpacing: 30 }),
  ],
  spacing: { after: 60 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
  keepNext: true,
});
// The part heading that opens each phase in the learner book. HEADING_1, so it is what the contents
// page lists - the contents stays one short page of parts instead of thirty page titles.
const partHead = (n, t, br) => new Paragraph({
  heading: lvl(1), keepNext: true, pageBreakBefore: !!br,
  children: [
    new TextRun({ text: `Part ${n}   `, bold: true, size: 26, color: PLUM, characterSpacing: 20 }),
    new TextRun({ text: plain(t), bold: true, size: 34, color: NAVY }),
  ],
  spacing: { before: 0, after: 200 },
});
const title = (t) => new Paragraph({
  heading: lvl(2), keepNext: true,
  children: [new TextRun({ text: plain(t), bold: true, size: 38, color: NAVY })],
  spacing: { before: 160, after: 180 },
});
// Labels above a box or a mat. `before` matters: a label sitting flush under the previous box reads
// as the caption of that box rather than the heading of the next one.
const bold = (t, o = {}) => P(t, Object.assign({ bold: true, size: BOOK, line: 300, before: 200, after: 100 }, o));

// The four sub-questions of our given research question, in the short form learners see on the wall.
// ---- markdown -> docx ------------------------------------------------------
// `size` renders the same markdown at learner size in a workbook and at reference size in a guide.
function mdTable(rowsRaw) {
  const cells = rowsRaw.map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  const kept = cells.filter((r) => !r.every((c) => c === '' || /^:?-+:?$/.test(c)));
  const nCols = Math.max(...kept.map((r) => r.length));
  const colW = Math.floor(COL / nCols);
  const trs = kept.map((r, ri) => new TableRow({ children: Array.from({ length: nCols }, (_, ci) => new TableCell({
    width: { size: colW, type: WidthType.DXA }, margins: { top: 70, bottom: 70, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: r[ci] || '', bold: ri === 0, size: 19, color: ri === 0 ? NAVY : undefined })], spacing: { line: 260 } })],
  })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: Array(nCols).fill(colW), borders: HAIRLINE, rows: trs });
}
function mdBlocks(md, size) {
  const out = [];
  const lines = String(md || '').replace(/\r/g, '').split('\n');
  let i = 0; let para = [];
  const flush = () => { if (para.length) { out.push(P(para.join(' '), { size: size || GUIDE, line: size ? 320 : LEAD_GUIDE })); para = []; } };
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === '') { flush(); i++; continue; }
    if (t.startsWith('### ')) { flush(); out.push(H3(t.slice(4))); i++; continue; }
    if (t.startsWith('## ')) { flush(); out.push(H2(t.slice(3))); i++; continue; }
    if (t.startsWith('# ')) { flush(); out.push(H1(t.slice(2))); i++; continue; }
    if (t.startsWith('- ')) { flush(); while (i < lines.length && lines[i].trim().startsWith('- ')) { out.push(bullet(lines[i].trim().slice(2), 0, size || GUIDE)); i++; } continue; }
    if (t.startsWith('|')) { flush(); const rws = []; while (i < lines.length && lines[i].trim().startsWith('|')) { rws.push(lines[i].trim()); i++; } out.push(mdTable(rws)); continue; }
    para.push(t); i++;
  }
  flush();
  return out;
}

// ---- reference furniture ---------------------------------------------------
const numbered = (text, ref) => new Paragraph({ children: [new TextRun({ text: plain(text), size: GUIDE })], numbering: { reference: ref, level: 0 }, spacing: { after: 80, line: LEAD_GUIDE } });
const writeLine = (before = 240) => new Paragraph({
  children: [new TextRun({ text: '\t' })],
  tabStops: [{ type: TabStopType.RIGHT, position: COL, leader: LeaderType.UNDERSCORE }],
  spacing: { before, after: 200, line: 300 },
});

const gridBoxes = (cols, rows, cellH, cellLabel) => {
  const colW = Math.floor(COL / cols);
  const trs = [];
  for (let r = 0; r < rows; r++) {
    trs.push(new TableRow({ height: { value: cellH, rule: 'atLeast' }, children: Array.from({ length: cols }, () => new TableCell({
      width: { size: colW, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [cellLabel ? new Paragraph({ children: [new TextRun({ text: cellLabel, size: 16, color: LINE })] }) : new Paragraph('')],
    })) }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: Array(cols).fill(colW), borders: HAIRLINE, rows: trs });
};

// A reference table with a header row and explicit column widths (rescaled to the real text column).
function refTable(header, rows, widths) {
  const colW = scaleW(widths || Array(header.length).fill(Math.floor(COL / header.length)));
  const cell = (content, i, isHead) => {
    const o = typeof content === 'object' && content !== null ? content : { text: String(content) };
    const lines = o.lines || String(o.text == null ? '' : o.text).split('\n');
    return new TableCell({
      width: { size: colW[i], type: WidthType.DXA },
      margins: { top: 70, bottom: 70, left: 130, right: 130 },
      children: lines.map((l) => new Paragraph({ spacing: { line: 260 }, children: [new TextRun({
        text: l,
        bold: isHead || o.bold || (!isHead && i === 0 && o.bold !== false),
        size: o.size || 19,
        color: isHead ? NAVY : (o.color || (i === 0 ? PLUM : undefined)),
      })] })),
    });
  };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: colW, borders: HAIRLINE,
    rows: [
      new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, i, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, i, false)) })),
    ],
  });
}
const twoCol = (header, rows) => refTable(header, rows, [3200, 7600]);

// A callout: an accent bar and no fill, so it costs a rule rather than a page of toner.
const callout = (heading, lines, color = PLUM) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [COL], borders: accentLeft(color),
  rows: [new TableRow({ children: [new TableCell({
    width: { size: COL, type: WidthType.DXA },
    margins: { top: 120, bottom: 120, left: 200, right: 140 },
    children: [
      new Paragraph({ children: [new TextRun({ text: plain(heading).toUpperCase(), bold: true, size: 17, color, characterSpacing: 24 })], spacing: { after: lines.length ? 90 : 0 } }),
      ...lines.map((l, i) => P(l, { size: 21, after: i === lines.length - 1 ? 0 : 90 })),
    ],
  })] })],
});

// ---- document shell --------------------------------------------------------
const NUMBERING = {
  config: ['setup', 'rhythm', 'evidence', 'print', 'steps'].map((reference) => ({
    reference,
    levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 460, hanging: 260 } } } }],
  })),
};

const pageFooter = (text) => new Footer({ children: [new Paragraph({
  tabStops: [{ type: TabStopType.RIGHT, position: COL }],
  border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE } },
  spacing: { before: 60 },
  children: [
    new TextRun({ text, size: 15, color: GREY }),
    new TextRun({ text: '\t' }),
    new TextRun({ text: 'page ', size: 15, color: GREY }),
    new TextRun({ children: [PageNumber.CURRENT], size: 15, color: GREY, bold: true }),
  ],
})] });

// Top-level headings only: a contents page is a way in, not an index.
const toc = (levels = '1-1') => new TableOfContents('Contents', { hyperlink: true, headingStyleRange: levels });
const contents = (intro) => [
  H1('Contents'),
  P(intro, { size: GUIDE, color: GREY }),
  toc(),
  // Word fills a contents field on open. Some offline machines run LibreOffice, which leaves it blank
  // until the field is refreshed - so say how, rather than shipping a page that looks broken.
  P('If this page is empty, right-click here and choose "Update field" (in LibreOffice, press F9).', { size: 17, color: GREY, before: 200 }),
  pageBreak(),
];

// Printing instructions belong IN the pack: the sites printing this are choosing between pages and
// toner, and they need to know what is safe to drop.
const printNotes = (kind, extra = [], br = false) => [
  H2('How to print this', br),
  bullet('A4 paper, portrait. Do not let the printer "shrink to fit" - the writing lines are sized for A4.', 0, GUIDE),
  bullet('Black and white is fine. Nothing here needs colour to make sense.', 0, GUIDE),
  bullet('Print double-sided if you can. It halves the paper.', 0, GUIDE),
  ...(kind === 'book'
    ? [
      bullet('One book per learner. This is the one thing worth spending the paper on - the learner writes in it and keeps it.', 0, GUIDE),
      bullet('Cream or off-white paper is easier to read from than bright white, if you have it.', 0, GUIDE),
    ]
    : [
      bullet('One copy per facilitator. It is a reference book - you will come back to it, so it is worth binding.', 0, GUIDE),
    ]),
  ...extra.map((t) => bullet(t, 0, GUIDE)),
  hr(),
];

const makeDoc = (children, opts = {}) => new Document({
  numbering: NUMBERING,
  features: { updateFields: true },
  styles: { default: { document: { run: { font: 'Calibri', size: GUIDE }, paragraph: { spacing: { line: LEAD_GUIDE } } } } },
  sections: [{
    properties: { page: PAGE },
    footers: opts.footerText ? { default: pageFooter(opts.footerText) } : undefined,
    children: children.filter(Boolean),
  }],
});

module.exports = {
  BRAND, LOGO, icon, imgRun, image, iconLine, pageFooter, toc, contents, printNotes, plain,
  NAVY, PLUM, GREY, OLIVE, LINE, RULE, PAGE, COL, scaleW, BOOK, GUIDE, LEAD_BOOK, LEAD_GUIDE,
  NO_BORDERS, HAIRLINE, accentLeft, setHeadingShift,
  toParas, P, runs, body, bullet, numbered, label, H1, H2, H3, mini, hr, pageBreak,
  eyebrow, eyebrowChip, partHead, title, bold,
  scribe, example, noteBox, visualTable, stem, ruled, linedArea, writeBox, choices, check, slot,
  zones, tallyMat, grid, notesPage, NOTES_LINES, gap,
  writeLine, box, gridBoxes, refTable, twoCol, callout, mdTable, mdBlocks, NUMBERING, makeDoc,
  AlignmentType, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  HeadingLevel, TabStopType, LeaderType,
};
