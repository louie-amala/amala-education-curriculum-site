/* Generate the Agency in Learning (Cox's Bazar) offline pack:
     - agency-in-learning-facilitator-unit-plan.docx   (the full 50-hour plan, guidance inline)
     - agency-in-learning-student-workbook.docx        (My Learning Book, visual-first learner pages)
   The plan is rendered from the authored YAML (coxs-bazar-agency-in-learning.yaml + the cb-ail-*
   materials) so the printed plan stays a faithful copy of the site. Re-run after editing either.

   It also exports its children builders, so the one-stop Educator Guide
   (scripts/downloads/generate-lb-guides.js) embeds exactly this content and cannot drift from it.

   Run:  node scripts/downloads/generate-ail.js
   Override output dir:  OUT_DIR=/tmp/pack node scripts/downloads/generate-ail.js */
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { Packer, Table, TableRow, TableCell, WidthType } = require('docx');
const S = require('./lib/docx-style');

const {
  NAVY, PLUM, GREY, OLIVE,
  toParas, P, body, bullet, label, H1, H2, H3, eyebrow, hr, pageBreak,
  box, slot, writeBox, notesPage, bold, gridBoxes, refTable, callout, makeDoc, Paragraph, TextRun, AlignmentType,
  LOGO, image, iconLine, imgRun, icon, mdBlocks, eyebrowChip, noteBox, scribe,
} = S;

const ROOT = path.resolve(__dirname, '..', '..');
const CS = path.join(ROOT, 'content-source');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'downloads');
const rd = (p) => yaml.parse(fs.readFileSync(p, 'utf8'));

const unit = rd(path.join(CS, 'units', 'coxs-bazar-agency-in-learning.yaml'));
// Amala's official proficiency scale. Read from the framework so the record cannot drift from it.
const scale = rd(path.join(CS, 'framework', 'proficiency-scale.yaml'));
const course = rd(path.join(CS, 'courses', 'agency-in-learning.yaml'));
// The competency framework, for the anchor competency's official title and goal in the course guide.
const competencies = rd(path.join(CS, 'framework', 'competencies.yaml'));
const { courseGuideChildren } = require('./lib/course-guide');
const mat = {};
for (const f of fs.readdirSync(path.join(CS, 'materials')).filter((f) => f.startsWith('cb-ail-'))) {
  const m = rd(path.join(CS, 'materials', f));
  mat[m.slug] = m;
}
const objStatement = (oid) => {
  if (!oid) return null;
  const n = parseInt(oid.split('--o')[1], 10);
  const o = course.objectives[n - 1];
  return o ? o.statement.trim() : null;
};
const LEAD = {
  'facilitator-led': 'You lead, directed and safe (scaffolding stays high)',
  shared: 'Shared, learners choose, you scaffold closely (scaffolding stays high)',
  'learner-led': 'Learners lead the goal, support stays high (you coach, prompt, steady)',
};
const KIND = { activity: 'Activity', practice: 'Practice', orientation: 'Orientation', consolidation: 'Consolidation', assessment: 'Assessment' };
const ADAPT = { group: 'With a group', 'one-to-one-mentoring': 'In 1:1 mentoring', independent: 'If a learner works alone' };
const FOOTER_TEXT = "Agency in Learning  \u00b7  Learning Bridge+ (Cox's Bazar)";
const hrs = (n) => (n === 1 ? '1h' : n < 1 ? `${Math.round(n * 60)} min` : `${n}h`);

// ============================================================ FACILITATOR PLAN
// Renders one activity block (heading + all inline guidance). Shared by the plan and the guide.
function blockChildren(b) {
  const c = [];
  c.push(H2(b.title));
  const bits = [KIND[b.kind] || 'Activity', `${hrs(b.facilitatedHours)} in-person`];
  if (b.independentHours) bits.push(`${hrs(b.independentHours)} independent`);
  c.push(P(bits.join('   ·   '), { size: 20, color: OLIVE, bold: true, after: 100 }));
  if (b.description) c.push(...body(b.description));
  const m = b.materialSlug ? mat[b.materialSlug] : null;
  if (m) {
    if (m.summary) c.push(P(toParas(m.summary).join(' '), { italics: true, size: 22, color: GREY }));
    const meta = [m.duration && `Timing: ${m.duration}`, m.grouping && `Grouping: ${m.grouping}`].filter(Boolean);
    if (meta.length) c.push(P(meta.join('   ·   '), { size: 20, color: GREY, after: 100 }));
    // The subject brief: what a facilitator needs to KNOW to teach this block, not just how to run
    // it. Offline this is the only place they can read it, so it comes before the practical detail.
    // Where the learner's sheet for this block lives, by sheet number. The educator is holding a
    // different document, so "the workbook page" was not enough to find it by.
    if (m.worksheet && m.worksheet.slug) {
      const idx = sheetIndex();
      const ws = mat[m.worksheet.slug];
      const no = idx.get(m.worksheet.slug) || (ws && idx.get(ws.title));
      // The name as PRINTED in the book, so the educator and the learner are looking for the same thing.
      const printed = SHEET_LIST.find((x) => x.n === no);
      const name = printed ? printed.heading : (ws ? ws.title : m.worksheet.slug);
      c.push(P(no
        ? `LEARNER SHEET:  Sheet ${no}, \u201c${name}\u201d, in My Learning Book (a separate file, one per learner).`
        : `LEARNER SHEET:  \u201c${name}\u201d, in My Learning Book (a separate file, one per learner).`,
        { size: 20, bold: true, color: OLIVE, after: 100 }));
    }
    if (m.educatorContent) c.push(...mdBlocks(m.educatorContent));
    if (m.learnerTeaching) {
      c.push(P(`The learners have this taught in their own book, on the \u201c${m.learnerTeaching.title}\u201d page, read it aloud to the group.`, { size: 20, italics: true, color: GREY, after: 100 }));
    }
    if (m.facilitationNotes) { c.push(eyebrow('The one thing to get right')); c.push(...body(m.facilitationNotes)); }
    if (m.whatLearnersDo && m.whatLearnersDo.length) { c.push(eyebrow('What learners do')); m.whatLearnersDo.forEach((x) => c.push(bullet(x))); }
    if (m.materialsAndPreparation && m.materialsAndPreparation.length) { c.push(eyebrow('Prepare')); m.materialsAndPreparation.forEach((x) => c.push(bullet(x))); }
    (m.steps || []).forEach((s, si) => {
      c.push(H3(`${si + 1}. ${s.title}${s.duration ? '   ' + s.duration : ''}`));
      c.push(...body(s.guidance));
      if (s.keyPrompts && s.keyPrompts.length) { c.push(P('Ask:', { size: 20, bold: true, color: PLUM, after: 40 })); s.keyPrompts.forEach((x) => c.push(bullet(x))); }
      if (s.watchOuts && s.watchOuts.length) { c.push(P('Watch out:', { size: 20, bold: true, color: PLUM, after: 40 })); s.watchOuts.forEach((x) => c.push(bullet(x))); }
      if (s.adaptation) c.push(label('If low-resource:', toParas(s.adaptation).join(' ')));
    });
    if (m.closing) { c.push(eyebrow('Closing')); c.push(...body(m.closing)); }
    if (m.deliveryAdaptations && m.deliveryAdaptations.length) {
      c.push(eyebrow('Running it a different way'));
      m.deliveryAdaptations.forEach((a) => c.push(label(`${ADAPT[a.context] || a.context}:`, toParas(a.how).join(' '))));
    }
  }
  if (b.independentTask) {
    c.push(eyebrow(`Independent task${b.independentHours ? ` (${hrs(b.independentHours)})` : ''}`));
    c.push(P(b.independentTask, { size: 22 }));
  }
  if (b.flexNote) c.push(P(toParas(b.flexNote).join(' '), { italics: true, size: 21, color: GREY }));
  c.push(hr());
  return c;
}

// The phases of the unit, rendered in order. `startPage` adds a page break before each phase.
function phaseChildren() {
  const c = [];
  unit.phases.forEach((ph, pi) => {
    c.push(H1(`Phase ${pi + 1}, ${ph.title}`));
    c.push(P(`Who leads: ${LEAD[ph.lead] || ph.lead || ', '}`, { size: 20, color: GREY, italics: true, after: 60 }));
    const os = objStatement(ph.objectiveId);
    if (os) c.push(label('Course objective:', os));
    if (ph.summary) { c.push(eyebrow('Focus of this phase')); c.push(...body(ph.summary)); }
    const fh = ph.blocks.reduce((t, b) => t + (b.facilitatedHours || 0), 0);
    const ih = ph.blocks.reduce((t, b) => t + (b.independentHours || 0), 0);
    const nb = ph.blocks.length;
    c.push(P(`${hrs(fh)} in-person · ${hrs(ih)} independent, across ${nb} ${nb === 1 ? 'block' : 'blocks'}.`, { size: 20, color: OLIVE, bold: true, after: 140 }));
    ph.blocks.forEach((b) => c.push(...blockChildren(b)));
    if (pi < unit.phases.length - 1) c.push(pageBreak());
  });
  return c;
}

// The plan's front matter (summary, hours, how control is handed over, how it is assessed).
function planFrontMatter() {
  const c = [];
  c.push(...body(unit.summary));
  c.push(eyebrow('The whole component'));
  c.push(P(`${unit.totalFacilitatedHours + unit.totalIndependentHours} hours: ${unit.totalFacilitatedHours}h in-person + ${unit.totalIndependentHours}h independent. Set out in hours, not weeks, so you can fit it to your own timetable over a minimum of 10 weeks.`, { size: 22 }));
  c.push(eyebrow('How this unit hands over control'));
  c.push(...body(unit.deliveryApproach));
  c.push(eyebrow('How the competency is assessed'));
  c.push(...body(unit.assessmentNote));
  return c;
}

// The three facilitator resources the Research Project part has and this one did not: what to prepare
// and how to run it with no screen, the protection guidance the activities assume, and how to judge
// FSL2. Rendered from their authored YAML, in the same order the Research Project uses, so the two
// components read the same way for someone moving between them.
function referenceSection(slug, heading) {
  const m = mat[slug];
  if (!m || !m.educatorContent) return [];
  return [pageBreak(), H1(heading),...mdBlocks(m.educatorContent)];
}

function facilitatorPlanChildren() {
  return [
    ...planFrontMatter(),
    // The course guide: what the component is working towards. Without it the plan says what to do,
    // session by session, and never what any of it is for.
    pageBreak(),
    ...courseGuideChildren(course, unit, competencies),
    ...referenceSection('cb-ail-running-this-offline', 'Before you start'),
    ...referenceSection('cb-ail-safeguarding-and-protection', 'Safeguarding and protection'),
    pageBreak(),
    ...phaseChildren(),
    ...referenceSection('cb-ail-assessing-the-goal-work', 'Assessing the goal work (FSL2)'),
  ];
}

function facilitatorPlan() {
  const c = [];
  c.push(image(LOGO, 150, 77, { after: 200 }));
  c.push(P("Learning Bridge+ (Cox's Bazar)", { size: 22, bold: true, color: OLIVE, after: 20 }));
  c.push(new Paragraph({ children: [new TextRun({ text: 'Agency in Learning', bold: true, size: 52, color: NAVY })], spacing: { after: 40 } }));
  c.push(P('Facilitator Unit Plan & Guide', { size: 30, bold: true, color: PLUM, after: 200 }));
  c.push(...S.printNotes('guide'),...S.contents('The phases of the unit and the reference sections, with the page each one starts on. Word fills the numbers in when this file is opened.'));
  c.push(...facilitatorPlanChildren());
  c.push(P('This plan is part of a fully offline, editable pack. Not for redistribution outside the programme.', { size: 18, color: GREY, before: 240 }));
  return makeDoc(c, { footerText: FOOTER_TEXT });
}

// ============================================================ STUDENT WORKBOOK
// "My Learning Book", one visual-first page per activity, in unit order. Authored learner pages
// (they are not derivable from the facilitator YAML), kept here so the book is reproducible.
// The shared locator strip: the part on the left, the page on the right, over a hairline rule. The
// same furniture the other two learner books use, so a bound copy reads as one book.
const eyebrowPair = (phase, title) => S.eyebrow(`${phase}  ·  ${title}`);

const bigTitle = (t, instr) => [
  S.title(t),
  ...(instr ? [S.P(instr, { size: S.BOOK, line: 300, color: GREY, after: 180 })] : []),
];
// A learner writes big, and a drawing is always a valid answer, so a "fill line" is the shared
// lined write box, not a run of underscores.
const fillLine = (lead, nLines = 2) => S.writeBox(lead.replace(/:\s*$/, ''), nLines);
const tickLine = (t) => S.check(t);

// --- Scaffolding helpers: turn a blank "capture" page into a supported one. ---
// A worked example the learner can look at when no adult is beside them. Persists in the book.
const example = (lines) => callout('Example  ·  you can do yours your own way', Array.isArray(lines) ? lines : [lines], OLIVE);
// One row of a decision-aid checklist: a tick box, an icon, and the test in plain words.
const checkItem = (iconName, t) => new Paragraph({
  children: [new TextRun({ text: '☐   ', size: 26 }), imgRun(icon(iconName), 24, 24), new TextRun({ text: '    ' + t, size: 22 })],
  spacing: { before: 120, after: 40 },
});
// An if–then (WOOP) frame: name the usual obstacle, and the smaller thing you will still do.
const ifThenFrame = () => [
  new Paragraph({ children: [new TextRun({ text: 'If this gets in the way…', bold: true, size: 22, color: PLUM })], spacing: { before: 120, after: 40 } }),
  ...slot('What usually stops me is…', 3),
  new Paragraph({ children: [new TextRun({ text: '→   then I will still do this…', bold: true, size: 22, color: OLIVE })], spacing: { before: 80, after: 40 } }),
  ...slot('Then I will still…', 3),
];
// A repeating weekly loop. The scaffold for the between-session pursuit. One row per week:
// the step, whether it happened, and what got in the way. This replaces the blank sticker grid.
const weeklySpread = (weeks) => {
  const W = [900, 3900, 1500, 4500];
  const headCell = (t, i) => new TableCell({
    width: { size: W[i], type: WidthType.DXA }, shading: { fill: 'F0ECE3' },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 18, color: NAVY })] })],
  });
  const rows = [new TableRow({ tableHeader: true, children: ['Week', 'This week I will (my step)', 'Did I?', 'What happened / what got in the way'].map(headCell) })];
  for (let i = 1; i <= weeks; i++) {
    rows.push(new TableRow({ height: { value: 1100, rule: 'atLeast' }, cantSplit: true, children: [
      new TableCell({ width: { size: W[0], type: WidthType.DXA }, margins: { top: 80, left: 120 }, children: [new Paragraph({ children: [new TextRun({ text: String(i), bold: true, size: 24, color: PLUM })] })] }),
      new TableCell({ width: { size: W[1], type: WidthType.DXA }, children: [new Paragraph('')] }),
      new TableCell({ width: { size: W[2], type: WidthType.DXA }, margins: { top: 80, left: 120 }, children: [new Paragraph({ children: [new TextRun({ text: '☐ yes', size: 18 })] }), new Paragraph({ children: [new TextRun({ text: '☐ not yet', size: 18 })] })] }),
      new TableCell({ width: { size: W[3], type: WidthType.DXA }, children: [new Paragraph('')] }),
    ] }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: W, rows });
};

// opts.embedded drops the cover page, so the programme-wide student workbook (generate-lb-guides.js)
// can carry these pages behind its own single cover instead of a fourth one. The standalone
// download passes nothing and is unchanged.
// Sheet numbers for the learner book, and the index the facilitator plan quotes. Built by running the
// workbook builder, so the number printed in the plan is by construction the number printed in the book.
let sheetSeq = 0;
const SHEET_NO = new Map();
const SHEET_LIST = [];

function workbookChildren(opts = {}) {
  sheetSeq = 0; SHEET_NO.clear(); SHEET_LIST.length = 0;
  const c = [];
  // Every activity page is followed by a whole sheet of open, lined space. The scaffolded pages ask
  // for particular things in particular slots; this is where anything they did not ask for can go.
  let currentPage = null;
  const emitted = new Set(['cb-ail-learning-book-cover']);
  const page = (phase, title, heading, instr, sheet) => {
    currentPage = heading;
    if (sheet) emitted.add(sheet);
    const n = ++sheetSeq;
    SHEET_NO.set(heading, n);
    if (sheet && !SHEET_NO.has(sheet)) SHEET_NO.set(sheet, n);
    SHEET_LIST.push({ n, heading, phase });
    c.push(eyebrowPair(`Sheet ${n}  ·  ${phase}`, title));
    c.push(...bigTitle(heading, instr));
  };
  const endPage = () => {
    c.push(pageBreak());
    if (currentPage) c.push(...notesPage(currentPage, false));
    c.push(pageBreak());
  };

  // LEARN IT. The method, taught, before the learner is asked to use it. Its own page, not a header
  // on the working page, so a learner can re-read the method while their own page is already filled
  // in. Where the skill has right answers they are printed at the BACK of the book, so a learner can
  // try it honestly and mark themselves. Collected here, emitted after the last activity page.
  const withAnswers = [];
  const learnIt = (slug) => {
    const m = mat[slug];
    const lt = m && m.learnerTeaching;
    if (!lt) return;
    c.push(eyebrowChip('learn it', m.title));
    c.push(...bigTitle(lt.title, ''));
    c.push(...mdBlocks(String(lt.readAloud || '').replace(/^\s*##\s+.*\n/, '')));
    if (lt.words && lt.words.length) {
      c.push(noteBox('New words:', lt.words.map((w) => `${w.term}, ${w.meaning}`)));
    }
    const t = lt.tryIt;
    if (t) {
      c.push(new Paragraph({ children: [new TextRun({ text: 'Try it yourself', bold: true, size: 23, color: PLUM })], spacing: { before: 200, after: 60 } }));
      toParas(t.intro).forEach((x) => c.push(P(x, { size: 22, line: 300 })));
      (t.items || []).forEach((it, i) => {
        c.push(P(`${i + 1}.   ${it}`, { size: 22, line: 300, before: 80, after: 20 }));
        if ((t.chooseFrom || []).length) {
          c.push(new Paragraph({ children: t.chooseFrom.flatMap((o) => [
            new TextRun({ text: '○  ', size: 22, color: PLUM }), new TextRun({ text: o + '      ', size: 22 }),
          ]), indent: { left: 340 }, spacing: { after: 60, line: 280 } }));
        }
      });
      if (t.then) toParas(t.then).forEach((x) => c.push(P(x, { size: 22, line: 300, before: 60 })));
      if ((t.answers || []).length) {
        c.push(P('The answers are at the back of your book. Try it first, then check.', { size: 20, italics: true, color: GREY, before: 80 }));
        withAnswers.push({ m, t });
      }
    }
    c.push(scribe());
    c.push(pageBreak());
  };

  // --- Cover ---
  if (!opts.embedded) {
    c.push(image(LOGO, 150, 77, { align: AlignmentType.CENTER, before: 300, after: 200 }));
    c.push(new Paragraph({ children: [new TextRun({ text: 'My Learning Book', bold: true, size: 60, color: NAVY })], alignment: AlignmentType.CENTER, spacing: { before: 200, after: 120 } }));
    c.push(new Paragraph({ children: [new TextRun({ text: 'Agency in Learning', size: 28, color: PLUM })], alignment: AlignmentType.CENTER, spacing: { after: 500 } }));
    c.push(...fillLine('My name:'));
    c.push(...fillLine('My place:'));
    c.push(P('You do not have to write. You can draw, colour, and say your answers, ask, and someone will write them for you.', { size: 22, color: GREY, before: 300 }));
    c.push(P('This book is yours. Each page shows you an example and what to do, so you can keep going even between sessions.', { size: 22, color: GREY, before: 120 }));
    // the cover has no activity page to close, so it takes a plain break. EndPage() would add a
    // notes sheet for a page that does not exist
    c.push(...S.printNotes('book', [], true),...S.contents('The parts of your book, and the page each one starts on. Word fills the numbers in when this file is opened.'));
  }
  // A definitive, numbered list of the sheets, spliced in once they have all been emitted. The Word
  // contents field lists headings and needs updating; this list is always right, and it is what the
  // facilitator plan's "Sheet 7" refers to.
  const sheetListAt = c.length;
  {
  }

  // --- Getting started ---
  page('Getting started', 'What we will learn', 'Our four learning steps', 'These are the four things this book helps you do. They are yours to use long after this course.', 'cb-ail-our-four-steps-page');
  const STEP_ICONS = ['mirror', 'target', 'ladder', 'plant'];
  const STEPS = [
    ['Get to know yourself as a learner', 'When you know what helps you learn and what gets in your way, you stop guessing. You can set up your learning so that it works for you.'],
    ['Choose a learning goal that matters to you', 'A goal you choose yourself is one you come back to. A goal someone else picks for you is one you drop when it gets hard.'],
    ['Make a plan and take steps', 'A goal with no first step stays a wish. Small steps you can really take are what move you.'],
    ['See how you are doing, and grow', 'Looking back tells you what worked, so the next goal is easier than the last. This is how people get better at getting better.'],
  ];
  STEPS.forEach(function (row, i) {
    c.push(new Paragraph({
      children: [
        new TextRun({ text: (i + 1) + '.  ', bold: true, size: 24, color: PLUM }),
        imgRun(icon(STEP_ICONS[i]), 28, 28),
        new TextRun({ text: '   ' + row[0], bold: true, size: 24, color: PLUM }),
      ],
      spacing: { before: 200, after: 40 },
    }));
    c.push(P(row[1], { size: 21, color: NAVY, after: 80 }));
  });
  endPage();

  // Why each one matters TO THIS LEARNER. The unit-plan block is "What we will learn, AND WHY", and
  // the second half of that was missing from the book: learners were asked how they would try each
  // objective, never why any of it was worth their time.
  page('Getting started', 'What we will learn', 'Why these matter to me', 'For each one, say or write why it matters to YOU, and how you would start. There is no right answer here, these are your own reasons.', 'cb-ail-our-four-steps-page');
  STEPS.forEach(function (row, i) {
    c.push(new Paragraph({
      children: [
        new TextRun({ text: (i + 1) + '.  ', bold: true, size: 22, color: PLUM }),
        new TextRun({ text: row[0], bold: true, size: 22, color: PLUM }),
      ],
      spacing: { before: 200, after: 60 },
    }));
    c.push(...slot('This matters to me because…', 2));
    c.push(...slot('I would start by…', 2));
  });
  endPage();

  // The page used to be a ladder to tick and nothing else. Half a sheet of white space, and no
  // reason given anywhere in the book for why setting goals is worth a learner's time. Offline, if it
  // is not on this page it is nowhere.
  learnIt('cb-ail-getting-better-at-goals');
  page('Getting started', 'Getting better at goals', 'Why goals, and where am I now?', 'Setting a goal is a skill. Like any skill, you can be a beginner at it and get better.', 'cb-ail-why-goals-page');
  c.push(S.noteBox('Why this matters', [
    'Much of life in the camp is decided by other people. A goal you set yourself is a piece of it that is yours.',
    'A goal turns "I wish" into "I will". It names one thing, and the first step towards it.',
    'People who set their own goals keep going for longer when things get hard, because the reason is theirs.',
    'And it carries: the same four steps work for learning English, for a job, for anything you want next.',
  ]));
  c.push(P('Nobody starts good at this. Here is how people grow at it, each step is a bit further along than the one before.', { size: 22, before: 200 }));
  c.push(P('Mark the one most like you NOW. At the end of the course, come back and mark it again.', { size: 20, color: GREY }));
  [
    'I am not sure how to set a goal or work towards one yet.',
    'I can say how I would set a goal and take steps towards it.',
    'I have set a goal and taken real steps, and I can say why.',
    'I reached a goal, and I can say what helped and what I would do better.',
    'I keep reaching goals, and I keep getting better at it.',
  ].forEach((t) => c.push(tickLine(t)));
  c.push(...fillLine('What makes me say that is where I am, a time it happened', 2));
  c.push(...fillLine('The one thing I most want to be able to do by the end', 2));
  c.push(...fillLine('My next step', 2));
  endPage();

  // --- Understand yourself ---
  learnIt('cb-ail-growth-mindset');
  page('Understand yourself', 'You can grow', 'You can grow', 'Draw a time you got better at something that was hard at first.', 'cb-ail-you-can-grow-page');
  c.push(example(['A learner could not read the letters. She practised a little each day and asked a friend to help.', 'Now she can read short words. What helped: practising, and asking for help.']));
  c.push(box(5000, 'Draw or write it here'));
  c.push(...fillLine('I got better at:'));
  c.push(...fillLine('What helped me:'));
  endPage();

  learnIt('cb-ail-strengths-and-areas-to-grow');
  page('Understand yourself', 'What I am good at', 'What I am good at', 'Not just WHAT you are good at, how you know. For each one, think of a time it actually happened.', 'cb-ail-good-at-page');
  c.push(example([
    'I am good at: helping younger children.',
    'How I know: last month I taught my cousin to count to twenty. She can do it on her own now.',
  ]));
  c.push(S.gap());
  c.push(S.noteBox('How do I know?', [
    'Anyone can say "I am good at helping people." A researcher asks: how do you know?',
    'The answer is a time it really happened. What you did, and what came of it.',
    'That is what makes it true, and it is what you will do with every claim in this programme.',
  ]));
  c.push(...slot('I am good at…', 2));
  c.push(...slot('How I know, a time it happened…', 3));
  c.push(...slot('I am also good at…', 2));
  c.push(...slot('How I know, a time it happened…', 3));
  endPage();

  page('Understand yourself', 'What I am good at', 'What I want to get better at', 'And the same question again: what makes you say that?', 'cb-ail-good-at-page');
  c.push(example([
    'I want to get better at: speaking in front of other people.',
    'What makes me say that: at the group meeting I had something to say and I did not say it.',
  ]));
  c.push(...slot('I want to get better at…', 2));
  c.push(...slot('What makes me say that, a time it happened…', 3));
  c.push(...slot('And I want to get better at…', 2));
  c.push(...slot('What makes me say that, a time it happened…', 3));
  endPage();

  learnIt('cb-ail-how-you-learn-best');
  page('Understand yourself', 'How I learn best', 'How I learn best', 'Mark when you learn best, and who and what helps you.', 'cb-ail-how-i-learn-page');
  c.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [3600, 3600, 3600],
    rows: [new TableRow({ children: [['sunrise', 'morning'], ['sun', 'midday'], ['moon', 'night']].map(([ic, t]) => new TableCell({
      width: { size: 3600, type: WidthType.DXA },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [imgRun(icon(ic), 40, 40)],
        spacing: { after: 60 },
      }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: t, size: 22, color: PLUM, bold: true })] })],
    })) })],
  }));
  c.push(bold('Where I learn best, and who helps me, draw it:'));
  c.push(box(3800, 'Draw or write it here'));
  c.push(...fillLine('What helps me learn:'));
  c.push(...fillLine('What gets in my way:'));
  endPage();

  // --- Set your goal ---
  learnIt('cb-ail-what-makes-a-good-goal');
  page('Set your goal', 'Is my goal a good goal?', 'Is my goal a good goal?', 'A good goal passes these four tests. Check your goal against each one. Keep this page, use it every time you set a goal.', 'cb-ail-good-goal-page');
  c.push(checkItem('target', 'Small, I can reach it soon, not in a far-off future.'));
  c.push(checkItem('mirror', 'Clear, I can tell when I have reached it.'));
  c.push(checkItem('plant', 'It matters, to me, and maybe to people I care about.'));
  c.push(checkItem('sun', 'By-when, I have picked a day to reach it by.'));
  c.push(P('If a test does not pass, change your goal a little until it does.', { size: 20, color: GREY, before: 160 }));
  endPage();

  learnIt('cb-ail-setting-your-goals');
  page('Set your goal', 'My goal', 'My goal', 'Draw the thing you want to be able to do.', 'cb-ail-my-goal-page');
  c.push(example(['I want to be able to read a short story out loud.', 'It matters because I want to read to my little sister.']));
  c.push(box(4600, 'Draw or write your goal here'));
  c.push(...fillLine('I want to be able to:'));
  c.push(...fillLine('It matters to me because:'));
  c.push(...fillLine('It could help (someone I care about):'));
  endPage();

  learnIt('cb-ail-your-goal-steps');
  page('Set your goal', 'My steps', 'My steps', 'Draw your steps. Colour the first step you can reach.', 'cb-ail-my-steps-page');
  c.push(...slot('My goal, at the top…', 3));
  c.push(...slot('Step 3, before that, I will…', 3));
  c.push(...slot('Step 2, before that, I will…', 3));
  c.push(...slot('Step 1, I can reach this one soon. I will…  (colour this one)', 3));
  endPage();

  // --- Plan and take steps ---
  learnIt('cb-ail-making-an-action-plan');
  page('Plan and take steps', 'My action plan', 'My action plan', 'Draw or write the steps to reach your goal, in order. For each step, what do you need?', 'cb-ail-action-plan-page');
  c.push(...fillLine('My goal:'));
  ['Step 1 (first)', 'Step 2 (next)', 'Step 3 (then)'].forEach((t) => {
    c.push(P(t, { size: 22, bold: true, color: PLUM, before: 200 }));
    c.push(...slot('This step: I will…', 3));
    c.push(...fillLine('What I need:'));
  });
  c.push(...fillLine('My first step this week:'));
  c.push(P('My if–then, for when something gets in the way', { size: 22, bold: true, color: NAVY, before: 220 }));
  c.push(...ifThenFrame());
  c.push(P('There is an Action Plan sheet you can use again for other goals.', { size: 20, color: GREY, before: 120 }));
  endPage();

  learnIt('cb-ail-managing-time-and-priorities');
  page('Plan and take steps', 'My time', 'My time', 'Mark when you will work on your goal, and protect one small slot you can really keep.', 'cb-ail-my-time-page');
  c.push(P('Days:  Sat · Sun · Mon · Tue · Wed · Thu · Fri', { size: 22, before: 80 }));
  c.push(box(3600, 'Draw, mark or write the times you will work on your goal'));
  c.push(...fillLine('My one small slot I will protect:'));
  c.push(...fillLine('The most important thing I will do first:'));
  c.push(...fillLine('If my week gets hard, the smaller thing I will still do:'));
  endPage();

  learnIt('cb-ail-finding-help-and-resources');
  page('Plan and take steps', 'Who and what can help me', 'Who and what can help me', 'Draw the people and things that can help you reach your goal. Asking for help is not weakness, no one reaches a goal alone.', 'cb-ail-who-can-help-page');
  c.push(box(5000, 'Draw or write it here'));
  c.push(...fillLine('The person I will ask:'));
  c.push(...fillLine('What I will ask them for:'));
  endPage();

  page('Plan and take steps', 'My weekly steps', 'My weekly steps', 'Each week, one small step towards your goal. Fill one row every week you work on it.');
  c.push(P('Remember your if–then: if the week gets hard, do the smaller step, do not stop.', { size: 20, color: OLIVE, bold: true, after: 140 }));
  c.push(weeklySpread(6));
  c.push(P('Every time you take a step, make one small mark or drawing here:', { size: 20, color: GREY, before: 220 }));
  c.push(gridBoxes(6, 2, 700, ''));
  endPage();

  // --- Track and reflect ---
  learnIt('cb-ail-seeking-and-using-feedback');
  page('Track and reflect', 'Feedback I got', 'Feedback I got', 'Ask one person: "what is one thing I could do better?" Listen, then decide what to do with it.', 'cb-ail-feedback-page');
  c.push(...fillLine('Who I asked:'));
  c.push(...slot('What they said was…', 4));
  c.push(P('What will I do with it? Mark one:', { size: 22, bold: true, color: NAVY, before: 180 }));
  c.push(tickLine('Keep it, I will try this now.'));
  c.push(tickLine('Hold it, useful later, not now.'));
  c.push(tickLine('Leave it, not for me.'));
  c.push(...fillLine('The one thing I will try:'));
  endPage();

  learnIt('cb-ail-reflecting-on-your-growth');
  page('Track and reflect', 'How I have grown', 'How I have grown', 'Look back through your book. Draw yourself before, and now, then say how far you came.', 'cb-ail-how-i-have-grown-page');
  c.push(P('Before', { size: 22, bold: true, color: PLUM, before: 80 }));
  c.push(box(2800, 'Draw or write it here'));
  c.push(P('Now', { size: 22, bold: true, color: PLUM, before: 160 }));
  c.push(box(2800, 'Draw or write it here'));
  c.push(...fillLine('My goal was:'));
  c.push(...fillLine('How far I got:'));
  c.push(...fillLine('How I know I have grown, a time it showed', 2));
  c.push(...fillLine('What helped me:'));
  c.push(...fillLine('What I would do differently next time:'));
  endPage();

  page('Track and reflect', 'My next goal', 'My next goal', 'Draw one goal you will keep working on after this course.');
  c.push(P('If your goal was hard to reach, your next goal can be a smaller step of it. That is not failing, that is how goals work.', { size: 20, color: OLIVE, before: 40, after: 140 }));
  c.push(box(5000, 'Draw or write it here'));
  c.push(...fillLine('My next goal:'));
  c.push(...fillLine('My first small step:'));
  c.push(tickLine('I shared one way I have grown with my group.'));
  // The book is hand-composed, so nothing stops a page quietly going missing when the unit plan gains
  // an activity, which is exactly what had happened to "What we will learn, and why". Check it on
  // every build, and fail rather than ship a book that no longer matches the plan.
  const missing = [];
  unit.phases.forEach((ph) => ph.blocks.forEach((b) => {
    const m = b.materialSlug ? mat[b.materialSlug] : null;
    if (m && m.type === 'activity' && m.worksheet && !emitted.has(m.worksheet.slug)) {
      missing.push(`  - ${b.title}  (${m.worksheet.slug})`);
    }
  }));
  if (missing.length) {
    throw new Error('Agency in Learning workbook has no page for these unit-plan activities:\n' + missing.join('\n'));
  }

  c.splice(sheetListAt, 0,
    P('The sheets in this book', { size: 26, bold: true, color: NAVY, before: 200, after: 60 }),
    P('Your facilitator will say a sheet number. Find it here.', { size: 20, color: GREY, after: 100 }),
    ...SHEET_LIST.map((x) => P(`Sheet ${x.n}   ${x.heading}`, { size: 21, after: 20 })),
    pageBreak(),
  );

  // ANSWERS. At the back, so a learner can do each "Try it yourself" honestly and then check it
  // themselves. Only skills with right answers appear; a generative task has no key.
  if (withAnswers.length) {
    c.push(...bigTitle('Answers, try it yourself', 'Do the "Try it yourself" on the Learn it page first, then look here. Getting one wrong is useful, go back and read that page again, and see why.'));
    withAnswers.forEach(({ m, t }) => {
      c.push(P(m.learnerTeaching.title, { size: 24, bold: true, color: NAVY, before: 160, after: 60 }));
      (t.items || []).forEach((it, i) => {
        c.push(P(`${i + 1}.   ${it}`, { size: 21, bold: true, before: 80, after: 30 }));
        c.push(P(`${t.answers[i]}`, { size: 21, color: '3F4A34', after: 40 }));
      });
      c.push(hr());
    });
  }

  return c;
}

function workbook() { return makeDoc(workbookChildren()); }


// ============================================================ ASSESSMENT RECORD (FSL2)
// Sibling of the Research Project's FSI1 record (generate-rp.js). The levels, GPA values and generic
// descriptors come from framework/proficiency-scale.yaml, Amala's official scale, so this record
// can never drift from it. Only the FSL2 reading of each level is written here.
const FSL2_READING = {
  none: 'Cannot say what goal they would set for their own learning, or what they would do about it, and why.',
  theorist: 'Can say what goal they would set and what steps they would take towards it, and why, but has not acted on it.',
  practitioner: 'Actually set a goal of their own and took deliberate steps towards it, with a clear rationale. Even if the goal is not yet reached.',
  reflective: 'Reached the goal they set, and can say what helped, what did not, and what they would do differently next time, pointing to evidence in their learning book.',
  expert: 'A second, distinct goal in which they carried through an improvement identified in the first.',
};
const scaleTable = () => {
  const colW = [300, 2500, 5200, 2800];
  const head = ['', 'Level', 'The learner (Amala\u2019s scale)', 'In this component (FSL2)'];
  const rows = [new TableRow({ tableHeader: true, children: head.map((t, i) => new TableCell({
    width: { size: colW[i], type: WidthType.DXA },
    children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 18, color: NAVY })] })],
  })) })];
  for (const lv of scale.levels) {
    const title = lv.title + (lv.creditAwarded ? '' : '  (no credit)') + `\nGPA ${lv.gpa.toFixed(1)}`;
    const cells = ['\u2610', title, lv.genericDescriptor, FSL2_READING[lv.id] || ''];
    rows.push(new TableRow({ height: { value: 900, rule: 'atLeast' }, cantSplit: true, children: cells.map((t, i) => new TableCell({
      width: { size: colW[i], type: WidthType.DXA },
      children: String(t).split('\n').map((line, j) => new Paragraph({ children: [new TextRun({ text: line, size: i === 0 ? 26 : 17, bold: i === 1 && j === 0, color: i === 1 ? NAVY : (i === 3 ? GREY : undefined) })] })),
    })) }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: colW, rows });
};

function rubricChildren() {
  const c = [];
  c.push(P('Agency in Learning', { size: 44, bold: true, color: NAVY, after: 40 }));
  c.push(P('Assessment record, Set and pursue goals (FSL2)', { size: 24, bold: true, color: PLUM, after: 40 }));
  c.push(P("Learning Bridge+ (Cox's Bazar)  \u00b7  Facilitator, make one copy per learner", { size: 20, color: GREY, after: 160 }));
  c.push(P('Judge each learner by your professional judgement against Amala\u2019s proficiency scale, from evidence gathered across the whole component, not from one artefact. Much of your strongest evidence is oral and visual, because many learners are not yet literate; that is expected, so record what you saw and heard. Tick the level and write one or two lines of evidence for why.', { size: 22, after: 120 }));
  c.push(P('The scale is generic: one ladder, read against the goal FSL2 names, the learner can establish clear objectives for learning and growth and take deliberate steps to make progress towards them. Credit begins at Practitioner, which is also the readiness bar for the accredited secondary pathway. Expert needs two or more genuinely different scenarios, so it rarely comes from this component alone.', { size: 20, color: GREY, after: 160 }));
  c.push(P('Learner: ______________________________', { size: 22, after: 200 }));
  const point = (title) => {
    c.push(H2(title));
    c.push(scaleTable());
    c.push(P('Evidence for the judgement (the goal they set and why \u00b7 the steps actually taken \u00b7 how they adjusted when a step did not work \u00b7 the growth path, before and now \u00b7 what they said in check-ins and the final sharing):', { size: 18, color: GREY, after: 40, before: 160 }));
    c.push(box(2200, ''));
  };
  point('Week 6, supported (formative) judgement');
  c.push(P('Provisional, made with Amala\u2019s support and calibration: a checkpoint that tells you where to put your support next, not the final grade.', { size: 18, italics: true, color: GREY, before: 80 }));
  c.push(pageBreak());
  point('Week 12, final (summative) judgement');
  c.push(P('This is the judgement that counts towards the certificated competency and the readiness decision. Amala moderates a sample of these against the evidence.', { size: 18, italics: true, color: GREY, before: 80 }));
  c.push(P('Levels, GPA values and generic descriptors are Amala\u2019s official Competency Framework and Proficiency Scale (cohorts starting 2025).', { size: 16, color: GREY, before: 200 }));
  return c;
}

// ============================================================ EXPORTS / WRITE
// Build the sheet index by running the workbook builder once and discarding the output, so the plan
// can quote sheet numbers even when it is rendered before the book (as in the Educator Guide).
function sheetIndex() {
  if (!SHEET_NO.size) workbookChildren();
  return SHEET_NO;
}

module.exports = {
  sheetIndex, SHEET_LIST,
  unit, mat, facilitatorPlanChildren, planFrontMatter, phaseChildren, blockChildren, workbookChildren,
  rubricChildren, scaleTable,
};

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [
    ['agency-in-learning-facilitator-unit-plan.docx', facilitatorPlan()],
    ['agency-in-learning-student-workbook.docx', workbook()],
    ['agency-in-learning-assessment-record.docx', makeDoc(rubricChildren())],
  ];
  for (const [name, doc] of jobs) {
    const buf = await Packer.toBuffer(doc);
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log('wrote', name, (buf.length / 1024).toFixed(1) + ' KB');
  }
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
