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
// The competency framework, for the anchor competency's official title and goal in the course guide.
const competencies = rd(path.join(CS, 'framework', 'competencies.yaml'));
const { courseGuideChildren } = require('./lib/course-guide');
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

// ---- house style ----------------------------------------------------------
// Shared with the other component packs and the one-stop Educator Guide (lib/docx-style.js), so this
// pack cannot drift from them. Every measurement and the reasoning behind it lives there.
const S = require('./lib/docx-style');
const {
  NAVY, PLUM, GREY, OLIVE, LINE, COL, BOOK, GUIDE, HAIRLINE, accentLeft, NOTES_LINES,
  plain, toParas, P, runs, body, bullet, label, H1, H2, H3, mini, hr, pageBreak,
  eyebrow, title, bold, example, noteBox, stem, ruled, linedArea, writeBox, choices, check, slot,
  zones, grid, notesPage, box, writeLine, gridBoxes, mdTable, mdBlocks,
  contents, printNotes, makeDoc, eyebrowChip, scribe,
} = S;

// ---- scaffolding helpers (worked examples, stems, standing scribe note) ----
// A pre-literate learner facing a blank box, once the facilitator steps back, has no scaffold. So every
// workbook page carries a persistent WORKED EXAMPLE and FRAMES, not empty space. modelBox renders a
// tinted "Like this" example that stays on the page. Names/things are culturally apt and literacy-free.
const { ShadingType } = require('docx');
const TINT = 'FBF3E4'; // light gold, worked-example boxes
const MODEL_MARGINS = { top: 90, bottom: 90, left: 140, right: 140 };
// The worked example. Now the shared accent-bar panel, so it matches the other packs and costs a
// rule instead of a page of tint.
const modelBox = (lines, opts = {}) => example(
  (Array.isArray(lines) ? lines : [lines]).map((ln) => (typeof ln === 'string' ? ln : '')).filter(Boolean),
  opts.label,
);
// The standing promise that keeps every page literacy-free.
// The standing promise that keeps every page literacy-free. It now lives in the running footer,
// once, instead of being reprinted in italics on every page.
const scribeNote = () => null;
const faceRun = (size = 20) => new TextRun({ text: ':)   :|   :(', size, color: GREY });

// minimal markdown -> docx blocks (headings, bullets, pipe tables, paragraphs) for resource content
function facilitatorPlanChildren(opts = {}) {
  const c = [];
  if (!opts.embedded) {
    c.push(new Paragraph({ children: [new TextRun({ text: 'My Voice', bold: true, size: 52, color: NAVY })], spacing: { after: 40 } }));
    c.push(P('Facilitator Unit Plan & Guide', { size: 30, bold: true, color: PLUM, after: 40 }));
    c.push(P("Learning Bridge+ (Cox's Bazar)  ·  English Language Development", { size: 22, color: GREY, after: 200 }));
    c.push(...printNotes('guide'),...contents('The phases of the unit and the reference sections, with the page each one starts on. Word fills the numbers in when this file is opened.'));
  }
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
  // The course guide: what the component is working towards, before how it is taught.
  c.push(pageBreak());
  c.push(...courseGuideChildren(course, unit, competencies));

  // How to teach this well. The facilitator playbook, up front (the method behind every activity)
  const playbook = mat['cb-mv-facilitator-playbook'];
  if (playbook && playbook.educatorContent) {
    c.push(pageBreak());
    c.push(H1('How to teach this well'));
    c.push(P('Read this before you start. It is the method behind every activity in the plan, the how, where each activity below gives you the what.', { size: 22, color: GREY }));
    c.push(...mdBlocks(playbook.educatorContent));
  }
  const practiceRes = mat['cb-mv-practice-everywhere'];
  if (practiceRes && practiceRes.educatorContent) {
    c.push(pageBreak());
    c.push(H1('Practice everywhere'));
    c.push(...mdBlocks(practiceRes.educatorContent));
  }
  // "Before you start" and "Safeguarding and protection", the two reference sections the Research
  // Project and Agency in Learning parts carry, so a facilitator moving between the three components
  // finds the same things in the same order. The playbook above is the pedagogy; these are the kit,
  // the preparation, and the protection guidance.
  const startHere = mat['cb-mv-running-this-offline'];
  if (startHere && startHere.educatorContent) {
    c.push(pageBreak());
    c.push(H1('Before you start'));
    c.push(...mdBlocks(startHere.educatorContent));
  }
  const safe = mat['cb-mv-safeguarding-and-protection'];
  if (safe && safe.educatorContent) {
    c.push(pageBreak());
    c.push(H1('Safeguarding and protection'));
    c.push(...mdBlocks(safe.educatorContent));
  }
  c.push(pageBreak());
  c.push(H2('How to use this plan'));
  c.push(P('This plan is set out in hours, not weeks. Work through the phases in order; within a phase, the blocks build on each other. Each activity block below carries its full facilitation guidance inline, what learners do, what to prepare, the steps, the prompts, what to watch for, and how to run it with no materials. Deliver in the language you share with learners, from this plain-English guide. Times are generous on purpose: oral and visual work, drawing, and translation take longer than they look.', { size: 22 }));
  c.push(pageBreak());

  unit.phases.forEach((ph, pi) => {
    c.push(H1(`Phase ${pi + 1}, ${ph.title}`));
    const meta = [`Lead: ${LEAD[ph.lead] || ph.lead || ', '}`];
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
        // The subject brief: what a facilitator needs to KNOW to teach this block. Offline this is the
        // only place they can read it, so it comes before the practical detail.
        // Where the learner's sheet lives, by number. They are holding a separate document.
        if (m.worksheet && m.worksheet.slug) {
          const idx = sheetIndex();
          const ws = mat[m.worksheet.slug];
          const no = idx.get(b.title) || idx.get(m.title) || (ws && idx.get(ws.title));
          // Use the name as PRINTED in the book, not the material's own title. Otherwise the educator
          // is told to find a sheet under a name the learner's book does not use.
          const printed = SHEET_LIST.find((x) => x.n === no);
          const name = printed ? printed.heading : (ws ? ws.title : m.title);
          c.push(P(no
            ? `LEARNER SHEET:  Sheet ${no}, \u201c${name}\u201d, in the My Voice book (a separate file, one per learner).`
            : `LEARNER SHEET:  \u201c${name}\u201d, in the My Voice book (a separate file, one per learner).`,
            { size: 20, bold: true, color: OLIVE, after: 100 }));
        }
        if (m.educatorContent) c.push(...mdBlocks(m.educatorContent));
        if (m.learnerTeaching) {
          c.push(P(`The learners have this taught in their own book, on the \u201c${m.learnerTeaching.title}\u201d page, read it aloud to the group.`, { size: 20, italics: true, color: GREY, after: 100 }));
        }
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

  // Appendix, phonics reference resources (not timed sessions; keep to hand)
  const resources = ['cb-mv-phonics-progression', 'cb-mv-phonics-table'].map((s) => mat[s]).filter(Boolean);
  if (resources.length) {
    c.push(pageBreak());
    c.push(H1('Appendix, phonics reference'));
    c.push(P('Two reference resources that sit behind the sounds phase. They are not timed sessions, keep them to hand and point back to them as you teach the sounds.', { size: 22, color: GREY }));
    for (const r of resources) {
      c.push(H2(r.title));
      if (r.summary) c.push(P(toParas(r.summary).join(' '), { italics: true, size: 21, color: GREY }));
      if (r.educatorContent) c.push(...mdBlocks(r.educatorContent));
      if (r.learnerContent) { c.push(mini('For the learner')); c.push(...mdBlocks(r.learnerContent)); }
    }
  }
  if (!opts.embedded) {
    c.push(pageBreak());
    c.push(H2('The offline pack'));
    c.push(P('This guide is part of a fully offline pack: this Facilitator Unit Plan & Guide, the student My Voice book (workbook), the printable letter and picture cards, and optional session slides for sites with a screen. All are editable so you can adapt them to your group and distribute them without the internet.', { size: 22 }));
    c.push(P('Cox’s Bazar edition · adaptation of the My Voice course (English for Impact Unit 1) · not for redistribution outside the programme.', { size: 18, color: GREY, before: 120 }));
  }
  return c;
}

// ============================================================ SHARED WORKBOOK PIECES
const wbTitle = (t, sub) => [
  title(t),
  ...(sub ? [P(sub, { size: BOOK, line: 300, color: GREY, after: 180 })] : []),
];

// ============================================================ STUDENT WORKBOOK
// One clearly-labelled sheet per activity in the unit (in unit order), so every worksheet resource in
// the material bank is literally "incorporated into the downloadable workbook".
// opts.embedded drops the branding half of the cover page (the big title and the "this book belongs
// to" line), so the programme-wide student workbook (generate-lb-guides.js) carries these sheets
// behind its own single cover. The "Set up your My Voice book" activity itself, draw yourself, is
// kept, because it is an activity in the unit, not decoration. Standalone download is unchanged.
// Sheet numbers for the My Voice book, and the index the plan quotes. See generate-ail.js.
let sheetSeq = 0;
const SHEET_NO = new Map();
const SHEET_LIST = [];

function workbookChildren(opts = {}) {
  sheetSeq = 0; SHEET_NO.clear(); SHEET_LIST.length = 0;
  const c = [];
  // Shared page furniture, so the three learner books read as one when they are bound together.
  const eyebrow2 = (t, br) => eyebrow(t, br);
  // Every worksheet page is followed by a whole sheet of open, lined space.
  let currentPage = null;
  const head = (activity, title, instr) => {
    currentPage = activity;
    const n = ++sheetSeq;
    SHEET_NO.set(activity, n);
    SHEET_NO.set(title, n);
    SHEET_LIST.push({ n, heading: title });
    c.push(eyebrow2(`Sheet ${n}  ·  ${activity}`));
    c.push(...wbTitle(title, instr));
  };
  const endPage = () => {
    c.push(pageBreak());
    if (currentPage) c.push(...notesPage(currentPage, false));
    c.push(pageBreak());
  };

  // LEARN IT. The method, taught, before the learner is asked to use it. Its own page, so a learner
  // can re-read it while their own sheet is already filled in, and so someone who missed the session
  // still has the teaching. Answers, where a skill has right ones, go at the BACK of the book.
  const withAnswers = [];
  const learnIt = (slug) => {
    const m = mat[slug];
    const lt = m && m.learnerTeaching;
    if (!lt) return;
    c.push(eyebrowChip('learn it', m.title));
    c.push(...wbTitle(lt.title, ''));
    c.push(...mdBlocks(String(lt.readAloud || '').replace(/^\s*##\s+.*\n/, '')));
    if (lt.words && lt.words.length) {
      c.push(noteBox('New words:', lt.words.map((w) => `${w.term}, ${w.meaning}`)));
    }
    const t = lt.tryIt;
    if (t) {
      c.push(new Paragraph({ children: [new TextRun({ text: 'Try it yourself', bold: true, size: 23, color: PLUM })], spacing: { before: 200, after: 60 } }));
      toParas(t.intro).forEach((x) => c.push(P(x, { size: BOOK, line: 300 })));
      (t.items || []).forEach((it, i) => {
        c.push(P(`${i + 1}.   ${it}`, { size: BOOK, line: 300, before: 80, after: 20 }));
        if ((t.chooseFrom || []).length) {
          c.push(new Paragraph({ children: t.chooseFrom.flatMap((o) => [
            new TextRun({ text: '\u25cb  ', size: BOOK, color: PLUM }), new TextRun({ text: o + '      ', size: BOOK }),
          ]), indent: { left: 340 }, spacing: { after: 60, line: 280 } }));
        }
      });
      if (t.then) toParas(t.then).forEach((x) => c.push(P(x, { size: BOOK, line: 300, before: 60 })));
      if ((t.answers || []).length) {
        c.push(P('The answers are at the back of your book. Try it first, then check.', { size: 20, italics: true, color: GREY, before: 80 }));
        withAnswers.push({ m, t });
      }
    }
    c.push(scribe());
    c.push(pageBreak());
  };

  const labelBoxes = (items, cols, cellH) => {
    const colW = Math.floor(10800 / cols);
    const rows = [];
    for (let i = 0; i < items.length; i += cols) {
      const slice = items.slice(i, i + cols); while (slice.length < cols) slice.push('');
      rows.push(new TableRow({ children: slice.map((t) => new TableCell({ width: { size: colW, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 20, color: PLUM })] })] })) }));
      rows.push(new TableRow({ height: { value: cellH, rule: 'atLeast' }, children: slice.map(() => new TableCell({ width: { size: colW, type: WidthType.DXA }, children: [new Paragraph('')] })) }));
    }
    return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: Array(cols).fill(colW), rows });
  };
  // Sentence starters. Were typed underscore runs at 15pt; now the shared lined write box, so the
  // learner can draw the answer instead and the rule reaches the column edge.
  const frames = (arr) => arr.forEach((t) => c.push(...writeBox(String(t).replace(/[_\s]+$/, '').trim(), 2)));

  // Sheet list, in unit order. Also drives the contents page.
  const SHEETS = [
    opts.embedded ? 'Set up your My Voice pages' : 'My Voice book (cover)', 'The "I can…" sheet',
    'Where I can practise', 'My practice weeks', 'Our classroom words', 'Listening: hello and names',
    'My name', 'My sounds and words', 'Building sounds and words', 'Words about me', 'My writing practice',
    'I can say who I am', 'Building sentences', 'Meeting people', 'Writing a little about myself',
    'My spoken introduction', 'My Name, My Voice card', 'How my voice has grown',
  ];

  // --- Cover (Set up your My Voice book) ---
  c.push(eyebrow2('Student worksheet · Set up your My Voice book'));
  if (!opts.embedded) {
    c.push(new Paragraph({ children: [new TextRun({ text: 'My Voice book', bold: true, size: 60, color: NAVY })], alignment: AlignmentType.CENTER, spacing: { before: 500, after: 200 } }));
    c.push(new Paragraph({ children: [new TextRun({ text: 'Learning Bridge+  ·  My Voice', size: 24, color: PLUM })], alignment: AlignmentType.CENTER, spacing: { after: 500 } }));
    c.push(new Paragraph({ children: [new TextRun({ text: 'This book belongs to:', size: 26, color: GREY })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
    c.push(writeLine());
  } else {
    c.push(new Paragraph({ children: [new TextRun({ text: 'Set up your My Voice pages', bold: true, size: 32, color: NAVY })], spacing: { after: 120 } }));
  }
  c.push(bold('Draw yourself, or write your name big:'));
  c.push(box(3600));
  // the cover has no worksheet page to close, so it takes a plain break. EndPage() would append a
  // notes sheet for a page that does not exist
  c.push(pageBreak());
  // "How to use this book" rides with the printing notes rather than taking a fifth of a sheet on its
  // own; the live contents follows.
  if (!opts.embedded) c.push(...printNotes('book'));
  const sheetListAt = c.length;
  c.push(H2(opts.embedded ? 'The sheets in this part' : 'How to use this book', opts.embedded));
  c.push(P('There is one sheet for each activity in My Voice, and a page for your own notes after it. Your facilitator will tell you which sheet to use.', { size: BOOK, line: 300 }));
  c.push(modelBox([
    'Every page shows you an example at the top, like this one, so you always have something to copy.',
    'You can draw or say every answer. Your facilitator can write it for you. Nothing here is a test.',
  ], { label: 'How to use this book' }));
  if (!opts.embedded) c.push(...contents('The parts of your book, and the page each one starts on. Word fills the numbers in when this file is opened.'));
  else c.push(pageBreak());

  // --- The "I can…" sheet ---
  learnIt('cb-mv-i-can-checklist');
  head('Mark where I am now', 'I can…', 'Your facilitator reads each line. Circle the face that is true for you today. There are no wrong answers.');
  c.push(modelBox([
    'yes, I can  =  :)        a little  =  :|        not yet  =  :(',
    'Circle one face in the Start column now. At the end of the course you circle the End column, and see how you have grown.',
    '"Not yet" is a good answer at the start. It shows you what you will learn.',
  ]));
  c.push(new Paragraph({ children: [new TextRun({ text: '', size: 10 })], spacing: { after: 100 } }));
  const canItems = [
    'I can say hello and my name in English', 'I can hear and say the sounds of English',
    'I can find and write the letters of my name', 'I can say some words about me (my family, where I am from, what I like)',
    'I can write my name and some words', 'I can say who I am (I am…, I am from…, I like…)',
    'I can meet someone and introduce myself', 'I can show and talk about my My Name, My Voice card',
  ];
  const hdr = ['I can…', 'Start', 'End'].map((t, i) => new TableCell({ width: { size: i === 0 ? 7200 : 1800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 20, color: NAVY })] })] }));
  const rowsC = [new TableRow({ tableHeader: true, children: hdr })];
  canItems.forEach((it) => rowsC.push(new TableRow({ height: { value: 640, rule: 'atLeast' }, children: [
    new TableCell({ width: { size: 7200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: it, size: 21 })] })] }),
    ...[0, 1].map(() => new TableCell({ width: { size: 1800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: ':)   :|   :(', size: 20, color: GREY })] })] })),
  ] })));
  c.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [7200, 1800, 1800], rows: rowsC }));
  endPage();

  // --- Where I can practise (people/places, with a worked example) ---
  head('Practice everywhere', 'Where I can practise', 'English grows when you use it. Who can you practise your English with? Circle or draw your people.');
  c.push(modelBox([
    'My name is Fatima. Every day I say "hello" in English to my sister.',
    'This week I taught her "thank you", so now we practise together.',
  ]));
  c.push(new Paragraph({ children: [new TextRun({ text: '', size: 10 })], spacing: { after: 120 } }));
  c.push(labelBoxes(['my family', 'a neighbour', 'my mentor', 'my group / class', 'a friend / buddy', 'someone at home'], 3, 2100));
  c.push(scribeNote());
  endPage();

  // --- My practice weeks: a REPEATING scaffolded self-regulation loop (replaces the blank log grid) ---
  // 20 of the 50 hours are independent; a pre-literate learner cannot use a blank grid alone, so the
  // between-session page is a frame-and-stem loop with a worked example, printed several times.
  const circleLine = (labelText, options) => c.push(new Paragraph({ spacing: { before: 130, after: 30 }, children: [
    new TextRun({ text: labelText + '  ', bold: true, size: 21, color: PLUM }),
    new TextRun({ text: options, size: 21, color: NAVY }),
  ] }));
  const weekBlock = () => {
    c.push(new Paragraph({ spacing: { before: 40, after: 40 }, children: [new TextRun({ text: 'Week ', bold: true, size: 24, color: NAVY }), new TextRun({ text: '________', size: 24, color: NAVY })] }));
    circleLine('This week I will speak English with:', 'family · friend · neighbour · my mentor · my buddy');
    circleLine('I will say:', 'hello · my name is ___ · I am from ___ · I like ___');
    circleLine('Did I?', ':) yes        :| a little        :( not yet');
    c.push(...writeBox('What happened? Who did I speak to? (draw or say)', 3));
    circleLine('If I feel shy, I will:', 'practise with one person · practise at home first · ask my buddy');
    c.push(...writeBox('Next week I will…', 2));
  };
  head('Say it to someone new', 'My practice weeks', 'Between our sessions, use your English. Fill in one week each time you practise. Bring it to show, we start each session with it.');
  c.push(modelBox([
    'Week 1',
    'This week I will speak English with:  FAMILY',
    'I will say:  hello · my name is Nur',
    'Did I?  :) yes',
    'What happened:  I said hello to my mother. She smiled and said hello back.',
    'If I feel shy, I will:  practise at home first',
    'Next week I will:  say "my name is Nur" to my friend',
  ], { label: 'Like this, one finished week' }));
  c.push(P('There are four weeks below. Your facilitator can print more.', { size: 19, color: GREY, before: 120 }));
  // The first week rides with the worked example that shows how to fill it; the rest pair up two to a
  // sheet, and a notes page closes each sheet.
  c.push(hr());
  for (let w = 0; w < 4; w++) {
    weekBlock();
    if (w === 0 || w === 2) endPage();
    else if (w < 3) c.push(hr());
  }
  c.push(hr());
  c.push(H3('Looking back at my four weeks'));
  c.push(...writeBox('The best time I used my English was…', 2));
  c.push(...writeBox('Next, I want to be able to say…', 2));
  endPage();

  // --- Our classroom words ---
  learnIt('cb-mv-classroom-language-and-warm-ups');
  head('The English of our classroom', 'Our classroom words', 'Your facilitator says each word. Draw a small picture in its box so you remember it, and say it aloud.');
  c.push(modelBox(['hello  →  draw a hand waving  →  say: "hello"'], { label: 'Like this, one box' }));
  c.push(new Paragraph({ children: [new TextRun({ text: '', size: 8 })], spacing: { after: 100 } }));
  c.push(labelBoxes(['hello', 'thank you', 'please', 'again, please', "I don't understand", 'may I…?'], 3, 2200));
  c.push(scribeNote());
  endPage();

  // --- Listening: hello and names ---
  learnIt('cb-mv-listening-hello-and-names');
  head('Listening: hello and names', 'Listening: hello and names', 'Listen. Point to and mark what you hear. No writing needed.');
  c.push(labelBoxes(['a wave = hello', 'a hand up = my name', 'two people = hello to you', 'a face I know'], 2, 2900));
  endPage();

  // --- My name ---
  learnIt('cb-mv-alphabet-and-first-sounds');
  head('The alphabet and your first sounds', 'My name', 'Your name is yours to keep. Trace it, then copy it. Do it as many times as you like.');
  c.push(modelBox([
    'Your facilitator writes your name BIG in the box. First trace it with your finger, then with a pencil. Then copy it on the lines.',
    'Example:   N u r      →  trace  →  copy',
  ]));
  c.push(new Paragraph({ children: [new TextRun({ text: 'My name (your facilitator writes it here, big):', size: 21, color: PLUM })], spacing: { before: 180, after: 80 } }));
  c.push(box(1900));
  c.push(new Paragraph({ children: [new TextRun({ text: 'Now trace and copy your name:', size: 21, color: PLUM })], spacing: { before: 160, after: 40 } }));
  for (let i = 0; i < 7; i++) c.push(writeLine());
  c.push(new Paragraph({ spacing: { before: 220, after: 80 }, children: [new TextRun({ text: 'My name starts with the sound ', size: 22, color: NAVY }), new TextRun({ text: '_____', size: 22, color: NAVY }), new TextRun({ text: '   (say it, then write the letter)', size: 19, italics: true, color: GREY })] }));
  c.push(box(1500));
  endPage();

  // --- My sounds and words (the learner's phonics-table tool: draw · English word · my word) ---
  learnIt('cb-mv-key-sounds-and-games');
  head('Key sounds through games', 'My sounds and words', 'This is your own word collection, keep adding to it all course long. Draw a thing, write its English word, and add your own word.');
  const swW = [5400, 2700, 2700];
  const swCell = (t, opts = {}) => new TableCell({ width: { size: opts.w, type: WidthType.DXA }, margins: opts.tint ? MODEL_MARGINS : undefined, shading: opts.tint ? { type: ShadingType.CLEAR, color: 'auto', fill: TINT } : undefined, children: [new Paragraph({ children: [new TextRun({ text: t, bold: opts.bold, italics: opts.italics, size: 20, color: opts.color || NAVY })] })] });
  const swRows = [
    new TableRow({ children: ['Draw the thing', 'English word', 'My own word'].map((t, i) => swCell(t, { w: swW[i], tint: true, bold: true, color: OLIVE })) }),
    new TableRow({ height: { value: 1150, rule: 'atLeast' }, children: ['(draw the sun)', 'sun', '(your word)'].map((t, i) => swCell(t, { w: swW[i], tint: true, italics: true })) }),
  ];
  for (let r = 0; r < 4; r++) swRows.push(new TableRow({ height: { value: 1500, rule: 'atLeast' }, children: swW.map((w) => new TableCell({ width: { size: w, type: WidthType.DXA }, children: [new Paragraph('')] })) }));
  c.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: swW, rows: swRows }));
  c.push(scribeNote());
  endPage();

  // --- Building sounds and words ---
  learnIt('cb-mv-sound-and-letter-practice');
  head('Sound and letter practice', 'Building sounds and words', 'Build your name and words from letters, one box at a time. Say each sound as you put it down.');
  c.push(modelBox(['One letter in each box:', '[ s ]  [ u ]  [ n ]   →  say it together:  "sun"'], { label: 'Like this' }));
  c.push(new Paragraph({ children: [new TextRun({ text: 'Build my name, one letter at a time:', size: 22, color: PLUM })], spacing: { before: 160, after: 100 } }));
  c.push(gridBoxes(6, 1, 1900, ''));
  c.push(new Paragraph({ children: [new TextRun({ text: 'Build a word:', size: 22, color: PLUM })], spacing: { before: 220, after: 100 } }));
  c.push(gridBoxes(4, 1, 1900, ''));
  c.push(new Paragraph({ children: [new TextRun({ text: 'The sound I heard:', size: 22, color: PLUM })], spacing: { before: 220, after: 100 } }));
  c.push(gridBoxes(4, 1, 1900, ''));
  c.push(scribeNote());
  endPage();

  // --- Words about me ---
  learnIt('cb-mv-words-about-me');
  head('Words about me', 'Words about me', 'Draw in each box. Your facilitator helps with the English word. You choose what to show, a lighter, everyday thing is always fine.');
  c.push(modelBox(['My family:  draw your family, then say "mother", "brother".', 'Where I am from:  draw your place. You choose what to show.']));
  c.push(new Paragraph({ children: [new TextRun({ text: '', size: 8 })], spacing: { after: 90 } }));
  const labelsRow = (a, b2) => new TableRow({ children: [a, b2].map((t) => new TableCell({ width: { size: 5400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 22, color: PLUM })] }), new Paragraph('')] })) });
  const drawRow = () => new TableRow({ height: { value: 2400, rule: 'atLeast' }, children: [0, 1].map(() => new TableCell({ width: { size: 5400, type: WidthType.DXA }, children: [new Paragraph('')] })) });
  c.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [5400, 5400], rows: [labelsRow('My family', 'Where I am from'), drawRow(), labelsRow('Things I like', 'Food I like'), drawRow()] }));
  c.push(new Paragraph({ spacing: { before: 200, after: 60 }, children: [new TextRun({ text: 'I am ', size: 24, color: NAVY }), new TextRun({ text: '____', size: 24, color: NAVY }), new TextRun({ text: ' years old.        I speak ', size: 24, color: NAVY }), new TextRun({ text: '____________', size: 24, color: NAVY })] }));
  c.push(scribeNote());
  endPage();

  // --- My writing practice ---
  learnIt('cb-mv-writing-my-name');
  head('Writing my name', 'My writing practice', 'Copy the word your facilitator writes for you at the start of each line. Take your time.');
  c.push(modelBox(['Your facilitator writes a word at the start of the line. You copy it along the line:', 'Nur          Nur          Nur          Nur']));
  c.push(new Paragraph({ children: [new TextRun({ text: 'My name', bold: true, size: 22, color: PLUM })], spacing: { before: 160, after: 80 } }));
  for (let i = 0; i < 5; i++) c.push(writeLine());
  c.push(new Paragraph({ children: [new TextRun({ text: 'My words', bold: true, size: 22, color: PLUM })], spacing: { before: 200, after: 80 } }));
  for (let i = 0; i < 11; i++) c.push(writeLine());
  endPage();

  // --- I can say who I am ---
  learnIt('cb-mv-i-am-sentences');
  head('I am…, saying who you are', 'I can say who I am', 'Say each sentence out loud. Fill the ending with your own true words, write, trace, or say it and draw.');
  c.push(modelBox([
    'I am Fatima.',
    'I am from Myanmar.',
    'I like rice.',
    'I am good at drawing.',
  ], { label: 'Like this', size: 24 }));
  c.push(new Paragraph({ children: [new TextRun({ text: 'Now you:', size: 22, color: PLUM, bold: true })], spacing: { before: 180, after: 20 } }));
  frames(['I am ________________________', 'I am from ________________________', 'I like ________________________', 'I am good at ________________________']);
  c.push(scribeNote());
  endPage();

  // --- Building sentences ---
  learnIt('cb-mv-sentence-practice');
  head('Sentence practice', 'Building sentences', 'Put the word cards together to make a true sentence about you. Then say it out loud.');
  c.push(modelBox([
    '[ I ]   [ am from ]   [ Myanmar ]   →   "I am from Myanmar."',
    'Choose by ear:   I  am  ·  she  is  ·  we  are',
  ]));
  c.push(new Paragraph({ children: [new TextRun({ text: '', size: 8 })], spacing: { after: 90 } }));
  c.push(labelBoxes(['I', 'am / am from / like', '…'], 3, 2400));
  c.push(new Paragraph({ children: [new TextRun({ text: 'Fill in am · is · are (say it first):', size: 22, color: PLUM })], spacing: { before: 240, after: 120 } }));
  frames(['I ______ from…', 'She ______ my friend.', 'We ______ here.']);
  c.push(scribeNote());
  endPage();

  // --- Meeting people ---
  learnIt('cb-mv-meeting-people-role-play');
  head('Meeting people', 'Meeting people', 'Use these picture cards to meet someone. Point and speak. No reading needed.');
  c.push(modelBox([
    'Nur:    Hello! My name is Nur. What is your name?',
    'Anwar:  Hello Nur! My name is Anwar.',
    'Nur:    This is my friend, Fatima.',
  ], { label: 'Like this, two people meeting' }));
  c.push(new Paragraph({ children: [new TextRun({ text: '', size: 8 })], spacing: { after: 90 } }));
  c.push(labelBoxes(['Hello!', 'My name is…', 'What is your name?', 'This is my friend.'], 2, 2800));
  endPage();

  // --- Writing a little about myself ---
  learnIt('cb-mv-writing-about-myself');
  head('Writing a little about myself', 'Writing a little about myself', 'Copy or finish a sentence about you. If writing is not comfortable yet, say it and draw it.');
  c.push(modelBox(['My name is Nur.', 'I am from Myanmar.'], { label: 'Like this', size: 24 }));
  c.push(new Paragraph({ children: [new TextRun({ text: 'Now you:', size: 22, color: PLUM, bold: true })], spacing: { before: 160, after: 20 } }));
  frames(['My name is ________________________', 'I am from ________________________']);
  c.push(box(3000, 'Draw or write one thing about you'));
  c.push(scribeNote());
  endPage();

  // --- My spoken introduction (a persistent scaffold for the presentation = spoken-intro evidence) ---
  head('Rehearse, share, and celebrate', 'My spoken introduction', 'This is what you will say when you share your card. Tick each part when you can say it. Practise with a partner first.');
  c.push(modelBox(['Hello!   My name is Nur.   I am from Myanmar.   I like rice.   Thank you.'], { label: 'Like this, a whole introduction', size: 24 }));
  c.push(new Paragraph({ children: [new TextRun({ text: 'My introduction, tick each part when you can say it:', size: 22, color: PLUM, bold: true })], spacing: { before: 180, after: 80 } }));
  c.push(check('Hello!'));
  c.push(...writeBox('My name is…', 1));
  c.push(...writeBox('I am from…', 1));
  c.push(...writeBox('I like…', 1));
  c.push(check('Thank you.'));
  c.push(new Paragraph({ children: [new TextRun({ text: 'I practised with a partner:    :) yes      :| not yet', size: 21, color: PLUM })], spacing: { before: 160 } }));
  c.push(scribeNote());
  endPage();

  // --- My Name, My Voice card (a labelled TEMPLATE with a worked example, not a blank canvas) ---
  learnIt('cb-mv-design-my-name-my-voice');
  head('Make your My Name, My Voice card', 'My Name, My Voice', 'Make your card. It has a place for everything, your name, a picture, and your words. You choose what to show.');
  c.push(modelBox(['MY NAME:  Nur', '(a picture of Nur and a flower)', 'I am from Myanmar.    I like flowers.'], { label: 'Like this, a finished card' }));
  c.push(new Paragraph({ children: [new TextRun({ text: '', size: 8 })], spacing: { after: 100 } }));
  const cardRow = (labelText, h, big) => new TableRow({ height: { value: h, rule: 'atLeast' }, children: [new TableCell({ width: { size: 10800, type: WidthType.DXA }, margins: MODEL_MARGINS, children: [new Paragraph({ children: [new TextRun({ text: labelText, bold: true, size: big ? 22 : 20, color: PLUM })] })] })] });
  c.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [10800], rows: [
    cardRow('MY NAME  (write it BIG):', 1500, true),
    cardRow('A picture of me, or something that shows who I am:', 3200),
    cardRow('I am from ________________          I like ________________', 1200),
  ] }));
  c.push(scribeNote());
  endPage();

  // --- How my voice has grown (STRUCTURED reflection producing the formative assessment evidence) ---
  head('Rehearse, share, and celebrate', 'How my voice has grown', 'Look back at your first "I can" page. See how far you have come. Draw or say each answer.');
  c.push(modelBox([
    'At the start I could NOT:  say my name in English.',
    'Now I CAN:  say "My name is Nur. I am from Myanmar."',
    'What helped me:  practising with my family.',
    'I want to keep learning:  to write my words.',
  ]));
  c.push(new Paragraph({ spacing: { before: 200, after: 40 }, children: [new TextRun({ text: 'At the start I could not:  ', bold: true, size: 22, color: PLUM }), new TextRun({ text: '______________________________', size: 22, color: NAVY })] }));
  c.push(new Paragraph({ spacing: { before: 80, after: 60 }, children: [new TextRun({ text: 'Now I can:  ', bold: true, size: 22, color: PLUM }), new TextRun({ text: '______________________________', size: 22, color: NAVY })] }));
  c.push(box(2600, 'Draw, write or say what you can do now'));
  c.push(new Paragraph({ spacing: { before: 160, after: 40 }, children: [new TextRun({ text: 'What helped me?  (circle)  ', bold: true, size: 22, color: PLUM }), new TextRun({ text: 'practising  ·  my facilitator  ·  my buddy  ·  my family', size: 21, color: NAVY })] }));
  c.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: 'I want to keep learning:  ', bold: true, size: 22, color: PLUM }), new TextRun({ text: '______________________________', size: 22, color: NAVY })] }));
  c.push(new Paragraph({ spacing: { before: 180, after: 40 }, children: [new TextRun({ text: 'How far have I come?  Mark it:      start  •, •  now', size: 21, color: OLIVE })] }));
  c.push(scribeNote());

  c.splice(sheetListAt, 0,
    P('The sheets in this book', { size: 26, bold: true, color: NAVY, before: 200, after: 60 }),
    P('Your facilitator will say a sheet number. Find it here.', { size: 20, color: GREY, after: 100 }),
    ...SHEET_LIST.map((x) => P(`Sheet ${x.n}   ${x.heading}`, { size: 21, after: 20 })),
    pageBreak(),
  );

  // ANSWERS. At the back, so a learner can try each self-check honestly and mark themselves.
  if (withAnswers.length) {
    c.push(pageBreak());
    c.push(...wbTitle('Answers, try it yourself', 'Do the "Try it yourself" on the Learn it page first, then look here. Getting one wrong is useful, go back and read that page again, and see why.'));
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

// ============================================================ LETTER & PICTURE CARDS
function cardsChildren() {
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
  c.push(new Paragraph({ children: [new TextRun({ text: 'My Voice, letter & picture cards', bold: true, size: 34, color: NAVY })], spacing: { after: 60 } }));
  c.push(P('Print and cut along the lines. Editable, change or add cards for your group.', { size: 20, color: GREY, after: 160 }));
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
  return c;
}


// A document wrapper around a children array. The children builders above are exported so the
// one-stop Educator Guide (generate-lb-guides.js) embeds exactly this content, with no drift.
// The document shell comes from the shared house style.
const FOOTER_TEXT = "My Voice  ·  Learning Bridge+ (Cox's Bazar)";
const FOOTER_BOOK = 'My Voice Book  ·  you can draw or say your answer';
const doc = (children, opts = {}) => makeDoc(children, { footerText: opts.footer || FOOTER_TEXT });

function sheetIndex() {
  if (!SHEET_NO.size) workbookChildren();
  return SHEET_NO;
}

module.exports = { unit, mat, facilitatorPlanChildren, workbookChildren, cardsChildren, sheetIndex, SHEET_LIST };

// ============================================================ WRITE
async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [
    ['my-voice-facilitator-unit-plan.docx', doc(facilitatorPlanChildren())],
    ['my-voice-student-workbook.docx', doc(workbookChildren())],
    ['my-voice-letter-and-picture-cards.docx', doc(cardsChildren())],
  ];
  for (const [name, d] of jobs) {
    const buf = await Packer.toBuffer(d);
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log('wrote', name, (buf.length / 1024).toFixed(1) + ' KB');
  }
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
