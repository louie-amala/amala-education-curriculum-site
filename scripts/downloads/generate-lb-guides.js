/* Generate the two Learning Bridge+ (Cox's Bazar) programme guides:
     - lb-coxs-bazar-coordinator-guide.docx   (for the NRC programme coordinator)
     - lb-coxs-bazar-educator-guide.docx      (for the facilitator / educator)

   The Coordinator Guide is a short authored narrative: what the programme is, who does what, the
   12-week rhythm, and the two assessment windows to protect.

   The Educator Guide is the ONE-STOP SHOP. It carries everything an educator needs to deliver the
   programme in one document: the orientation, mentoring and assessment guidance, then the FULL
   facilitator unit plan for all three taught components, the three learner books to print, the
   printable cards, and the two assessment records. Those parts are not re-authored here — they are
   composed from the same children builders the standalone downloads use (generate-ail.js,
   generate-docx.js, generate-rp.js), so the guide can never drift from the component packs or the
   authored YAML behind them.

   Run:  node scripts/downloads/generate-lb-guides.js
   Override output dir:  OUT_DIR=/tmp/pack node scripts/downloads/generate-lb-guides.js
   Re-run after editing any Cox's Bazar unit or cb-* material, and after re-running the component
   generators — this guide embeds their content. */
const fs = require('fs');
const path = require('path');
const { Packer } = require('docx');
const S = require('./lib/docx-style');

const {
  NAVY, PLUM, GREY, OLIVE,
  P, body, bullet, numbered, H1, H2, H3, mini, hr, pageBreak,
  refTable, twoCol, callout, makeDoc, toc, image, LOGO, Paragraph, TextRun,
} = S;

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'downloads');

// The three component packs, as children builders — embedded, never re-authored.
const AIL = require('./generate-ail');
const MV = require('./generate-docx');
const RP = require('./generate-rp');

// The three taught components, in the order the guide presents them. Drives the week-by-week map.
const COMPONENTS = [AIL, MV, RP];

// ============================================================ SHARED CONTENT
// Both guides describe the same programme, so the pieces that must not drift live here once.

// The shared 12-week arc.
const ARC_ROWS = [
  ['Before Week 1', 'Diagnostic intake. Each learner is placed and, where needed, English proficiency is checked (below B1). Learners are paired with a mentor.'],
  ['Weeks 1–5', 'First block of learning. Educators deliver the component sessions and begin gathering evidence of each learner’s competency as they go — from workbooks, steps taken, and what learners say and do.'],
  ['Week 6', 'Supported (formative) assessment. Educators make a first, provisional judgement of each learner against the Proficiency Scale — with Amala’s support and calibration. This is a rehearsal and a checkpoint, not the final grade.'],
  ['Weeks 7–11', 'Second block of learning. Educators keep building the competencies and keep gathering evidence, guided by what Week 6 surfaced about each learner.'],
  ['Week 12', 'Final (summative) assessment. Educators make their final judgement of each learner in the two assessed competencies, against the Proficiency Scale.'],
  ['After Week 12', 'Amala moderation. Amala reviews a sample of judgements against the evidence to confirm they are consistent and fair, and the readiness decision is confirmed.'],
];

// ---- The example week -------------------------------------------------------------------------
// Used by both guides so the two timetables cannot drift. Deliberately concrete: THREE learning days
// a week, THREE hours with you each day (one hour per component), and about TWO hours at home each
// day. That is the whole weekly load — 9 in-person + 6 independent = 15 hours — laid out so an
// educator can see it, not infer it. Days are numbered, not named: each site places its own rest day.
const WEEK_HEADER = [
  'Learning day',
  'With you, in the CBLF — 3 hours',
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
const exampleWeekTable = () => refTable(WEEK_HEADER, weekRows(), [1700, 4700, 4400]);

const WEEK_MATHS = '3 learning days × 3 hours with you = 9 in-person hours. 3 days × about 2 hours at home = 6 independent hours. That is 15 hours a week, and about 150 hours across the 10 weeks of delivery — the full programme.';
const WEEK_ADAPT = 'This is one way to place the hours, not the timetable. What is fixed is the weekly total per component — 3 hours in-person and 2 hours independent — and that all three run side by side. Everything else is yours to set with your coordinator: which days you use (place your own rest day, for example Friday), and whether you spread the same hours over more days with shorter sessions. Before the Research Project’s shared challenge is agreed, run Agency in Learning and English only — two hours a day with you instead of three.';

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
  ['Agency in Learning — student workbook (“My Learning Book”)', 'Learners', 'One per learner. Part 7A here.'],
  ['My Voice — student workbook (“My Voice book”)', 'Learners', 'One per learner. Part 7B here.'],
  ['Research Project — student workbook (“Our Research Book”)', 'Learners', 'One per learner. Part 7C here.'],
  ['My Voice — letter & picture cards', 'The group', 'One set per group, printed and cut out. Part 8A here.'],
  ['Research Project — picture-word cards', 'The group', 'One set per group, printed and cut out. Part 8B here.'],
  ['Agency in Learning — picture cards (PDF)', 'The group', 'One set per group, printed and cut out. On the USB only — a PDF, so it is not reproduced in this guide.'],
  ['Agency in Learning — assessment record (FSL2)', 'You', 'One copy per learner. Part 9A here.'],
  ['Research Project — assessment record (FSI1)', 'You', 'One copy per learner. Part 9B here.'],
  ['Session slides (Agency in Learning, My Voice)', 'Optional', 'Only for the minority of sites with a screen. On the USB only.'],
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
  c.push(new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 44, color: NAVY })], spacing: { after: 120 } }));
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
  c.push(numbered('Distribute the offline pack. Every resource is supplied ready-made and editable, distributed physically by USB or hard drive. The Educator Guide is the single document a facilitator delivers from — it carries the unit plans, the learner books, the cards and the assessment records inside it — with the slides and the picture-card PDF alongside on the USB.', 'setup'));
  c.push(numbered('Check every site can print what it needs — at minimum one learner book per learner per component — or has a screen, or can work from a single held-up copy.', 'setup'));
  c.push(numbered('Make the safeguarding pathway concrete at each site. Before any facilitator takes a mentoring caseload, make sure they know NRC’s Code of Conduct and the camp MHPSS and protection referral pathway — who to hand a concern to, and how.', 'setup'));
  c.push(numbered('Run diagnostic intake. Place each learner, check English proficiency where needed (the cohort is below B1, many not yet literate in any language), and pair each learner with a mentor.', 'setup'));

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
  c.push(exampleWeekTable());
  c.push(P(WEEK_MATHS, { size: 21, color: OLIVE, bold: true, before: 140 }));
  c.push(P(WEEK_ADAPT, { size: 22 }));

  c.push(H2('The 12-week rhythm'));
  c.push(P('Around that weekly learning, hold this assessment rhythm: five weeks of learning, a supported assessment, five more weeks, then the final assessment. Your job is to protect the two assessment windows and keep them on the calendar.', { size: 22 }));
  c.push(twoCol(['When', 'What happens'], ARC_ROWS));
  c.push(callout('The two assessment points, in one line', [
    'Week 6 — supported assessment: a first, provisional judgement, made with Amala’s support. A checkpoint and a rehearsal.',
    'Week 12 — final assessment: the educators’ final judgement of the two competencies, which Amala then moderates.',
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
  const c = [pageBreak(), H1('Contents')];
  c.push(P('Every page is numbered at the foot. The list below is the shape of the guide; in Word, the detailed contents underneath it fills in with page numbers when you open the file.', { size: 20, color: GREY, after: 160 }));
  outline.forEach((e) => c.push(outlineLine(e)));
  c.push(pageBreak());
  c.push(H2('Detailed contents, with page numbers'));
  c.push(P('This table fills itself in when the file is opened in Word. If it looks empty, right-click it and choose “Update field”.', { size: 19, italics: true, color: GREY }));
  c.push(toc('1-2'));
  return c;
}

// ============================================================ EDUCATOR GUIDE
function educatorGuide() {
  const c = [];
  const outline = [];
  // Push a numbered section heading and record it for the contents page.
  const sec = (title) => { outline.push({ level: 1, text: title }); c.push(H1(title)); };
  const part = (n, title, blurb) => partDivider(c, n, title, blurb, outline);
  titleBlock(c, 'Educator Guide', 'Facilitate, mentor, assess',
    'Everything you need to run the programme, in one document.');

  // ---------------------------------------------------------------- How to use this guide
  c.push(H1('How to use this guide'));
  c.push(P('This is your complete manual. You should not need any other document to deliver Learning Bridge+ (Cox’s Bazar): the full plan for all three components, the learner books to print, the cards to cut out, and the assessment records are all inside it, in the order you will need them.', { size: 22 }));
  c.push(P('Read Parts 1 to 3 before you start — they take about an hour and they carry everything that is shared across the programme. After that you live in Parts 4 to 6, one part per component, session by session. Parts 7 to 9 are the things you print and hand out.', { size: 22 }));
  c.push(refTable(['Part', 'What is in it', 'When you use it'], [
    [{ lines: ['1'] }, { lines: ['Before you start — your three roles, how we deliver here, what a week could look like, the 12-week rhythm, and the week-by-week map of all three components.'] }, { lines: ['Read first.'], color: GREY }],
    [{ lines: ['2'] }, { lines: ['Mentoring and wellbeing — how the 1:1 conversations run, and the safeguarding you must know before you take a caseload.'] }, { lines: ['Read first, then return to it.'], color: GREY }],
    [{ lines: ['3'] }, { lines: ['Assessment — the two competencies you judge, what evidence to gather as you teach, and how the Week-6 and Week-12 judgements work.'] }, { lines: ['Read first, use throughout.'], color: GREY }],
    [{ lines: ['4'] }, { lines: ['Agency in Learning — the full 50-hour plan, every session’s guidance inline.'] }, { lines: ['Every session.'], color: GREY }],
    [{ lines: ['5'] }, { lines: ['English (My Voice) — the full 50-hour plan, plus how to teach beginner English to pre-literate learners, and the phonics reference.'] }, { lines: ['Every session.'], color: GREY }],
    [{ lines: ['6'] }, { lines: ['Research Project — the full 50-hour plan, plus the source pack and the full original articles for your reference.'] }, { lines: ['Every session.'], color: GREY }],
    [{ lines: ['7'] }, { lines: ['The three learner books, ready to print — one per learner, per component.'] }, { lines: ['Print before Week 1.'], color: GREY }],
    [{ lines: ['8'] }, { lines: ['The cards to print and cut out.'] }, { lines: ['Print before Week 1.'], color: GREY }],
    [{ lines: ['9'] }, { lines: ['The two assessment records — one copy per learner, per assessed competency.'] }, { lines: ['Copy before Week 1; fill at Weeks 6 and 12.'], color: GREY }],
  ], [800, 6400, 3600]));

  c.push(H2('What to print, and for whom'));
  c.push(P('Everything below is inside this guide except the Agency in Learning picture-card PDF and the optional slides, which stay on the USB. Where there is no printer: show one copy on a screen, or hold up a printed sheet, and learners use their own notebooks — every activity is written to work that way.', { size: 22 }));
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
  c.push(P(WEEK_MATHS, { size: 21, color: OLIVE, bold: true, before: 140 }));
  c.push(mini('Where the mentoring goes'));
  c.push(P('While the rest of the group is working, take two or three learners aside for a short 1:1 check-in. Over the three days you get to everyone. It costs no extra hours — it happens inside the three.', { size: 22 }));
  c.push(mini('Where the two hours at home come from'));
  c.push(P('They are not homework you invent. Every activity in Parts 4 to 6 sets its own between-session task — ask someone at home, take one step towards your goal, gather one piece of evidence, practise your English. Those tasks are the independent hours. Say the task aloud at the end of each hour and check it at the start of the next.', { size: 22 }));
  c.push(mini('Adapting it'));
  c.push(P(WEEK_ADAPT, { size: 22 }));

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

  sec('1.6  Before Week 1 — your checklist');
  c.push(bullet('You have read Parts 1 to 3 of this guide.'));
  c.push(bullet('You know NRC’s Code of Conduct and the camp referral pathway — who you hand a concern to, and how. Do not take a mentoring caseload without this.'));
  c.push(bullet('Learner books printed, one per learner per component (Part 7), or a plan for how you will work without a printer.'));
  c.push(bullet('Cards printed and cut out (Part 8).'));
  c.push(bullet('Assessment records copied, one per learner (Part 9), with learners’ names on them.'));
  c.push(bullet('You have skimmed Part 4 Phase 1 and Part 5 Phase 1, so you know how the first sessions open.'));
  c.push(bullet('You know which learners are on your mentoring caseload, and you have agreed the weekly timetable with your coordinator.'));

  // ---------------------------------------------------------------- PART 2
  part(2, 'Mentoring and wellbeing', 'The spine of wellbeing support: where a learner is known as a person, where distress is noticed early, and where the goals set in Agency in Learning are kept alive.');
  c.push(pageBreak());

  sec('2.1  What mentoring is here');
  c.push(P('1:1 mentoring is the spine of wellbeing support: it is where a learner is known as a person, where distress is noticed early, and where the learning goals set in Agency in Learning are kept alive. You are not a counsellor — you build the relationship, notice concerns, and refer along NRC’s pathways.', { size: 22 }));
  c.push(mini('How it runs'));
  c.push(bullet('Fold mentoring into the weekly in-person time as short 1:1 or very small-group conversations. No devices, no internet.'));
  c.push(bullet('Start every meeting with a genuine check-in, spoken in the learner’s own language rather than as a written survey. Watch for withdrawal, or a change in how "fine" sounds over the weeks.'));
  c.push(bullet('Keep a light paper record of what you notice, so each conversation builds on the last and survives stop-start attendance.'));
  c.push(bullet('Surface the skills learners already use in camp life — caring for siblings, translating, running a stall, resolving disputes. Capture that growth orally and visually; it becomes evidence for the Set and Pursue Goals assessment.'));
  c.push(P('The shared practice is the mentor moves on the Educators pages. Use them; this guide says how they are held in the Cox’s Bazar context.', { size: 21, italics: true, color: GREY }));

  sec('2.2  Safeguarding');
  c.push(callout('Before you take a caseload', [
    'Know NRC’s safeguarding policy and the camp referral pathway before you mentor anyone.',
    'No learner ever has to share. For sensitive ground — loss, family, marriage, displacement — step back; the materials give you clear step-back prompts.',
    'Disclosures may involve protection risks common in displacement — child marriage, family separation, gender-based violence. Respond calmly, never promise secrecy, and refer. Your job is to notice, steady, and refer — not to counsel.',
  ], PLUM));
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
  c.push(P('Note: the Research Project’s shared challenge is being finalised with NRC and the community. Confirm with your coordinator which competencies your cohort is assessed in and when.', { size: 21, italics: true, color: GREY }));

  sec('3.5  A few things that make this work');
  c.push(bullet('Deliver in the language you share with learners, from the plain-English guide. Times in the plans are generous on purpose — oral work, drawing, and translation take longer than they look.'));
  c.push(bullet('Let learners draw and speak. Reading and writing are not the point of most activities; showing the thinking is.'));
  c.push(bullet('Coach, don’t rescue. Re-anchor the goal, break the next step down, and let the learner take it.'));
  c.push(bullet('A return after absence is progress. Pick the learner up where they are.'));
  c.push(bullet('No printer? Show one copy on a screen, or hold up a printed sheet, and learners use their own notebooks.'));
  c.push(bullet('When something sensitive surfaces: step back, stay calm, do not promise secrecy, and refer.'));

  // ---------------------------------------------------------------- PARTS 4–6: the unit plans
  part(4, 'Agency in Learning', 'The full 50-hour plan — 30 hours in-person, 20 independent. Develops Set and Pursue Goals (FSL2), one of the two assessed competencies.');
  phasesIntoOutline(AIL.unit, outline);
  c.push(pageBreak());
  c.push(...AIL.facilitatorPlanChildren());

  part(5, 'English — My Voice', 'The full 50-hour plan — 30 hours in-person, 20 independent. Compulsory in this edition; assessed formatively against the A1 Can-Do outcomes. Read "How to teach this well" before you start.');
  phasesIntoOutline(MV.unit, outline);
  c.push(pageBreak());
  c.push(...MV.facilitatorPlanChildren({ embedded: true }));

  part(6, 'Research Project', 'The full 50-hour plan — 30 hours in-person, 20 independent. Develops Investigate Real World Issues (FSI1), the second assessed competency. Includes the source pack and the full original articles for your reference.');
  phasesIntoOutline(RP.unit, outline);
  c.push(pageBreak());
  c.push(...RP.facilitatorPlanChildren({ embedded: true }));

  // ---------------------------------------------------------------- PART 7: the learner books
  part(7, 'The learner books — print one per learner', 'Three books, one per component. Print each learner a copy before Week 1, or work from one held-up copy and learners’ own notebooks.');
  c.push(pageBreak());
  sec('7A  Agency in Learning — “My Learning Book”');
  c.push(P('One visual-first page per activity: the Learner Profile pages, the goal, the plan, and the growth pages. It is the learner’s record of the whole component, and it is where most of your Set and Pursue Goals evidence comes from.', { size: 22, color: GREY }));
  c.push(pageBreak());
  c.push(...AIL.workbookChildren());

  c.push(pageBreak());
  sec('7B  English — the “My Voice book”');
  c.push(P('One sheet per activity, in unit order: the name pages, the sound and word pages, the sentence frames, the My Name My Voice card, and the "I can…" sheet you mark at the start and again at the end.', { size: 22, color: GREY }));
  c.push(pageBreak());
  c.push(...MV.workbookChildren());

  c.push(pageBreak());
  sec('7C  Research Project — “Our Research Book”');
  c.push(P('The source cards learners read (graded B1 and A1/A2 versions), the research word bank, and a page for each step of the investigation.', { size: 22, color: GREY }));
  c.push(pageBreak());
  c.push(...RP.workbookChildren());

  // ---------------------------------------------------------------- PART 8: the cards
  part(8, 'Cards to print and cut out', 'One set per group. Print on the heaviest paper you have, cut along the lines, and keep each set together.');
  c.push(pageBreak());
  sec('8A  English — letter & picture cards');
  c.push(pageBreak());
  c.push(...MV.cardsChildren());

  c.push(pageBreak());
  sec('8B  Research Project — picture-word cards');
  c.push(pageBreak());
  c.push(...RP.cardsChildren());

  c.push(pageBreak());
  sec('8C  Agency in Learning — picture cards');
  c.push(P('Every picture the Agency in Learning activities suggest, ready to print and cut out. This one is a PDF, so it is not reproduced here — print it from agency-in-learning-picture-cards.pdf on the USB. If you cannot print it, every activity tells you how to draw the picture on paper or on the ground instead.', { size: 22 }));

  // ---------------------------------------------------------------- PART 9: the records
  part(9, 'Assessment records', 'Two records, one per assessed competency. Make one copy of each per learner, put their name on it, and fill it at Week 6 and again at Week 12.');
  c.push(pageBreak());
  sec('9A  Agency in Learning — Set and pursue goals (FSL2)');
  c.push(...AIL.rubricChildren());
  c.push(pageBreak());
  sec('9B  Research Project — Investigate real-world issues (FSI1)');
  c.push(...RP.rubricChildren());

  c.push(pageBreak());
  c.push(P('This guide is the complete, fully offline, editable pack for Learning Bridge+ (Cox’s Bazar) educators. Levels, GPA values and generic descriptors are Amala’s official Competency Framework and Proficiency Scale (cohorts starting 2025). Reproduced articles in Part 6 are used with attribution under educational / non-commercial permission. Not for redistribution outside the programme.', { size: 18, color: GREY, before: 240 }));
  c.splice(contentsAt, 0, ...contentsPage(outline));
  return makeDoc(c, { footerText: "Educator Guide  ·  Learning Bridge+ (Cox's Bazar)", updateFields: true });
}

// ============================================================ WRITE
async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [
    ['lb-coxs-bazar-coordinator-guide.docx', coordinatorGuide()],
    ['lb-coxs-bazar-educator-guide.docx', educatorGuide()],
  ];
  for (const [name, doc] of jobs) {
    const buf = await Packer.toBuffer(doc);
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log('wrote', name, (buf.length / 1024).toFixed(1) + ' KB');
  }
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
