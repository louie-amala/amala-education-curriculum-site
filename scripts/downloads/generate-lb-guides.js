/* Generate the two Learning Bridge+ (Cox's Bazar) programme guides:
     - lb-coxs-bazar-coordinator-guide.docx   (for the NRC programme coordinator)
     - lb-coxs-bazar-educator-guide.docx       (for the facilitator / educator)
   These are authored narrative guides (not rendered from a unit YAML). They are wired as
   programme-level `downloads` on content-source/programmes/learning-bridge-coxs-bazar.yaml and
   served, fully offline and editable, from public/downloads/.

   Run:  node scripts/downloads/generate-lb-guides.js
   Override output dir:  OUT_DIR=/tmp/pack node scripts/downloads/generate-lb-guides.js */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak, HeadingLevel,
} = require('docx');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'downloads');

// ---- house style (matches scripts/downloads/generate-docx.js) ----
const NAVY = '1F3A5F', PLUM = '7A3B69', GREY = '5A6473', OLIVE = '6E7A2E', LINE = 'B9B3A6';
const LETTER = { size: { width: 12240, height: 15840 } };

const P = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, size: opts.size || 22, bold: opts.bold, italics: opts.italics, color: opts.color })],
  spacing: { after: opts.after == null ? 120 : opts.after, before: opts.before || 0 },
  alignment: opts.align,
});
const runs = (arr, after = 120) => new Paragraph({ children: arr, spacing: { after } });
const bullet = (text, level = 0) => new Paragraph({ children: [new TextRun({ text, size: 22 })], bullet: { level }, spacing: { after: 60 } });
const numbered = (text, ref) => new Paragraph({ children: [new TextRun({ text, size: 22 })], numbering: { reference: ref, level: 0 }, spacing: { after: 60 } });
const label = (lab, text) => new Paragraph({ children: [new TextRun({ text: lab + ' ', bold: true, size: 22, color: PLUM }), new TextRun({ text, size: 22 })], spacing: { after: 120 } });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 260, after: 100 }, children: [new TextRun({ text: t, bold: true, size: 30, color: NAVY })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: t, bold: true, size: 25, color: PLUM })] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 60 }, children: [new TextRun({ text: t, bold: true, size: 23, color: NAVY })] });
const mini = (t) => new Paragraph({ children: [new TextRun({ text: t, bold: true, italics: true, size: 21, color: OLIVE })], spacing: { before: 80, after: 40 } });
const hr = () => new Paragraph({ text: '', border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE } }, spacing: { after: 120 } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// A soft callout box for a short piece of emphasis (safeguarding, key rule).
const callout = (heading, lines, color = PLUM) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  columnWidths: [10800],
  borders: {
    top: { style: BorderStyle.SINGLE, size: 2, color: LINE },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE },
    left: { style: BorderStyle.SINGLE, size: 18, color },
    right: { style: BorderStyle.SINGLE, size: 2, color: LINE },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  },
  rows: [new TableRow({ children: [new TableCell({
    width: { size: 10800, type: WidthType.DXA },
    margins: { top: 120, bottom: 120, left: 200, right: 200 },
    children: [
      new Paragraph({ children: [new TextRun({ text: heading, bold: true, size: 22, color })], spacing: { after: lines.length ? 80 : 0 } }),
      ...lines.map((l, i) => P(l, { size: 21, after: i === lines.length - 1 ? 0 : 80 })),
    ],
  })] })],
});

// A simple 2-column reference table with a header row.
const twoCol = (header, rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  columnWidths: [3200, 7600],
  rows: [
    new TableRow({ tableHeader: true, children: header.map((h, i) => new TableCell({
      width: { size: i === 0 ? 3200 : 7600, type: WidthType.DXA },
      shading: { fill: 'F0ECE3' },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: NAVY })] })],
    })) }),
    ...rows.map((r) => new TableRow({ children: r.map((cell, i) => new TableCell({
      width: { size: i === 0 ? 3200 : 7600, type: WidthType.DXA },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: cell, bold: i === 0, size: 20, color: i === 0 ? PLUM : undefined })] })],
    })) })),
  ],
});

function titleBlock(c, title, subtitle) {
  c.push(new Paragraph({ children: [new TextRun({ text: "Learning Bridge+", bold: true, size: 22, color: OLIVE })], spacing: { after: 20 } }));
  c.push(new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 52, color: NAVY })], spacing: { after: 60 } }));
  c.push(P(subtitle, { size: 28, bold: true, color: PLUM, after: 60 }));
  c.push(P("Learning Bridge+ (Cox's Bazar)  ·  a fully offline readiness programme for Rohingya youth", { size: 21, color: GREY, after: 20 }));
  c.push(P("Amala Education, remote technical consultant to the Norwegian Refugee Council (NRC)", { size: 21, color: GREY, after: 220 }));
}

// Shared numbering config so both docs get ordered lists.
const NUMBERING = {
  config: [
    { reference: 'setup', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 460, hanging: 260 } } } }] },
    { reference: 'rhythm', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 460, hanging: 260 } } } }] },
    { reference: 'evidence', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 460, hanging: 260 } } } }] },
  ],
};
const makeDoc = (children) => new Document({
  numbering: NUMBERING,
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
  sections: [{ properties: { page: LETTER }, children }],
});

// The shared 12-week arc, described once and reused (as prose) in both guides.
const ARC_ROWS = [
  ['Before Week 1', 'Diagnostic intake. Each learner is placed and, where needed, English proficiency is checked (below B1). Learners are paired with a mentor.'],
  ['Weeks 1–5', 'First block of learning. Educators deliver the component sessions and begin gathering evidence of each learner’s competency as they go — from workbooks, steps taken, and what learners say and do.'],
  ['Week 6', 'Supported (formative) assessment. Educators make a first, provisional judgement of each learner against the Proficiency Scale — with Amala’s support and calibration. This is a rehearsal and a checkpoint, not the final grade.'],
  ['Weeks 7–11', 'Second block of learning. Educators keep building the competencies and keep gathering evidence, guided by what Week 6 surfaced about each learner.'],
  ['Week 12', 'Final (summative) assessment. Educators make their final judgement of each learner in the two assessed competencies, against the Proficiency Scale.'],
  ['After Week 12', 'Amala moderation. Amala reviews a sample of judgements against the evidence to confirm they are consistent and fair, and the readiness decision is confirmed.'],
];

// ============================================================ COORDINATOR GUIDE
function coordinatorGuide() {
  const c = [];
  titleBlock(c, 'Coordinator Guide', 'Running the programme in the camps');

  c.push(P('This guide is for the NRC programme coordinator — the person who holds the programme together across sites. It explains what the programme is, who does what, how to set it up, and the 12-week rhythm you run each cohort through, including the two assessment points and Amala’s moderation. It is a companion to the Educator Guide, which is written for the facilitators you support.', { size: 22 }));
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
    ['Educators', 'Deliver the programme. Each educator holds three functions — they facilitate the sessions, mentor learners 1:1, and assess the competencies. See the Educator Guide.'],
    ['NRC', 'Owns the programme, employs and manages staff, and owns the Code of Conduct, safeguarding, and MHPSS/protection referral pathways.'],
  ]));

  c.push(pageBreak());
  c.push(H1('3. Setting up a cohort'));
  c.push(P('Work through this before Week 1. Most of it you do once per site, then maintain.', { size: 22 }));
  c.push(numbered('Confirm the sites (CBLFs) and the space each offers. A CBLF is often a room in a teacher’s shelter — plan for no internet, and often no reliable power or learner devices.', 'setup'));
  c.push(numbered('Confirm facilitators. Plan for female facilitators and same-gender grouping wherever girls’ participation depends on it, and match language so learners can take part in the language they use at home. Keep mentor caseloads small enough that each learner is genuinely known.', 'setup'));
  c.push(numbered('Distribute the offline pack. Every resource is supplied ready-made and editable, distributed physically by USB or hard drive — the facilitator plan, the student workbook, picture cards, and optional slides for the minority of sites with a screen. Check every site has the full pack and can print what it needs (or has a screen, or can work from a single held-up copy).', 'setup'));
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
  c.push(H2('An example week'));
  c.push(P('One way to place the hours across a six-day week. Each in-person session is about an hour, mentoring is folded in, and the independent tasks are done at home between sessions.', { size: 22 }));
  c.push(twoCol(['Day', 'In-person sessions (about 1 hour each)'], [
    ['Day 1', 'English  ·  Agency in Learning'],
    ['Day 2', 'Research Project  ·  mentoring check-ins'],
    ['Day 3', 'English  ·  Agency in Learning'],
    ['Day 4', 'Research Project  ·  mentoring check-ins'],
    ['Day 5', 'English  ·  Agency in Learning'],
    ['Day 6', 'Research Project  ·  a short small-group wellbeing check and reflection'],
  ]));
  c.push(P('This is one example — adapt it to your site. The fixed points are the weekly hours per component (3h in-person, 2h independent) and that the components run side by side; how you place them across the week is yours. Fewer learning days? Run longer sessions on fewer days. Early cohorts, before the Research Project’s shared challenge is agreed, run Agency in Learning and English only — about six hours in-person a week — and add the Research Project when it is ready.', { size: 22 }));
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
  return makeDoc(c);
}

// ============================================================ EDUCATOR GUIDE
function educatorGuide() {
  const c = [];
  titleBlock(c, 'Educator Guide', 'Facilitate, mentor, assess');

  c.push(P('This guide is for you, the educator. In this programme one person holds three functions: you facilitate the learning, you mentor learners one-to-one, and you assess the two competencies. This guide is the shared thread across all three — how to deliver in this context, and how the two assessments work. Your day-to-day session guidance lives in the Facilitator Unit Plan for each component; keep that beside you.', { size: 22 }));
  c.push(hr());

  c.push(H1('1. Your three roles'));
  c.push(twoCol(['Role', 'What it means here'], [
    ['Facilitator', 'You run the sessions — 3 hours in-person and 2 hours independent per week — delivering oral and visual first, in the language you share with learners.'],
    ['Mentor', 'You know each learner as a person through short 1:1 conversations. You keep their learning goals alive between sessions, notice when something is wrong, and refer.'],
    ['Assessor', 'You gather evidence as you teach and make a judgement of each learner in the two competencies — a supported one at Week 6, a final one at Week 12.'],
  ]));

  c.push(H1('2. How we deliver here'));
  c.push(P('Three things are rebuilt for this context. Hold all three, in every session.', { size: 22 }));
  c.push(H3('Oral and visual first'));
  c.push(P('Most learners are not yet literate in any language. Deliver from the plain-English guide in the language you use with learners; learners draw, colour, and speak rather than read and write. The materials are built for this — lean on the say-aloud guidance rather than assuming subject expertise.', { size: 22 }));
  c.push(H3('Learning goals within the learner’s control'));
  c.push(P('Goal-setting is reframed around near-term learning goals the learner can actually act on, not futures that are currently blocked. Keep the conversation about the next controllable step — honest and hopeful.', { size: 22 }));
  c.push(H3('Modular, so stop-start attendance never breaks the sequence'));
  c.push(P('Sessions are self-contained. When a learner returns after an absence, re-anchor the goal, break the next step down small, and treat the return as progress — not a fresh start. Fully offline throughout: assume no internet, and often no power or devices.', { size: 22 }));

  c.push(H2('What a week looks like'));
  c.push(P('You deliver three taught components side by side — Agency in Learning, the Research Project, and English — each 3 hours in-person and 2 hours independent per week, with your mentoring folded into the in-person time. One example week:', { size: 22 }));
  c.push(twoCol(['Day', 'In-person sessions (about 1 hour each)'], [
    ['Day 1', 'English  ·  Agency in Learning'],
    ['Day 2', 'Research Project  ·  mentoring check-ins'],
    ['Day 3', 'English  ·  Agency in Learning'],
    ['Day 4', 'Research Project  ·  mentoring check-ins'],
    ['Day 5', 'English  ·  Agency in Learning'],
    ['Day 6', 'Research Project  ·  a short small-group wellbeing check and reflection'],
  ]));
  c.push(P('Adapt it with your coordinator — the fixed points are the weekly hours per component; how you place them is yours. The 2 independent hours per component are the between-session tasks set in each activity (asking someone at home, gathering evidence, practising English), done at home. Before the Research Project’s challenge is agreed, you run Agency in Learning and English only.', { size: 22 }));

  c.push(pageBreak());
  c.push(H1('3. Mentoring'));
  c.push(P('1:1 mentoring is the spine of wellbeing support: it is where a learner is known as a person, where distress is noticed early, and where the learning goals set in Agency in Learning are kept alive. You are not a counsellor — you build the relationship, notice concerns, and refer along NRC’s pathways.', { size: 22 }));
  c.push(mini('How it runs'));
  c.push(bullet('Fold mentoring into the weekly in-person time as short 1:1 or very small-group conversations. No devices, no internet.'));
  c.push(bullet('Start every meeting with a genuine check-in, spoken in the learner’s own language rather than as a written survey. Watch for withdrawal, or a change in how "fine" sounds over the weeks.'));
  c.push(bullet('Keep a light paper record of what you notice, so each conversation builds on the last and survives stop-start attendance.'));
  c.push(bullet('Surface the skills learners already use in camp life — caring for siblings, translating, running a stall, resolving disputes. Capture that growth orally and visually; it becomes evidence for the Set and Pursue Goals assessment.'));
  c.push(P('The shared practice is the mentor moves on the Educators pages. Use them; this guide says how they are held in the Cox’s Bazar context.', { size: 21, italics: true, color: GREY }));

  c.push(callout('Safeguarding — before you take a caseload', [
    'Know NRC’s safeguarding policy and the camp referral pathway before you mentor anyone.',
    'No learner ever has to share. For sensitive ground — loss, family, marriage, displacement — step back; the materials give you clear step-back prompts.',
    'Disclosures may involve protection risks common in displacement — child marriage, family separation, gender-based violence. Respond calmly, never promise secrecy, and refer. Your job is to notice, steady, and refer — not to counsel.',
  ], PLUM));

  c.push(pageBreak());
  c.push(H1('4. Assessing the two competencies'));
  c.push(P('You are assessing two competencies against Amala’s Proficiency Scale. Assessment is your judgement across varied evidence — not a single test — and it is gathered as you teach.', { size: 22 }));
  c.push(twoCol(['Competency', 'Where it is developed'], [
    ['Set and Pursue Goals', 'Agency in Learning — setting clear learning goals and taking deliberate steps toward them.'],
    ['Investigate Real World Issues', 'The Research Project — researching a real challenge to develop actionable insights.'],
  ]));

  c.push(H2('Gather evidence as you go'));
  c.push(P('Do not leave assessment to the end. Across the weeks, collect the evidence of each learner’s competency from:', { size: 22 }));
  c.push(numbered('Their workbook — the Learner Profile, goal, plan, and growth pages they build.', 'evidence'));
  c.push(numbered('The steps they actually take toward a goal, and how they adjust when a step does not work.', 'evidence'));
  c.push(numbered('Their growth path — where they started and how they have moved.', 'evidence'));
  c.push(numbered('What they say and do — in sessions and in mentoring. Much of your strongest evidence is oral and visual, because many learners are not yet literate. That is expected; record it.', 'evidence'));

  c.push(H2('The two assessment points'));
  c.push(H3('Week 6 — supported assessment'));
  c.push(P('After the first five weeks of learning, make a first, provisional judgement of each learner against the Proficiency Scale. You do this with Amala’s support and calibration — it is a checkpoint and a rehearsal, not the final grade. Use what it surfaces: which learners you have thin evidence on, where your judgement felt uncertain, which competency needs more attention in the next block.', { size: 22 }));
  c.push(H3('Week 12 — final assessment'));
  c.push(P('After the next five weeks, make your final judgement of each learner in the two competencies, against the same scale and on the fuller body of evidence. Amala then moderates a sample — reviewing judgements against the evidence — to confirm they are consistent and fair before the readiness decision is confirmed.', { size: 22 }));
  c.push(callout('Five weeks, check in, five weeks, decide', [
    'Weeks 1–5 learn  →  Week 6 supported (provisional) judgement, with Amala  →  Weeks 7–11 learn  →  Week 12 final judgement, then Amala moderation.',
  ], OLIVE));

  c.push(H2('The grade scale'));
  c.push(twoCol(['Grade', 'Requirement'], [
    ['Pass', 'Practitioner in both competencies.'],
    ['Merit', 'Reflective Practitioner in one competency, Practitioner in the other.'],
    ['Distinction', 'Reflective Practitioner in both competencies.'],
  ]));
  c.push(P('Note: the Research Project’s shared challenge is being finalised with NRC and the community. Confirm with your coordinator which competencies your cohort is assessed in and when.', { size: 21, italics: true, color: GREY }));

  c.push(pageBreak());
  c.push(H1('5. A few things that make this work'));
  c.push(bullet('Deliver in the language you share with learners, from the plain-English guide. Times in the plan are generous on purpose — oral work, drawing, and translation take longer than they look.'));
  c.push(bullet('Let learners draw and speak. Reading and writing are not the point of most activities; showing the thinking is.'));
  c.push(bullet('Coach, don’t rescue. Re-anchor the goal, break the next step down, and let the learner take it.'));
  c.push(bullet('A return after absence is progress. Pick the learner up where they are.'));
  c.push(bullet('No printer? Show one copy on a screen, or hold up a printed sheet, and learners use their own notebooks.'));
  c.push(bullet('When something sensitive surfaces: step back, stay calm, do not promise secrecy, and refer.'));

  c.push(P('This guide is part of a fully offline, editable pack for Learning Bridge+ (Cox’s Bazar). Your session-by-session guidance is in the Facilitator Unit Plan for each component. Not for redistribution outside the programme.', { size: 18, color: GREY, before: 240 }));
  return makeDoc(c);
}

// ============================================================ WRITE
(async () => {
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
})();
