/* Generate the Learning Bridge+ Moderation Guides - one per edition of the programme:

     lb-moderation-guide.docx              (general Learning Bridge+ - an Amala Trainer facilitates)
     lb-coxs-bazar-moderation-guide.docx   (Cox's Bazar - NRC's master educators hold moderation
                                            discussions with educators, then a session with Amala)
     lb-coxs-bazar-moderation-template.docx (Cox's Bazar - the template a discussion is captured on)
     lb-coxs-bazar-moderation-protocol.docx (Cox's Bazar - the session between Amala and the master
                                            educators, with the session summary record)

   RENDERED  - everything about how moderation runs: roles, sessions, the case, the running order,
               the facilitator's rules, the outcomes, the recheck, the facilitator's own case and how
               facilitators are prepared (Cox's Bazar only), the records and the trap. Read from the
               `moderation` block of each programme YAML, so the guides and the programme pages cannot
               drift. Never re-type any of it here.
   AUTHORED  - only the printable records' layout.

   An edition with a `cycle` (Cox's Bazar) gets its own layout - the steps of an assessment period,
   the moderation discussion, the Amala session and the template - because its process is a sequence
   of steps rather than a single session. The general edition keeps the session layout.

   Run:  node scripts/downloads/generate-moderation.js
   Override output dir:  OUT_DIR=/tmp/pack node scripts/downloads/generate-moderation.js
   Re-run generate-lb-guides.js afterwards - the Educator Guide renders from the same block. */
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { Packer } = require('docx');
const S = require('./lib/docx-style');
const {
  NAVY, PLUM, GREY, OLIVE,
  P, bullet, H1, H2, mini, hr, pageBreak,
  refTable, twoCol, callout, makeDoc, writeBox, linedArea, image, LOGO, AlignmentType,
  Paragraph, TextRun,
} = S;

const ROOT = path.resolve(__dirname, '..', '..');
const CS = path.join(ROOT, 'content-source');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'downloads');
const readProgramme = (slug) => yaml.parse(fs.readFileSync(path.join(CS, 'programmes', `${slug}.yaml`), 'utf8'));

const EDITIONS = [
  { slug: 'learning-bridge', file: 'lb-moderation-guide.docx', name: 'Learning Bridge+', assessor: 'educator' },
  { slug: 'learning-bridge-coxs-bazar', file: 'lb-coxs-bazar-moderation-guide.docx', name: "Learning Bridge+ (Cox's Bazar)", assessor: 'educator', template: 'lb-coxs-bazar-moderation-template.docx', protocol: 'lb-coxs-bazar-moderation-protocol.docx' },
];

const LEVELS = 'No level awarded  ·  Theorist  ·  Practitioner  ·  Reflective Practitioner';
// Two blank lines per cell, so a printed row is tall enough to write in.
const blankRows = (n, cols) => Array.from({ length: n }, () => Array(cols).fill(' \n '));
// The programme's own session names, so the general guide offers three and Cox's Bazar two.
const sessionChoices = (m) => m.sessions.map((s) => { const w = s.when.split(',')[0]; return w.length <= 12 ? w : s.title; }).join('     /     ');

// ---- the printable records ----------------------------------------------------------------------

// One per assessor per session. `heading` lets the Educator Guide set it at its own heading level.
function caseSheetChildren(m, { heading = H1, assessor = 'educator' } = {}) {
  const c = [];
  if (heading) c.push(heading('Moderation case sheet')); // null when the caller has already titled it
  c.push(P(`One per session. Bring it with the evidence and the assessment record. Do not write your level where the group can see it before they have judged - fold this sheet, or keep it face down.`, { size: 21, color: GREY }));
  c.push(refTable(['The case', ''], [
    [`Your name (${assessor})`, ''],
    ['Session (circle)', sessionChoices(m)],
    ['Learner (first name or code only)', ''],
    ['Competency', 'Set and Pursue Goals        Investigate Real World Issues'],
  ], [3600, 7200]));
  c.push(...writeBox('The evidence you will show - what the learner did, said and made', 4));
  c.push(P(`Your level (circle one):   ${LEVELS}`, { size: 22, bold: true, color: NAVY, before: 200 }));
  c.push(...writeBox('Your reason - which words in the descriptor put it there', 3));
  c.push(...writeBox('Where you were least sure, and what would have moved you up or down', 3));
  c.push(mini('After the session'));
  c.push(P('Decision:   Confirmed        Changed to ______________________        More evidence needed', { size: 22 }));
  c.push(...writeBox('The reason the group gave', 2));
  c.push(P('Recheck needed?   Yes  /  No        By (date): ______________', { size: 22 }));
  return c;
}

function moderationRecordChildren(m, e) {
  const c = [];
  c.push(H1('Moderation record'));
  c.push(P(`One per session, kept by the facilitator as the session runs.${m.facilitatorCase ? ' It goes to Amala with your own case.' : ''}`, { size: 21, color: GREY }));
  c.push(refTable(['The session', ''], [
    ['Facilitator', ''], ['Session and date', ''], ['Site / group', ''], [`${e.assessor === 'facilitator' ? 'Facilitators' : 'Educators'} present`, ''],
  ], [3000, 7800]));
  c.push(P('Levels shown blind: write the spread, e.g. "T T P P P".  Result: C confirmed · Ch changed · E more evidence.', { size: 19, color: GREY, before: 160 }));
  c.push(refTable(['Assessor', 'Learner · competency', 'Their level', 'Shown blind', 'Result', 'Reason (the descriptor)', 'Recheck by'],
    blankRows(8, 7), [1500, 1700, 1100, 1300, 1000, 2900, 1300]));
  c.push(...writeBox('What showed up across the cases - the agreed reading', 2));
  if (m.facilitatorCase) c.push(...writeBox('The case I am taking to Amala, and why', 2));
  return c;
}

function recheckListChildren() {
  const c = [];
  c.push(H1('Recheck list'));
  c.push(P('For anyone whose case was changed. List every other judgement in that competency, check it against the reading the group agreed, and return this by the date on the record.', { size: 21, color: GREY }));
  c.push(refTable(['The recheck', ''], [['Name', ''], ['The reading that changed', ''], ['Return to', ''], ['By (date)', '']], [3000, 7800]));
  c.push(refTable(['Learner', 'Level before', 'Level now', 'Why it moved, or why it stays'],
    blankRows(12, 4), [2400, 1500, 1500, 5400]));
  return c;
}


// The moderation template (an edition with `template`): one per moderation discussion. Rendered as its
// own download and at the back of the guide, from the same fields.
function templateChildren(m, e, { heading = H1 } = {}) {
  const t = m.template;
  const c = [];
  const run = (text, o = {}) => new TextRun({ text, size: o.size || 20, bold: o.bold, color: o.color, italics: o.italics });
  if (heading) c.push(heading('Moderation template'));
  c.push(P(t.intro, { size: 20, color: GREY }));
  c.push(refTable(['The discussion', ''], [
    ['Master educator', ''], ['Learning centre', ''], ['Educator', ''], ['Learner (SL or student ID)', ''],
    ['Competency (circle)', 'Investigate Real World Issues (FSI1)        Set and Pursue Goals (FSL2)'],
    ['Assessment period (circle)', m.sessions.map((x) => x.when.split(' - ')[0]).join('          ')],
    ['Date', ''],
  ], [3400, 7400]));
  c.push(...fieldsChildren(t.fields));
  if (t.afterSession) {
    c.push(new Paragraph({ spacing: { before: 260, after: 40 }, children: [run(t.afterSession.label, { bold: true, color: OLIVE, size: 22 })] }));
    c.push(P(t.afterSession.prompt, { size: 20 }));
  }
  return c;
}


// A form, from a list of fields: text = lines to write on, level = circle a level, choice = tick one of
// `options`. Shared by the moderation template and the session summary.
function fieldsChildren(fields) {
  const c = [];
  const run = (text, o = {}) => new TextRun({ text, size: o.size || 20, bold: o.bold, color: o.color });
  fields.forEach((f, i) => {
    c.push(new Paragraph({ spacing: { before: 200, after: 40 }, keepNext: true, children: [
      run(`${i + 1}. ${f.label}`, { bold: true, color: NAVY, size: 22 }),
      ...(f.prompt ? [run(`   ${f.prompt}`, { color: GREY, size: 18 })] : []),
    ] }));
    if (f.kind === 'level') c.push(P(LEVELS, { size: 21, bold: true, color: PLUM, before: 60, after: f.lines ? 60 : 0 }));
    if (f.kind === 'choice') c.push(P((f.options || []).map((o) => `☐  ${o}`).join('        '), { size: 21, before: 60, after: f.lines ? 60 : 0 }));
    if (f.kind === 'text' || f.lines) c.push(linedArea(f.lines || 2));
  });
  return c;
}

// The protocol for the moderation session between Amala and the master educators, with the session
// summary record at the back.
function protocolDoc(e, prog, m) {
  const pr = m.amalaProtocol;
  const c = [];
  let n = 0;
  const sec = (t) => H1(`${++n}. ${t}`);
  c.push(image(LOGO, 110, 57, { align: AlignmentType.LEFT, after: 200 }));
  c.push(P('MODERATION PROTOCOL  ·  THE SESSION WITH AMALA', { size: 20, bold: true, color: OLIVE, after: 40 }));
  c.push(P(e.name, { size: 40, bold: true, color: NAVY, after: 200 }));
  c.push(P(pr.intro, { size: 23 }));
  c.push(hr());
  c.push(sec('What the session is for'));
  pr.purpose.forEach((t) => c.push(bullet(t)));
  c.push(refTable(['Role', 'What they do'], pr.roles.map((r) => [r.role, { text: r.does, bold: false }]), [2400, 8400]));
  if (m.facilitatorCase) c.push(twoCol(['The session', ''], [['When', m.facilitatorCase.when], ['How', m.facilitatorCase.format]]));
  c.push(sec('Before the session'));
  pr.before.forEach((t) => c.push(bullet(t)));
  c.push(sec('Running the session'));
  const mins = (rows) => rows.reduce((a, r) => a + (parseInt(r.time, 10) || 0), 0);
  const fixed = mins(pr.running.filter((r) => !/per case/.test(r.time || '')));
  const perCase = mins(pr.running.filter((r) => /per case/.test(r.time || '')));
  c.push(P(`About ${fixed} minutes of fixed time, plus about ${perCase} minutes for each case. Four to six cases makes a session of about ${Math.round((fixed + 4 * perCase) / 5) * 5} minutes to ${Math.round((fixed + 6 * perCase) / 5) * 5} minutes.`, { size: 22 }));
  c.push(refTable(['Step', 'Time', 'What happens'], pr.running.map((r) => [r.step, r.time || '', r.detail]), [2100, 1500, 7200]));
  c.push(H2('The question bank'));
  c.push(P('One prepared question per case, and these to draw on as the discussion goes.', { size: 21, color: GREY }));
  pr.probes.forEach((t) => c.push(bullet(t)));
  c.push(sec('Holding the session'));
  pr.rules.forEach((t) => c.push(bullet(t)));
  if (m.facilitatorCase) c.push(callout('When the session reads a case differently', [m.facilitatorCase.ifDisagree], OLIVE));
  c.push(sec('After the session'));
  pr.after.forEach((t) => c.push(bullet(t)));
  if (pr.summary) {
    c.push(pageBreak());
    c.push(H1('Session summary'));
    c.push(P(pr.summary.intro, { size: 20, color: GREY }));
    c.push(refTable(['The session', ''], [['Amala moderator', ''], ['Assessment period', m.sessions.map((x) => x.when.split(' - ')[0]).join('          ')], ['Date', ''], ['Master educators present', '']], [3400, 7400]));
    c.push(...fieldsChildren(pr.summary.fields));
  }
  c.push(P(`Part of the ${e.name} pack. Editable.${prog.access === 'partner' ? ' Not for redistribution outside the programme.' : ''}`, { size: 18, color: GREY, before: 240 }));
  return makeDoc(c, { footerText: `Moderation protocol  ·  ${e.name}` });
}

// The Cox's Bazar layout: the steps of an assessment period, then the discussion, the Amala session,
// sharing the learning, and the template.
function cycleGuide(e, prog, m) {
  const c = [];
  let n = 0;
  const sec = (t) => H1(`${++n}. ${t}`);
  c.push(image(LOGO, 110, 57, { align: AlignmentType.LEFT, after: 200 }));
  c.push(P('MODERATION GUIDE  ·  FOR MASTER EDUCATORS', { size: 20, bold: true, color: OLIVE, after: 40 }));
  c.push(P(e.name, { size: 40, bold: true, color: NAVY, after: 200 }));
  c.push(P(m.intro, { size: 23 }));
  if (m.contextNote) c.push(callout('How this edition differs', [m.contextNote], OLIVE));
  c.push(hr());

  c.push(sec('Each assessment period, step by step'));
  c.push(P('The same five steps run in the formative and the summative period. Your coordinator sets the dates for each.', { size: 22 }));
  c.push(refTable(['', 'Step', 'Who', 'What happens'], m.cycle.map((st, i) => [String(i + 1), st.title, st.who, { text: st.detail, bold: false }]), [500, 2300, 2300, 5700]));
  m.sessions.forEach((x) => {
    c.push(H2(x.title));
    c.push(P(x.when.toUpperCase(), { size: 19, bold: true, color: OLIVE, after: 80 }));
    c.push(P(x.purpose, { size: 22 }));
  });

  c.push(sec('Who does what'));
  c.push(refTable(['Role', 'Who', 'What they do'], m.roles.map((r) => [r.role, r.who, r.does]), [2000, 3000, 5800]));

  c.push(pageBreak());
  c.push(sec('Choosing what to moderate'));
  c.push(P(m.theCase.intro, { size: 23, color: NAVY }));
  c.push(mini('Which assessments'));
  m.theCase.choose.forEach((t) => c.push(bullet(t)));
  c.push(mini('What the educator brings'));
  m.theCase.bring.forEach((t) => c.push(bullet(t)));

  c.push(sec('Running a moderation discussion'));
  const mins = m.running.reduce((a, r) => a + (parseInt(r.time, 10) || 0), 0);
  c.push(P(`In person, at the learning centre. One educator presents one case - one learner, one competency - and their rationale, then answers questions. About ${mins} minutes. Fill in the template as you go - printed and by hand is fine.`, { size: 22 }));
  c.push(refTable(['Step', 'Time', 'What happens'], m.running.map((r) => [r.step, r.time || '', r.detail]), [2100, 1300, 7400]));
  if (m.groupVariant) c.push(callout('Who is in the room', [m.groupVariant], OLIVE));
  if (m.facilitatorRules.length) {
    c.push(mini('Holding the discussion'));
    m.facilitatorRules.forEach((t) => c.push(bullet(t)));
  }
  if (m.trap) c.push(callout('The trap', [m.trap], PLUM));

  if (m.template && m.template.fields.some((f) => f.guidance)) {
    c.push(pageBreak());
    c.push(sec('Filling in the template, box by box'));
    c.push(P(m.template.intro, { size: 22 }));
    c.push(refTable(['Box', 'What a good entry looks like'], m.template.fields.map((f, i) => [`${i + 1}. ${f.label}`, { text: f.guidance || f.prompt || '', bold: false }]), [2800, 8000]));
    if (m.template.fields.some((f) => f.example)) {
      c.push(H2('A worked example'));
      if (m.template.exampleIntro) c.push(P(m.template.exampleIntro, { size: 21, italics: true, color: GREY }));
      c.push(refTable(['Box', 'In the example'], m.template.fields.filter((f) => f.example).map((f) => [f.label, { text: f.example, bold: false }]), [2800, 8000]));
    }
  }

  c.push(pageBreak());
  c.push(sec('After the discussion'));
  c.push(P('Moderation is case-based, not consensus-based. The discussion does not have to end in agreement, and the level stays the educator\u2019s judgement. What happens next is one of these:', { size: 22 }));
  c.push(refTable(['After the discussion', 'What it means', 'What happens next'], m.outcomes.map((o) => [o.outcome, o.meaning, o.then]), [2300, 3500, 5000]));
  if (m.recheck) c.push(callout('Why one discussion per competency per centre is enough', [m.recheck], OLIVE));

  if (m.facilitatorCase) {
    const f = m.facilitatorCase;
    c.push(sec('The moderation session with Amala'));
    c.push(P(f.intro, { size: 23, color: NAVY }));
    c.push(twoCol(['The session', ''], [['When', f.when], ['How', f.format]]));
    c.push(mini('What to bring'));
    [...f.choose, ...f.bring].forEach((t) => c.push(bullet(t)));
    const pr = m.amalaProtocol;
    if (pr) {
      const present = pr.running.find((r) => /present/i.test(r.step));
      if (present) {
        c.push(mini('If your case is chosen'));
        c.push(P(`You will have about ${present.time.replace(/ per case/, '')} to present it. ${present.detail.replace(/^The master educator presents/, 'You present').replace('their own level', 'your own level')} Then come questions, and Amala's view.`, { size: 22 }));
      }
      c.push(mini('Questions you may be asked'));
      pr.probes.forEach((t) => c.push(bullet(t)));
      c.push(P('The full running order is in the moderation protocol.', { size: 21, color: GREY }));
    }
    c.push(callout('If the session reads a case differently', [f.ifDisagree], OLIVE));
  }

  if (m.sharing) {
    const sh = m.sharing;
    c.push(sec('Making the most of the session with Amala'));
    c.push(P(sh.intro, { size: 23, color: NAVY }));
    sh.steps.forEach((t) => c.push(bullet(t)));
    if (sh.agenda.length) {
      const total = sh.agenda.reduce((a, r) => a + (parseInt(r.time, 10) || 0), 0);
      c.push(H2(`A follow-up session with educators - about ${total} minutes`));
      c.push(refTable(['Step', 'Time', 'What happens'], sh.agenda.map((r) => [r.step, r.time || '', r.detail]), [2300, 1200, 7300]));
    }
    if (sh.tip) c.push(callout('If you cannot get everyone together', [sh.tip], OLIVE));
  } else {
    const share = m.cycle.find((st) => /share/i.test(st.title));
    if (share) {
      c.push(sec('Sharing the learning'));
      c.push(P(share.detail, { size: 22 }));
    }
  }

  if (m.facilitatorPreparation) {
    c.push(sec('Getting ready'));
    c.push(P(m.facilitatorPreparation.intro, { size: 22 }));
    m.facilitatorPreparation.steps.forEach((t) => c.push(bullet(t)));
  }

  c.push(sec('The records'));
  c.push(refTable(['Record', 'Who keeps it', 'What it holds'], m.records.map((r) => [r.name, r.who, r.what]), [2200, 3000, 5600]));
  if (m.template) {
    c.push(P('The moderation template follows, ready to print. It is also its own file.', { size: 21, color: GREY }));
    c.push(pageBreak());
    c.push(...templateChildren(m, e));
  }
  c.push(P(`This guide is part of the ${e.name} pack. Editable.${prog.access === 'partner' ? ' Not for redistribution outside the programme.' : ''}`, { size: 18, color: GREY, before: 240 }));
  return makeDoc(c, { footerText: `Moderation Guide  ·  ${e.name}` });
}

// ---- the guide ---------------------------------------------------------------------------------

function guide(e) {
  const prog = readProgramme(e.slug);
  const m = prog.moderation;
  if (!m) throw new Error(`${e.slug} has no moderation block`);
  if ((m.cycle || []).length) return cycleGuide(e, prog, m);
  const c = [];
  let n = 0;
  const sec = (t) => H1(`${++n}. ${t}`);

  c.push(image(LOGO, 110, 57, { align: AlignmentType.LEFT, after: 200 }));
  c.push(P('MODERATION GUIDE', { size: 20, bold: true, color: OLIVE, after: 40 }));
  c.push(P(e.name, { size: 40, bold: true, color: NAVY, after: 200 }));
  c.push(P(m.intro, { size: 23 }));
  if (m.contextNote) c.push(callout('How this edition differs', [m.contextNote], OLIVE));
  c.push(hr());

  c.push(sec('Who does what'));
  c.push(refTable(['Role', 'Who', 'What they do'], m.roles.map((r) => [r.role, r.who, r.does]), [2000, 3000, 5800]));

  c.push(sec('When it happens'));
  m.sessions.forEach((s) => {
    c.push(H2(s.title));
    c.push(P(`${s.when.toUpperCase()}${s.facilitatedBy ? `   ·   FACILITATED BY: ${s.facilitatedBy}` : ''}`, { size: 19, bold: true, color: OLIVE, after: 80 }));
    c.push(P(s.purpose, { size: 22 }));
  });

  c.push(pageBreak());
  c.push(sec('The case'));
  c.push(P(m.theCase.intro, { size: 23, color: NAVY }));
  c.push(mini('Which one to bring'));
  m.theCase.choose.forEach((t) => c.push(bullet(t)));
  c.push(mini('What to bring with it'));
  m.theCase.bring.forEach((t) => c.push(bullet(t)));

  c.push(sec('Running the session'));
  const perCase = 15;
  c.push(P(`Plan about ${perCase} minutes per case, plus the opening and the close. Six cases is about two hours.`, { size: 22 }));
  c.push(refTable(['Step', 'Time', 'What happens'], m.running.map((r) => [r.step, r.time || '', r.detail]), [2100, 1400, 7300]));
  if (m.facilitatorRules.length) {
    c.push(mini('If you are facilitating'));
    m.facilitatorRules.forEach((t) => c.push(bullet(t)));
  }
  if (m.trap) c.push(callout('The trap', [m.trap], PLUM));

  c.push(pageBreak());
  c.push(sec('What a session can decide'));
  c.push(refTable(['Decision', 'What it means', 'What happens next'], m.outcomes.map((o) => [o.outcome, o.meaning, o.then]), [1900, 3700, 5200]));
  if (m.recheck) {
    c.push(H2('The recheck'));
    c.push(P(m.recheck, { size: 22 }));
  }

  if (m.facilitatorCase) {
    const f = m.facilitatorCase;
    c.push(sec('Your case to Amala'));
    c.push(P(f.intro, { size: 23, color: NAVY }));
    c.push(twoCol(['The call', ''], [['When', f.when], ['How', f.format]]));
    c.push(mini('Which case'));
    f.choose.forEach((t) => c.push(bullet(t)));
    c.push(mini('What to send ahead, and bring'));
    f.bring.forEach((t) => c.push(bullet(t)));
    c.push(callout('If Amala places it differently', [f.ifDisagree], OLIVE));
  }

  if (m.facilitatorPreparation) {
    c.push(sec('Getting ready to facilitate'));
    c.push(P(m.facilitatorPreparation.intro, { size: 22 }));
    m.facilitatorPreparation.steps.forEach((t) => c.push(bullet(t)));
  }

  c.push(sec('The records'));
  c.push(refTable(['Record', 'Who keeps it', 'What it holds'], m.records.map((r) => [r.name, r.who, r.what]), [2000, 3200, 5600]));
  c.push(P('All three follow, ready to print.', { size: 21, color: GREY }));

  c.push(pageBreak());
  c.push(...caseSheetChildren(m, { assessor: e.assessor }));
  c.push(pageBreak());
  c.push(...moderationRecordChildren(m, e));
  c.push(pageBreak());
  c.push(...recheckListChildren());

  c.push(P(`This guide is part of the ${e.name} pack. Editable.${prog.access === 'partner' ? ' Not for redistribution outside the programme.' : ''}`, { size: 18, color: GREY, before: 240 }));
  return makeDoc(c, { footerText: `Moderation Guide  ·  ${e.name}` });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const e of EDITIONS) {
    const buf = await Packer.toBuffer(guide(e));
    fs.writeFileSync(path.join(OUT, e.file), buf);
    console.log('wrote', e.file, (buf.length / 1024).toFixed(1) + ' KB');
    const m = readProgramme(e.slug).moderation;
    if (e.template && m.template) {
      const tb = await Packer.toBuffer(makeDoc(templateChildren(m, e), { footerText: `Moderation template  ·  ${e.name}` }));
      fs.writeFileSync(path.join(OUT, e.template), tb);
      console.log('wrote', e.template, (tb.length / 1024).toFixed(1) + ' KB');
    }
    if (e.protocol && m.amalaProtocol) {
      const pb = await Packer.toBuffer(protocolDoc(e, readProgramme(e.slug), m));
      fs.writeFileSync(path.join(OUT, e.protocol), pb);
      console.log('wrote', e.protocol, (pb.length / 1024).toFixed(1) + ' KB');
    }
  }
}

module.exports = { caseSheetChildren, templateChildren, readProgramme };
if (require.main === module) main().catch((err) => { console.error(err); process.exit(1); });
