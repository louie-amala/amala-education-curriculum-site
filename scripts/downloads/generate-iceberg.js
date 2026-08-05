/* Generate the Iceberg model artefact pair — the reference example for the worksheet/template split.
   Produces two real, printable Word files in public/downloads/:
     - iceberg-model-worksheet.docx : the GUIDED sheet. Explains the method, walks the four bands with
       their guiding prompts and fillable space, sets out the two passes (Take 1 / Take 2), and ends
       with the blank template embedded (so the worksheet "contains" the template).
     - iceberg-model-template.docx  : the BLANK final product on its own — the four-band grid, no prompts.
   Content is kept faithful to content-source/materials/iceberg-model.yaml (learnerContent + the band
   prompts in educatorContent). Run:  node scripts/downloads/generate-iceberg.js
   Override output dir:  OUT_DIR=/tmp/pack node scripts/downloads/generate-iceberg.js */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak, HeadingLevel,
} = require('docx');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'downloads');

// ---- palette + text helpers (house style, matching generate-docx.js) ----
const NAVY = '1F3A5F', PLUM = '7A3B69', GREY = '5A6473', OLIVE = '6E7A2E', LINE = 'B9B3A6', TEAL = '2E6E6A';
const P = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text, size: opts.size || 22, bold: opts.bold, italics: opts.italics, color: opts.color })], spacing: { after: opts.after == null ? 120 : opts.after, before: opts.before || 0 }, alignment: opts.align });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 100 }, children: [new TextRun({ text: t, bold: true, size: 30, color: NAVY })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: t, bold: true, size: 26, color: PLUM })] });
const bullet = (text) => new Paragraph({ children: [new TextRun({ text, size: 22 })], bullet: { level: 0 }, spacing: { after: 60 } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const LETTER = { size: { width: 12240, height: 15840 } };
// A few blank ruled lines for handwriting.
const writeLines = (n) => Array.from({ length: n }, () => new Paragraph({ spacing: { after: 60 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE } }, children: [new TextRun({ text: ' ', size: 24 })] }));

// The four bands, tip → base. Faithful to iceberg-model.yaml.
const BANDS = [
  { name: 'Events', where: 'the tip, above the water', prompt: 'What happened? What did you or others observe?' },
  { name: 'Patterns', where: 'just below the surface', prompt: 'What has been happening over time? What are the trends?' },
  { name: 'Structure', where: 'deeper down', prompt: 'What policies, laws, systems or relationships shape those patterns?' },
  { name: 'Mental models', where: 'the base', prompt: 'What beliefs, assumptions or values keep the structure in place?' },
];

// A band as a titled block with its guiding prompt and space to write (worksheet).
function bandBlock(b, lines) {
  return [
    new Paragraph({ spacing: { before: 160, after: 40 }, children: [
      new TextRun({ text: `${b.name} `, bold: true, size: 24, color: NAVY }),
      new TextRun({ text: `(${b.where})`, italics: true, size: 20, color: GREY }),
    ] }),
    P(b.prompt, { size: 21, color: PLUM, after: 80 }),
    ...writeLines(lines),
  ];
}

// A band as a single grid row (blank template): label cell + empty write cell.
function bandRow(b, heightTwips) {
  const cell = (children, w) => new TableCell({ width: { size: w, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children });
  return new TableRow({ height: { value: heightTwips, rule: 'atLeast' }, children: [
    cell([
      new Paragraph({ children: [new TextRun({ text: b.name, bold: true, size: 22, color: NAVY })] }),
      new Paragraph({ children: [new TextRun({ text: b.where, italics: true, size: 18, color: GREY })] }),
    ], 2600),
    cell([new Paragraph({ children: [new TextRun({ text: '', size: 22 })] })], 8200),
  ] });
}

function tag(text, color) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: ` ${text} `, bold: true, size: 18, color: 'FFFFFF', highlight: undefined })], shading: { type: 'clear', color: 'auto', fill: color } });
}

// ---------- Worksheet (guided) ----------
function worksheetDoc() {
  const children = [
    H1('Iceberg model — worksheet'),
    P('A tool for looking beneath a problem: from what you can see at the surface down to the beliefs that hold it in place. Work down the four levels for the real problem you are exploring.', { color: GREY, after: 160 }),

    H2('How to use this'),
    bullet('Fill in each level for your problem. Start at the top; do not worry if the lower levels are hard at first — that is normal.'),
    bullet('Write down the questions each level raises, not only the answers.'),
    bullet('Do this twice. Take 1 now, from what you already know. Take 2 after your research — come back and add what you learned in a different colour, so your growth is visible.'),

    P('Problem I am exploring:', { bold: true, before: 200, after: 40 }),
    ...writeLines(2),

    P('Take 1 — from what I already know', { bold: true, color: TEAL, before: 200, after: 40 }),
  ];
  for (const b of BANDS) children.push(...bandBlock(b, b.name === 'Mental models' || b.name === 'Structure' ? 3 : 2));

  children.push(
    P('What is the most important thing I now understand about what lies beneath the surface?', { bold: true, before: 220, after: 60 }),
    ...writeLines(3),
    P('Take 2 — after my research (add in a different colour)', { bold: true, color: TEAL, before: 200, after: 60 }),
    P('Return to the four levels above and revise them with what your research showed. Then answer:', { size: 21, color: GREY, after: 80 }),
    P('What changed between Take 1 and Take 2, and how might it shape the kind of solution I build?', { bold: true, after: 60 }),
    ...writeLines(3),

    pageBreak(),
    H2('Blank template'),
    P('The same four levels with no prompts — for your next problem, once you have done this once.', { italics: true, color: GREY, after: 120 }),
    templateTable(),
  );
  return new Document({ sections: [{ properties: { page: LETTER }, children }] });
}

// The blank four-band grid, reused by the worksheet's final page and the standalone template.
function templateTable() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [2600, 8200],
    rows: BANDS.map((b) => bandRow(b, 1600)),
  });
}

// ---------- Template (blank final product) ----------
function templateDoc() {
  return new Document({ sections: [{ properties: { page: LETTER }, children: [
    H1('Iceberg model — template'),
    P('Problem:', { bold: true, after: 40 }),
    ...writeLines(1),
    P('Fill in each level, from the visible events at the tip down to the beliefs at the base.', { color: GREY, after: 140 }),
    templateTable(),
  ] }] });
}

async function write(name, doc) {
  fs.mkdirSync(OUT, { recursive: true });
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log('wrote', path.join(OUT, name));
}

(async () => {
  await write('iceberg-model-worksheet.docx', worksheetDoc());
  await write('iceberg-model-template.docx', templateDoc());
})();
