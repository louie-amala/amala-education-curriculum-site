/* Generate the English Check pack - the baseline/endline proficiency instrument for the English
   Language Development component of Learning Bridge+ (Cox's Bazar):

     cb-en-check-baseline.docx        (the paper, first session - answers stripped)
     cb-en-check-endline.docx         (the paper, final week - answers stripped)
     cb-en-check-marking-pack.docx    (facilitator only: both answer keys and tick schemes)
     cb-en-check-guide.docx           (the complete guide - coordinator and facilitator)
     cb-en-check-learner-profile.docx (the learner's own "what I can do" sheet)
     cb-en-check-record-sheet.csv     (the class spreadsheet, with live formulas)

   There are no pictures and nothing is read aloud: every task is answered from what is printed on
   the page, so a facilitator hands the papers out and lets the class work. That rules out testing
   phonics here - decoding needs a voice - and the component's formative assessment covers it.

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
  .replace(/\*\*(.+?)\*\*/g, '$1')
  .replace(/(^|\s)_(?=\S)/gm, '$1').replace(/(?<=\S)_(?=\s|$)/gm, '')
  .replace(/`/g, '')
  .replace(/— /g, '— ');

// Split on horizontal rules so each block renders separately with a printed rule between, and hand
// picture lines and picture tables to the renderers above instead of to mdBlocks.
// A learner who cannot yet read is being asked to LOOK at these - a letter to point to, a word to
// sound out, their own name among four. At body size they are unusable. A [big] line in the markdown
// makes the block that follows it print at the size the task actually needs.
const BIGPT = 44;
const bigTable = (rows) => {
  const cells = rows.map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  const kept = cells.filter((r) => !r.every((c) => c === '' || /^:?-+:?$/.test(c)));
  const n = Math.max(...kept.map((r) => r.length));
  const w = Math.floor(S.COL / n);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: Array(n).fill(w), borders: S.HAIRLINE,
    rows: kept.map((r) => new TableRow({ height: { value: 620, rule: 'atLeast' }, children: Array.from({ length: n }, (_, ci) => new TableCell({
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

// A reading text, a notice or a word bank, in a light grey panel with a hairline border. The fill is
// deliberately pale: these are photocopied in black and white, and anything darker turns the text to
// mush by the third copy. The border does the work; the grey only says "this is the thing to read".
const PANEL = 'EDEBE6';
const isHeading = (t) => t.length <= 60 && /^[A-Z0-9 ,.'\u2019\u2014\u2013:-]+$/.test(t) && /[A-Z]{2}/.test(t);
const isWordBank = (t) => t.includes(' \u00b7 ') && !/[.?!]$/.test(t);

const quoteBox = (rawLines, size) => {
  const paras = [];
  let cur = [];
  rawLines.forEach((l) => {
    if (!l.trim()) { if (cur.length) { paras.push(cur.join(' ')); cur = []; } }
    else cur.push(l.trim());
  });
  if (cur.length) paras.push(cur.join(' '));

  const kids = paras.map((t, idx) => {
    const last = idx === paras.length - 1;
    if (isHeading(t)) {
      return new Paragraph({
        children: [new TextRun({ text: t, bold: true, size: 21, color: NAVY, characterSpacing: 20 })],
        spacing: { after: last ? 0 : 170 },
      });
    }
    if (isWordBank(t)) {
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: t, bold: true, size: (size || S.BOOK) + 4 })],
        spacing: { after: last ? 0 : 140, line: 360 },
      });
    }
    return P(t, { size: size || S.BOOK, after: last ? 0 : 150, line: 340 });
  });

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [S.COL], borders: S.HAIRLINE,
    rows: [new TableRow({ children: [new TableCell({
      width: { size: S.COL, type: WidthType.DXA }, shading: { fill: PANEL },
      margins: { top: 140, bottom: 140, left: 220, right: 200 },
      children: kids,
    })] })],
  }), P('', { after: 100 })];
};

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

    // An answer area: the same bordered, faintly ruled box the student workbook uses, so a learner
    // sees a place to write rather than a run of underscores.
    const lines_m = t.match(/^\[lines:(\d+)\]$/);
    if (lines_m) { flush(); out.push(S.linedArea(Number(lines_m[1])), P('', { after: 100 })); continue; }

    // A table the learner writes into.
    if (t === '[answers]' || t === '[form]') {
      const kind = t === '[form]' ? 'form' : 'answers';
      flush();
      i++;
      const rws = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rws.push(lines[i].trim()); i++; }
      i--;
      out.push(fillTable(rws, kind), P('', { after: 120 }));
      continue;
    }


    // A quoted block is a thing to read: put it in a panel, not in the prose.
    if (t.startsWith('>')) {
      flush();
      const qs = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        qs.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      i--;
      out.push(...quoteBox(qs, size));
      continue;
    }

    // Every numbered item gets its own line. mdBlocks only knows "-" bullets, so without this a run
    // of questions is glued into one paragraph and the paper becomes unreadable.
    if (/^\d+\.\s/.test(t)) {
      flush();
      out.push(P(t, { size: size || GUIDE, after: 110, line: 300 }));
      continue;
    }

    // The options line under a multiple-choice stem: its own line, indented under the question.
    if (/^[A-D]\)\s/.test(t)) {
      flush();
      out.push(P(t, { size: size || GUIDE, after: 130, line: 300, indent: { left: 340 } }));
      continue;
    }

    if (big && t) {
      if (t.startsWith('|')) {
        const rws = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) { rws.push(lines[i].trim()); i++; }
        i--;
        out.push(bigTable(rws), P('', { after: 90 }));
      } else {
        out.push(bigLine(t));
      }
      big = false;
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

// The markdown opens with a title and a note pointing at the other paper - written for someone
// reading the file, not for a learner holding the paper. The docx cover already carries all of it,
// so a booklet starts at the first PART heading.
const fromFirstPart = (md) => md.slice(md.indexOf('\n# PART 1'));

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

// The name/block/date line and the sentence the facilitator says. On the cover, where they belong -
// and where they cannot merge into the first task.
const openerRows = [
  P('Learner name ______________________     Block ____________     Date ____________',
    { size: S.BOOK, after: 260 }),
  S.callout('Say this before you start, in the language you share', [
    '"This is not an exam. Nobody passes and nobody fails. Some parts will be too hard \u2014 leave those and go on. You can stop whenever you like."',
  ]),
  P('Everything is on the page and nothing is read out. Hand out the papers, say the sentence above, and let learners work. Most learners will not finish every part, and that is expected.',
    { size: 20, color: GREY, after: 200 }),
];

// A table a learner writes INTO. The answer column is narrow and the rows are tall, so the empty
// cell reads as a box to write in rather than a cell somebody forgot to fill. [answers] puts the
// answer column on the right and narrow; [form] puts the label on the left and narrow.
const fillTable = (rows, kind) => {
  const cells = rows.map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  const kept = cells.filter((r) => !r.every((c) => c === '' || /^:?-+:?$/.test(c)));
  const widths = kind === 'form'
    ? [Math.round(S.COL * 0.38), Math.round(S.COL * 0.62)]
    : [Math.round(S.COL * 0.74), Math.round(S.COL * 0.26)];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: widths, borders: S.HAIRLINE,
    rows: kept.map((r, ri) => new TableRow({
      height: { value: ri === 0 ? 340 : 560, rule: 'atLeast' },
      children: widths.map((w, ci) => new TableCell({
        width: { size: w, type: WidthType.DXA },
        margins: { top: 110, bottom: 110, left: 160, right: 160 },
        verticalAlign: 'center',
        children: [new Paragraph({
          children: [new TextRun({
            text: (r[ci] || '').replace(/\*\*/g, ''),
            bold: ri === 0,
            size: ri === 0 ? 19 : S.BOOK,
            color: ri === 0 ? NAVY : undefined,
          })],
          spacing: { line: 300 },
        })],
      })),
    })),
  });
};

const cover = (t, sub, note) => [
  image(LOGO, 118, 60, { after: 420 }),
  new Paragraph({ children: [new TextRun({ text: 'THE ENGLISH CHECK', bold: true, size: 20, color: GREY, characterSpacing: 40 })], spacing: { after: 160 } }),
  new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 52, color: NAVY })], spacing: { after: 180 } }),
  new Paragraph({ children: [new TextRun({ text: sub, size: 24, color: GREY })], spacing: { after: 320 } }),
  ...(note ? [P(note, { size: 20, color: GREY, after: 320 })] : []),
  ...(t === 'Baseline' || t === 'Endline' ? openerRows : []),
  // A learner paper is printed per learner, so a cover page is a page per learner. The papers run
  // straight on from the header; only the facilitator documents get a page of their own.
  ...(t === 'Baseline' || t === 'Endline' ? [] : [pageBreak()]),
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
const BANDS = { reading: [31, 22, 13], writing: [16, 10, 5], speaking: [14, 9, 4] };
const level = (cell, [b1, a2, a1]) =>
  `=IF(${cell}="","",IF(${cell}>=${b1},"B1",IF(${cell}>=${a2},"A2",IF(${cell}>=${a1},"A1","Pre-A1"))))`;
const change = (a, b) => `=IF(OR(${a}="",${b}=""),"",${b}-${a})`;

const recordCsv = (rows = 30) => {
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const head = ['Learner',
    'Reading raw (start) /36', 'Reading CEFR (start)', 'Reading raw (end) /36', 'Reading CEFR (end)', 'Reading change',
    'Writing raw (start) /20', 'Writing CEFR (start)', 'Writing raw (end) /20', 'Writing CEFR (end)', 'Writing change',
    'Speaking raw (start) /16', 'Speaking CEFR (start)', 'Speaking raw (end) /16', 'Speaking CEFR (end)', 'Speaking change',
    'Notes'];
  const out = [
    ['THE ENGLISH CHECK - class record'].map(q).join(','),
    ['Class:,,Facilitator:,,Baseline date:,,Endline date:'].join(''),
    [''].join(''),
    ['Enter the RAW scores only. The CEFR and change columns calculate themselves.'].map(q).join(','),
    ['Reading /36: Pre-A1 0-12, A1 13-21, A2 22-30, B1 31-36   |   Writing /20: Pre-A1 0-4, A1 5-9, A2 10-15, B1 16-20   |   Speaking /16: Pre-A1 0-3, A1 4-8, A2 9-13, B1 14-16'].map(q).join(','),
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
      'One per learner. Nothing to prepare and nothing to read out \u2014 hand them out and let the class work. This paper contains no answers.'),
    ...blocks(fromFirstPart(stripInternal(base.booklet)), S.BOOK),
  ]);

  await write('cb-en-check-endline.docx', [
    ...cover('Endline', 'Sit this in the final week of the course.',
      'Same tasks in the same order as the baseline, with different content, so nobody sits the same questions twice. One per learner. This paper contains no answers.'),
    ...blocks(fromFirstPart(stripInternal(end.booklet)), S.BOOK),
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
