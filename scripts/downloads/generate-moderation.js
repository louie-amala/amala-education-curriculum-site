/* Generate the Learning Bridge+ Moderation Guides - one per edition of the programme:

     lb-moderation-guide.docx              (general Learning Bridge+ - an Amala Trainer facilitates)
     lb-coxs-bazar-moderation-guide.docx   (Cox's Bazar - NRC's master educators facilitate, and each
                                            brings a case of their own to Amala)

   RENDERED  - everything about how moderation runs: roles, sessions, the case, the running order,
               the facilitator's rules, the outcomes, the recheck, the facilitator's own case and how
               facilitators are prepared (Cox's Bazar only), the records and the trap. Read from the
               `moderation` block of each programme YAML, so the guides and the programme pages cannot
               drift. Never re-type any of it here.
   AUTHORED  - only the printable records' layout.

   caseSheetChildren() is also exported: the Cox's Bazar Educator Guide carries the case sheet as
   Part 9B, so a facilitator prepares their case from the same page this guide prints.

   Run:  node scripts/downloads/generate-moderation.js
   Override output dir:  OUT_DIR=/tmp/pack node scripts/downloads/generate-moderation.js
   Re-run generate-lb-guides.js afterwards - the Educator Guide embeds the case sheet. */
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { Packer } = require('docx');
const S = require('./lib/docx-style');
const {
  NAVY, PLUM, GREY, OLIVE,
  P, bullet, H1, H2, mini, hr, pageBreak,
  refTable, twoCol, callout, makeDoc, writeBox, image, LOGO, AlignmentType,
} = S;

const ROOT = path.resolve(__dirname, '..', '..');
const CS = path.join(ROOT, 'content-source');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'downloads');
const readProgramme = (slug) => yaml.parse(fs.readFileSync(path.join(CS, 'programmes', `${slug}.yaml`), 'utf8'));

const EDITIONS = [
  { slug: 'learning-bridge', file: 'lb-moderation-guide.docx', name: 'Learning Bridge+', assessor: 'educator' },
  { slug: 'learning-bridge-coxs-bazar', file: 'lb-coxs-bazar-moderation-guide.docx', name: "Learning Bridge+ (Cox's Bazar)", assessor: 'facilitator' },
];

const LEVELS = 'No Level Awarded  ·  Theorist  ·  Practitioner  ·  Reflective Practitioner';
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

// ---- the guide ---------------------------------------------------------------------------------

function guide(e) {
  const prog = readProgramme(e.slug);
  const m = prog.moderation;
  if (!m) throw new Error(`${e.slug} has no moderation block`);
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
  }
}

module.exports = { caseSheetChildren, readProgramme };
if (require.main === module) main().catch((err) => { console.error(err); process.exit(1); });
