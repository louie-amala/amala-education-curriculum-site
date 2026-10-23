/* Generate the two Learning Bridge+ (Cox's Bazar) assessment tools:

     lb-coxs-bazar-assessment-record.docx          (the Competency Assessment Record - one per learner
                                                    per assessment point, both competencies)
     lb-coxs-bazar-what-might-you-see-or-hear.docx (the educator guide to judging FSI1 and FSL2)

   RENDERED  - every level, descriptor, example, term, watch-out and writing example, from `grading`
               in content-source/programmes/learning-bridge-coxs-bazar.yaml. That block is Amala's
               Proficiency Scale written in the language of each competency, and it is the LB+
               standard. Never re-type any of it here.
   AUTHORED  - only the record's layout.

   levelsChildren() and writingChildren() are exported: Educator Guide Part 3 embeds them, so the guide
   an educator reads and the record they fill describe each level in the same words by construction.

   Run:  node scripts/downloads/generate-assessment.js
   Override output dir:  OUT_DIR=/tmp/pack node scripts/downloads/generate-assessment.js
   Re-run generate-lb-guides.js afterwards - the Educator Guide embeds the guide. */
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { Packer } = require('docx');
const S = require('./lib/docx-style');
const {
  NAVY, PLUM, GREY, OLIVE, LINE,
  P, bullet, H1, H2, mini, pageBreak,
  refTable, callout, makeDoc, image, LOGO, linedArea,
  Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType,
} = S;

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'downloads');
const PROGRAMME = yaml.parse(fs.readFileSync(path.join(ROOT, 'content-source', 'programmes', 'learning-bridge-coxs-bazar.yaml'), 'utf8'));
const G = PROGRAMME.grading;

// The record labels the credit-bearing level the way the tool always has: Practitioner is where a
// competency counts towards a Pass.
const levelLabel = (lv) => (lv.level === 'Practitioner' ? 'Practitioner (Pass)' : lv.level);

const BOX = { style: BorderStyle.SINGLE, size: 6, color: LINE };
const BOXED = { top: BOX, bottom: BOX, left: BOX, right: BOX, insideHorizontal: BOX, insideVertical: BOX };
const run = (text, o = {}) => new TextRun({ text, size: o.size || 19, bold: o.bold, italics: o.italics, color: o.color });
const cell = (children, width, o = {}) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  shading: o.fill ? { fill: o.fill } : undefined,
  columnSpan: o.span,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: (Array.isArray(children) ? children : [children]).map((c) => (typeof c === 'string' ? new Paragraph({ children: [run(c, o)] }) : c)),
});
const table = (rows, widths) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: widths, borders: BOXED, rows });

// ---- the record --------------------------------------------------------------------------------

function recordChildren() {
  const c = [];
  const W = S.COL;
  c.push(image(LOGO, 90, 46, { align: AlignmentType.LEFT, after: 80 }));
  c.push(P('Learning Bridge+ Competency Assessment Record', { size: 32, bold: true, color: NAVY, after: 40 }));
  c.push(P('Circle one level for each competency. Explain why in the box below it.', { size: 21, color: GREY, after: 140 }));

  const q = [Math.floor(W * 0.22), Math.floor(W * 0.28), Math.floor(W * 0.22), W - Math.floor(W * 0.22) * 2 - Math.floor(W * 0.28)];
  const label = (t, wd) => cell(t, wd, { bold: true, color: NAVY, fill: 'F0ECE3' });
  c.push(table([
    new TableRow({ height: { value: 480, rule: 'atLeast' }, children: [label('Learner SL or Student ID:', q[0]), cell('', q[1]), label('Learning Centre Name:', q[2]), cell('', q[3])] }),
    new TableRow({ height: { value: 480, rule: 'atLeast' }, children: [label('Educator name:', q[0]), cell('', q[1]), label('Date:', q[2]), cell('', q[3])] }),
    new TableRow({ height: { value: 480, rule: 'atLeast' }, children: [label('Assessment point:', q[0]), cell('☐  Week 6 (formative)          ☐  Week 12 (summative)', W - q[0], { span: 3 })] }),
  ], q));

  G.assessedCompetencies.forEach((comp, i) => {
    if (i) c.push(pageBreak()); // one competency per page, so a level table never splits
    const n = comp.levels.length;
    const w = Math.floor(W / n);
    c.push(new Paragraph({ spacing: { before: 260, after: 40 }, keepNext: true, children: [run(`${comp.code}  `, { size: 24, bold: true, color: PLUM }), run(comp.title, { size: 24, bold: true, color: NAVY })] }));
    c.push(P(comp.statement, { size: 19, italics: true, color: GREY, after: 80 }));
    c.push(table([
      new TableRow({ cantSplit: true, children: comp.levels.map((lv) => cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [run(levelLabel(lv), { bold: true, size: 20, color: NAVY })] })], w, { fill: 'F0ECE3' })) }),
      new TableRow({ cantSplit: true, height: { value: 1100, rule: 'atLeast' }, children: comp.levels.map((lv) => cell(lv.descriptor, w, { size: 18 })) }),
    ], Array(n).fill(w)));
    c.push(new Paragraph({ spacing: { before: 120, after: 40 }, keepNext: true, children: [run('Why this level?  ', { bold: true, size: 20, color: NAVY }), run('What did you see or hear the learner do or say?', { size: 19, color: GREY })] }));
    c.push(linedArea(4));
    c.push(new Paragraph({ spacing: { before: 120, after: 40 }, keepNext: true, children: [run('Next step for the learner:  ', { bold: true, size: 20, color: NAVY }), run('One thing they could do to reach the next level.', { size: 19, color: GREY })] }));
    c.push(linedArea(2));
  });

  // Week 12 judgements are confirmed only after moderation (see `moderation` in the programme YAML),
  // so the record needs somewhere to show what moderation decided.
  const comps = G.assessedCompetencies.map((x) => x.code);
  c.push(new Paragraph({ spacing: { before: 220, after: 60 }, children: [run('After moderation', { bold: true, size: 20, color: NAVY }), run('  (only if this learner’s case was taken, or a recheck changed it)', { size: 18, color: GREY })] }));
  c.push(table(comps.map((code) => new TableRow({ children: [
    cell(code, Math.floor(W * 0.15), { bold: true, color: PLUM }),
    cell('☐  Confirmed       ☐  Changed to: __________________   Why: ____________________', W - Math.floor(W * 0.15), { size: 18 }),
  ] })), [Math.floor(W * 0.15), W - Math.floor(W * 0.15)]));

  const h = Math.floor(W / 2);
  c.push(new Paragraph({ spacing: { before: 160 }, children: [] }));
  c.push(table([new TableRow({ height: { value: 560, rule: 'atLeast' }, children: [
    cell([new Paragraph({ children: [run('Educator signature:', { bold: true, color: NAVY })] })], h),
    cell('☐  Recorded on the Amala assessment spreadsheet', W - h),
  ] })], [h, W - h]));
  c.push(P('Talk this sheet through with the learner when you give it to them. Keep a copy or photo before handing it over.', { size: 19, italics: true, color: GREY, before: 120 }));
  return c;
}

// ---- the guide ---------------------------------------------------------------------------------
// Split in two so Educator Guide Part 3 can give each its own numbered section: the levels (with what
// you might see or hear), and how to write the record. `h1/h2` let the caller set the heading depth.

function levelsChildren({ h1 = H1, h2 = H2 } = {}) {
  const c = [];
  c.push(h2('Three things to remember'));
  G.remember.forEach((r) => c.push(new Paragraph({ spacing: { after: 100 }, children: [run(`${r.title}  `, { size: 22, bold: true, color: NAVY }), run(r.detail, { size: 22 })] })));
  if (G.levelsNote) c.push(callout('Four levels, not five', [G.levelsNote], OLIVE));

  G.assessedCompetencies.forEach((comp) => {
    c.push(pageBreak());
    c.push(h1(`${comp.code}  ${comp.title}`));
    c.push(P(comp.statement, { size: 22, italics: true, color: GREY }));
    if (comp.terms.length) {
      c.push(mini('Useful terms'));
      comp.terms.forEach((t) => c.push(new Paragraph({ spacing: { after: 90 }, children: [run(`${t.term}: `, { size: 21, bold: true, color: NAVY }), run(t.meaning, { size: 21 })] })));
    }
    c.push(refTable(['Level', 'You might see or hear'], comp.levels.map((lv) => [
      { lines: [levelLabel(lv), '', lv.descriptor], size: 19 },
      { lines: lv.seeOrHear.map((x) => `•  ${x}`), size: 19 },
    ]), [3400, 7400]));
    if (comp.watchOut.length) c.push(callout('Watch out', comp.watchOut, PLUM));
  });
  return c;
}

function writingChildren({ h2 = H2 } = {}) {
  const c = [];
  const w = G.writing;
  if (!w) return c;
  c.push(h2('Writing the "Why this level?" box'));
  c.push(P(w.whyIntro, { size: 22 }));
  c.push(refTable(['Not useful', 'Useful'], w.whyExamples.map((e) => [e.notUseful, { text: e.useful, bold: false }]), [3200, 7600]));
  c.push(h2('Writing the "Next step" line'));
  c.push(P(w.nextStepIntro, { size: 22 }));
  w.nextStepRules.forEach((r) => c.push(bullet(r)));
  const rows = [];
  G.assessedCompetencies.forEach((comp) => comp.nextSteps.forEach((n) => rows.push([`${comp.code} ${n.level}`, { text: n.notUseful, bold: false }, { text: n.useful, bold: false }])));
  c.push(refTable(['Level now', 'Not useful', 'Useful'], rows, [2600, 2600, 5600]));
  if (w.alreadyTop) c.push(callout('Learners already at Reflective Practitioner', [w.alreadyTop], OLIVE));
  if (w.handover) c.push(P(w.handover, { size: 22, bold: true, color: NAVY, before: 200 }));
  return c;
}

// The standalone download: front matter, the levels, then how to write the record.
function seeOrHearChildren() {
  const c = [];
  c.push(image(LOGO, 110, 57, { align: AlignmentType.LEFT, after: 200 }));
  c.push(P("Learning Bridge+ (Cox's Bazar)", { size: 20, bold: true, color: OLIVE, after: 40 }));
  c.push(P('What Might You See or Hear?', { size: 40, bold: true, color: NAVY, after: 40 }));
  c.push(P('An educator guide to assessing FSI1 and FSL2', { size: 24, color: PLUM, after: 200 }));
  c.push(P('This guide sits alongside the Competency Assessment Record. For each competency and each level, it gives examples of what a learner at that level might do or say. Use it to help you decide which level to circle, and to write a clear reason in the "Why this level?" box.', { size: 22 }));
  c.push(...levelsChildren());
  c.push(pageBreak());
  c.push(H1('Writing the record'));
  c.push(...writingChildren());
  return c;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [
    ['lb-coxs-bazar-assessment-record.docx', makeDoc(recordChildren(), { footerText: "Competency Assessment Record  ·  Learning Bridge+ (Cox's Bazar)" })],
    ['lb-coxs-bazar-what-might-you-see-or-hear.docx', makeDoc(seeOrHearChildren(), { footerText: "What Might You See or Hear?  ·  Learning Bridge+ (Cox's Bazar)" })],
  ];
  for (const [name, doc] of jobs) {
    const buf = await Packer.toBuffer(doc);
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log('wrote', name, (buf.length / 1024).toFixed(1) + ' KB');
  }
}

module.exports = { levelsChildren, writingChildren, seeOrHearChildren, recordChildren, levelLabel };
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
