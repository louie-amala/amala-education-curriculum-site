/* Generate the English Check pack - the baseline/endline proficiency instrument for the English
   Language Development component of Learning Bridge+ (Cox's Bazar):

     cb-en-check-form-a.docx        (learner booklet, baseline - keys stripped)
     cb-en-check-form-b.docx        (learner booklet, endline - keys stripped)
     cb-en-check-marking-pack.docx  (facilitator only: both keys, mark schemes, marking sheet, card)
     cb-en-check-admin-guide.docx   (how to run it)
     cb-en-check-record-sheets.docx (class record sheet + learner profile sheet)

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

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const A = splitForm(read('ENGLISH-ASSESSMENT-FORM-A.md'));
  const B = splitForm(read('ENGLISH-ASSESSMENT-FORM-B.md'));
  const sheets = read('ENGLISH-ASSESSMENT-SHEETS.md');

  await write('cb-en-check-form-a.docx', [
    ...cover('Form A', 'The booklet each learner works in at the start of the course.',
      'Print one per learner. Write each learner’s own name into it before the sitting, everywhere the page says [learner’s name]. This booklet contains no answers.'),
    ...blocks(stripInternal(A.booklet), S.BOOK),
  ]);

  await write('cb-en-check-form-b.docx', [
    ...cover('Form B', 'The booklet each learner works in in the final week.',
      'Same tasks, same order, different content - so nobody sits the same paper twice. Six slots are deliberately identical to Form A. This booklet contains no answers.'),
    ...blocks(stripInternal(B.booklet), S.BOOK),
  ]);

  await write('cb-en-check-marking-pack.docx', [
    ...cover('Marking pack', 'Keys, mark schemes, the marking sheet and the conversion card.',
      'FOR THE FACILITATOR ONLY. Never print this into a learner booklet and never leave it where learners can read it - they sit these same tasks again at the end of the course.'),
    ...blocks(A.marking), pageBreak(),
    ...blocks(B.marking), pageBreak(),
    ...blocks(section(sheets, 'The conversion card')), pageBreak(),
    ...blocks(section(sheets, 'The marking sheet')),
  ]);

  await write('cb-en-check-admin-guide.docx', [
    ...cover('How to run it', 'The full administration guide.',
      'Written for a facilitator who does not know the CEFR, and who does not need to.'),
    ...blocks(read('ENGLISH-ASSESSMENT-ADMIN-GUIDE.md')),
  ]);

  await write('cb-en-check-record-sheets.docx', [
    ...cover('Record and profile sheets', 'The class record sheet, and the learner’s own profile.',
      'The class record sheet is one per class, filled in twice. The profile sheet is one per learner and is given to them - read it through together.'),
    ...blocks(section(sheets, 'The class record sheet')), pageBreak(),
    ...blocks(section(sheets, 'The learner profile sheet')),
  ]);
})();
