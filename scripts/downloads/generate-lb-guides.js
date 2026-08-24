/* Generate the three programme-level Learning Bridge+ (Cox's Bazar) documents:
     - lb-coxs-bazar-coordinator-guide.docx   (for the NRC programme coordinator)
     - lb-coxs-bazar-educator-guide.docx      (for the facilitator / educator)
     - lb-coxs-bazar-student-workbook.docx    (for the learner)

   The Coordinator Guide is a short authored narrative: what the programme is, who does what, the
   12-week rhythm, and the two assessment windows to protect.

   The Educator Guide is the ONE-STOP SHOP. It carries everything an educator needs to deliver the
   programme in one document: the orientation, mentoring and assessment guidance, then the FULL
   facilitator unit plan for all three taught components, the three learner books to print, the
   printable cards, and the two assessment records. Those parts are not re-authored here — they are
   composed from the same children builders the standalone downloads use (generate-ail.js,
   generate-docx.js, generate-rp.js), so the guide can never drift from the component packs or the
   authored YAML behind them.

   The Student Workbook is the same idea for the learner: ONE book per learner for the whole twelve
   weeks, so a site prints one job instead of three. Parts 1-3 are the three component learner books,
   composed from the same workbookChildren() builders the standalone downloads use (with
   { embedded: true }, which drops each component's own cover so the book has one front). Part 4 is
   programme-level: the mentoring page and the growth self-check, rendered from their cb-* materials.
   The group cards are deliberately NOT here - they are one set per group, printed and cut up, so
   they stay in the Educator Guide and the standalone files.

   Run:  node scripts/downloads/generate-lb-guides.js
   Override output dir:  OUT_DIR=/tmp/pack node scripts/downloads/generate-lb-guides.js
   Re-run after editing any Cox's Bazar unit or cb-* material, and after re-running the component
   generators — this guide embeds their content. */
const fs = require('fs');
const path = require('path');
const { Packer } = require('docx');
const S = require('./lib/docx-style');

const {
  NAVY, PLUM, GREY, OLIVE, LINE,
  P, body, bullet, numbered, H1, H2, H3, mini, hr, pageBreak,
  refTable, twoCol, callout, makeDoc, toc, image, LOGO, icon, imgRun, Paragraph, TextRun,
  box, mdBlocks, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle,
} = S;

const ROOT = path.resolve(__dirname, '..', '..');
const CS = path.join(ROOT, 'content-source');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'downloads');

// The two programme-level learner pages (Part 4 of the Student Workbook). They belong to no single
// component, so they are read here rather than by a component generator — but they are still read
// from their authored YAML, so the printed page and the site page cannot drift.
const yaml = require('yaml');
const readMaterial = (slug) => yaml.parse(fs.readFileSync(path.join(CS, 'materials', `${slug}.yaml`), 'utf8'));
const PROGRAMME_PAGES = ['cb-my-mentoring-conversations', 'cb-my-growth-across-the-programme'].map(readMaterial);
// Programme-level, belonging to no one component: the single closing showcase. (The optional
// significant adult meeting belongs to Mentoring, and arrives with MN.guideChildren().)
const SHOWCASE = readMaterial('cb-my-showcase');

// The programme itself, for the agency thread. Agency for positive change is Amala's required
// outcome, but it appeared in NONE of the three distributed documents — a facilitator holding the
// complete manual was never told what the programme was ultimately for. These sections fix that, and
// they render the authored YAML rather than a re-typed copy, so the guides and the site cannot drift.
const PROGRAMME = yaml.parse(fs.readFileSync(path.join(CS, 'programmes', 'learning-bridge-coxs-bazar.yaml'), 'utf8'));
const AGENCY = yaml.parse(fs.readFileSync(path.join(CS, 'foundations', 'agency.yaml'), 'utf8'));
const COMPETENCIES = yaml.parse(fs.readFileSync(path.join(CS, 'framework', 'competencies.yaml'), 'utf8'));
const indicatorLabel = (id) => (AGENCY.indicators.find((i) => i.id === id) || {}).label || id;
const competencyTitle = (code) => {
  const c = COMPETENCIES.find((x) => x.code === code);
  return c ? c.title : code;
};

// The agency thread, as document children. `depth` picks the heading level so the same builder can
// open the Coordinator Guide (H1 sections) and sit inside Part 1 of the Educator Guide (H2/H3).
function agencyThreadChildren({ heading, sub, full = true }) {
  const t = PROGRAMME.agencyThread;
  if (!t) return [];
  const c = [];
  c.push(heading('Agency for positive change — what this is all for'));
  c.push(P(t.statement, { size: 22 }));
  if (t.inThisProgramme) c.push(P(t.inThisProgramme, { size: 22 }));
  c.push(callout('The three indicators of agency', AGENCY.indicators.map((i) => i.label), PLUM));
  if (full && t.byComponent.length) {
    c.push(sub('What each component contributes'));
    c.push(twoCol(['Component', 'What it builds, and which indicators'], t.byComponent.map((r) => [
      r.component,
      `${r.how}\n\nIndicators: ${r.indicators.map(indicatorLabel).join('  ·  ')}`,
    ])));
  }
  if (full && t.byCompetency.length) {
    c.push(sub('What developing each competency contributes'));
    c.push(twoCol(['Competency', 'How developing it builds agency'], t.byCompetency.map((r) => [
      `${r.code} — ${competencyTitle(r.code)}`,
      `${r.how}\n\nIndicators: ${r.indicators.map(indicatorLabel).join('  ·  ')}`,
    ])));
  }
  if (t.howWeSeeIt.length) {
    c.push(sub('How you see it — and how not to turn it into another test'));
    t.howWeSeeIt.forEach((x) => c.push(bullet(x)));
  }
  return c;
}

// The three component packs, as children builders — embedded, never re-authored.
const AIL = require('./generate-ail');
const MV = require('./generate-docx');
const RP = require('./generate-rp');
// Mentoring is a component like the others now, with its own generator and children builders.
const MN = require('./generate-mentoring');

// The three taught components, in the order the guide presents them. Drives the week-by-week map.
const COMPONENTS = [AIL, MV, RP];

// ============================================================ SHARED CONTENT
// Both guides describe the same programme, so the pieces that must not drift live here once.

// The shared 12-week arc.
const ARC_ROWS = [
  ['Before Week 1', 'Diagnostic intake. Each learner is placed and, where needed, English proficiency is checked (below B1). Learners are paired with a mentor.'],
  ['Weeks 1–5', 'First block of learning. Educators deliver the component sessions and begin gathering evidence of each learner’s competency as they go — from workbooks, steps taken, and what learners say and do.'],
  ['Week 6', 'Supported (formative) assessment. Educators make a first, provisional judgement of each learner against the Proficiency Scale — with Amala’s support and calibration. This is a rehearsal and a checkpoint, not the final grade.'],
  ['Weeks 7–11', 'Second block of learning. Educators keep building the competencies and keep gathering evidence, guided by what Week 6 surfaced about each learner. The optional significant adult meetings, where a site is running them, sit in this block.'],
  ['Last week of delivery', 'The showcase. One shared closing event for all three components, with guests the learners invited themselves. Fix the date early — invitations have to go out.'],
  ['Week 12', 'Final (summative) assessment. Educators make their final judgement of each learner in the two assessed competencies, against the Proficiency Scale.'],
  ['After Week 12', 'Amala moderation. Amala reviews a sample of judgements against the evidence to confirm they are consistent and fair, and the readiness decision is confirmed.'],
];

// ---- The example week -------------------------------------------------------------------------
// Used by both guides so the two timetables cannot drift. Deliberately concrete: THREE learning days
// a week, THREE hours with you each day (one hour per component), and about TWO hours at home each
// day. That is the whole weekly load — 9 in-person + 6 independent = 15 hours — laid out so an
// educator can see it, not infer it. Days are numbered, not named: each site places its own rest day.
// The middle column is written in the second person for the educator's own guide, and in the third
// for the coordinator's — the same table, addressed to the person actually holding it.
const weekHeader = (aud = 'educator') => [
  'Learning day',
  aud === 'coordinator'
    ? 'With the educator, in the CBLF — 3 hours'
    : 'With you, in the CBLF — 3 hours',
  'At home before the next day — about 2 hours',
];
// The three components rotate, so the same one is never always last, when the group is most tired.
const WEEK_ROTATION = [
  ['Agency in Learning', 'English', 'Research Project'],
  ['English', 'Research Project', 'Agency in Learning'],
  ['Research Project', 'Agency in Learning', 'English'],
];
const HOME_TASKS = {
  'Agency in Learning': 'take one step towards your goal, and mark your learning book',
  English: 'practise your English with someone at home',
  'Research Project': 'notice or gather one piece of evidence for our question',
};
const weekRows = () => WEEK_ROTATION.map((order, i) => {
  const sessions = order.map((n, j) => `Hour ${j + 1} — ${n}`);
  if (i === WEEK_ROTATION.length - 1) sessions.push('…then close the week: a short small-group wellbeing check and reflection');
  const home = order.map((n) => `about 40 min — ${HOME_TASKS[n]}`);
  return [
    { lines: [`Day ${i + 1}`], bold: true },
    { lines: sessions, bold: false, color: undefined },
    { lines: home, bold: false, color: GREY },
  ];
});
const exampleWeekTable = (aud = 'educator') => refTable(weekHeader(aud), weekRows(), [1700, 4700, 4400]);

const weekMaths = (aud = 'educator') => `3 learning days × 3 hours with ${aud === 'coordinator' ? 'the educator' : 'you'} = 9 in-person hours. 3 days × about 2 hours at home = 6 independent hours. That is 15 hours a week, and about 150 hours across the 10 weeks of delivery — the full programme.`;
// Same guidance, addressed to the person holding the document: the educator sets their own days with
// their coordinator; the coordinator sets them across sites with their educators.
const WEEK_ADAPT_FIXED = 'This is one way to place the hours, not the timetable. What is fixed is the weekly total per component — 3 hours in-person and 2 hours independent — and that all three run side by side.';
const WEEK_ADAPT_FREE = {
  educator: 'Everything else is yours to set with your coordinator: which days you use (place your own rest day, for example Friday), and whether you spread the same hours over more days with shorter sessions.',
  coordinator: 'Everything else is yours to set with your educators: which days each site uses (place the local rest day, for example Friday), and whether a site spreads the same hours over more days with shorter sessions.',
};
const weekAdapt = (aud = 'educator') => `${WEEK_ADAPT_FIXED} ${WEEK_ADAPT_FREE[aud] || WEEK_ADAPT_FREE.educator}`;

// ---- The week-by-week map ---------------------------------------------------------------------
// Computed from the unit YAMLs: walks each component's blocks, filling 3 in-person hours per week,
// so an educator can see what they are teaching in every component in the same week.
function weekMap(unit, weeksTarget = 10) {
  const perWeek = unit.totalFacilitatedHours / weeksTarget;
  const weeks = Array.from({ length: weeksTarget }, () => []);
  let cursor = 0; // hours consumed so far
  for (const ph of unit.phases) {
    for (const b of ph.blocks) {
      const h = b.facilitatedHours || 0;
      const first = Math.min(weeksTarget - 1, Math.floor(cursor / perWeek));
      const last = Math.min(weeksTarget - 1, Math.floor(Math.max(cursor, cursor + h - 0.001) / perWeek));
      for (let w = first; w <= last; w++) if (!weeks[w].includes(b.title)) weeks[w].push(b.title);
      cursor += h;
    }
  }
  return weeks;
}
function weekMapTable() {
  const maps = COMPONENTS.map((c) => weekMap(c.unit));
  const rows = maps[0].map((_, w) => [
    { lines: [`Week ${w + 1}`], bold: true },
    ...maps.map((m) => ({ lines: m[w].length ? m[w] : ['—'], bold: false, color: undefined, size: 18 })),
  ]);
  return refTable(['Week', 'Agency in Learning', 'English (My Voice)', 'Research Project'], rows, [1200, 3200, 3200, 3200]);
}

// ---- The offline pack index -------------------------------------------------------------------
const PACK_ROWS = [
  ['Educator Guide (this document)', 'You', 'One per educator. Everything below is inside it too — print the parts you need.'],
  ['Coordinator Guide', 'Your coordinator', 'One per coordinator. You do not need to print it.'],
  ['Student Workbook (“My Learning Book”) — the whole programme in one book', 'Learners', 'One per learner — the simplest thing to print. It holds all three learner books below, plus the learner’s mentoring page and growth check. Print this OR the three separate books, not both.'],
  ['Agency in Learning — student workbook (“My Learning Book”)', 'Learners', 'One per learner. Part 7A here. Already inside the Student Workbook above.'],
  ['My Voice — student workbook (“My Voice book”)', 'Learners', 'One per learner. Part 7B here. Already inside the Student Workbook above.'],
  ['Research Project — student workbook (“Our Research Book”)', 'Learners', 'One per learner. Part 7C here. Already inside the Student Workbook above.'],
  ['My Voice — letter & picture cards', 'The group', 'One set per group, printed and cut out. Part 8A here.'],
  ['Research Project — picture-word cards', 'The group', 'One set per group, printed and cut out. Part 8B here.'],
  ['Agency in Learning — picture cards (PDF)', 'The group', 'One set per group, printed and cut out. On the USB only — a PDF, so it is not reproduced in this guide.'],
  ['Agency in Learning — assessment record (FSL2)', 'You', 'One copy per learner. Part 9A here.'],
  ['Research Project — assessment record (FSI1)', 'You', 'One copy per learner. Part 9B here.'],
  ['Mentor’s record', 'You', 'One copy per learner on your mentoring caseload. Part 9C here.'],
];

function titleBlock(c, title, subtitle, blurb) {
  c.push(image(LOGO, 150, 77, { after: 220 }));
  c.push(new Paragraph({ children: [new TextRun({ text: 'Learning Bridge+', bold: true, size: 22, color: OLIVE })], spacing: { after: 20 } }));
  c.push(new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 52, color: NAVY })], spacing: { after: 60 } }));
  c.push(P(subtitle, { size: 28, bold: true, color: PLUM, after: 60 }));
  if (blurb) c.push(P(blurb, { size: 23, color: NAVY, after: 120 }));
  c.push(P("Learning Bridge+ (Cox's Bazar)  ·  a fully offline readiness programme for Rohingya youth", { size: 21, color: GREY, after: 20 }));
  c.push(P('Amala Education, remote technical consultant to the Norwegian Refugee Council (NRC)', { size: 21, color: GREY, after: 220 }));
}

// A full-page divider that opens each part of the Educator Guide. `outline` collects the entry for
// the static contents page.
function partDivider(c, number, title, blurb, outline) {
  if (outline) outline.push({ level: 0, text: `Part ${number} — ${title}` });
  c.push(pageBreak());
  c.push(P(`PART ${number}`, { size: 24, bold: true, color: OLIVE, before: 1800, after: 60 }));
  c.push(new Paragraph({
    heading: S.HeadingLevel.HEADING_1,
    children: [new TextRun({ text: `Part ${number} — ${title}`, bold: true, size: 44, color: NAVY })],
    spacing: { after: 120 },
  }));
  c.push(P(blurb, { size: 23, color: GREY }));
}

// ============================================================ COORDINATOR GUIDE
function coordinatorGuide() {
  const c = [];
  titleBlock(c, 'Coordinator Guide', 'Running the programme in the camps');

  c.push(P('This guide is for the NRC programme coordinator — the person who holds the programme together across sites. It explains what the programme is, who does what, how to set it up, and the 12-week rhythm you run each cohort through, including the two assessment points and Amala’s moderation. It is a companion to the Educator Guide, which is the facilitators’ complete manual: everything they deliver from is in that one document.', { size: 22 }));
  c.push(hr());

  c.push(H1('1. What this programme is'));
  c.push(P('Learning Bridge+ (Cox’s Bazar) is a readiness bridge. It prepares Rohingya refugee youth — typically aged 14 to 24, at around Grade 6 of the Myanmar curriculum — to enter and sustain an accredited secondary education pathway. It keeps the components and competencies of Amala’s Learning Bridge programme, but delivery is rebuilt for this context: fully offline, in Community Based Learning Facilities (CBLFs), for a largely pre-literate cohort, under the protection realities of the camps.', { size: 22 }));
  c.push(P('It is the certificated Learning Bridge+ tier, so learners are formally assessed in two competencies to support the decision about whether they are ready to transition.', { size: 22 }));
  c.push(mini('The headline success measure'));
  c.push(P('Agreed with NRC: at least 70% of learners who complete the programme demonstrate the competencies needed to enrol in the accredited secondary education pathway, as measured by the final assessment. Everything below serves that measure.', { size: 22 }));

  c.push(...agencyThreadChildren({
    heading: (t) => H2(t),
    sub: (t) => mini(t),
  }));

  c.push(H1('2. Who does what'));
  c.push(twoCol(['Role', 'Responsibility'], [
    ['Amala', 'Remote technical consultant. Contextualises the curriculum, supplies ready-made offline resources, trains facilitators and you (the coordinator), supports the Week-6 assessment, and moderates the final judgements. Amala does not deliver in the camps.'],
    ['You (coordinator)', 'Lead implementation on the ground. Set up sites and materials, recruit and support facilitators, hold the calendar and the two assessment windows, keep safeguarding pathways live, and be the bridge between the camps and Amala.'],
    ['Educators', 'Deliver the programme. Each educator holds three functions — they facilitate the sessions, mentor learners 1:1, and assess the competencies. Everything they need is in the Educator Guide.'],
    ['NRC', 'Owns the programme, employs and manages staff, and owns the Code of Conduct, safeguarding, and MHPSS/protection referral pathways.'],
  ]));

  c.push(pageBreak());
  c.push(H1('3. Setting up a cohort'));
  c.push(P('Work through this before Week 1. Most of it you do once per site, then maintain.', { size: 22 }));
  c.push(numbered('Confirm the sites (CBLFs) and the space each offers. A CBLF is often a room in a teacher’s shelter — plan for no internet, and often no reliable power or learner devices.', 'setup'));
  c.push(numbered('Confirm facilitators. Plan for female facilitators and same-gender grouping wherever girls’ participation depends on it, and match language so learners can take part in the language they use at home. Keep mentor caseloads small enough that each learner is genuinely known.', 'setup'));
  c.push(numbered('Distribute the offline pack. Every resource is supplied ready-made and editable, distributed physically by USB or hard drive. The Educator Guide is the single document a facilitator delivers from — it carries the unit plans, the learner books, the cards and the assessment records inside it — with the picture-card PDF alongside on the USB.', 'setup'));
  c.push(numbered('Agree with each site how the learner books will reach learners: one printed book each is best, one shared between two or three works, and a single displayed copy with learners using notebooks is the floor. The books carry the teaching and the worked examples, so what matters is that every learner can SEE them — not that every learner owns one. The books are editable Word files, so pages can be cut before printing if paper is short.', 'setup'));
  c.push(numbered('Make the safeguarding pathway concrete at each site. Before any facilitator takes a mentoring caseload, make sure they know NRC’s Code of Conduct and the camp MHPSS and protection referral pathway — who to hand a concern to, and how.', 'setup'));
  c.push(numbered('Run diagnostic intake. Place each learner, check English proficiency where needed (the cohort is below B1, many not yet literate in any language), and pair each learner with a mentor.', 'setup'));
  c.push(numbered('Plan the closing showcase early. The programme ends with ONE shared event in the last week, not three separate ones: learners present their research, show their "My Name, My Voice" card, and name one way they have grown — and each learner invites at least one person themselves. You need a space that can hold guests, a date fixed early enough for invitations, and the guest arrangements cleared against NRC\u2019s Code of Conduct. Confirm the same-gender seating and grouping plan BEFORE invitations go out.', 'setup'));
  c.push(numbered('Decide whether your sites will offer the optional significant adult meeting — a three-way conversation between a mentor, a learner, and one adult the learner chooses, best placed between Weeks 7 and 11. It is the fastest way to make a learner\u2019s growth visible to the people whose belief shapes what happens next, and it is genuinely demanding to organise. It is fine to run it for some learners and not others; it is not fine to run it where there is an open protection concern. Full guidance is in the Educator Guide, Part 2.3.', 'setup'));

  c.push(H1('4. The programme structure and the 12-week rhythm'));
  c.push(P('The programme has three taught components plus ongoing mentoring, running side by side across the same weeks.', { size: 22 }));
  c.push(twoCol(['Component', 'Hours and cadence'], [
    ['Agency in Learning', 'About 50 hours · 3h in-person + 2h independent per week. Develops Set and Pursue Goals (assessed).'],
    ['Research Project', 'About 50 hours · 3h in-person + 2h independent per week. Develops Investigate Real World Issues (assessed).'],
    ['English Language Development', 'About 50 hours · 3h in-person + 2h independent per week. Compulsory in this edition; assessed formatively against A1 Can-Do outcomes, not one of the two graded competencies.'],
    ['Mentoring and Wellbeing', 'Ongoing · short 1:1 or small-group conversations folded into the weekly in-person time. Not a fixed block of hours.'],
  ]));
  c.push(P('All three taught components run side by side across the same 10–12 weeks. At 3 hours in-person and 2 hours independent each, a full week is about 9 hours in-person and 6 hours of independent tasks (done at home between sessions), with mentoring folded into the in-person time — around 150 hours of taught learning in total.', { size: 22 }));

  c.push(H2('What a week could look like'));
  c.push(P('The simplest way to place the hours is three learning days a week: three hours with the educator each day — one hour per component — and about two hours of independent work at home before the next day. Mentoring check-ins happen inside the in-person time.', { size: 22 }));
  c.push(exampleWeekTable('coordinator'));
  c.push(P(weekMaths('coordinator'), { size: 21, color: OLIVE, bold: true, before: 140 }));
  c.push(P(weekAdapt('coordinator'), { size: 22 }));

  c.push(H2('The 12-week rhythm'));
  c.push(P('Around that weekly learning, hold this assessment rhythm: five weeks of learning, a supported assessment, five more weeks, then the final assessment. Your job is to protect the two assessment windows and keep them on the calendar.', { size: 22 }));
  c.push(twoCol(['When', 'What happens'], ARC_ROWS));
  c.push(callout('The two assessment points, in one line', [
    'Week 6 — supported assessment: a first, provisional judgement, made with Amala’s support. A checkpoint and a rehearsal.',
    'Week 12 — final assessment: the educators’ final judgement of the two competencies, which Amala then moderates.',
  ], OLIVE));

  c.push(callout('Reading the Week-6 results', [
    'Expect most learners to sit at Theorist at Week 6. The goal-pursuit weeks in Agency in Learning, and the analysis and output weeks in the Research Project, both fall AFTER it — so Week 6 is measured before most of the evidence exists.',
    'A low Week-6 picture is not a failing cohort. It is the checkpoint doing its job: it shows where to concentrate support across Weeks 7 to 11.',
    'The 70% measure is taken at Week 12, on the final judgement, and nowhere else.',
  ], OLIVE));

  c.push(pageBreak());
  c.push(H1('5. Coordinating assessment and moderation'));
  c.push(P('Assessment rests on educator judgement across varied evidence, not on a single test. Your role is to make that judgement possible and fair.', { size: 22 }));
  c.push(mini('Before Week 6'));
  c.push(bullet('Check educators are gathering evidence as they teach — from workbooks, steps taken, the growth path, and what learners say and do — not leaving it to the end. Much of this evidence is oral and visual, because many learners are not yet literate; that is expected.'));
  c.push(bullet('Check each educator has the two assessment records (in Part 9 of their guide) copied, one per learner, and started.'));
  c.push(bullet('Schedule the Week-6 supported assessment with Amala, so educators make their first judgements with support and calibration.'));
  c.push(mini('Between Week 6 and Week 12'));
  c.push(bullet('Feed back what Week 6 surfaced: which learners need more evidence, where educators’ judgements were uncertain, which competency needs more attention in the second block.'));
  c.push(mini('At Week 12'));
  c.push(bullet('Educators make their final judgement of each learner in the two competencies against the Proficiency Scale. Collect the judgements and the evidence behind them.'));
  c.push(bullet('Hand a sample to Amala for moderation — a case-based review that confirms judgements are consistent and fair before the readiness decision is confirmed.'));

  c.push(H2('The two assessed competencies'));
  c.push(twoCol(['Competency', 'Developed through'], [
    ['Set and Pursue Goals', 'The Agency in Learning component. The ability to set clear objectives for learning and growth and take deliberate steps toward them.'],
    ['Investigate Real World Issues', 'The Research Project component. The ability to research challenges affecting people and the planet to develop actionable insights.'],
  ]));
  c.push(P('Note: the Research Project is contextualised around a single shared local challenge, which is being agreed with NRC and the community. Until it is finalised, early cohorts may reach the final assessment in Set and Pursue Goals first; confirm the assessed scope for your cohort with Amala.', { size: 21, italics: true, color: GREY }));

  c.push(H2('The grade scale'));
  c.push(twoCol(['Grade', 'Requirement'], [
    ['Pass', 'Practitioner in both competencies.'],
    ['Merit', 'Reflective Practitioner in one competency, Practitioner in the other.'],
    ['Distinction', 'Reflective Practitioner in both competencies.'],
  ]));

  c.push(pageBreak());
  c.push(H1('6. Safeguarding and protection'));
  c.push(callout('This is not optional, and it is not yours to improvise', [
    'All delivery follows NRC’s Code of Conduct and protection principles. Safeguarding is built into every activity that could surface loss, family, marriage, or displacement: no learner ever has to share.',
    'Disclosures here may involve protection risks common in displacement — child marriage, family separation, gender-based violence. Educators are told to notice, steady, and refer — never to counsel, and never to promise secrecy.',
    'Your job as coordinator: make sure the referral pathway is known and live at every site before delivery starts, and that every educator has been briefed on it.',
  ], PLUM));

  c.push(H1('7. Coordinator checklist'));
  c.push(mini('Once per cohort, before Week 1'));
  c.push(bullet('Sites confirmed; offline packs distributed and checked at each site.'));
  c.push(bullet('Facilitators confirmed, with female facilitators and same-gender grouping where needed, and language matched.'));
  c.push(bullet('Safeguarding and referral pathway concrete and briefed at every site.'));
  c.push(bullet('Diagnostic intake complete; learners placed and paired with mentors.'));
  c.push(bullet('Week-6 and Week-12 assessment windows on the calendar; Week-6 support booked with Amala.'));
  c.push(mini('Through the cohort'));
  c.push(bullet('Evidence being gathered continuously, not left to the end.'));
  c.push(bullet('Attendance is stop-start by nature — pick learners up where they are; a return after absence is progress, not a fresh start.'));
  c.push(bullet('Week-6 supported assessment run with Amala; findings fed back to educators.'));
  c.push(bullet('Week-12 final assessment collected; sample handed to Amala for moderation.'));
  c.push(bullet('Track the cohort against the 70% readiness measure.'));

  c.push(P('This guide is part of a fully offline, editable pack for Learning Bridge+ (Cox’s Bazar). Not for redistribution outside the programme.', { size: 18, color: GREY, before: 240 }));
  return makeDoc(c, { footerText: "Coordinator Guide  ·  Learning Bridge+ (Cox's Bazar)" });
}

// ---- the contents page ------------------------------------------------------------------------
// The guide is ~250 pages, so it needs a contents. Word fills in the live table of contents on open
// (the document sets updateFields), but other word processors leave that field blank — so the parts
// and sections are also listed statically. The static list is collected as the guide is built, by
// pushing every part and section heading through part()/sec(), so it cannot fall out of step with
// the headings themselves.
function outlineLine(entry) {
  if (entry.level === 0) {
    return new Paragraph({
      children: [new TextRun({ text: entry.text, bold: true, size: 22, color: NAVY })],
      spacing: { before: 160, after: 40 },
    });
  }
  return new Paragraph({
    children: [new TextRun({ text: entry.text, size: 20, color: entry.level === 1 ? PLUM : GREY })],
    indent: { left: entry.level === 1 ? 340 : 700 },
    spacing: { after: 30 },
  });
}

// The phases of an embedded unit plan, as second-level contents entries.
function phasesIntoOutline(unit, outline) {
  unit.phases.forEach((ph, i) => outline.push({ level: 2, text: `Phase ${i + 1} — ${ph.title}` }));
}

function contentsPage(outline) {
  // deliberately NOT a heading: a contents page that lists itself is noise
  const c = [pageBreak(), P('Contents', { size: 36, bold: true, color: NAVY, after: 140 })];
  c.push(P('The shape of the guide, and then the contents with page numbers.', { size: 20, color: GREY, after: 160 }));
  // The nine parts only. The detailed list follows with real page numbers, so repeating every
  // section here just made the contents long enough that nobody would read either one.
  outline.filter((e) => e.level === 0).forEach((e) => c.push(outlineLine(e)));
  c.push(H2('Contents, with page numbers'));
  c.push(P('This table fills itself in when the file is opened in Word. If it looks empty, right-click it and choose “Update field”.', { size: 19, color: GREY }));
  c.push(toc('1-2'));
  return c;
}

// ============================================================ EDUCATOR GUIDE
// Build a component pack's children one outline level down, so its headings nest under the Part
// that carries them instead of competing with it. `embedded: true` also drops each pack's own cover,
// printing notes and contents page — three of those were landing inside the guide.
function embed(build, shift = 1) {
  S.setHeadingShift(shift);
  try { return build(); } finally { S.setHeadingShift(0); }
}

function educatorGuide() {
  const c = [];
  const outline = [];
  // Push a numbered section heading and record it for the contents page.
  const sec = (title) => { outline.push({ level: 1, text: title }); c.push(H2(title)); };
  const part = (n, title, blurb) => partDivider(c, n, title, blurb, outline);
  titleBlock(c, 'Educator Guide', 'Facilitate, mentor, assess',
    'Everything you need to run the programme, in one document.');

  // ---------------------------------------------------------------- How to use this guide
  c.push(H1('How to use this guide'));
  c.push(P('This is your complete manual. You should not need any other document to deliver Learning Bridge+ (Cox’s Bazar): the full plan for all three components, the learner books to print, the cards to cut out, and the assessment records are all inside it, in the order you will need them.', { size: 22 }));
  c.push(P('Read Parts 1 to 3 before you start — they take about an hour and they carry everything that is shared across the programme. After that you live in Parts 4 to 6, one part per component, session by session. Parts 7 to 9 are the things you print and hand out.', { size: 22 }));
  c.push(refTable(['Part', 'What is in it', 'When you use it'], [
    [{ lines: ['1'] }, { lines: ['Before you start — your three roles, how we deliver here, what a week could look like, the 12-week rhythm, and the week-by-week map of all three components.'] }, { lines: ['Read first.'], color: GREY }],
    [{ lines: ['2'] }, { lines: ['Mentoring and wellbeing — the whole component: setting up, the ten-minute conversation, safeguarding and referral, the arc across twelve weeks, and the record.'] }, { lines: ['Read first, then return to it.'], color: GREY }],
    [{ lines: ['3'] }, { lines: ['Assessment — the two competencies you judge, what evidence to gather as you teach, and how the Week-6 and Week-12 judgements work.'] }, { lines: ['Read first, use throughout.'], color: GREY }],
    [{ lines: ['4'] }, { lines: ['Agency in Learning — the full 50-hour plan, every session’s guidance inline.'] }, { lines: ['Every session.'], color: GREY }],
    [{ lines: ['5'] }, { lines: ['English (My Voice) — the full 50-hour plan, plus how to teach beginner English to pre-literate learners, and the phonics reference.'] }, { lines: ['Every session.'], color: GREY }],
    [{ lines: ['6'] }, { lines: ['Research Project — the full 50-hour plan, plus the source pack and the full original articles for your reference.'] }, { lines: ['Every session.'], color: GREY }],
    [{ lines: ['7'] }, { lines: ['The three learner books, ready to print — one per learner, per component.'] }, { lines: ['Print before Week 1.'], color: GREY }],
    [{ lines: ['8'] }, { lines: ['The cards to print and cut out.'] }, { lines: ['Print before Week 1.'], color: GREY }],
    [{ lines: ['9'] }, { lines: ['The two assessment records — one copy per learner, per assessed competency.'] }, { lines: ['Copy before Week 1; fill at Weeks 6 and 12.'], color: GREY }],
  ], [800, 6400, 3600]));

  c.push(H2('What to print, and for whom'));
  c.push(P('Everything below is inside this guide except the Agency in Learning picture-card PDF, which stays on the USB. There are no slides — this pack assumes no screen, and every activity runs from paper, a wall, and your voice.', { size: 22 }));
  c.push(callout('How much to print, in order of preference', [
    'BEST — one learner book per learner. The book carries the teaching, the worked examples and the frames, and it is the evidence the assessment is made from. A learner who owns theirs can re-read a method after a missed session and take it home.',
    'WORKABLE — one book shared between two or three learners, with each learner using an ordinary notebook for their own answers. You keep the teaching; you lose only the private page.',
    'THE FLOOR — one copy, displayed on a screen or held up, and everyone works in a notebook. Say the page title aloud each time so a learner\u2019s notebook still has a shape you can both follow.',
    'The books are Word files. If paper is short, NRC can cut pages before printing — start with the "My notes and drawings" pages, which an ordinary notebook does better.',
  ], PLUM));
  c.push(P('For the learners, the simplest thing to print is the Student Workbook: it is one book per learner for the whole twelve weeks, holding all three learner books plus their mentoring page and growth check. Print that, or the three component books separately — not both. The cards are separate either way, because they are one set per group and get cut up.', { size: 22 }));
  c.push(refTable(['File', 'For', 'How many'], PACK_ROWS.map((r) => [
    { lines: [r[0]] }, { lines: [r[1]], color: undefined }, { lines: [r[2]], color: GREY },
  ]), [4400, 1800, 4600]));
  c.push(callout('Everything here is editable', [
    'These are Word files, not locked PDFs. Change the words, cut an activity, add your own picture — adapt them to your group. The plan is a floor, not a ceiling.',
  ], OLIVE));

  // The contents page is built last, once every part and section has been collected, then spliced
  // in here.
  const contentsAt = c.length;

  // ---------------------------------------------------------------- PART 1
  part(1, 'Before you start', 'Your three roles, how delivery is rebuilt for this context, what a week could look like, and the rhythm of the twelve weeks.');
  c.push(pageBreak());

  sec('1.0  What this programme is for');
  c.push(...agencyThreadChildren({
    heading: () => P('Read this first. Everything after it is how.', { size: 21, italics: true, color: GREY, after: 120 }),
    sub: (t) => H3(t),
  }));

  c.push(pageBreak());
  sec('1.1  Your three roles');
  c.push(P('In this programme one person holds three functions. They are not three jobs — they feed each other. What you notice as a mentor shapes how you facilitate; what you see in sessions is the evidence you assess from.', { size: 22 }));
  c.push(twoCol(['Role', 'What it means here'], [
    ['Facilitator', 'You run the sessions — 3 hours in-person and 2 hours independent per week, per component — delivering oral and visual first, in the language you share with learners. Parts 4 to 6 are your session-by-session guidance.'],
    ['Mentor', 'You know each learner as a person through short 1:1 conversations. You keep their learning goals alive between sessions, notice when something is wrong, and refer. Part 2.'],
    ['Assessor', 'You gather evidence as you teach and make a judgement of each learner in the two assessed competencies — a supported one at Week 6, a final one at Week 12. Part 3.'],
  ]));

  sec('1.2  How we deliver here');
  c.push(P('Three things are rebuilt for this context. Hold all three, in every session.', { size: 22 }));
  c.push(H3('Oral and visual first'));
  c.push(P('Most learners are not yet literate in any language. Deliver from the plain-English guide in the language you use with learners; learners draw, colour, and speak rather than read and write. The materials are built for this — lean on the say-aloud guidance rather than assuming subject expertise.', { size: 22 }));
  c.push(H3('Learning goals within the learner’s control'));
  c.push(P('Goal-setting is reframed around near-term learning goals the learner can actually act on, not futures that are currently blocked. Keep the conversation about the next controllable step — honest and hopeful.', { size: 22 }));
  c.push(H3('Modular, so stop-start attendance never breaks the sequence'));
  c.push(P('Sessions are self-contained. When a learner returns after an absence, re-anchor the goal, break the next step down small, and treat the return as progress — not a fresh start. Fully offline throughout: assume no internet, and often no power or devices.', { size: 22 }));

  c.push(pageBreak());
  sec('1.3  What a week could look like');
  c.push(P('You deliver three taught components side by side — Agency in Learning, the Research Project, and English. Each one is 3 hours in-person and 2 hours independent per week, so across the three that is 9 hours with you and 6 hours the learners do at home.', { size: 22 }));
  c.push(P('The simplest way to place those hours is three learning days a week. On each of the three days you teach for three hours — one hour of each component — and learners do about two hours at home before the next day. Your mentoring is folded into the in-person time, not added on top.', { size: 22 }));
  c.push(exampleWeekTable());
  c.push(P(weekMaths(), { size: 21, color: OLIVE, bold: true, before: 140 }));
  c.push(mini('Where the mentoring goes'));
  c.push(P('While the rest of the group is working, take two or three learners aside for a short 1:1 check-in. Over the three days you get to everyone. It costs no extra hours — it happens inside the three.', { size: 22 }));
  c.push(mini('Where the two hours at home come from'));
  c.push(P('They are not homework you invent. Every activity in Parts 4 to 6 sets its own between-session task — ask someone at home, take one step towards your goal, gather one piece of evidence, practise your English. Those tasks are the independent hours. Say the task aloud at the end of each hour and check it at the start of the next.', { size: 22 }));
  c.push(mini('Adapting it'));
  c.push(P(weekAdapt(), { size: 22 }));

  sec('1.4  The twelve weeks');
  c.push(P('Ten weeks of delivery sit inside a twelve-week rhythm: five weeks of learning, a supported assessment, five more weeks, then the final assessment. Your coordinator holds the calendar; you hold the evidence.', { size: 22 }));
  c.push(twoCol(['When', 'What happens'], ARC_ROWS));
  c.push(callout('Five weeks, check in, five weeks, decide', [
    'Weeks 1–5 learn  →  Week 6 supported (provisional) judgement, with Amala  →  Weeks 7–11 learn  →  Week 12 final judgement, then Amala moderation.',
  ], OLIVE));

  sec('1.5  The week-by-week map');
  c.push(P('What you are teaching in each component, in the same week, if you run all three from Week 1 at 3 in-person hours each. It is a guide, not a contract — blocks run long or short with a real group, and you may start the Research Project later. Use it to see the whole shape and to check you are roughly on track.', { size: 22 }));
  c.push(weekMapTable());
  c.push(P('Full guidance for every block listed above is in Part 4 (Agency in Learning), Part 5 (English) and Part 6 (Research Project).', { size: 21, italics: true, color: GREY }));

  sec('1.6  The showcase — one closing for the whole programme');
  c.push(P(SHOWCASE.summary, { size: 22, italics: true, color: GREY }));
  c.push(...mdBlocks(SHOWCASE.educatorContent));
  c.push(mini('What the learners are told'));
  c.push(...mdBlocks(SHOWCASE.learnerContent));

  c.push(pageBreak());
  sec('1.7  Before Week 1 — your checklist');
  c.push(bullet('You have read Parts 1 to 3 of this guide.'));
  c.push(bullet('You know NRC’s Code of Conduct and the camp referral pathway — who you hand a concern to, and how. Do not take a mentoring caseload without this.'));
  c.push(bullet('Learner books printed — one per learner if you can, one per two or three if you cannot, or a plan for displaying one copy. Agree which with your coordinator before Week 1.'));
  c.push(bullet('Cards printed and cut out (Part 8).'));
  c.push(bullet('Assessment records copied, one per learner (Part 9), with learners’ names on them.'));
  c.push(bullet('You have skimmed Part 4 Phase 1 and Part 5 Phase 1, so you know how the first sessions open.'));
  c.push(bullet('You know which learners are on your mentoring caseload, and you have agreed the weekly timetable with your coordinator.'));

  // ---------------------------------------------------------------- PART 2
  // Composed from generate-mentoring.js, exactly as Parts 4-6 compose the taught components. Was 343
  // hand-written words for a component the programme calls "the spine of wellbeing support".
  part(2, 'Mentoring and wellbeing', 'The spine of wellbeing support: where a learner is known as a person, where distress is noticed early, and where the goals set in Agency in Learning are kept alive. It adds no hours — it runs inside the in-person time you already have.');
  c.push(pageBreak());
  c.push(...embed(() => MN.guideChildren({ embedded: true })));
  c.push(P('The Research Project has its own, fuller safeguarding and protection guidance, because learners go out and speak to people in the community. It is in Part 6, and you should read it before that component starts.', { size: 22 }));

  // ---------------------------------------------------------------- PART 3
  part(3, 'Assessing the two competencies', 'Your judgement, across varied evidence, gathered as you teach — a supported judgement at Week 6 and a final one at Week 12.');
  c.push(pageBreak());

  sec('3.1  What you are assessing');
  c.push(P('You are assessing two competencies against Amala’s Proficiency Scale. Assessment is your judgement across varied evidence — not a single test — and it is gathered as you teach.', { size: 22 }));
  c.push(twoCol(['Competency', 'Where it is developed'], [
    ['Set and Pursue Goals (FSL2)', 'Agency in Learning — setting clear learning goals and taking deliberate steps toward them. Record in Part 9A.'],
    ['Investigate Real World Issues (FSI1)', 'The Research Project — researching a real challenge to develop actionable insights. Record in Part 9B.'],
  ]));
  c.push(P('English is compulsory but is not one of the two graded competencies: its assessment is formative, against the A1 Can-Do outcomes and each learner’s own growth. The "I can…" sheet in the My Voice book (Part 7B) is how you track it.', { size: 22 }));

  sec('3.2  Gather evidence as you go');
  c.push(P('Do not leave assessment to the end. Across the weeks, collect the evidence of each learner’s competency from:', { size: 22 }));
  c.push(numbered('Their workbook — the Learner Profile, goal, plan, growth pages, and the research book pages they build.', 'evidence'));
  c.push(numbered('The steps they actually take toward a goal, and how they adjust when a step does not work.', 'evidence'));
  c.push(numbered('Their growth path — where they started and how they have moved.', 'evidence'));
  c.push(numbered('What they say and do — in sessions and in mentoring. Much of your strongest evidence is oral and visual, because many learners are not yet literate. That is expected; record it.', 'evidence'));

  sec('3.3  The two assessment points');
  c.push(H3('Week 6 — supported assessment'));
  c.push(P('After the first five weeks of learning, make a first, provisional judgement of each learner against the Proficiency Scale. You do this with Amala’s support and calibration — it is a checkpoint and a rehearsal, not the final grade. Use what it surfaces: which learners you have thin evidence on, where your judgement felt uncertain, which competency needs more attention in the next block.', { size: 22 }));
  c.push(callout('Most learners will look low at Week 6 — that is expected', [
    'By Week 6 a learner has usually SET a goal and made a plan, but the goal-pursuit weeks are still ahead: most of the tracked steps happen in Weeks 7 to 11. So expect a lot of Theorist on Set and Pursue Goals at Week 6, and treat it as normal, not as a warning sign.',
    'The same is true of the Research Project. At Week 6 most groups are still gathering; the weighing, the insights and the output — where Investigate Real World Issues really shows — come afterwards.',
    'Judge what is in front of you honestly and record it. Week 6 tells you where to put your support, not whether the cohort is going to pass.',
  ], OLIVE));
  c.push(H3('Week 12 — final assessment'));
  c.push(P('After the next five weeks, make your final judgement of each learner in the two competencies, against the same scale and on the fuller body of evidence. Amala then moderates a sample — reviewing judgements against the evidence — to confirm they are consistent and fair before the readiness decision is confirmed.', { size: 22 }));
  c.push(P('Fill the record in Part 9 at both points. Do not over-assess: two considered judgements, built from evidence gathered over time, are worth more than repeated testing.', { size: 22 }));

  sec('3.4  The scale, and the grade it produces');
  c.push(P('One ladder, read against the goal each competency names. Credit begins at Practitioner, which is also the readiness bar for the accredited secondary pathway. Expert needs two or more genuinely different scenarios, so it rarely comes from one component alone.', { size: 22 }));
  c.push(P('Below is the ladder with its right-hand column read for Set and Pursue Goals. The same ladder, read for Investigate Real World Issues, is on the Research Project record in Part 9B.', { size: 21, color: GREY }));
  c.push(AIL.scaleTable());
  c.push(H3('The grade scale'));
  c.push(twoCol(['Grade', 'Requirement'], [
    ['Pass', 'Practitioner in both competencies.'],
    ['Merit', 'Reflective Practitioner in one competency, Practitioner in the other.'],
    ['Distinction', 'Reflective Practitioner in both competencies.'],
  ]));

  sec('3.5  A few things that make this work');
  c.push(bullet('Deliver in the language you share with learners, from the plain-English guide. Times in the plans are generous on purpose — oral work, drawing, and translation take longer than they look.'));
  c.push(bullet('Let learners draw and speak. Reading and writing are not the point of most activities; showing the thinking is.'));
  c.push(bullet('Coach, don’t rescue. Re-anchor the goal, break the next step down, and let the learner take it.'));
  c.push(bullet('A return after absence is progress. Pick the learner up where they are.'));
  c.push(bullet('Short of paper, or no printer? Share one book between two or three learners, or display one copy, and let learners work in ordinary notebooks. Say the page title aloud so their notebook keeps the same shape.'));
  c.push(bullet('When something sensitive surfaces: step back, stay calm, do not promise secrecy, and refer.'));

  // ---------------------------------------------------------------- PARTS 4–6: the unit plans
  part(4, 'Agency in Learning', 'The full 50-hour plan — 30 hours in-person, 20 independent. Develops Set and Pursue Goals (FSL2), one of the two assessed competencies.');
  phasesIntoOutline(AIL.unit, outline);
  c.push(pageBreak());
  c.push(...embed(() => AIL.facilitatorPlanChildren({ embedded: true })));

  part(5, 'English — My Voice', 'The full 50-hour plan — 30 hours in-person, 20 independent. Compulsory in this edition; assessed formatively against the A1 Can-Do outcomes. Read "How to teach this well" before you start.');
  phasesIntoOutline(MV.unit, outline);
  c.push(pageBreak());
  c.push(...embed(() => MV.facilitatorPlanChildren({ embedded: true })));

  part(6, 'Research Project', 'The full 50-hour plan — 30 hours in-person, 20 independent. Develops Investigate Real World Issues (FSI1), the second assessed competency. Includes the source pack and the full original articles for your reference.');
  phasesIntoOutline(RP.unit, outline);
  c.push(pageBreak());
  c.push(...embed(() => RP.facilitatorPlanChildren({ embedded: true })));

  // ---------------------------------------------------------------- PART 7: the learner books
  part(7, 'The learner books — print one per learner', 'Three books, one per component. Print each learner a copy before Week 1, or work from one held-up copy and learners’ own notebooks.');
  c.push(pageBreak());
  sec('7A  Agency in Learning — “My Learning Book”');
  c.push(P('One visual-first page per activity: the Learner Profile pages, the goal, the plan, and the growth pages. It is the learner’s record of the whole component, and it is where most of your Set and Pursue Goals evidence comes from.', { size: 22, color: GREY }));
  c.push(pageBreak());
  c.push(...embed(() => AIL.workbookChildren({ embedded: true }), 2));

  c.push(pageBreak());
  sec('7B  English — the “My Voice book”');
  c.push(P('One sheet per activity, in unit order: the name pages, the sound and word pages, the sentence frames, the My Name My Voice card, and the "I can…" sheet you mark at the start and again at the end.', { size: 22, color: GREY }));
  c.push(pageBreak());
  c.push(...embed(() => MV.workbookChildren({ embedded: true }), 2));

  c.push(pageBreak());
  sec('7C  Research Project — “Our Research Book”');
  c.push(P('The source cards learners read (graded B1 and A1/A2 versions), the research word bank, and a page for each step of the investigation.', { size: 22, color: GREY }));
  c.push(pageBreak());
  c.push(...embed(() => RP.workbookChildren({ embedded: true }), 2));

  // ---------------------------------------------------------------- PART 8: the cards
  part(8, 'Cards to print and cut out', 'One set per group. Print on the heaviest paper you have, cut along the lines, and keep each set together.');
  c.push(pageBreak());
  sec('8A  English — letter & picture cards');
  c.push(pageBreak());
  c.push(...embed(() => MV.cardsChildren()));

  c.push(pageBreak());
  sec('8B  Research Project — picture-word cards');
  c.push(pageBreak());
  c.push(...embed(() => RP.cardsChildren()));

  c.push(pageBreak());
  sec('8C  Agency in Learning — picture cards');
  c.push(P('Every picture the Agency in Learning activities suggest, ready to print and cut out. This one is a PDF, so it is not reproduced here — print it from agency-in-learning-picture-cards.pdf on the USB. If you cannot print it, every activity tells you how to draw the picture on paper or on the ground instead.', { size: 22 }));

  // ---------------------------------------------------------------- PART 9: the records
  part(9, 'Records', 'Two assessment records, one per assessed competency, filled at Week 6 and again at Week 12 — plus the mentor’s record, one page per learner for the whole twelve weeks. Make one copy of each per learner and put their name on it.');
  c.push(pageBreak());
  sec('9A  Agency in Learning — Set and pursue goals (FSL2)');
  c.push(...embed(() => AIL.rubricChildren()));
  c.push(pageBreak());
  sec('9B  Research Project — Investigate real-world issues (FSI1)');
  c.push(...embed(() => RP.rubricChildren()));
  c.push(pageBreak());
  sec('9C  Mentoring — the mentor’s record');
  c.push(...embed(() => MN.recordChildren()));

  c.push(pageBreak());
  c.push(P('This guide is the complete, fully offline, editable pack for Learning Bridge+ (Cox’s Bazar) educators. Levels, GPA values and generic descriptors are Amala’s official Competency Framework and Proficiency Scale (cohorts starting 2025). Reproduced articles in Part 6 are used with attribution under educational / non-commercial permission. Not for redistribution outside the programme.', { size: 18, color: GREY, before: 240 }));
  c.splice(contentsAt, 0, ...contentsPage(outline));
  return makeDoc(c, { footerText: "Educator Guide  ·  Learning Bridge+ (Cox's Bazar)", updateFields: true });
}


// ============================================================ STUDENT WORKBOOK
// One book per learner for the whole twelve weeks, so a site prints one job instead of three.
// Parts 1-3 are the three component learner books, composed from the SAME workbookChildren()
// builders as the standalone downloads — passed { embedded: true } so each component drops its own
// cover and the book has a single front. Part 4 is programme-level, rendered from the two cb-*
// materials that belong to no component.
//
// The group cards are deliberately absent: they are one set per group, printed and cut up, so a
// per-learner book is the wrong place for them (it would multiply card printing by the cohort size,
// and mean learners cutting pages out of their own book). They stay in the Educator Guide, Part 8.

// ---- reading the two programme-level pages out of their YAML --------------------------------
// The learner pages are authored as materials, and the printable furniture (the rows, the tick
// boxes) is drawn here from named sections of that learnerContent. Renaming a heading throws rather
// than silently rendering an empty page, so the printed book cannot quietly drift from the site.
function mdSection(md, heading) {
  const lines = String(md || '').replace(/\r/g, '').split('\n');
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start < 0) throw new Error(`learnerContent section not found: "${heading}"`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.trim().startsWith('## '));
  return (end < 0 ? rest : rest.slice(0, end)).join('\n').trim();
}
// Bullets of a section, with wrapped continuation lines rejoined.
function mdBullets(block) {
  const out = [];
  let inList = false;
  for (const raw of block.split('\n')) {
    const t = raw.trim();
    if (t.startsWith('- ')) { out.push(t.slice(2).trim()); inList = true; continue; }
    if (!t) { inList = false; continue; }
    if (inList) out[out.length - 1] += ' ' + t;
  }
  return out;
}
// The prose of a section, up to its first bullet.
const mdIntro = (block) => mdBlocks(block.split('\n').slice(0, (() => {
  const i = block.split('\n').findIndex((l) => l.trim().startsWith('- '));
  return i < 0 ? block.split('\n').length : i;
})()).join('\n'));

const page = (slug) => PROGRAMME_PAGES.find((m) => m.slug === slug);

// ---- learner-facing furniture ----------------------------------------------------------------
const bigFill = (lead) => new Paragraph({
  children: [
    new TextRun({ text: lead + '  ', size: 26, color: NAVY }),
    new TextRun({ text: '________________________________________', size: 26, color: GREY }),
  ],
  spacing: { before: 240, after: 140 },
});

// A five-step ladder marked TWICE — once in the middle of the programme and once at the end — so a
// learner who cannot read a rubric can still see the distance between their two marks. The steps are
// the learner-facing reading of the same proficiency scale the educator records use.
function twiceMarkedLadder(items) {
  const colW = [1350, 1350, 8100];
  const headCell = (t) => new TableCell({
    width: { size: colW[0], type: WidthType.DXA },
    shading: { fill: 'F0ECE3' },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: t.split('\n').map((l, i) => new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: l, bold: i === 0, size: i === 0 ? 20 : 17, color: i === 0 ? NAVY : GREY })],
    })),
  });
  const rows = [new TableRow({ tableHeader: true, children: [
    headCell('Middle\nWeek 6'),
    headCell('End\nWeek 12'),
    new TableCell({
      width: { size: colW[2], type: WidthType.DXA },
      shading: { fill: 'F0ECE3' },
      margins: { top: 60, bottom: 60, left: 140, right: 140 },
      children: [new Paragraph({ children: [new TextRun({ text: 'Mark the one that is most like me now', bold: true, size: 20, color: NAVY })] })],
    }),
  ] })];
  items.forEach((t) => rows.push(new TableRow({ height: { value: 700, rule: 'atLeast' }, cantSplit: true, children: [
    ...[0, 1].map((i) => new TableCell({
      width: { size: colW[i], type: WidthType.DXA },
      margins: { top: 100, bottom: 100, left: 100, right: 100 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '☐', size: 44, color: GREY })] })],
    })),
    new TableCell({
      width: { size: colW[2], type: WidthType.DXA },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: [new Paragraph({ children: [new TextRun({ text: t, size: 22 })] })],
    }),
  ] })));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: colW, rows });
}

// The mentoring log: one row per conversation. Only the next step is ever written here — never what
// was talked about. The book goes home with the learner, so it must not be a place a disclosure is
// recorded; the educator's own note stays with the educator, under NRC's policy.
function mentoringRows(n) {
  const colW = [1200, 7600, 2000];
  const head = ['Week', 'The one step I will take before we meet again', 'Done'];
  const rows = [new TableRow({ tableHeader: true, children: head.map((t, i) => new TableCell({
    width: { size: colW[i], type: WidthType.DXA },
    shading: { fill: 'F0ECE3' },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 20, color: NAVY })] })],
  })) })];
  for (let i = 0; i < n; i++) {
    rows.push(new TableRow({ height: { value: 1150, rule: 'atLeast' }, cantSplit: true, children: [
      new TableCell({ width: { size: colW[0], type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: '', size: 22, color: GREY })] })] }),
      new TableCell({ width: { size: colW[1], type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'draw or write one step', size: 16, color: LINE })] })] }),
      new TableCell({ width: { size: colW[2], type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '☐', size: 44, color: GREY })] })] }),
    ] }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: colW, rows });
}

// The four parts, each with the icon that stands for it on the visual contents page. Most of this
// cohort is not yet reading, so the icon is how a learner finds their part, not the words.
const BOOK_PARTS = [
  { icon: 'target', title: 'My learning goal', sub: 'Agency in Learning', blurb: 'Getting to know myself as a learner, choosing a goal that matters to me, making a plan, and seeing how I have grown.' },
  { icon: 'sunrise', title: 'My voice in English', sub: 'English', blurb: 'My name, the first sounds and words of English, saying who I am, and my own My Name, My Voice card.' },
  { icon: 'plant', title: 'Our research', sub: 'Research Project', blurb: 'Our shared question about the hills, the sources we read, what we find out, and what we make with it.' },
  { icon: 'ladder', title: 'My progress', sub: 'All twelve weeks', blurb: 'My mentoring page, and the page where I mark how I have grown — once in the middle, once at the end.' },
];

// A full-page divider opening each part, carrying the part's icon so it can be found by flicking.
function learnerPartDivider(c, n, part) {
  c.push(pageBreak());
  c.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [imgRun(icon(part.icon), 110, 110)],
    spacing: { before: 1500, after: 240 },
  }));
  c.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `PART ${n}`, bold: true, size: 24, color: OLIVE })], spacing: { after: 80 } }));
  c.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: part.title, bold: true, size: 48, color: NAVY })], spacing: { after: 100 } }));
  c.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: part.sub, size: 26, color: PLUM })], spacing: { after: 200 } }));
  c.push(P(part.blurb, { size: 23, color: GREY, align: AlignmentType.CENTER }));
}

function studentWorkbook() {
  const c = [];

  // ---------------------------------------------------------------- Cover
  c.push(image(LOGO, 150, 77, { align: AlignmentType.CENTER, before: 400, after: 260 }));
  c.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'My Learning Book', bold: true, size: 68, color: NAVY })], spacing: { after: 120 } }));
  c.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Learning Bridge+  ·  Cox's Bazar", size: 28, color: PLUM })], spacing: { after: 700 } }));
  c.push(bigFill('My name'));
  c.push(bigFill('My place'));
  c.push(bigFill('My group'));
  c.push(bigFill('My mentor'));
  c.push(P('You do not have to write. You can draw, colour, and say your answers.', { size: 24, color: GREY, before: 500 }));

  // ---------------------------------------------------------------- How to use this book
  c.push(pageBreak());
  c.push(H1('This book is yours'));
  c.push(P('This one book holds everything you need for the whole programme. You keep it, you fill it, and you take it home with you.', { size: 24 }));
  c.push(P('There are four parts. Your facilitator will tell you which page to turn to. You do not need to go in order, and you do not need to finish every page.', { size: 24 }));
  c.push(H2('Three things to know'));
  c.push(P('1.  You do not have to write.', { size: 24, bold: true, color: PLUM, before: 160 }));
  c.push(P('Drawing is a full answer. A mark is a full answer. You can say your answer out loud and ask someone to write it for you.', { size: 23 }));
  c.push(P('2.  There are no wrong answers here.', { size: 24, bold: true, color: PLUM, before: 160 }));
  c.push(P('No one marks these pages right or wrong. They are for you to think with, and to look back on.', { size: 23 }));
  c.push(P('3.  You never have to share.', { size: 24, bold: true, color: PLUM, before: 160 }));
  c.push(P('You choose what you show and what you keep to yourself. If a question is hard, leave it and come back, or leave it empty.', { size: 23 }));
  c.push(callout('If you miss some weeks', [
    'Leave those pages empty and start again where the group is now. Coming back is progress. Your facilitator will help you pick up from where you are, not from where the plan says you should be.',
  ], OLIVE));

  // ---------------------------------------------------------------- What is in this book
  c.push(pageBreak());
  c.push(H1('What is in this book'));
  c.push(P('Four parts. Look for the picture at the start of each one.', { size: 23, color: GREY, after: 200 }));
  BOOK_PARTS.forEach((part, i) => {
    c.push(new Paragraph({
      children: [
        imgRun(icon(part.icon), 46, 46),
        new TextRun({ text: `    Part ${i + 1}  ·  `, size: 22, color: OLIVE, bold: true }),
        new TextRun({ text: part.title, bold: true, size: 28, color: NAVY }),
        new TextRun({ text: `    ${part.sub}`, size: 21, color: PLUM }),
      ],
      spacing: { before: 260, after: 60 },
    }));
    c.push(P(part.blurb, { size: 22, color: GREY }));
  });

  // ---------------------------------------------------------------- My twelve weeks
  c.push(pageBreak());
  c.push(H1('My twelve weeks'));
  c.push(P('Every learning week you do all three: your goal, your English, and our research. They run side by side from the first week to the last.', { size: 23 }));
  c.push(new Paragraph({
    children: BOOK_PARTS.slice(0, 3).flatMap((p, i) => [
      ...(i ? [new TextRun({ text: '        ', size: 22 })] : []),
      imgRun(icon(p.icon), 56, 56),
      new TextRun({ text: '  ' + p.title, size: 22, color: NAVY }),
    ]),
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 300 },
  }));
  c.push(P('Twice you stop and look at how far you have come — in the middle, and at the end. Those two weeks are marked with a star.', { size: 23 }));
  c.push(weekStrip());
  c.push(P('On those two weeks you fill the same page twice, in Part 4, so you can see the distance you have moved.', { size: 22, color: GREY, before: 160 }));

  // ---------------------------------------------------------------- PARTS 1-3: the component books
  learnerPartDivider(c, 1, BOOK_PARTS[0]);
  c.push(pageBreak());
  c.push(...embed(() => AIL.workbookChildren({ embedded: true })));

  learnerPartDivider(c, 2, BOOK_PARTS[1]);
  c.push(pageBreak());
  c.push(...embed(() => MV.workbookChildren({ embedded: true })));

  learnerPartDivider(c, 3, BOOK_PARTS[2]);
  c.push(pageBreak());
  c.push(...embed(() => RP.workbookChildren({ embedded: true })));

  // ---------------------------------------------------------------- PART 4: programme-level pages
  learnerPartDivider(c, 4, BOOK_PARTS[3]);

  // --- My mentoring conversations ---
  const mentoring = page('cb-my-mentoring-conversations');
  const mLC = mentoring.learnerContent;
  c.push(pageBreak());
  c.push(H1(mentoring.title));
  c.push(...mdIntro(mdSection(mLC, '## My mentoring conversations')));
  c.push(bigFill('My mentor is'));
  c.push(bigFill('We usually meet'));
  c.push(P('One row for each conversation. Draw or write the one step you will take before you meet again, and tick it when it is done.', { size: 22, color: GREY, before: 240, after: 140 }));
  c.push(mentoringRows(6));
  c.push(pageBreak());
  c.push(H2('My mentoring conversations, continued'));
  c.push(mentoringRows(6));
  const paras = (block) => block.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  c.push(callout('What goes on this page, and what does not', paras(mdSection(mLC, '## What goes on this page, and what does not')), PLUM));
  c.push(H3('If you miss some weeks'));
  paras(mdSection(mLC, '## If you miss some weeks')).forEach((t) => c.push(P(t, { size: 22 })));

  // --- How I have grown ---
  const growth = page('cb-my-growth-across-the-programme');
  const gLC = growth.learnerContent;
  const LADDERS = [
    ['## Setting a goal and going after it', 'My learning goal'],
    ['## Finding out about a real thing', 'Our research'],
  ];
  c.push(pageBreak());
  c.push(H1('How I have grown'));
  c.push(...mdIntro(mdSection(gLC, '## How I have grown')));
  LADDERS.forEach(([heading, eyebrowText], i) => {
    if (i) c.push(pageBreak());
    c.push(new Paragraph({ children: [new TextRun({ text: eyebrowText.toUpperCase(), bold: true, size: 15, color: OLIVE })], spacing: { before: 240, after: 40 } }));
    c.push(H2(heading.replace(/^##\s*/, '')));
    c.push(twiceMarkedLadder(mdBullets(mdSection(gLC, heading))));
  });
  c.push(pageBreak());
  c.push(H2('In my own words'));
  c.push(...mdIntro(mdSection(gLC, '## In my own words')));
  mdBullets(mdSection(gLC, '## In my own words')).forEach((t) => {
    c.push(P(t, { size: 23, bold: true, color: PLUM, before: 200, after: 100 }));
    c.push(box(2000, 'draw, write, or say it out loud'));
  });

  c.push(pageBreak());
  c.push(image(LOGO, 130, 67, { align: AlignmentType.CENTER, before: 2000, after: 240 }));
  c.push(P('This book belongs to you. Keep it — it is the record of what you did, and how far you came.', { size: 24, color: NAVY, align: AlignmentType.CENTER }));
  c.push(P("Learning Bridge+ (Cox's Bazar)  ·  Amala Education with the Norwegian Refugee Council", { size: 18, color: GREY, align: AlignmentType.CENTER, before: 300 }));
  return makeDoc(c, { footerText: "My Learning Book  ·  Learning Bridge+ (Cox's Bazar)" });
}

// The twelve weeks as two rows of six, with the two "how I have grown" weeks starred. Visual on
// purpose: a learner who cannot read the labels can still count to their week and see the stars.
function weekStrip() {
  const cols = 6, colW = Math.floor(10800 / cols);
  const cell = (w) => {
    const starred = w === 6 || w === 12;
    return new TableCell({
      width: { size: colW, type: WidthType.DXA },
      shading: starred ? { fill: 'F0ECE3' } : undefined,
      margins: { top: 120, bottom: 120, left: 80, right: 80 },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Week ${w}`, bold: true, size: 22, color: starred ? NAVY : GREY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: starred ? '★' : '', size: 30, color: OLIVE })], spacing: { before: 60 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: starred ? 'How I have grown' : '', size: 16, color: OLIVE })] }),
      ],
    });
  };
  const row = (from) => new TableRow({ children: Array.from({ length: cols }, (_, i) => cell(from + i)) });
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: Array(cols).fill(colW), rows: [row(1), row(7)] });
}

// ============================================================ WRITE
async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [
    ['lb-coxs-bazar-coordinator-guide.docx', coordinatorGuide()],
    ['lb-coxs-bazar-educator-guide.docx', educatorGuide()],
    ['lb-coxs-bazar-student-workbook.docx', studentWorkbook()],
  ];
  for (const [name, doc] of jobs) {
    const buf = await Packer.toBuffer(doc);
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log('wrote', name, (buf.length / 1024).toFixed(1) + ' KB');
  }
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
