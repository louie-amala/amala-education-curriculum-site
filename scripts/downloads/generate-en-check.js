/* Generate the English Check pack - the baseline/endline proficiency instrument for the English
   Language Development component of Learning Bridge+ (Cox's Bazar):

     cb-en-check-baseline.docx        (the paper, first session - answers stripped)
     cb-en-check-endline.docx         (the paper, final week - answers stripped)
     cb-en-check-marking-pack.docx    (facilitator only: both answer keys and tick schemes)
     cb-en-check-guide.docx           (the complete guide - coordinator and facilitator)
     cb-en-check-learner-profile.docx (the learner's own "what I can do" sheet)
     cb-en-check-record-sheet.csv     (the class spreadsheet, with live formulas)

   RENDERED from the planning docs in docs/, which are the single source of truth for every item,
   key and conversion table. Nothing here re-types content: edit the markdown, re-run this.

   The one thing this script MUST get right is the split between the learner booklet and the marking
   pack. Each form doc contains both, separated by the "# MARKING PACK" heading. A key that leaks
   into a learner booklet destroys the instrument, so the split is asserted, not assumed.

   Run:  node scripts/downloads/generate-en-check.js
   Override output dir:  OUT_DIR=/tmp/pack node scripts/downloads/generate-en-check.js */
const fs = require('fs');
const path = require('path');
const { Packer } = require('docx');
const S = require('./lib/docx-style');
const { NAVY, GREY, P, H1, mini, hr, pageBreak, mdBlocks, makeDoc, image, LOGO,
        Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } = S;

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'downloads');
const FOOTER = 'The English Check - Learning Bridge+ Cox’s Bazar - Amala';

const read = (f) => fs.readFileSync(path.join(DOCS, f), 'utf8');

// The markdown in docs/ is written for humans reading it on the site and in an editor, so it carries
// emphasis, blockquotes and rules that mdBlocks does not read. Flatten them rather than teaching
// mdBlocks new syntax: the docx has its own typography and does not need the source's.
const clean = (md) => md
  .replace(/^\s*>\s?/gm, '')            // blockquote markers - the box is drawn by the style, not the text
  .replace(/\*\*(.+?)\*\*/g, '$1')
  .replace(/(^|\s)_(?=\S)/gm, '$1').replace(/(?<=\S)_(?=\s|$)/gm, '')
  .replace(/`/g, '')
  .replace(/— /g, '— ');

// ---- pictures ----------------------------------------------------------------
// The forms name their pictures rather than embedding them, because the markdown in docs/ is the
// source both the site and these files read. Here the names become the drawings, from
// public/brand/en-check (see generate-en-check-pictures.js).
//
// Two rules the layout has to keep. Pictures are NEVER captioned - the learner is matching a written
// word to a picture, and a caption hands them the answer. And they are printed in the order the
// markdown gives, which is deliberately not the order of the words: position must not be a clue.
const PIC = path.join(ROOT, 'public', 'brand', 'en-check');
const picFile = (name) => path.join(PIC, `${name.trim().replace(/\s+/g, '-')}.png`);

const picStrip = (names) => {
  const list = names.map((n) => (n === 'water tap' ? 'tap' : n));
  list.forEach((n) => { if (!fs.existsSync(picFile(n))) throw new Error(`No picture drawn for "${n}"`); });
  if (list.length === 1) {
    const scene = list[0].startsWith('scene-');
    return [image(picFile(list[0]), scene ? 420 : 92, scene ? 273 : 92, { after: 200 })];
  }
  // A numbered row so a learner can draw a line to a picture and a marker can say which one it was.
  const w = Math.floor(S.COL / list.length);
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: list.map(() => w), borders: S.HAIRLINE,
    rows: [
      new TableRow({ children: list.map((n) => new TableCell({
        width: { size: w, type: WidthType.DXA }, margins: { top: 120, bottom: 60, left: 60, right: 60 },
        children: [image(picFile(n), 74, 74, { alignment: AlignmentType.CENTER, after: 0 })],
      })) }),
      new TableRow({ children: list.map((_, i) => new TableCell({
        width: { size: w, type: WidthType.DXA }, margins: { top: 0, bottom: 100, left: 60, right: 60 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(i + 1), bold: true, size: 20, color: GREY })] })],
      })) }),
    ],
  }), P('', { after: 120 })];
};

// The group-mode spelling task puts a picture in the first column of a table: [pic:mat].
const picTable = (rows) => {
  const cells = rows.map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  const kept = cells.filter((r) => !r.every((c) => c === '' || /^:?-+:?$/.test(c)));
  const n = Math.max(...kept.map((r) => r.length));
  const w = Math.floor(S.COL / n);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: Array(n).fill(w), borders: S.HAIRLINE,
    rows: kept.map((r, ri) => new TableRow({ children: Array.from({ length: n }, (_, ci) => {
      const raw = r[ci] || '';
      const m = raw.match(/^\[pic:([a-z-]+)\]$/);
      return new TableCell({
        width: { size: w, type: WidthType.DXA }, margins: { top: 90, bottom: 90, left: 120, right: 120 },
        children: m
          ? [image(picFile(m[1]), 62, 62, { alignment: AlignmentType.CENTER, after: 0 })]
          : [new Paragraph({ children: [new TextRun({ text: raw, bold: ri === 0, size: 21, color: ri === 0 ? NAVY : undefined })], spacing: { line: 300 } })],
      });
    }) })),
  });
};

// Split on horizontal rules so each block renders separately with a printed rule between, and hand
// picture lines and picture tables to the renderers above instead of to mdBlocks.
// A learner who cannot yet read is being asked to LOOK at these - a letter to point to, a word to
// sound out, their own name among four. At body size they are unusable. A [big] line in the markdown
// makes the block that follows it print at the size the task actually needs.
const BIGPT = 52;
const bigTable = (rows) => {
  const cells = rows.map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  const kept = cells.filter((r) => !r.every((c) => c === '' || /^:?-+:?$/.test(c)));
  const n = Math.max(...kept.map((r) => r.length));
  const w = Math.floor(S.COL / n);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: Array(n).fill(w), borders: S.HAIRLINE,
    rows: kept.map((r) => new TableRow({ height: { value: 900, rule: 'atLeast' }, children: Array.from({ length: n }, (_, ci) => new TableCell({
      width: { size: w, type: WidthType.DXA }, margins: { top: 140, bottom: 140, left: 80, right: 80 },
      verticalAlign: 'center',
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (r[ci] || '').replace(/\*\*/g, ''), size: BIGPT })] })],
    })) })),
  });
};
const bigLine = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: text.replace(/\*\*/g, ''), size: BIGPT })],
  spacing: { before: 200, after: 260, line: 400 },
});

const render = (md, size) => {
  const out = [];
  const lines = clean(md).replace(/\r/g, '').split('\n');
  let buf = [];
  let big = false;
  const flush = () => {
    // A [big] marker can leave a table's header and rule behind with no body rows; mdTable cannot
    // build a table from those and throws. Drop the orphan rather than crash the pack.
    const text = buf.join('\n');
    const rows = text.split('\n').filter((l) => l.trim().startsWith('|'));
    const bodyRows = rows.filter((l) => !/^\|[\s|]*\|$/.test(l.trim()) && !/^\|[-:\s|]+\|$/.test(l.trim()));
    const useable = rows.length === 0 || bodyRows.length > 0;
    if (text.trim() && useable) out.push(...mdBlocks(text, size));
    else if (text.trim()) out.push(...mdBlocks(text.split('\n').filter((l) => !l.trim().startsWith('|')).join('\n'), size));
    buf = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === '[big]') { flush(); big = true; continue; }
    if (big && t) {
      if (t.startsWith('|')) {
        const rws = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) { rws.push(lines[i].trim()); i++; }
        i--;
        out.push(bigTable(rws), P('', { after: 120 }));
      } else {
        out.push(bigLine(t));
      }
      big = false;
      continue;
    }
    const pics = t.match(/^Pictures:\s*(.+)$/);
    if (pics) { flush(); out.push(...picStrip(pics[1].split('·'))); continue; }
    if (t.startsWith('|') && t.includes('[pic:')) {
      // The header and rule of this table are already in buf. Take them back before flushing, or the
      // table renders twice - once headerless, once whole.
      const rws = [];
      let j = i;
      while (j >= 0 && lines[j].trim().startsWith('|')) j--;
      j++;
      while (j < lines.length && lines[j].trim().startsWith('|')) { rws.push(lines[j].trim()); j++; }
      // the table may have started before this line - drop anything already buffered from it
      while (buf.length && buf[buf.length - 1].trim().startsWith('|')) buf.pop();
      flush();
      out.push(picTable(rws), P('', { after: 120 }));
      i = j - 1;
      continue;
    }
    buf.push(lines[i]);
  }
  flush();
  return out;
};

const blocks = (md, size) => {
  const chunks = clean(md).split(/\n-{3,}\n/);
  const out = [];
  chunks.forEach((c, i) => {
    if (!c.trim()) return;
    if (i) out.push(hr());
    out.push(...render(c, size));
  });
  return out;
};

// The forms carry annotations for the team - which slots are anchors, why F3 has to repeat. They
// belong in the source and in the marking pack, never on a learner's page: a learner reading
// "identical to Form A" learns nothing and wonders what they missed.
const stripInternal = (md) => md
  .replace(/ ?· \*\*ANCHOR[^\n]*/g, '')
  .replace(/ ?· \*\*C1 and C2 are ANCHORS\*\*/g, '')
  .split(/\n\s*\n/)
  .filter((para) => !/anchor/i.test(para))
  .join('\n\n');

// Everything before "# MARKING PACK" is what a learner sees. Everything after is what they must not.
const splitForm = (md) => {
  const marker = '\n# MARKING PACK';
  const at = md.indexOf(marker);
  if (at < 0) throw new Error('No "# MARKING PACK" heading found - refusing to build a booklet that may contain the keys.');
  return { booklet: md.slice(0, at), marking: md.slice(at) };
};

// Pull one "# " top-level section out of a doc by its heading text.
const section = (md, heading) => {
  const lines = md.replace(/\r/g, '').split('\n');
  const start = lines.findIndex((l) => l.trim().startsWith('# ') && l.includes(heading));
  if (start < 0) throw new Error(`Section not found: ${heading}`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('# ')) { end = i; break; }
  }
  return lines.slice(start, end).join('\n');
};

const cover = (t, sub, note) => [
  image(LOGO, 118, 60, { after: 420 }),
  new Paragraph({ children: [new TextRun({ text: 'THE ENGLISH CHECK', bold: true, size: 20, color: GREY, characterSpacing: 40 })], spacing: { after: 160 } }),
  new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 52, color: NAVY })], spacing: { after: 180 } }),
  new Paragraph({ children: [new TextRun({ text: sub, size: 24, color: GREY })], spacing: { after: 320 } }),
  ...(note ? [P(note, { size: 20, color: GREY })] : []),
  pageBreak(),
];

const write = async (name, children) => {
  const buf = await Packer.toBuffer(makeDoc(children, { footerText: FOOTER }));
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(`  ${name}  ${(buf.length / 1024).toFixed(0)} kB`);
};

// The coordinator's spreadsheet. Written as CSV rather than xlsx because the repo has no
// spreadsheet library and does not need one: Excel and Google Sheets both evaluate a leading "="
// on import, so the level and change columns arrive live. The facilitator only ever enters the raw
// scores - every level is calculated, so nobody looks up a table and nobody mistypes a level.
const BANDS = { reading: [39, 28, 17], writing: [23, 14, 7], speaking: [14, 9, 4] };
const level = (cell, [b1, a2, a1]) =>
  `=IF(${cell}="","",IF(${cell}>=${b1},"B1",IF(${cell}>=${a2},"A2",IF(${cell}>=${a1},"A1","Pre-A1"))))`;
const change = (a, b) => `=IF(OR(${a}="",${b}=""),"",${b}-${a})`;

const recordCsv = (rows = 30) => {
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const head = ['Learner',
    'Reading raw (start) /45', 'Reading CEFR (start)', 'Reading raw (end) /45', 'Reading CEFR (end)', 'Reading change',
    'Writing raw (start) /30', 'Writing CEFR (start)', 'Writing raw (end) /30', 'Writing CEFR (end)', 'Writing change',
    'Speaking raw (start) /16', 'Speaking CEFR (start)', 'Speaking raw (end) /16', 'Speaking CEFR (end)', 'Speaking change',
    'Notes'];
  const out = [
    ['THE ENGLISH CHECK - class record'].map(q).join(','),
    ['Class:,,Facilitator:,,Baseline date:,,Endline date:'].join(''),
    [''].join(''),
    ['Enter the RAW scores only. The CEFR and change columns calculate themselves.'].map(q).join(','),
    ['Reading /45: Pre-A1 0-16, A1 17-27, A2 28-38, B1 39-45   |   Writing /30: Pre-A1 0-6, A1 7-13, A2 14-22, B1 23-30   |   Speaking /16: Pre-A1 0-3, A1 4-8, A2 9-13, B1 14-16'].map(q).join(','),
    ['Never average the three. A learner is often a level higher in speaking than in writing.'].map(q).join(','),
    [''].join(''),
    head.map(q).join(','),
  ];
  for (let i = 0; i < rows; i++) {
    const r = i + 9; // header row is 8
    out.push([
      '', '', level(`B${r}`, BANDS.reading), '', level(`D${r}`, BANDS.reading), change(`B${r}`, `D${r}`),
      '', level(`G${r}`, BANDS.writing), '', level(`I${r}`, BANDS.writing), change(`G${r}`, `I${r}`),
      '', level(`L${r}`, BANDS.speaking), '', level(`N${r}`, BANDS.speaking), change(`L${r}`, `N${r}`),
      '',
    ].map(q).join(','));
  }
  return out.join('\n') + '\n';
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const base = splitForm(read('ENGLISH-ASSESSMENT-BASELINE.md'));
  const end = splitForm(read('ENGLISH-ASSESSMENT-ENDLINE.md'));

  await write('cb-en-check-baseline.docx', [
    ...cover('Baseline', 'Sit this in the first session, before any teaching.',
      'One per learner. Write each learner\u2019s own name into it beforehand, everywhere the page says [learner\u2019s name] \u2014 three tasks depend on it. This paper contains no answers.'),
    ...blocks(stripInternal(base.booklet), S.BOOK),
  ]);

  await write('cb-en-check-endline.docx', [
    ...cover('Endline', 'Sit this in the final week of the course.',
      'Same tasks in the same order as the baseline, with different content, so nobody sits the same questions twice. One per learner. This paper contains no answers.'),
    ...blocks(stripInternal(end.booklet), S.BOOK),
  ]);

  await write('cb-en-check-marking-pack.docx', [
    ...cover('Marking pack', 'The answers and the tick schemes, for both papers.',
      'FOR THE FACILITATOR ONLY. Never print this into a learner\u2019s paper and never leave it where learners can read it \u2014 they sit these same tasks again at the end of the course.'),
    ...blocks(base.marking), pageBreak(),
    ...blocks(end.marking),
  ]);

  await write('cb-en-check-guide.docx', [
    ...cover('The complete guide', 'For the coordinator and the facilitator.',
      'Part A is the coordinator\u2019s: what to print, the record spreadsheet, and how to read the results. Part B is the facilitator\u2019s: running it, marking it, and what to do with it.'),
    ...blocks(read('ENGLISH-ASSESSMENT-ADMIN-GUIDE.md')),
  ]);

  await write('cb-en-check-learner-profile.docx', [
    ...cover('What I can do in English', 'The learner\u2019s own sheet.',
      'One per learner, given to them at the end of the course. Read it through together \u2014 most learners at this level cannot read it alone, and that is fine.'),
    ...blocks(read('ENGLISH-ASSESSMENT-PROFILE.md'), S.BOOK),
  ]);

  fs.writeFileSync(path.join(OUT, 'cb-en-check-record-sheet.csv'), recordCsv());
  console.log('  cb-en-check-record-sheet.csv');
})();
