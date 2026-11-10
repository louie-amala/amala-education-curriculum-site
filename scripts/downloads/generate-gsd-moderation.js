/* Generate the GSD case-based moderation template:

     gsd-moderation-template.docx   One per case - one educator, one learner, one competency.

   RENDERED  - every word, from `moderationTemplate` in content-source/programmes/gsd.yaml, and the
               levels from content-source/framework/proficiency-scale.yaml. Never re-type either here.
   AUTHORED  - only the layout: response boxes to type in (or write in, printed), and tick boxes that
               click in Word.

   Run:  node scripts/downloads/generate-gsd-moderation.js
   Override output dir:  OUT_DIR=/tmp/pack node scripts/downloads/generate-gsd-moderation.js */
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { Packer, CheckBox, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } = require('docx');
const S = require('./lib/docx-style');
const { NAVY, PLUM, GREY, OLIVE, P, bullet, H1, hr, pageBreak, makeDoc, image, LOGO, AlignmentType, Paragraph, TextRun } = S;

const ROOT = path.resolve(__dirname, '..', '..');
const CS = path.join(ROOT, 'content-source');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'downloads');
const FILE = 'gsd-moderation-template.docx';

const prog = yaml.parse(fs.readFileSync(path.join(CS, 'programmes', 'gsd.yaml'), 'utf8'));
const scale = yaml.parse(fs.readFileSync(path.join(CS, 'framework', 'proficiency-scale.yaml'), 'utf8'));
const t = prog.moderationTemplate;
const LEVELS = scale.levels.map((l) => l.title);

const COL = 9070; // the text column in twips (lib/docx-style.js)
const LINE = 'B9B3A6';
const FILL = 'F5F7FA';
const edge = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const BOX_BORDERS = { top: edge, bottom: edge, left: edge, right: edge };
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };

const run = (text, o = {}) => new TextRun({ text, size: o.size || 20, bold: o.bold, italics: o.italics, color: o.color });
const tick = () => new CheckBox({ checked: false, checkedState: { value: '2612' }, uncheckedState: { value: '2610' } });

// A shaded box to type in. Tall enough to write in when printed; grows as you type.
const responseBox = (lines = 3, label) => new Table({
  width: { size: COL, type: WidthType.DXA }, columnWidths: [COL], borders: BOX_BORDERS,
  rows: [new TableRow({
    height: { value: Math.max(1, lines) * 380 + (label ? 260 : 0), rule: 'atLeast' },
    children: [new TableCell({
      width: { size: COL, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: FILL },
      margins: { top: 90, bottom: 90, left: 140, right: 140 },
      children: [
        ...(label ? [new Paragraph({ spacing: { after: 40 }, children: [run(label, { size: 17, bold: true, color: GREY })] })] : []),
        new Paragraph({ children: [run('', { size: 21 })] }),
      ],
    })],
  })],
});

// Clickable tick boxes, one per option, on one line.
const tickLine = (options, { size = 21 } = {}) => new Paragraph({
  keepNext: true, spacing: { before: 60, after: 100 },
  children: options.flatMap((o, i) => [
    ...(i ? [run('      ')] : []),
    tick(),
    run(`  ${o}`, { size }),
  ]),
});

// Tick boxes stacked, one per line (the levels).
const tickStack = (options) => options.map((o) => new Paragraph({
  keepNext: true, spacing: { after: 50 }, indent: { left: 120 },
  children: [tick(), run(`  ${o}`, { size: 21, bold: true, color: PLUM })],
}));

const spacer = (after = 120) => new Paragraph({ spacing: { after }, children: [] });

// A part heading: a navy band, so each part stands apart when scrolling or printed.
const partHeading = (text) => new Table({
  width: { size: COL, type: WidthType.DXA }, columnWidths: [COL], borders: NO_BORDERS,
  rows: [new TableRow({ children: [new TableCell({
    width: { size: COL, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: NAVY },
    margins: { top: 110, bottom: 110, left: 180, right: 180 },
    children: [new Paragraph({ children: [run(text, { size: 26, bold: true, color: 'FFFFFF' })] })],
  })] })],
});

// Field text: kept with what follows, so a question never sits at the foot of a page without its box.
const para = (text, o = {}) => new Paragraph({ keepNext: true, spacing: { before: o.before || 0, after: o.after == null ? 60 : o.after },
  children: [run(text, { size: o.size || 20, italics: o.italics, color: o.color })] });

function fieldChildren(f, n) {
  const c = [];
  c.push(new Paragraph({ spacing: { before: 300, after: 60 }, keepNext: true, children: [
    run(`${n}. `, { bold: true, color: OLIVE, size: 24 }),
    run(f.label, { bold: true, color: NAVY, size: 24 }),
  ] }));
  if (f.prompt) c.push(para(f.prompt.trim()));
  (f.bullets || []).forEach((b) => {
    const [head, ...rest] = b.split(': ');
    c.push(new Paragraph({ bullet: { level: 0 }, keepNext: true, spacing: { after: 40 }, children: rest.length
      ? [run(`${head}: `, { bold: true }), run(rest.join(': '))]
      : [run(b)] }));
  });
  if (f.after) c.push(para(f.after.trim(), { before: 60 }));
  if (f.guidance) c.push(para(f.guidance.trim(), { size: 18, italics: true, color: GREY, after: 100 }));

  if (f.kind === 'level') c.push(...tickStack(LEVELS));
  if (f.kind === 'choice') c.push(tickLine(f.options || []));
  if (f.kind === 'text') c.push(responseBox(f.lines));
  if (f.kind === 'choice' && f.boxLabel) c.push(responseBox(f.lines, f.boxLabel));
  (f.boxes || []).forEach((b) => {
    c.push(new Paragraph({ spacing: { before: 160, after: 30 }, keepNext: true, children: [run(b.label, { bold: true, color: PLUM, size: 21 })] }));
    if (b.prompt) c.push(para(b.prompt, { size: 18, color: GREY }));
    c.push(responseBox(b.lines));
  });
  return c;
}

function headerTable(rows) {
  const w = [3100, COL - 3100];
  return new Table({
    width: { size: COL, type: WidthType.DXA }, columnWidths: w,
    borders: { ...BOX_BORDERS, insideHorizontal: edge, insideVertical: edge },
    rows: rows.map((label) => new TableRow({ height: { value: 460, rule: 'atLeast' }, children: [
      new TableCell({ width: { size: w[0], type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 140, right: 140 },
        children: [new Paragraph({ children: [run(label, { bold: true, color: NAVY, size: 20 })] })] }),
      new TableCell({ width: { size: w[1], type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 140, right: 140 },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: FILL },
        children: [new Paragraph({ children: [run('', { size: 21 })] })] }),
    ] })),
  });
}

function build() {
  const c = [];
  c.push(image(LOGO, 110, 57, { align: AlignmentType.LEFT, after: 220 }));
  c.push(P('GLOBAL SECONDARY DIPLOMA  ·  MODERATION', { size: 19, bold: true, color: OLIVE, after: 40 }));
  c.push(P(t.title, { size: 44, bold: true, color: NAVY, after: 160 }));
  c.push(hr());

  c.push(H1(t.about.heading));
  t.about.paras.forEach((p) => c.push(P(p.trim(), { size: 21, after: 120 })));
  c.push(H1(t.howTo.heading));
  t.howTo.items.forEach((i) => c.push(bullet(i)));

  c.push(pageBreak());
  c.push(H1('The case'));
  c.push(headerTable(t.header));

  let n = 0;
  t.parts.forEach((part, pi) => {
    c.push(pi === 0 ? spacer(360) : pageBreak());
    c.push(partHeading(part.title));
    part.fields.forEach((f) => c.push(...fieldChildren(f, ++n)));
  });
  return c;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const buf = await Packer.toBuffer(makeDoc(build(), { footerText: `${t.title}  ·  Global Secondary Diploma  ·  Amala` }));
  fs.writeFileSync(path.join(OUT, FILE), buf);
  console.log('wrote', FILE, (buf.length / 1024).toFixed(1) + ' KB');
})();
