/* Generate the Mentoring and Wellbeing pack for Learning Bridge+ (Cox's Bazar):
     - lb-coxs-bazar-mentoring-guide.docx   (the whole component, for the facilitator/mentor)
     - lb-coxs-bazar-mentor-record.docx     (one page per learner, for the twelve weeks)

   Mentoring was named as a component and as "the spine of wellbeing support" but had no pack at all -
   343 words in the Educator Guide and a pointer to a website a facilitator in a CBLF cannot reach.

   Like the other component generators, this exports children builders so generate-lb-guides.js can
   compose Part 2 (the guide) and Part 9C (the record) from exactly the same content the standalone
   files carry - they cannot drift.

   Everything is rendered from the authored YAML: units/coxs-bazar-mentoring-and-wellbeing.yaml and
   the cb-mn-* materials.

   Run:  node scripts/downloads/generate-mentoring.js
   Override output dir:  OUT_DIR=/tmp/pack node scripts/downloads/generate-mentoring.js */
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { Packer } = require('docx');
const S = require('./lib/docx-style');

const {
  NAVY, PLUM, GREY, OLIVE, LINE,
  P, body, bullet, H1, H2, H3, mini, hr, pageBreak, box,
  refTable, callout, makeDoc, contents, printNotes, mdBlocks, image, LOGO,
  Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
} = S;

const ROOT = path.resolve(__dirname, '..', '..');
const CS = path.join(ROOT, 'content-source');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'downloads');
const rd = (p) => yaml.parse(fs.readFileSync(p, 'utf8'));

const unit = rd(path.join(CS, 'units', 'coxs-bazar-mentoring-and-wellbeing.yaml'));
// The programme's own mentoring block: the role areas and their Cox's Bazar context notes. Read from
// there rather than restated, so the guide and the programme page say the same thing.
const programme = rd(path.join(CS, 'programmes', 'learning-bridge-coxs-bazar.yaml'));

const mat = {};
for (const f of fs.readdirSync(path.join(CS, 'materials')).filter((f) => f.startsWith('cb-mn-'))) {
  const m = rd(path.join(CS, 'materials', f));
  mat[m.slug] = m;
}

const FOOTER_TEXT = "Learning Bridge+ (Cox's Bazar) · Mentoring and Wellbeing · Amala Education with NRC";

// ============================================================ THE GUIDE

// The reference materials, in the order a mentor needs them: set up, know the pathway, learn the
// shape, set up the record. Each is a section rendered from its authored educatorContent.
const REFERENCE_ORDER = [
  ['cb-mn-running-mentoring-here', 'Setting up your mentoring'],
  ['cb-mn-safeguarding-and-referral', 'Safeguarding and referral'],
  ['cb-mn-the-conversation', 'The ten-minute conversation'],
  ['cb-mn-mentor-record', 'The mentor’s record'],
];

// Materials that belong to a phase of the arc rather than to the reference section, so they are not
// printed twice: the arc references them, and they are written out in full once, after it.
const ARC_ONLY = [
  ['cb-mn-re-anchoring-after-absence', 'Picking a learner back up after an absence'],
  ['cb-mn-surfacing-growth', 'Surfacing the growth a learner cannot see'],
  ['cb-mn-significant-adult-meeting', 'The significant adult meeting (optional)'],
  ['cb-mn-what-next-conversation', 'The what-next conversation (Week 12)'],
];

function section(slug, heading, { learner = false } = {}) {
  const m = mat[slug];
  if (!m || !m.educatorContent) return [];
  const c = [pageBreak(), H1(heading)];
  if (m.summary) c.push(P(m.summary, { size: 21, italics: true, color: GREY, after: 120 }));
  c.push(...mdBlocks(m.educatorContent));
  if (learner && m.learnerContent) {
    c.push(mini('What the learner is told'));
    c.push(...mdBlocks(m.learnerContent));
  }
  return c;
}

// The arc: one row per phase, so a mentor can see at a glance which part of the relationship they are
// in and what the conversations are mostly for. Computed from the unit's phases.
function arcChildren() {
  const c = [pageBreak(), H1('The arc across twelve weeks')];
  c.push(P('A mentoring relationship has phases, and which one you are in changes what the conversation is for. The full guidance for each block follows this table.', { size: 22 }));
  c.push(refTable(['When', 'What the conversations are mostly for'], unit.phases.map((ph) => ([
    { lines: [ph.title], bold: true },
    { lines: [ph.summary || ''], color: undefined },
  ])), [3200, 7600]));

  unit.phases.forEach((ph) => {
    c.push(H2(ph.title));
    if (ph.summary) c.push(P(ph.summary, { size: 21, italics: true, color: GREY }));
    ph.blocks.forEach((b) => {
      c.push(H3(b.title));
      if (b.description) c.push(...body(b.description));
      if (b.independentTask) {
        c.push(P(`What the learner leaves with:  ${b.independentTask}`, { size: 20, color: OLIVE, bold: true }));
      }
      if (b.flexNote) c.push(callout('Watch for', [b.flexNote], PLUM));
      const m = b.materialSlug ? mat[b.materialSlug] : null;
      if (m) c.push(P(`Full guidance: “${m.title}”.`, { size: 19, italics: true, color: GREY }));
    });
  });
  return c;
}

// The programme's own mentoring context, by role area - held here rather than restated, so the guide
// and the programme page cannot say different things.
function contextChildren() {
  const men = programme.mentoring;
  if (!men) return [];
  const c = [pageBreak(), H1('Mentoring in this context')];
  c.push(P(men.intro, { size: 22 }));
  if ((men.context || []).length) {
    c.push(H2('How it runs here'));
    men.context.forEach((x) => { c.push(mini(x.title)); c.push(P(x.detail, { size: 22 })); });
  }
  if ((men.areas || []).length) {
    c.push(H2('The five things mentoring holds'));
    c.push(P('Amala’s shared mentoring practice covers these five areas. The note against each says how it is held in the camps.', { size: 22 }));
    const LABEL = {
      wellbeing: 'Wellbeing and belonging',
      safeguarding: 'Safeguarding',
      progress: 'Progress',
      'recognising-growth': 'Recognising growth',
      pathways: 'Pathways',
    };
    c.push(refTable(['Area', 'How it is held here'], men.areas.map((a) => ([
      { lines: [LABEL[a.area] || a.area], bold: true },
      { lines: [a.contextNote], color: undefined },
    ])), [2600, 8200]));
  }
  return c;
}

const { componentGuideChildren } = require('./lib/course-guide');

function guideChildren(opts = {}) {
  const c = [];
  if (!opts.embedded) {
    c.push(...body(unit.summary));
  }
  // What the component is working towards, before how it is run - the equivalent of the course guide
  // the three taught components render.
  c.push(...componentGuideChildren(unit));
  c.push(pageBreak());
  c.push(S.eyebrow ? S.eyebrow('How this component works') : mini('How this component works'));
  c.push(...body(unit.deliveryApproach));
  c.push(mini('Mentoring and assessment'));
  c.push(...body(unit.assessmentNote));
  c.push(callout('Before you take a single learner', [
    'Know NRC’s Code of Conduct, and the MHPSS and protection referral pathway - the actual name of the person you hand a concern to, written down and to hand.',
    'You are a mentor, not a counsellor. You notice, you steady, and you refer.',
    'Agree your caseload size, your pairing for gender and language, and where your records live, with your coordinator.',
  ], PLUM));

  c.push(...contextChildren());
  REFERENCE_ORDER.forEach(([slug, heading]) => c.push(...section(slug, heading, { learner: slug === 'cb-mn-mentor-record' })));
  c.push(...arcChildren());
  ARC_ONLY.forEach(([slug, heading]) => c.push(...section(slug, heading, { learner: slug === 'cb-mn-significant-adult-meeting' })));
  return c.filter(Boolean);
}

function guide() {
  const c = [];
  c.push(image(LOGO, 150, 77, { after: 200 }));
  c.push(P("Learning Bridge+ (Cox's Bazar)", { size: 22, bold: true, color: OLIVE, after: 20 }));
  c.push(new Paragraph({ children: [new TextRun({ text: 'Mentoring and Wellbeing', bold: true, size: 52, color: NAVY })], spacing: { after: 40 } }));
  c.push(P('Mentor Guide', { size: 30, bold: true, color: PLUM, after: 200 }));
  c.push(...printNotes('guide', ['If paper is short, print "Safeguarding and referral" and "The ten-minute conversation" first - those two you need in your hand.']));
  c.push(...contents('The sections of this guide, with the page each one starts on. Word fills the numbers in when this file is opened.'));
  c.push(...guideChildren());
  c.push(P('This guide is part of a fully offline, editable pack. Not for redistribution outside the programme.', { size: 18, color: GREY, before: 240 }));
  return makeDoc(c, { footerText: FOOTER_TEXT });
}

// ============================================================ THE MENTOR'S RECORD
// One page per learner, for twelve weeks. Deliberately thin: continuity and pattern, nothing else.
// What is NOT on it matters as much as what is - see cb-mn-mentor-record.

const line = (label, width = '____________________________') =>
  new Paragraph({
    children: [
      new TextRun({ text: `${label}  `, size: 21, color: NAVY, bold: true }),
      new TextRun({ text: width, size: 21, color: LINE }),
    ],
    spacing: { after: 140 },
  });

function weekTable(rows = 12) {
  const colW = S.scaleW([900, 3600, 3400, 2100, 800]);
  const head = ['Week', 'Step we agreed', 'What I noticed (facts, not diagnosis)', 'Last step happened?', 'Flag'];
  const trs = [new TableRow({ tableHeader: true, children: head.map((t, i) => new TableCell({
    width: { size: colW[i], type: WidthType.DXA },
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 17, color: NAVY })] })],
  })) })];
  for (let w = 1; w <= rows; w++) {
    trs.push(new TableRow({ height: { value: 620, rule: 'atLeast' }, cantSplit: true, children: colW.map((width, i) => new TableCell({
      width: { size: width, type: WidthType.DXA },
      margins: { top: 90, bottom: 90, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: i === 0 ? String(w) : '', size: 19, color: i === 0 ? PLUM : undefined, bold: i === 0 })] })],
    })) }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: colW, rows: trs });
}

function recordChildren() {
  const c = [];
  c.push(P('Mentor’s record', { size: 44, bold: true, color: NAVY, after: 40 }));
  c.push(P('One page per learner · the whole twelve weeks', { size: 24, bold: true, color: PLUM, after: 40 }));
  c.push(P("Learning Bridge+ (Cox's Bazar)  ·  make one copy per learner on your caseload", { size: 20, color: GREY, after: 160 }));
  c.push(callout('The test for anything you write here', [
    'Would you be willing to read this line aloud to the learner? If not, it does not go on this page.',
    'Details of a disclosure are NOT recorded here. They go, separately and in the learner’s own words, to the person you refer to.',
    'One page, one learner. Keep it where another learner cannot read it.',
  ], PLUM));
  c.push(line('Learner'));
  c.push(line('Language we talk in'));
  c.push(line('Their other facilitators'));
  c.push(line('Their learning goal (update it when it changes)'));
  c.push(P('Flag key:   ! = watch this   → = referred (write the date)', { size: 19, color: GREY, after: 120 }));
  c.push(weekTable(12));
  c.push(P('Read the WHOLE page every few weeks, not just the last row. The pattern is the point, and it is invisible one row at a time.', { size: 20, italics: true, color: OLIVE, before: 160 }));
  c.push(P('Bring this to the Week-6 and Week-12 judgements. What you saw and heard in mentoring is legitimate evidence - for a learner who cannot yet write, it may be your strongest.', { size: 20, italics: true, color: GREY, before: 60 }));
  return c;
}

function record() { return makeDoc(recordChildren(), { footerText: FOOTER_TEXT }); }

// ============================================================ EXPORTS / WRITE
module.exports = { unit, mat, guideChildren, recordChildren, arcChildren, contextChildren, section };

if (require.main === module) {
  fs.mkdirSync(OUT, { recursive: true });
  const files = [
    ['lb-coxs-bazar-mentoring-guide.docx', guide()],
    ['lb-coxs-bazar-mentor-record.docx', record()],
  ];
  Promise.all(files.map(async ([name, doc]) => {
    const buf = await Packer.toBuffer(doc);
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log('wrote', name, (buf.length / 1024).toFixed(1) + ' KB');
  }));
}
