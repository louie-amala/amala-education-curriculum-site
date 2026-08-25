/* Generate the Powerful Narratives printable worksheets in public/downloads/:
     - pn-peer-review-sheet.docx   : a story-feedback form for peer review of a story/presentation.
     - pn-provocation-response.docx: the generic "provocation response" analysis task + formative rubric.
   Both are faithful to the 2025 Powerful Narratives source pack (Peer Review Sheet; Assessed Task
   Template: Provocation Response), generalised so they are reusable across contexts (no film-specific
   detail). Wired as `downloads` on content-source/materials/pn-peer-review-sheet.yaml and
   pn-provocation-response.yaml. Run:  node scripts/downloads/generate-pn-worksheets.js
   Override output dir:  OUT_DIR=/tmp/pack node scripts/downloads/generate-pn-worksheets.js */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak, HeadingLevel,
} = require('docx');
// The A4 text column and the width scaler, shared so the page width is defined in one place.
const { scaleW } = require('./lib/docx-style');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'downloads');

// ---- palette + text helpers (house style, matching generate-iceberg.js) ----
const NAVY = '1F3A5F', PLUM = '7A3B69', GREY = '5A6473', OLIVE = '6E7A2E', LINE = 'B9B3A6', TEAL = '2E6E6A';
const P = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text, size: opts.size || 22, bold: opts.bold, italics: opts.italics, color: opts.color })], spacing: { after: opts.after == null ? 120 : opts.after, before: opts.before || 0 }, alignment: opts.align });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 100 }, children: [new TextRun({ text: t, bold: true, size: 30, color: NAVY })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: t, bold: true, size: 26, color: PLUM })] });
const bullet = (text) => new Paragraph({ children: [new TextRun({ text, size: 22 })], bullet: { level: 0 }, spacing: { after: 60 } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const LETTER = { size: { width: 12240, height: 15840 } };
const writeLines = (n) => Array.from({ length: n }, () => new Paragraph({ spacing: { after: 60 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE } }, children: [new TextRun({ text: ' ', size: 24 })] }));

// A prompt followed by a few ruled lines to write on.
function field(prompt, lines) {
  return [P(prompt, { bold: true, color: NAVY, before: 160, after: 40 }), ...writeLines(lines)];
}

// ---------- Peer review sheet ----------
const REVIEW_ROWS = [
  ['What I enjoyed most about this story', 'What I enjoyed least, or found harder to follow'],
  ['The most powerful element (and why)', 'The element that could be strongest with more work'],
  ['Is it well suited to its intended audience? How do you know?', 'One thing that felt under-developed or over-developed'],
];
function reviewGrid() {
  const cell = (children) => new TableCell({ width: { size: 5100, type: WidthType.DXA }, margins: { top: 100, bottom: 220, left: 120, right: 120 }, children });
  const rows = [];
  for (const [a, b] of REVIEW_ROWS) {
    rows.push(new TableRow({ children: [
      cell([new Paragraph({ children: [new TextRun({ text: a, bold: true, size: 20, color: PLUM })] })]),
      cell([new Paragraph({ children: [new TextRun({ text: b, bold: true, size: 20, color: PLUM })] })]),
    ] }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: scaleW([5100, 5100]), rows });
}
function peerReviewDoc() {
  const oneSheet = () => [
    H2('Peer review: a story or presentation'),
    P('Reviewer:', { bold: true, after: 40 }), ...writeLines(1),
    P('Storyteller / work reviewed:', { bold: true, before: 120, after: 40 }), ...writeLines(1),
    P('Give feedback that is useful and kind. Be specific: point to what actually worked, and what would make the story stronger.', { color: GREY, before: 120, after: 140 }),
    reviewGrid(),
    ...field('My recommendations: two or three things I would try next', 3),
  ];
  return new Document({ sections: [{ properties: { page: LETTER }, children: [
    H1('Story peer review sheet'),
    P('Use this to give a fellow storyteller feedback on a story or presentation. Two copies are included, one per person you review.', { color: GREY, after: 160 }),
    ...oneSheet(),
    pageBreak(),
    ...oneSheet(),
  ] }] });
}

// ---------- Provocation response ----------
const FRAMEWORK = [
  ['Purpose', 'Who produced the provocation? What might their reasons have been? Do they state them, or do you have to work them out?'],
  ['Process', 'How might it have been produced? Is there likely to be any bias in how it was made?'],
  ['Content', 'What does it tell us about what the author(s) believe? To what extent do you agree?'],
  ['Reporting', 'Describe the provocation. What is it, and what does it say or show?'],
  ['Interpreting', 'Explain its significance. What does it mean? Why is it important? What lessons does it hold?'],
  ['Critiquing', 'What is your view on the value of its ideas? Where is it strong, where limited? How might it have argued more convincingly?'],
];
function frameworkTable() {
  const cell = (children, w, fill) => new TableCell({ width: { size: w, type: WidthType.DXA }, shading: fill ? { type: 'clear', color: 'auto', fill } : undefined, margins: { top: 80, bottom: 160, left: 120, right: 120 }, children });
  const rows = FRAMEWORK.map(([k, v]) => new TableRow({ children: [
    cell([new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 22, color: NAVY })] })], 2200, 'F1EEF3'),
    cell([new Paragraph({ children: [new TextRun({ text: v, size: 20, color: GREY })] }), ...writeLines(2)], 8600),
  ] }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: scaleW([2200, 8600]), rows });
}
const RUBRIC = [
  ['Description', 'Describes the provocation, outlines its main ideas, and says who produced it.'],
  ['Analysis', 'Explains the significance of who produced it and of its ideas; outlines strengths and limitations.'],
  ['Writing', 'Uses full sentences and correct grammar; references any sources or ideas from others correctly.'],
];
function rubricTable() {
  const cell = (children, w, fill) => new TableCell({ width: { size: w, type: WidthType.DXA }, shading: fill ? { type: 'clear', color: 'auto', fill } : undefined, margins: { top: 80, bottom: 120, left: 120, right: 120 }, children });
  const header = new TableRow({ tableHeader: true, children: [
    cell([new Paragraph({ children: [new TextRun({ text: 'Criteria', bold: true, size: 20, color: 'FFFFFF' })] })], 2600, NAVY),
    cell([new Paragraph({ children: [new TextRun({ text: 'The learner…', bold: true, size: 20, color: 'FFFFFF' })] })], 8200, NAVY),
  ] });
  const rows = RUBRIC.map(([k, v]) => new TableRow({ children: [
    cell([new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 22, color: NAVY })] })], 2600),
    cell([new Paragraph({ children: [new TextRun({ text: v, size: 20, color: GREY })] })], 8200),
  ] }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: scaleW([2600, 8200]), rows: [header, ...rows] });
}
function provocationDoc() {
  return new Document({ sections: [{ properties: { page: LETTER }, children: [
    H1('Provocation response'),
    P('A provocation is a resource, an image, article, film, or object, chosen to make you think and to spark investigation. This sheet helps you record and analyse the thinking a provocation provokes, so you can look back on it and plan what to do next.', { color: GREY, after: 160 }),

    H2('The provocation'),
    ...field('What is the provocation you are responding to?', 2),

    H2('Analyse it'),
    P('Make notes under each heading. They are here to guide you, not to limit you.', { color: GREY, after: 100 }),
    frameworkTable(),

    pageBreak(),
    H2('Reflection'),
    ...field('To what extent did producing this response help you learn from the provocation?', 2),
    ...field('How might you use this approach with future provocations?', 2),

    H2('Formative rubric'),
    P('Use this to make your response stronger before you submit. It is for your development; it does not decide your grade.', { color: GREY, after: 100 }),
    rubricTable(),
    P('Your facilitator will add the specific success indicators from the Amala Competency Framework that this task is being used to evidence.', { italics: true, color: GREY, before: 160, after: 60 }),
  ] }] });
}

async function write(name, doc) {
  fs.mkdirSync(OUT, { recursive: true });
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log('wrote', path.join(OUT, name));
}

(async () => {
  await write('pn-peer-review-sheet.docx', peerReviewDoc());
  await write('pn-provocation-response.docx', provocationDoc());
})();
