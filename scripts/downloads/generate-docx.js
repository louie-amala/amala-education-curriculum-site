/* Generate the My Voice (Cox's Bazar) offline pack: facilitator plan, student workbook, cards.
   Reads the authored YAML so the facilitator plan is a faithful render of the unit + materials.
   Run from anywhere:  node scripts/downloads/generate-docx.js
   Override the output dir (e.g. to test without touching committed files):  OUT_DIR=/tmp/pack node scripts/downloads/generate-docx.js */
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak, HeadingLevel,
} = require('docx');

const ROOT = path.resolve(__dirname, '..', '..');
const CS = path.join(ROOT, 'content-source');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'downloads');
const rd = (p) => yaml.parse(fs.readFileSync(p, 'utf8'));

const unit = rd(path.join(CS, 'units', 'coxs-bazar-my-voice.yaml'));
const course = rd(path.join(CS, 'courses', 'efi-my-voice.yaml'));
const mat = {};
for (const f of fs.readdirSync(path.join(CS, 'materials')).filter((f) => f.startsWith('cb-mv-'))) {
  const m = rd(path.join(CS, 'materials', f));
  mat[m.slug] = m;
}
const objStatement = (oid) => {
  if (!oid) return null;
  const n = parseInt(oid.split('--o')[1], 10);
  const o = course.objectives[n - 1];
  return o ? o.statement.trim() : null;
};
const LEAD = { 'facilitator-led': 'You lead', shared: 'Shared', 'learner-led': 'Learners lead' };
const KIND = { activity: 'Activity', practice: 'Practice', orientation: 'Orientation', consolidation: 'Consolidation', assessment: 'Assessment' };

// ---- text helpers ----
const NAVY = '1F3A5F', PLUM = '7A3B69', GREY = '5A6473', OLIVE = '6E7A2E', LINE = 'B9B3A6';
// Split a block-scalar string into paragraphs (blank line = new para; single newline = space).
const toParas = (s) => String(s || '').trim().split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
const P = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text, size: opts.size || 22, bold: opts.bold, italics: opts.italics, color: opts.color })], spacing: { after: opts.after == null ? 120 : opts.after, before: opts.before || 0 }, alignment: opts.align, border: opts.border });
const runs = (arr) => new Paragraph({ children: arr, spacing: { after: 120 } });
const body = (s) => toParas(s).map((t) => P(t, { size: 22, after: 120 }));
const bullet = (text, level = 0) => new Paragraph({ children: [new TextRun({ text, size: 22 })], bullet: { level }, spacing: { after: 60 } });
const label = (lab, text) => new Paragraph({ children: [new TextRun({ text: lab + ' ', bold: true, size: 22, color: PLUM }), new TextRun({ text, size: 22 })], spacing: { after: 120 } });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 100 }, children: [new TextRun({ text: t, bold: true, size: 30, color: NAVY })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: t, bold: true, size: 26, color: PLUM })] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 60 }, children: [new TextRun({ text: t, bold: true, size: 23, color: NAVY })] });
const mini = (t) => new Paragraph({ children: [new TextRun({ text: t, bold: true, italics: true, size: 21, color: OLIVE })], spacing: { before: 80, after: 40 } });
const hr = () => new Paragraph({ text: '', border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE } }, spacing: { after: 120 } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const LETTER = { size: { width: 12240, height: 15840 } };

// minimal markdown -> docx blocks (headings, bullets, pipe tables, paragraphs) for resource content
function mdTable(rows) {
  const cells = rows.map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  const kept = cells.filter((r) => !r.every((c) => c === '' || /^:?-+:?$/.test(c)));
  const nCols = Math.max(...kept.map((r) => r.length));
  const colW = Math.floor(10800 / nCols);
  const trs = kept.map((r, ri) => new TableRow({ children: Array.from({ length: nCols }, (_, ci) => new TableCell({
    width: { size: colW, type: WidthType.DXA },
    children: [new Paragraph({ children: [new TextRun({ text: r[ci] || '', bold: ri === 0, size: 20, color: ri === 0 ? NAVY : undefined })] })],
  })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: Array(nCols).fill(colW), rows: trs });
}
function mdBlocks(md) {
  const out = [];
  const lines = String(md || '').replace(/\r/g, '').split('\n');
  let i = 0; let para = [];
  const flush = () => { if (para.length) { out.push(P(para.join(' '), { size: 22 })); para = []; } };
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === '') { flush(); i++; continue; }
    if (t.startsWith('### ')) { flush(); out.push(H3(t.slice(4))); i++; continue; }
    if (t.startsWith('## ')) { flush(); out.push(H2(t.slice(3))); i++; continue; }
    if (t.startsWith('- ')) { flush(); while (i < lines.length && lines[i].trim().startsWith('- ')) { out.push(bullet(lines[i].trim().slice(2))); i++; } continue; }
    if (t.startsWith('|')) { flush(); const rows = []; while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i].trim()); i++; } out.push(mdTable(rows)); continue; }
    para.push(t); i++;
  }
  flush();
  return out;
}

// ============================================================ FACILITATOR PLAN
function facilitatorPlan() {
  const c = [];
  c.push(new Paragraph({ children: [new TextRun({ text: 'My Voice', bold: true, size: 52, color: NAVY })], spacing: { after: 40 } }));
  c.push(P('Facilitator Unit Plan & Guide', { size: 30, bold: true, color: PLUM, after: 40 }));
  c.push(P("Learning Bridge+ (Cox's Bazar)  ·  English Language Development", { size: 22, color: GREY, after: 200 }));
  c.push(...body(unit.summary));
  c.push(runs([
    new TextRun({ text: `${unit.totalFacilitatedHours + unit.totalIndependentHours} hours total`, bold: true, size: 22, color: NAVY }),
    new TextRun({ text: `   ·   ${unit.totalFacilitatedHours}h in-person  ·  ${unit.totalIndependentHours}h independent  ·  set out in hours, fit your own schedule (min. 10 weeks)`, size: 22, color: GREY }),
  ]));
  c.push(hr());
  c.push(H2('How this unit hands over control'));
  c.push(...body(unit.deliveryApproach));
  c.push(H2('Assessing English progress'));
  c.push(...body(unit.assessmentNote));
  c.push(H2('How to use this plan'));
  c.push(P('This plan is set out in hours, not weeks. Work through the phases in order; within a phase, the blocks build on each other. Each activity block below carries its full facilitation guidance inline — what learners do, what to prepare, the steps, the prompts, what to watch for, and how to run it with no materials. Deliver in the language you share with learners, from this plain-English guide. Times are generous on purpose: oral and visual work, drawing, and translation take longer than they look.', { size: 22 }));
  c.push(pageBreak());

  unit.phases.forEach((ph, pi) => {
    c.push(H1(`Phase ${pi + 1} — ${ph.title}`));
    const meta = [`Lead: ${LEAD[ph.lead] || ph.lead || '—'}`];
    const os = objStatement(ph.objectiveId);
    c.push(P(meta.join('   ·   '), { size: 20, color: GREY, italics: true, after: os ? 40 : 120 }));
    if (os) c.push(label('Course objective:', os));
    if (ph.summary) c.push(...body(ph.summary));
    ph.blocks.forEach((b) => {
      c.push(H2(b.title));
      const hrsBits = [KIND[b.kind] || 'Activity', `${b.facilitatedHours}h facilitated`];
      if (b.independentHours) hrsBits.push(`${b.independentHours}h independent`);
      c.push(P(hrsBits.join('   ·   '), { size: 20, color: OLIVE, bold: true, after: 100 }));
      const m = b.materialSlug ? mat[b.materialSlug] : null;
      if (m) {
        if (m.summary) c.push(P(toParas(m.summary).join(' '), { italics: true, size: 22, color: GREY }));
        if (m.duration) c.push(label('Timing:', m.duration));
        if (m.grouping) c.push(label('Grouping:', m.grouping));
        if (m.whatLearnersDo && m.whatLearnersDo.length) { c.push(mini('What learners do')); m.whatLearnersDo.forEach((x) => c.push(bullet(x))); }
        if (m.materialsAndPreparation && m.materialsAndPreparation.length) { c.push(mini('Materials and preparation')); m.materialsAndPreparation.forEach((x) => c.push(bullet(x))); }
        if (m.facilitationNotes) { c.push(mini('Facilitation notes')); c.push(...body(m.facilitationNotes)); }
        (m.steps || []).forEach((s, si) => {
          c.push(H3(`Step ${si + 1}: ${s.title}${s.duration ? '  (' + s.duration + ')' : ''}`));
          c.push(...body(s.guidance));
          if (s.keyPrompts && s.keyPrompts.length) { c.push(mini('Ask')); s.keyPrompts.forEach((x) => c.push(bullet(x))); }
          if (s.watchOuts && s.watchOuts.length) { c.push(mini('Watch out for')); s.watchOuts.forEach((x) => c.push(bullet(x))); }
          if (s.adaptation) c.push(label('Running it with no materials:', toParas(s.adaptation).join(' ')));
        });
        if (m.closing) { c.push(mini('Closing')); c.push(...body(m.closing)); }
      } else if (b.description) {
        c.push(...body(b.description));
      }
      if (b.independentTask) c.push(label('Independent task:', b.independentTask));
      if (b.flexNote) c.push(P(toParas(b.flexNote).join(' '), { italics: true, size: 21, color: GREY }));
      c.push(hr());
    });
    if (pi < unit.phases.length - 1) c.push(pageBreak());
  });

  // Appendix — phonics reference resources (not timed sessions; keep to hand)
  const resources = ['cb-mv-phonics-progression', 'cb-mv-phonics-table'].map((s) => mat[s]).filter(Boolean);
  if (resources.length) {
    c.push(pageBreak());
    c.push(H1('Appendix — phonics reference'));
    c.push(P('Two reference resources that sit behind the sounds phase. They are not timed sessions — keep them to hand and point back to them as you teach the sounds.', { size: 22, color: GREY }));
    for (const r of resources) {
      c.push(H2(r.title));
      if (r.summary) c.push(P(toParas(r.summary).join(' '), { italics: true, size: 21, color: GREY }));
      if (r.educatorContent) c.push(...mdBlocks(r.educatorContent));
      if (r.learnerContent) { c.push(mini('For the learner')); c.push(...mdBlocks(r.learnerContent)); }
    }
  }
  c.push(pageBreak());
  c.push(H2('The offline pack'));
  c.push(P('This guide is part of a fully offline pack: this Facilitator Unit Plan & Guide, the student My Voice book (workbook), the printable letter and picture cards, and optional session slides for sites with a screen. All are editable so you can adapt them to your group and distribute them without the internet.', { size: 22 }));
  c.push(P('Cox’s Bazar edition · adaptation of the My Voice course (English for Impact Unit 1) · not for redistribution outside the programme.', { size: 18, color: GREY, before: 120 }));
  return new Document({ styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } }, sections: [{ properties: { page: LETTER }, children: c }] });
}

// ============================================================ SHARED WORKBOOK PIECES
const box = (h, labelText) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  columnWidths: [10800],
  rows: [new TableRow({ height: { value: h, rule: 'atLeast' }, children: [new TableCell({
    width: { size: 10800, type: WidthType.DXA },
    children: labelText ? [new Paragraph({ children: [new TextRun({ text: labelText, size: 20, color: GREY })] })] : [new Paragraph('')],
  })] })],
});
const writeLine = () => new Paragraph({ text: '', border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '888888' } }, spacing: { before: 240, after: 120 } });
const gridBoxes = (cols, rows, cellH, cellLabel) => {
  const colW = Math.floor(10800 / cols);
  const trs = [];
  for (let r = 0; r < rows; r++) {
    trs.push(new TableRow({ height: { value: cellH, rule: 'atLeast' }, children: Array.from({ length: cols }, () => new TableCell({
      width: { size: colW, type: WidthType.DXA },
      children: [cellLabel ? new Paragraph({ children: [new TextRun({ text: cellLabel, size: 16, color: LINE })] }) : new Paragraph('')],
    })) }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: Array(cols).fill(colW), rows: trs });
};
const wbTitle = (t, sub) => [
  new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 34, color: NAVY })], spacing: { after: sub ? 40 : 160 } }),
  ...(sub ? [new Paragraph({ children: [new TextRun({ text: sub, size: 22, color: GREY })], spacing: { after: 160 } })] : []),
];

// ============================================================ STUDENT WORKBOOK
function workbook() {
  const c = [];
  // Cover
  c.push(new Paragraph({ children: [new TextRun({ text: 'My Voice book', bold: true, size: 60, color: NAVY })], alignment: AlignmentType.CENTER, spacing: { before: 800, after: 200 } }));
  c.push(new Paragraph({ children: [new TextRun({ text: 'Learning Bridge+  ·  My Voice', size: 24, color: PLUM })], alignment: AlignmentType.CENTER, spacing: { after: 600 } }));
  c.push(new Paragraph({ children: [new TextRun({ text: 'This book belongs to:', size: 26, color: GREY })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
  c.push(writeLine());
  c.push(new Paragraph({ children: [new TextRun({ text: 'Draw yourself:', size: 22, color: GREY })], spacing: { before: 240, after: 120 } }));
  c.push(box(2600));
  c.push(pageBreak());
  // My name
  c.push(...wbTitle('My name', 'Trace your name. Do it as many times as you like.'));
  for (let i = 0; i < 4; i++) c.push(writeLine());
  c.push(new Paragraph({ children: [new TextRun({ text: 'The first sound of my name:', size: 22, color: GREY })], spacing: { before: 300, after: 120 } }));
  c.push(box(1400));
  c.push(pageBreak());
  // My sounds and words
  c.push(...wbTitle('My sounds and words', 'Draw a thing, write its English word, and add your own word for it.'));
  c.push(gridBoxes(3, 4, 1500, 'draw + word'));
  c.push(pageBreak());
  // Words about me
  c.push(...wbTitle('Words about me', 'Draw in each box. Your facilitator will help with the English word.'));
  const labelsRow = (a, b2) => new TableRow({ children: [a, b2].map((t) => new TableCell({ width: { size: 5400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 22, color: PLUM })] }), new Paragraph('')] })) });
  const drawRow = () => new TableRow({ height: { value: 1900, rule: 'atLeast' }, children: [0, 1].map(() => new TableCell({ width: { size: 5400, type: WidthType.DXA }, children: [new Paragraph('')] })) });
  c.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [5400, 5400], rows: [labelsRow('My family', 'Where I am from'), drawRow(), labelsRow('Things I like', 'Food I like'), drawRow()] }));
  c.push(pageBreak());
  // My sentences
  c.push(...wbTitle('I can say who I am', 'Say each sentence. Write or trace the ending if you can.'));
  ['I am ________________________', 'I am from ________________________', 'I like ________________________', 'I am good at ________________________'].forEach((s) => {
    c.push(new Paragraph({ children: [new TextRun({ text: s, size: 30, color: NAVY })], spacing: { before: 260, after: 200 } }));
  });
  c.push(pageBreak());
  // Writing practice
  c.push(...wbTitle('My writing practice'));
  c.push(new Paragraph({ children: [new TextRun({ text: 'My name', bold: true, size: 22, color: PLUM })], spacing: { after: 80 } }));
  for (let i = 0; i < 3; i++) c.push(writeLine());
  c.push(new Paragraph({ children: [new TextRun({ text: 'My words', bold: true, size: 22, color: PLUM })], spacing: { before: 200, after: 80 } }));
  for (let i = 0; i < 4; i++) c.push(writeLine());
  c.push(pageBreak());
  // My Name My Voice card
  c.push(...wbTitle('My Name, My Voice', 'Design your card. Put your name big, and draw or write what shows who you are.'));
  c.push(box(6200));
  c.push(pageBreak());
  // I can... checklist
  c.push(...wbTitle('I can…', 'Mark how you feel now. Your facilitator will read each one. Circle a face. There are no wrong answers.'));
  const canItems = [
    'I can say hello and my name in English',
    'I can hear and say the sounds of English',
    'I can find and write the letters of my name',
    'I can say some words about me (my family, where I am from, what I like)',
    'I can write my name and some words',
    'I can say who I am (I am…, I am from…, I like…)',
    'I can meet someone and introduce myself',
    'I can show and talk about my My Name, My Voice card',
  ];
  const hdr = ['I can…', 'Start', 'End'].map((t, i) => new TableCell({ width: { size: i === 0 ? 7200 : 1800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 20, color: NAVY })] })] }));
  const rowsC = [new TableRow({ tableHeader: true, children: hdr })];
  canItems.forEach((it) => {
    rowsC.push(new TableRow({ height: { value: 700, rule: 'atLeast' }, children: [
      new TableCell({ width: { size: 7200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: it, size: 21 })] })] }),
      ...[0, 1].map(() => new TableCell({ width: { size: 1800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: ':)   :|   :(', size: 20, color: GREY })] })] })),
    ] }));
  });
  c.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [7200, 1800, 1800], rows: rowsC }));
  c.push(pageBreak());
  // How I have grown
  c.push(...wbTitle('How my voice has grown', 'Draw or mark one way your English has grown since the start.'));
  c.push(box(4200));
  c.push(new Paragraph({ children: [new TextRun({ text: 'One thing I want to keep learning:', size: 22, color: GREY })], spacing: { before: 240, after: 120 } }));
  c.push(writeLine());
  return new Document({ styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } }, sections: [{ properties: { page: LETTER }, children: c }] });
}

// ============================================================ LETTER & PICTURE CARDS
function cards() {
  const c = [];
  const bigCellGrid = (items, cols, rowH, fmt) => {
    const colW = Math.floor(10800 / cols);
    const trs = [];
    for (let i = 0; i < items.length; i += cols) {
      const rowItems = items.slice(i, i + cols);
      while (rowItems.length < cols) rowItems.push(null);
      trs.push(new TableRow({ height: { value: rowH, rule: 'atLeast' }, children: rowItems.map((it) => new TableCell({ width: { size: colW, type: WidthType.DXA }, verticalAlign: 'center', children: it == null ? [new Paragraph('')] : fmt(it) })) }));
    }
    return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: Array(cols).fill(colW), rows: trs });
  };
  c.push(new Paragraph({ children: [new TextRun({ text: 'My Voice — letter & picture cards', bold: true, size: 34, color: NAVY })], spacing: { after: 60 } }));
  c.push(P('Print and cut along the lines. Editable — change or add cards for your group.', { size: 20, color: GREY, after: 160 }));
  c.push(H2('Alphabet cards'));
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((u) => `${u} ${u.toLowerCase()}`);
  c.push(bigCellGrid(alpha, 4, 1500, (t) => [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: t, bold: true, size: 56, color: NAVY })] })]));
  c.push(pageBreak());
  c.push(H2('Key sound cards'));
  c.push(P('The sounds My Voice focuses on. Say the sound, not the letter name.', { size: 20, color: GREY, after: 120 }));
  const sounds = ['a', 'o', 'u', 's', 't', 'l', 'm', 'n', 'k', 'p', 'b', 'd', 'g'];
  c.push(bigCellGrid(sounds, 4, 1500, (t) => [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: t, bold: true, size: 60, color: PLUM })] })]));
  c.push(pageBreak());
  c.push(H2('Picture-word cards (blank)'));
  c.push(P('Make your own vocabulary cards: draw the thing in the box, write the English word on the line.', { size: 20, color: GREY, after: 120 }));
  const blanks = Array.from({ length: 9 }, () => 'x');
  c.push(bigCellGrid(blanks, 3, 2100, () => [new Paragraph({ children: [new TextRun({ text: '', size: 20 })] }), new Paragraph({ text: '', border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '888888' } }, spacing: { before: 1500 } })]));
  return new Document({ styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } }, sections: [{ properties: { page: LETTER }, children: c }] });
}

// ============================================================ WRITE
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [
    ['my-voice-facilitator-unit-plan.docx', facilitatorPlan()],
    ['my-voice-student-workbook.docx', workbook()],
    ['my-voice-letter-and-picture-cards.docx', cards()],
  ];
  for (const [name, doc] of jobs) {
    const buf = await Packer.toBuffer(doc);
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log('wrote', name, (buf.length / 1024).toFixed(1) + ' KB');
  }
})();
