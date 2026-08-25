/* Generate the printable PIP artefacts referenced by the pip-* materials.
   Produces real, printable Word files in public/downloads/:
     - pip-strengths-and-growth-reflection-worksheet.docx / -template.docx
     - pip-challenges-brainstorm-worksheet.docx / -template.docx
     - pip-planning-template-worksheet.docx / -template.docx
     - pip-examples-of-student-journeys.docx   (reading + discussion questions)
     - pip-assessment-rubric.docx              (facilitator rubric, copy per learner)
   Content is kept faithful to the source PIP resource pack and to the learnerContent in the
   matching content-source/materials/pip-*.yaml files. No learner data from the source pack is
   reproduced (the filled-in brainstorms and student presentation videos are excluded by design).
   Run:  node scripts/downloads/generate-pip.js
   Override output dir:  OUT_DIR=/tmp/pack node scripts/downloads/generate-pip.js */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak, HeadingLevel,
} = require('docx');

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
const cell = (children, w, opts = {}) => new TableCell({ width: { size: w, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, shading: opts.fill ? { type: 'clear', color: 'auto', fill: opts.fill } : undefined, children });
const headCell = (text, w) => cell([new Paragraph({ children: [new TextRun({ text, bold: true, size: 22, color: 'FFFFFF' })] })], w, { fill: NAVY });
const doc = (children) => new Document({ sections: [{ properties: { page: LETTER }, children }] });

async function write(name, d) {
  fs.mkdirSync(OUT, { recursive: true });
  const buf = await Packer.toBuffer(d);
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log('wrote', path.join(OUT, name));
}

// ============================================================
// 1. Strengths and growth reflection (KSAV)
// ============================================================
const KSAV_COLS = [
  { name: 'Knowledge', gloss: 'things you know about the world' },
  { name: 'Skills', gloss: 'things you can do well in the world' },
  { name: 'Attitudes and values', gloss: 'the principles and beliefs that shape your choices and actions' },
];
const KSAV_ROWS = {
  Strength: [
    'What are you knowledgeable about that you could use to make a positive impact? How could you use it?',
    'What can you do well that you could apply in real situations to make a positive impact? How?',
    'What principles and beliefs guide your choices? How could they help you decide what to do?',
  ],
  Development: [
    'What do you want to know more about, and could research to find out? How would you find out?',
    'What do you wish you could do better, and could learn and practise? How would you practise it?',
    'What principles or beliefs would you like to explore more, to support choices you want to make?',
  ],
};

function ksavColWidth() { return [3200, 3200, 3200]; }
function ksavHeaderRow() {
  return new TableRow({ tableHeader: true, children: KSAV_COLS.map((c, i) => cell([
    new Paragraph({ children: [new TextRun({ text: c.name, bold: true, size: 22, color: 'FFFFFF' })] }),
    new Paragraph({ children: [new TextRun({ text: c.gloss, italics: true, size: 17, color: 'FFFFFF' })] }),
  ], ksavColWidth()[i], { fill: NAVY })) });
}
function ksavBodyRow(label, guided) {
  const labelPara = new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: label, bold: true, size: 21, color: PLUM })] });
  const rows = [];
  // A label row spanning the intent, then a content row per column.
  return new TableRow({ height: { value: guided ? 1700 : 1300, rule: 'atLeast' }, children: KSAV_COLS.map((c, i) => {
    const kids = [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, color: PLUM })] })];
    if (guided) kids.push(new Paragraph({ spacing: { before: 40 }, children: [new TextRun({ text: KSAV_ROWS[label][i], size: 18, color: GREY })] }));
    return cell(kids, ksavColWidth()[i]);
  }) });
}
function ksavTable(guided) {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: ksavColWidth(),
    rows: [ksavHeaderRow(), ksavBodyRow('Strength', guided), ksavBodyRow('Development', guided)] });
}
function ksavWorksheet() {
  return doc([
    H1('Strengths and growth reflection'),
    P('Before you choose a project, look honestly at what you already bring and where you want to grow. Fill in the table for yourself. You can use as much or as little of it as you like.', { color: GREY, after: 160 }),
    H2('Your reflection'),
    ksavTable(true),
    P('Conclusion', { bold: true, color: TEAL, before: 220, after: 40 }),
    P('Looking at your strengths and the ways you want to grow, what ideas for a personal interest project are starting to emerge? Write down one or two to carry forward.', { size: 21, color: GREY, after: 80 }),
    ...writeLines(4),
    pageBreak(),
    H2('Blank template'),
    P('The same three columns with no questions, for when you want a clean sheet.', { italics: true, color: GREY, after: 120 }),
    ksavTable(false),
  ]);
}
function ksavTemplate() {
  return doc([
    H1('Strengths and growth reflection - template'),
    P('Knowledge (what you know) · Skills (what you can do) · Attitudes and values (what you believe). For each, note a strength and an area you want to develop.', { color: GREY, after: 140 }),
    ksavTable(false),
    P('Conclusion: what project ideas are emerging from this reflection?', { bold: true, before: 200, after: 60 }),
    ...writeLines(3),
  ]);
}

// ============================================================
// 2. Challenges brainstorm (personal / community / global)
// ============================================================
const CB_COLS = [
  { name: 'Personal challenge', prompt: 'Challenges you face yourself. For example: money or internet access, time, family responsibilities, a skill you lack, worries about your future.' },
  { name: 'Community challenge', prompt: 'Challenges faced by a community you belong to. Community is broad: your camp or village, a religious group, a sports team, women in your community, anyone who shares a situation with you.' },
  { name: 'Global challenge', prompt: 'Challenges that, if left unaddressed, would cause problems for the world. For example: climate change, inequality, the loss of nature.' },
];
function cbTable(guided) {
  const widths = [3200, 3200, 3200];
  const header = new TableRow({ tableHeader: true, children: CB_COLS.map((c, i) => headCell(c.name, widths[i])) });
  const promptRow = guided ? new TableRow({ children: CB_COLS.map((c, i) => cell([new Paragraph({ children: [new TextRun({ text: c.prompt, size: 17, color: GREY })] })], widths[i])) }) : null;
  const writeRow = new TableRow({ height: { value: 4200, rule: 'atLeast' }, children: CB_COLS.map((c, i) => cell([new Paragraph({ children: [new TextRun({ text: '', size: 22 })] })], widths[i])) });
  const rows = [header];
  if (promptRow) rows.push(promptRow);
  rows.push(writeRow);
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: widths, rows });
}
function cbWorksheet() {
  return doc([
    H1('Challenges brainstorm'),
    P('Generate a list of challenges that could become your project. Write as many as you can in each column. Do not filter yet, and do not worry about solving them.', { color: GREY, after: 160 }),
    cbTable(true),
    P('Conclusion', { bold: true, color: TEAL, before: 220, after: 40 }),
    P('Out of all the challenges you have identified, which interest you the most? Which feel like ones you could make a realistic impact on in the time you have, not too small, but not too big? Write down one or two to carry forward.', { size: 21, color: GREY, after: 80 }),
    ...writeLines(4),
    pageBreak(),
    H2('Blank template'),
    P('The same three columns with no prompts, for a clean sheet.', { italics: true, color: GREY, after: 120 }),
    cbTable(false),
  ]);
}
function cbTemplate() {
  return doc([
    H1('Challenges brainstorm - template'),
    P('Personal · Community · Global. List as many challenges as you can in each column.', { color: GREY, after: 140 }),
    cbTable(false),
    P('Conclusion: which challenges interest you most, and which are the right size to act on?', { bold: true, before: 200, after: 60 }),
    ...writeLines(3),
  ]);
}

// ============================================================
// 3. PIP planning template
// ============================================================
const PLAN_FIELDS = [
  { name: 'People involved', prompt: 'The names of everyone working on this project.' },
  { name: 'Area of focus', prompt: 'Briefly describe the challenge, problem, topic or idea the project will focus on.' },
  { name: 'Personal interest', prompt: 'Briefly describe why this matters to you.' },
  { name: 'Current understanding', prompt: 'Briefly describe what you already know, or have already done, about it.' },
  { name: 'Intended outcome', prompt: 'Briefly describe what you hope to achieve by the end of the project.' },
  { name: 'Next steps', prompt: 'Briefly describe how you will get started.' },
];
function planField(f, guided, lines) {
  return [
    new Paragraph({ spacing: { before: 160, after: 40 }, children: [new TextRun({ text: f.name, bold: true, size: 24, color: NAVY })] }),
    ...(guided ? [P(f.prompt, { size: 20, color: GREY, after: 60 })] : []),
    ...writeLines(lines),
  ];
}
function planWorksheet() {
  const kids = [
    H1('PIP plan'),
    P('Planning gets your ideas out of your head and onto paper, where you can improve them and come back to them. Most plans change as you go, so update yours as the project develops.', { color: GREY, after: 120 }),
    P('Working as a team? A joint plan is fine (up to four people). You can produce a joint artefact and presentation as long as each person’s contribution is clear, but your reflection is always your own.', { italics: true, color: OLIVE, after: 140 }),
  ];
  for (const f of PLAN_FIELDS) kids.push(...planField(f, true, f.name === 'People involved' ? 2 : 3));
  kids.push(P('Submit your plan for feedback, then give yourself time to respond to it. Revising your plan is a good sign, not a bad one.', { bold: true, color: TEAL, before: 200, after: 60 }));
  return doc(kids);
}
function planTemplate() {
  const kids = [
    H1('PIP plan - template'),
    P('Complete each field. Update it as your project develops.', { color: GREY, after: 120 }),
  ];
  for (const f of PLAN_FIELDS) kids.push(...planField(f, false, f.name === 'People involved' ? 2 : 3));
  return doc(kids);
}

// ============================================================
// 4. Examples of student journeys (reading)
// ============================================================
const JOURNEYS = [
  { t: '1. Building on an existing project', b: 'A student took a charity project they were already running and used the PIP to reimagine it, setting a clear new goal rather than carrying on unchanged. They tried expanding it to a new age group, found it did not catch on, went back to research and revised their plan, and ended by curating an exhibition and a celebration event. Their biggest lesson: however well you know your subject, never be afraid to go back to the beginning and ask why something is not working.' },
  { t: '2. A brand-new goal', b: 'A student took a long time to find inspiration, then used the United Nations Sustainable Development Goals to identify a community need. They researched the issue deeply, wrote a careful report, ran an inquiry in their community, and ended with recommendations, planning to act on them after the PIP.' },
  { t: '3. A research question', b: 'A student wanting to study a subject at university used the PIP to produce an independent piece of research, learning to reference properly and to think critically about an ethical issue. They ended with a journal-style article they could add to their transcript.' },
  { t: '4. Learning on the job', b: 'A student wanting to grow at work asked their boss what skills the industry needed, chose ones to develop, enrolled in online courses, and put the learning straight into practice in their job, asking for feedback as they went.' },
  { t: '5. Human-centred design', b: 'A student who had learned human-centred design applied it to a community inquiry using a field guide. They only reached the ideation stage in the time they had, and used that work to pitch a project idea at their final presentation.' },
];
function journeysDoc() {
  const kids = [
    H1('Examples of student PIP journeys'),
    P('Here are five ways past students have shaped a PIP. They are very different on purpose. A PIP can take almost any form, as long as it is a deeper engagement with something you care about.', { color: GREY, after: 160 }),
  ];
  for (const j of JOURNEYS) {
    kids.push(new Paragraph({ spacing: { before: 160, after: 40 }, children: [new TextRun({ text: j.t, bold: true, size: 23, color: NAVY })] }));
    kids.push(P(j.b, { size: 21, after: 60 }));
  }
  kids.push(H2('Discuss'));
  kids.push(bullet('In what ways are these PIPs similar?'));
  kids.push(bullet('In what ways are they different?'));
  kids.push(bullet('What other approaches to a PIP are not shown here?'));
  kids.push(bullet('What does this make you think about for your own PIP?'));
  return doc(kids);
}

// ============================================================
// 5. Assessment rubric (facilitator, copy per learner)
// ============================================================
const RUBRIC = [
  { c: 'Focus', p: 'A focus is established (for example, a problem the student intends to address is outlined and described). The reason for the focus is made clear (for example, the student explains why the problem is important).' },
  { c: 'Methodology', p: 'The approach the student took during the PIP is outlined (for example, how they investigated a problem, analysed data, worked towards a solution, and monitored, evaluated and improved it).' },
  { c: 'Knowledge and understanding', p: 'The student demonstrates an understanding of the important facts and knowledge that support success in the project, and has used a variety of sources to support their work.' },
  { c: 'Critical thinking', p: 'The student evaluates the trustworthiness of the sources they used, and outlines findings and recommendations supported by evidence (from their investigation and/or the literature).' },
];
function rubricDoc() {
  const widths = [2400, 4200, 3000];
  const header = new TableRow({ tableHeader: true, children: [headCell('Criterion', widths[0]), headCell('Passing criteria', widths[1]), headCell('Facilitator comments', widths[2])] });
  const rows = [header];
  for (const r of RUBRIC) {
    rows.push(new TableRow({ height: { value: 1600, rule: 'atLeast' }, children: [
      cell([new Paragraph({ children: [new TextRun({ text: r.c, bold: true, size: 21, color: NAVY })] })], widths[0]),
      cell([new Paragraph({ children: [new TextRun({ text: r.p, size: 19 })] })], widths[1]),
      cell([new Paragraph({ children: [new TextRun({ text: '', size: 20 })] })], widths[2]),
    ] }));
  }
  return doc([
    H1('PIP presentation assessment rubric'),
    P('Make a copy for each student. The PIP is not graded: use this to give developmental feedback and to notice which competencies the presentation may evidence, not to pass or fail.', { color: GREY, after: 100 }),
    P('For each criterion, comment on: in what ways did the student meet the passing criteria? In what ways did they exceed them? In what ways could they improve the presentation, and the project itself? Which competency success indicators might they have evidenced?', { italics: true, color: GREY, after: 140 }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: widths, rows }),
    P('Note: these criteria lean towards investigative PIPs. For a personal or creative project, read them generously. Focus and methodology still apply; knowledge and critical thinking may show up as reflection on practice and honest self-evaluation rather than source evaluation.', { size: 19, italics: true, color: OLIVE, before: 200 }),
  ]);
}

(async () => {
  await write('pip-strengths-and-growth-reflection-worksheet.docx', ksavWorksheet());
  await write('pip-strengths-and-growth-reflection-template.docx', ksavTemplate());
  await write('pip-challenges-brainstorm-worksheet.docx', cbWorksheet());
  await write('pip-challenges-brainstorm-template.docx', cbTemplate());
  await write('pip-planning-template-worksheet.docx', planWorksheet());
  await write('pip-planning-template-template.docx', planTemplate());
  await write('pip-examples-of-student-journeys.docx', journeysDoc());
  await write('pip-assessment-rubric.docx', rubricDoc());
})();
