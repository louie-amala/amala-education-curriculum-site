/* Generate the Agency in Learning (Cox's Bazar) offline pack:
     - agency-in-learning-facilitator-unit-plan.docx   (the full 50-hour plan, guidance inline)
     - agency-in-learning-student-workbook.docx        (My Learning Book — visual-first learner pages)
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
  box, gridBoxes, refTable, callout, makeDoc, Paragraph, TextRun, AlignmentType,
  LOGO, image, iconLine, imgRun, icon,
} = S;

const ROOT = path.resolve(__dirname, '..', '..');
const CS = path.join(ROOT, 'content-source');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'downloads');
const rd = (p) => yaml.parse(fs.readFileSync(p, 'utf8'));

const unit = rd(path.join(CS, 'units', 'coxs-bazar-agency-in-learning.yaml'));
// Amala's official proficiency scale — read from the framework so the record cannot drift from it.
const scale = rd(path.join(CS, 'framework', 'proficiency-scale.yaml'));
const course = rd(path.join(CS, 'courses', 'agency-in-learning.yaml'));
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
  'facilitator-led': 'You lead — directed and safe (scaffolding stays high)',
  shared: 'Shared — learners choose, you scaffold closely (scaffolding stays high)',
  'learner-led': 'Learners lead the goal — support stays high (you coach, prompt, steady)',
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
    c.push(H1(`Phase ${pi + 1} — ${ph.title}`));
    c.push(P(`Who leads: ${LEAD[ph.lead] || ph.lead || '—'}`, { size: 20, color: GREY, italics: true, after: 60 }));
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

function facilitatorPlanChildren() {
  return [...planFrontMatter(), pageBreak(), ...phaseChildren()];
}

function facilitatorPlan() {
  const c = [];
  c.push(image(LOGO, 150, 77, { after: 200 }));
  c.push(P("Learning Bridge+ (Cox's Bazar)", { size: 22, bold: true, color: OLIVE, after: 20 }));
  c.push(new Paragraph({ children: [new TextRun({ text: 'Agency in Learning', bold: true, size: 52, color: NAVY })], spacing: { after: 40 } }));
  c.push(P('Facilitator Unit Plan & Guide', { size: 30, bold: true, color: PLUM, after: 200 }));
  c.push(...facilitatorPlanChildren());
  c.push(P('This plan is part of a fully offline, editable pack. Not for redistribution outside the programme.', { size: 18, color: GREY, before: 240 }));
  return makeDoc(c, { footerText: FOOTER_TEXT });
}

// ============================================================ STUDENT WORKBOOK
// "My Learning Book" — one visual-first page per activity, in unit order. Authored learner pages
// (they are not derivable from the facilitator YAML), kept here so the book is reproducible.
const eyebrowPair = (phase, title) => new Paragraph({
  children: [
    new TextRun({ text: phase, bold: true, size: 16, color: PLUM }),
    new TextRun({ text: '     ' + title, bold: true, size: 16, color: GREY }),
  ],
  spacing: { after: 60 },
});
const bigTitle = (t, instr) => {
  const out = [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 32, color: NAVY })], spacing: { after: instr ? 40 : 150 } })];
  if (instr) out.push(new Paragraph({ children: [new TextRun({ text: instr, size: 22, color: GREY })], spacing: { after: 150 } }));
  return out;
};
const fillLine = (lead) => new Paragraph({
  children: [new TextRun({ text: lead + ' ', size: 22 }), new TextRun({ text: '________________________________________', size: 22, color: GREY })],
  spacing: { before: 160, after: 100 },
});
const tickLine = (t) => new Paragraph({ children: [new TextRun({ text: '☐    ' + t, size: 22 })], spacing: { after: 100 } });

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
  box(1000, 'draw the thing that usually stops you'),
  new Paragraph({ children: [new TextRun({ text: '→   then I will still do this…', bold: true, size: 22, color: OLIVE })], spacing: { before: 80, after: 40 } }),
  box(1000, 'draw the smaller step you will still take'),
];
// A repeating weekly loop — the scaffold for the between-session pursuit. One row per week:
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
function workbookChildren(opts = {}) {
  const c = [];
  const page = (phase, title, heading, instr) => {
    c.push(eyebrowPair(phase, title));
    c.push(...bigTitle(heading, instr));
  };

  // --- Cover ---
  if (!opts.embedded) {
    c.push(image(LOGO, 150, 77, { align: AlignmentType.CENTER, before: 300, after: 200 }));
    c.push(new Paragraph({ children: [new TextRun({ text: 'My Learning Book', bold: true, size: 60, color: NAVY })], alignment: AlignmentType.CENTER, spacing: { before: 200, after: 120 } }));
    c.push(new Paragraph({ children: [new TextRun({ text: 'Agency in Learning', size: 28, color: PLUM })], alignment: AlignmentType.CENTER, spacing: { after: 500 } }));
    c.push(fillLine('My name:'));
    c.push(fillLine('My place:'));
    c.push(P('You do not have to write. You can draw, colour, and say your answers — ask, and someone will write them for you.', { size: 22, color: GREY, before: 300 }));
    c.push(P('This book is yours. Each page shows you an example and what to do, so you can keep going even between sessions.', { size: 22, color: GREY, before: 120 }));
    c.push(pageBreak());
  }

  // --- Getting started ---
  page('Getting started', 'What we will learn', 'Our four learning steps', 'Draw or mark how you would try each one.');
  const STEP_ICONS = ['mirror', 'target', 'ladder', 'plant'];
  ['Get to know yourself as a learner', 'Choose a learning goal that matters to you', 'Make a plan and take steps', 'See how you are doing, and grow'].forEach((t, i) => {
    c.push(new Paragraph({
      children: [
        new TextRun({ text: `${i + 1}.  `, bold: true, size: 22, color: PLUM }),
        imgRun(icon(STEP_ICONS[i]), 28, 28),
        new TextRun({ text: '   ' + t, bold: true, size: 22, color: PLUM }),
      ],
      spacing: { before: 160, after: 60 },
    }));
    c.push(box(1200, 'how I would try'));
  });
  c.push(pageBreak());

  page('Getting started', 'Getting better at goals', 'Getting better at goals', 'How people grow at setting and pursuing goals. Mark where you are now, and again at the end.');
  c.push(P('Each step is a bit further along. Mark the one most like you now.', { size: 20, color: GREY }));
  [
    'I am not sure how to set a goal or work towards one yet.',
    'I can say how I would set a goal and take steps towards it.',
    'I have set a goal and taken real steps, and I can say why.',
    'I reached a goal, and I can say what helped and what I would do better.',
    'I keep reaching goals, and I keep getting better at it.',
  ].forEach((t) => c.push(tickLine(t)));
  c.push(fillLine('My next step:'));
  c.push(pageBreak());

  // --- Understand yourself ---
  page('Understand yourself', 'You can grow', 'You can grow', 'Draw a time you got better at something that was hard at first.');
  c.push(example(['A learner could not read the letters. She practised a little each day and asked a friend to help.', 'Now she can read short words. What helped: practising, and asking for help.']));
  c.push(box(3400, 'draw here'));
  c.push(fillLine('I got better at:'));
  c.push(fillLine('What helped me:'));
  c.push(pageBreak());

  page('Understand yourself', 'What I am good at', 'What I am good at', 'Draw or mark what you are good at as a learner.');
  c.push(example(['Good at: remembering stories · helping younger children · fixing things with my hands.', 'Want to grow: speaking in front of others · writing my letters.']));
  c.push(P('I am good at…', { size: 22, bold: true, color: PLUM, before: 80 }));
  c.push(box(2600));
  c.push(P('What I want to grow', { size: 22, bold: true, color: PLUM, before: 200 }));
  c.push(P('I want to grow…', { size: 20, color: GREY }));
  c.push(box(2600));
  c.push(pageBreak());

  page('Understand yourself', 'How I learn best', 'How I learn best', 'Mark when you learn best, and who and what helps you.');
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
  c.push(P('Where I learn best, and who helps me — draw here', { size: 20, color: GREY, before: 200 }));
  c.push(box(2800));
  c.push(fillLine('What helps me learn:'));
  c.push(fillLine('What gets in my way:'));
  c.push(pageBreak());

  // --- Set your goal ---
  page('Set your goal', 'Is my goal a good goal?', 'Is my goal a good goal?', 'A good goal passes these four tests. Check your goal against each one. Keep this page — use it every time you set a goal.');
  c.push(checkItem('target', 'Small  —  I can reach it soon, not in a far-off future.'));
  c.push(checkItem('mirror', 'Clear  —  I can tell when I have reached it.'));
  c.push(checkItem('plant', 'It matters  —  to me, and maybe to people I care about.'));
  c.push(checkItem('sun', 'By-when  —  I have picked a day to reach it by.'));
  c.push(P('If a test does not pass, change your goal a little until it does.', { size: 20, color: GREY, before: 160 }));
  c.push(pageBreak());

  page('Set your goal', 'My goal', 'My goal', 'Draw the thing you want to be able to do.');
  c.push(example(['I want to be able to read a short story out loud.', 'It matters because I want to read to my little sister.']));
  c.push(box(3400, 'draw your goal here'));
  c.push(fillLine('I want to be able to:'));
  c.push(fillLine('It matters to me because:'));
  c.push(fillLine('It could help (someone I care about):'));
  c.push(pageBreak());

  page('Set your goal', 'My steps', 'My steps', 'Draw your steps. Colour the first step you can reach.');
  c.push(P('My goal (top)', { size: 22, bold: true, color: PLUM, before: 80 }));
  c.push(box(1400));
  c.push(P('step 3', { size: 20, color: GREY, before: 120 }));
  c.push(box(1200));
  c.push(P('step 2', { size: 20, color: GREY, before: 120 }));
  c.push(box(1200));
  c.push(P('step 1  —  colour this one — I can reach it soon', { size: 20, color: OLIVE, bold: true, before: 120 }));
  c.push(box(1200));
  c.push(pageBreak());

  // --- Plan and take steps ---
  page('Plan and take steps', 'My action plan', 'My action plan', 'Draw or write the steps to reach your goal, in order. For each step, what do you need?');
  c.push(fillLine('My goal:'));
  ['Step 1 (first)', 'Step 2 (next)', 'Step 3 (then)'].forEach((t) => {
    c.push(P(t, { size: 22, bold: true, color: PLUM, before: 200 }));
    c.push(box(1600, 'draw or write this step'));
    c.push(fillLine('What I need:'));
  });
  c.push(fillLine('My first step this week:'));
  c.push(P('My if–then — for when something gets in the way', { size: 22, bold: true, color: NAVY, before: 220 }));
  c.push(...ifThenFrame());
  c.push(P('There is an Action Plan sheet you can use again for other goals.', { size: 20, color: GREY, before: 120 }));
  c.push(pageBreak());

  page('Plan and take steps', 'My time', 'My time', 'Mark when you will work on your goal, and protect one small slot you can really keep.');
  c.push(P('Days:  Sat · Sun · Mon · Tue · Wed · Thu · Fri', { size: 22, before: 80 }));
  c.push(box(2800, 'Draw or mark the times you will work on your goal'));
  c.push(fillLine('My one small slot I will protect:'));
  c.push(fillLine('The most important thing I will do first:'));
  c.push(fillLine('If my week gets hard, the smaller thing I will still do:'));
  c.push(pageBreak());

  page('Plan and take steps', 'Who and what can help me', 'Who and what can help me', 'Draw the people and things that can help you reach your goal. Asking for help is not weakness — no one reaches a goal alone.');
  c.push(box(3800, 'draw here'));
  c.push(fillLine('The person I will ask:'));
  c.push(fillLine('What I will ask them for:'));
  c.push(pageBreak());

  page('Plan and take steps', 'My weekly steps', 'My weekly steps', 'Each week, one small step towards your goal. Fill one row every week you work on it.');
  c.push(P('Remember your if–then: if the week gets hard, do the smaller step — do not stop.', { size: 20, color: OLIVE, bold: true, after: 140 }));
  c.push(weeklySpread(6));
  c.push(P('Every time you take a step, make one small mark or drawing here:', { size: 20, color: GREY, before: 220 }));
  c.push(gridBoxes(6, 2, 700, ''));
  c.push(pageBreak());

  // --- Track and reflect ---
  page('Track and reflect', 'Feedback I got', 'Feedback I got', 'Ask one person: "what is one thing I could do better?" Listen, then decide what to do with it.');
  c.push(fillLine('Who I asked:'));
  c.push(P('What they said — draw or write it here:', { size: 22, bold: true, color: PLUM, before: 140 }));
  c.push(box(2200, 'draw or write here'));
  c.push(P('What will I do with it? Mark one:', { size: 22, bold: true, color: NAVY, before: 180 }));
  c.push(tickLine('Keep it  —  I will try this now.'));
  c.push(tickLine('Hold it  —  useful later, not now.'));
  c.push(tickLine('Leave it  —  not for me.'));
  c.push(fillLine('The one thing I will try:'));
  c.push(pageBreak());

  page('Track and reflect', 'How I have grown', 'How I have grown', 'Look back through your book. Draw yourself before, and now, then say how far you came.');
  c.push(P('Before', { size: 22, bold: true, color: PLUM, before: 80 }));
  c.push(box(2000, 'draw here'));
  c.push(P('Now', { size: 22, bold: true, color: PLUM, before: 160 }));
  c.push(box(2000, 'draw here'));
  c.push(fillLine('My goal was:'));
  c.push(fillLine('How far I got:'));
  c.push(fillLine('What helped me:'));
  c.push(fillLine('What I would do differently next time:'));
  c.push(pageBreak());

  page('Track and reflect', 'My next goal', 'My next goal', 'Draw one goal you will keep working on after this course.');
  c.push(P('If your goal was hard to reach, your next goal can be a smaller step of it. That is not failing — that is how goals work.', { size: 20, color: OLIVE, before: 40, after: 140 }));
  c.push(box(3400, 'draw here'));
  c.push(fillLine('My next goal:'));
  c.push(fillLine('My first small step:'));
  c.push(tickLine('I shared one way I have grown with my group.'));
  return c;
}

function workbook() { return makeDoc(workbookChildren()); }


// ============================================================ ASSESSMENT RECORD (FSL2)
// Sibling of the Research Project's FSI1 record (generate-rp.js). The levels, GPA values and generic
// descriptors come from framework/proficiency-scale.yaml — Amala's official scale — so this record
// can never drift from it. Only the FSL2 reading of each level is written here.
const FSL2_READING = {
  none: 'Cannot say what goal they would set for their own learning, or what they would do about it, and why.',
  theorist: 'Can say what goal they would set and what steps they would take towards it, and why — but has not acted on it.',
  practitioner: 'Actually set a goal of their own and took deliberate steps towards it, with a clear rationale — even if the goal is not yet reached.',
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
  c.push(P('Assessment record \u2014 Set and pursue goals (FSL2)', { size: 24, bold: true, color: PLUM, after: 40 }));
  c.push(P("Learning Bridge+ (Cox's Bazar)  \u00b7  Facilitator \u2014 make one copy per learner", { size: 20, color: GREY, after: 160 }));
  c.push(P('Judge each learner by your professional judgement against Amala\u2019s proficiency scale, from evidence gathered across the whole component \u2014 not from one artefact. Much of your strongest evidence is oral and visual, because many learners are not yet literate; that is expected, so record what you saw and heard. Tick the level and write one or two lines of evidence for why.', { size: 22, after: 120 }));
  c.push(P('The scale is generic: one ladder, read against the goal FSL2 names \u2014 the learner can establish clear objectives for learning and growth and take deliberate steps to make progress towards them. Credit begins at Practitioner, which is also the readiness bar for the accredited secondary pathway. Expert needs two or more genuinely different scenarios, so it rarely comes from this component alone.', { size: 20, color: GREY, after: 160 }));
  c.push(P('Learner: ______________________________', { size: 22, after: 200 }));
  const point = (title) => {
    c.push(H2(title));
    c.push(scaleTable());
    c.push(P('Evidence for the judgement (the goal they set and why \u00b7 the steps actually taken \u00b7 how they adjusted when a step did not work \u00b7 the growth path, before and now \u00b7 what they said in check-ins and the final sharing):', { size: 18, color: GREY, after: 40, before: 160 }));
    c.push(box(2200, ''));
  };
  point('Week 6 \u2014 supported (formative) judgement');
  c.push(P('Provisional, made with Amala\u2019s support and calibration: a checkpoint that tells you where to put your support next, not the final grade.', { size: 18, italics: true, color: GREY, before: 80 }));
  c.push(pageBreak());
  point('Week 12 \u2014 final (summative) judgement');
  c.push(P('This is the judgement that counts towards the certificated competency and the readiness decision. Amala moderates a sample of these against the evidence.', { size: 18, italics: true, color: GREY, before: 80 }));
  c.push(P('Levels, GPA values and generic descriptors are Amala\u2019s official Competency Framework and Proficiency Scale (cohorts starting 2025).', { size: 16, color: GREY, before: 200 }));
  return c;
}

// ============================================================ EXPORTS / WRITE
module.exports = {
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
