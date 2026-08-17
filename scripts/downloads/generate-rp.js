/* Generate the Research Project (Cox's Bazar) offline pack: facilitator unit plan & guide, and the
   student workbook. Reads the authored YAML (coxs-bazar-research-project.yaml + cb-rp-* materials) so
   the printed documents stay a faithful copy of the site. Re-run after editing the unit or materials.
   Run:  node scripts/downloads/generate-rp.js
   Override output dir (preview without touching committed files):  OUT_DIR=/tmp/pack node scripts/downloads/generate-rp.js

   Decision (2026-08-04): the FULL original articles go in the FACILITATOR guide only (Appendix B). The
   student workbook carries the graded B1/A1-A2 readings, references, word bank, and a blank evidence
   log. Full originals for sources we may reproduce (FAO, UN) are held below; The Conversation is
   CC BY-ND (insert verbatim from source at print), Grow Billion Trees is not reproduced. */
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak, HeadingLevel,
} = require('docx');

const ROOT = path.resolve(__dirname, '..', '..');
const CS = path.join(ROOT, 'content-source');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(ROOT, 'public', 'downloads');
const rd = (p) => yaml.parse(fs.readFileSync(p, 'utf8'));

const unit = rd(path.join(CS, 'units', 'coxs-bazar-research-project.yaml'));
const course = rd(path.join(CS, 'courses', 'research-project.yaml'));
const mat = {};
for (const f of fs.readdirSync(path.join(CS, 'materials')).filter((f) => f.startsWith('cb-rp-'))) {
  const m = rd(path.join(CS, 'materials', f));
  mat[m.slug] = m;
}
// Amala's official proficiency scale — read from the framework so this record cannot drift from it.
const scale = rd(path.join(CS, 'framework', 'proficiency-scale.yaml'));
const objStatement = (oid) => {
  if (!oid) return null;
  const n = parseInt(oid.split('--o')[1], 10);
  const o = course.objectives[n - 1];
  return o ? o.statement.trim() : null;
};
const LEAD = { 'facilitator-led': 'You lead', shared: 'Shared', 'learner-led': 'Learners lead' };
const KIND = { activity: 'Activity', practice: 'Practice', orientation: 'Orientation', consolidation: 'Consolidation', assessment: 'Assessment' };

// ---- text helpers (shared style with generate-docx.js) ----
const NAVY = '1F3A5F', PLUM = '7A3B69', GREY = '5A6473', OLIVE = '6E7A2E', LINE = 'B9B3A6';
const toParas = (s) => String(s || '').trim().split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
const P = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text, size: opts.size || 22, bold: opts.bold, italics: opts.italics, color: opts.color })], spacing: { after: opts.after == null ? 120 : opts.after, before: opts.before || 0 }, alignment: opts.align, border: opts.border });
const runs = (arr) => new Paragraph({ children: arr, spacing: { after: 120 } });
const body = (s) => toParas(s).map((t) => P(t, { size: 22, after: 120 }));
const bullet = (text, level = 0) => new Paragraph({ children: [new TextRun({ text, size: 22 })], bullet: { level }, spacing: { after: 60 } });
const label = (lab, text) => new Paragraph({ children: [new TextRun({ text: lab + ' ', bold: true, size: 22, color: PLUM }), new TextRun({ text, size: 22 })], spacing: { after: 120 } });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 100 }, children: [new TextRun({ text: t, bold: true, size: 30, color: NAVY })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: t, bold: true, size: 26, color: PLUM })] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 60 }, children: [new TextRun({ text: t, bold: true, size: 23, color: NAVY })] });
const mini = (t) => new Paragraph({ children: [new TextRun({ text: t, bold: true, italics: true, size: 21, color: OLIVE })], spacing: { before: 80, after: 40 } });
const hr = () => new Paragraph({ text: '', border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE } }, spacing: { after: 120 } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const LETTER = { size: { width: 12240, height: 15840 } };

// minimal markdown -> docx blocks (headings, bullets, paragraphs) for resource content
function mdBlocks(md) {
  const out = [];
  const lines = String(md || '').replace(/\r/g, '').split('\n');
  let i = 0; let para = [];
  const flush = () => { if (para.length) { out.push(P(para.join(' '), { size: 22 })); para = []; } };
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === '') { flush(); i++; continue; }
    if (t.startsWith('### ')) { flush(); out.push(H3(t.slice(4))); i++; continue; }
    if (t.startsWith('## ')) { flush(); out.push(H2(t.slice(3))); i++; continue; }
    if (t.startsWith('- ')) { flush(); while (i < lines.length && lines[i].trim().startsWith('- ')) { out.push(bullet(lines[i].trim().slice(2))); i++; } continue; }
    para.push(t); i++;
  }
  flush();
  return out;
}

// Full original articles — facilitator reference only (Appendix B of the guide). Only sources whose
// licence permits reproduction are held here; the others carry a note.
const ORIGINALS = {
  B: {
    ref: 'FAO Regional Office for Asia and the Pacific, "Protecting 45,000 Rohingya Lives Ahead of Life-Threatening Landslides," 28 April 2026. © FAO 2026. Reproduced under FAO educational / non-commercial permission, with attribution.',
    text: [
      'The Food and Agriculture Organization of the United Nations (FAO) in Bangladesh has received USD 584,369 from the Bangladesh Humanitarian Fund to implement urgent slope stabilization and community preparedness initiatives. These efforts aim to protect vulnerable Rohingya households from landslide risks before the approaching monsoon season.',
      'The funding will support stabilization work across approximately 170 hectares of high-risk slopes at 85 sites within 15 Rohingya refugee camps in Ukhia and Teknaf. The intervention strategy includes planting deep-rooted native vegetation, deploying bioengineering techniques such as bamboo crib walls and contour trenching, and offering emergency Cash-for-Work opportunities benefiting 800 direct participants. These measures are designed to protect over 45,000 Rohingya refugees by safeguarding shelters, evacuation routes, and access to essential services during monsoon months.',
      'FAO Representative Jiaoqun Shi emphasized the urgency: "Fragile and deforested slopes combined with extreme monsoon rainfall are increasing the risk of life-threatening landslides." He noted that sustainable prevention measures are critically needed to prevent loss of life and secondary displacement, and praised the Bangladesh Humanitarian Fund for addressing a significant gap in the 2025-2026 Rohingya Joint Response Plan.',
      'Shi highlighted that "nature-based solutions deliver between USD 7 and USD 30 in returns for every USD 1 invested" while simultaneously reducing disaster risks and generating income.',
      'FAO brings substantial technical expertise in nature-based bioengineering solutions. Through the Safe Access to Fuel and Energy Plus (SAFE+) programme, FAO has already stabilized over 3,500 hectares of degraded slopes since 2018. The organization maintains a strong field presence in Cox’s Bazar since the 2017 Rohingya influx, coordinating through the Rohingya Coordination Platform to align interventions with site management, shelter, and protection responses.',
      'Project activities will be delivered through local community structures including majhis (community leaders), imams (spiritual leaders), and youth networks to foster long-term ownership and self-reliance.',
      'The Bangladesh Humanitarian Fund supports rapid, flexible financing for urgent life-saving priorities. This contribution allows partners like FAO to act proactively before predictable hazards cause casualties or displacement.',
    ],
  },
  C: {
    ref: 'FAO / United Nations in Bangladesh, "Nearly half a million trees planted in two months: FAO restores degraded watersheds and forests in Cox’s Bazar," 7 January 2020. © United Nations in Bangladesh. Reproduced for educational / non-commercial use, with attribution.',
    text: [
      'The Food and Agriculture Organization completed a two-month reforestation initiative in watershed areas near Rohingya camps. Through the SAFE Plus project - a collaboration between FAO, IOM and WFP - nearly half a million tree seedlings were planted in partnership with Cox’s Bazar South Forest Division.',
      'During October and November, local workers from disadvantaged communities planted 475,000 tree seedlings and removed unwanted vegetation across 571 hectares. Combined with 25,000 seedlings near camps and 500,000 inside camps, the total reached one million trees, replacing losses from settlement development and firewood demand.',
      'The project established 16 new local nurseries, with FAO supporting 45 total nurseries through training and assistance. This approach strengthened the local economy while creating sustainable tree sourcing.',
      'The Watershed and Forest Rehabilitation project, jointly funded by Japan, the Netherlands, Canada and IOM, targeted upland forest areas that capture rainwater for rivers and streams. These forests prevent landslides, maintain water quality, support biodiversity, and protect against natural hazards.',
      'Planting occurred within 1-3 kilometres of camps (360 hectares) and 3-5 kilometres away (190 hectares), involving 19 local Forest Department offices. An assisted natural regeneration approach removed undesired species and planted indigenous varieties. Additional plantings included ten hectares around government institutions and schools, plus eleven hectares along the Reju Khal canal banks, protecting a critical local water source.',
    ],
  },
  A: { ref: 'Thompson, Correa, Duncan and Crompton, "Deforestation can raise local temperatures by up to 4.5C," The Conversation, 15 November 2021.', note: 'CC BY-ND 4.0 - reproduce the article verbatim from the source, with The Conversation’s required attribution line. Not re-typed here (BY-ND forbids altered copies).' },
  D: { ref: 'Grow Billion Trees, "How Can Trees Help Prevent Soil Erosion?" growbilliontrees.com.', note: 'Commercial, all rights reserved - not reproduced. Cite and summarise only.' },
  E: {
    ref: 'U.S. Geological Survey (USGS), Water Science School, "Surface Runoff and the Water Cycle." usgs.gov. US Government public domain - free to reproduce with a courtesy credit.',
    text: [
      'When rain falls on the land, some of it soaks into the ground (infiltration) and some flows over the surface (runoff). How much runs off depends heavily on the ground cover.',
      'When falling raindrops strike bare soil, the impact causes both splash erosion and soil compaction, resulting in faster runoff and increased erosion. Vegetation can slow the movement of runoff, allowing more time for it to seep into the ground; plant roots bind the soil and create channels that help water infiltrate.',
    ],
  },
  F: { ref: 'Ro Maung Shwe / RK News Desk, "Rohingya Youth Form Environmental Network to Protect Camps from Growing Ecological Crisis," Rohingya Khobor, 12 December 2025. rohingyakhobor.com.', note: 'Community outlet, rights reserved - not reproduced. Cite and summarise only.' },
  G: {
    ref: 'Authors listed at the source (CONFIRM), "Land Cover Changes and Land Surface Temperature Dynamics in the Rohingya Refugee Area, Cox’s Bazar, Bangladesh: An Analysis from 2013 to 2024." Atmosphere (MDPI), 2025. doi:10.3390/atmos16030250. Open access (CC BY) - free to reproduce with attribution.',
    text: [
      'Using Landsat satellite imagery of the 34 refugee camps, the study found a 97% decline in mixed forest cover and a 161.78% increase in built-up area between 2013 and 2018, corresponding to a substantial rise in land surface temperature.',
      'The area with land surface temperature between 36.5 and 39.5 degrees C expanded by about 35% by 2018 compared with 2013, then reduced slightly (about 2%) from 2018 to 2024, attributed to reforestation efforts by government and NGOs.',
    ],
  },
  H: { ref: 'UNHCR, "Rohingya refugees restore depleted forest in Bangladesh," around 2021 (CONFIRM date). unhcr.org.', note: 'UN agency first-person story (a plantation guardian); reproducible for educational/non-commercial use with attribution, but full text not to hand - summarised only. Confirm date and any quotes at the source.' },
  I: {
    ref: 'International Organization for Migration (IOM), "UN Agencies and Government Distribute LPG Stoves to Rohingya Refugees to Save Remaining Forests." iom.int. Reproducible for educational/non-commercial use with attribution.',
    text: [
      'To slow the deforestation driven by families cutting firewood to cook, UN agencies and the government distributed LPG (bottled cooking gas) stoves to Rohingya refugee and host-community families through the SAFE Plus programme. In 2024 alone, agencies distributed nearly 1.8 million LPG cylinders.',
      'The switch away from firewood let local vegetation begin to regenerate, reduced the protection risks women and girls faced collecting wood in the forest, and cut the smoke inside shelters.',
    ],
  },
  J: {
    ref: 'Food and Agriculture Organization of the United Nations (FAO), "Restoring degraded land in Rohingya refugee camps in Cox’s Bazar, Bangladesh." openknowledge.fao.org. Reproducible for educational/non-commercial use with attribution.',
    text: [
      'Through planting on degraded slopes and the shift to LPG, agencies report that green cover in and around the camps has increased (about 43% between 2018 and 2024) and that landslide frequency has fallen from the early years as slope-stabilisation and afforestation took hold.',
      'The fuller picture is that forest cover inside the camps fell drastically after the 2017 influx (from over half the land to almost none), so recovery is partial and ongoing. Effectiveness claims here come from the organisations delivering the work and should be weighed against independent evidence and local observation.',
    ],
  },
};

// ============================================================ FACILITATOR PLAN & GUIDE
function facilitatorPlan() {
  const c = [];
  c.push(new Paragraph({ children: [new TextRun({ text: 'Research Project', bold: true, size: 52, color: NAVY })], spacing: { after: 40 } }));
  c.push(P('Facilitator Unit Plan & Guide', { size: 30, bold: true, color: PLUM, after: 40 }));
  c.push(P("Learning Bridge+ (Cox's Bazar)  ·  The trees on our hills", { size: 22, color: GREY, after: 200 }));
  c.push(...body(unit.summary));
  c.push(runs([
    new TextRun({ text: `${unit.totalFacilitatedHours + unit.totalIndependentHours} hours total`, bold: true, size: 22, color: NAVY }),
    new TextRun({ text: `   ·   ${unit.totalFacilitatedHours}h in-person  ·  ${unit.totalIndependentHours}h independent  ·  set out in hours, fit your own schedule (min. 10 weeks)`, size: 22, color: GREY }),
  ]));
  c.push(hr());
  c.push(H2('How this unit hands over control'));
  c.push(...body(unit.deliveryApproach));
  c.push(H2('How to use this plan'));
  c.push(P('This plan is set out in hours, not weeks. Work through the phases in order; within a phase, the blocks build on each other. Each block carries its full guidance inline. Read "Before you start" and "Safeguarding and protection" first; the source pack the learners read is in Appendix A, the full original articles in Appendix B, and how to assess FSI1 in "Assessing the investigation". Deliver in the language you share with learners. Times are generous on purpose.', { size: 22 }));

  // Before you start — facilitator resources the activity materials assume exist.
  const runOff = mat['cb-rp-running-this-offline'];
  if (runOff && runOff.educatorContent) { c.push(pageBreak()); c.push(H1('Before you start')); c.push(...mdBlocks(runOff.educatorContent)); }
  const safe = mat['cb-rp-safeguarding-and-protection'];
  if (safe && safe.educatorContent) { c.push(pageBreak()); c.push(H1('Safeguarding and protection')); c.push(...mdBlocks(safe.educatorContent)); }
  c.push(pageBreak());

  unit.phases.forEach((ph, pi) => {
    c.push(H1(`Phase ${pi + 1} - ${ph.title}`));
    c.push(P(`Lead: ${LEAD[ph.lead] || ph.lead || '-'}`, { size: 20, color: GREY, italics: true, after: 40 }));
    const os = objStatement(ph.objectiveId);
    if (os) c.push(label('Course objective:', os));
    if (ph.summary) c.push(...body(ph.summary));
    ph.blocks.forEach((b) => {
      c.push(H2(b.title));
      const hrsBits = [KIND[b.kind] || 'Activity', `${b.facilitatedHours}h facilitated`];
      if (b.independentHours) hrsBits.push(`${b.independentHours}h independent`);
      c.push(P(hrsBits.join('   ·   '), { size: 20, color: OLIVE, bold: true, after: 100 }));
      const m = b.materialSlug ? mat[b.materialSlug] : null;
      if (b.description) c.push(...body(b.description));
      if (m) {
        c.push(mini(`Activity in the material bank: ${m.title}`));
        if (m.duration) c.push(label('Timing:', m.duration));
        if (m.grouping) c.push(label('Grouping:', m.grouping));
        if (m.whatLearnersDo && m.whatLearnersDo.length) { c.push(mini('What learners do')); m.whatLearnersDo.forEach((x) => c.push(bullet(x))); }
        if (m.materialsAndPreparation && m.materialsAndPreparation.length) { c.push(mini('Materials and preparation')); m.materialsAndPreparation.forEach((x) => c.push(bullet(x))); }
        if (m.facilitationNotes) { c.push(mini('Facilitation notes')); c.push(...body(m.facilitationNotes)); }
        (m.steps || []).forEach((s, si) => {
          c.push(H3(`Step ${si + 1}: ${s.title}${s.duration ? '  (' + s.duration + ')' : ''}`));
          c.push(...body(s.guidance));
          if (s.keyPrompts && s.keyPrompts.length) { c.push(mini('Ask')); s.keyPrompts.forEach((x) => c.push(bullet(x))); }
        });
        if (m.worksheet && m.worksheet.slug && mat[m.worksheet.slug]) {
          c.push(label('Student worksheet:', `${mat[m.worksheet.slug].title} (in the student workbook)`));
        }
      }
      if (b.independentTask) c.push(label('Independent task:', b.independentTask));
      if (b.flexNote) c.push(P(toParas(b.flexNote).join(' '), { italics: true, size: 21, color: GREY }));
      c.push(hr());
    });
    if (pi < unit.phases.length - 1) c.push(pageBreak());
  });

  // Assessing FSI1 — the educator's assessment guide.
  const assess = mat['cb-rp-assessing-the-research'];
  if (assess && assess.educatorContent) { c.push(pageBreak()); c.push(H1('Assessing the investigation (FSI1)')); c.push(...mdBlocks(assess.educatorContent)); }

  // Appendix A — the source pack (facilitator copy: educator notes + all graded readings + word bank)
  const pack = mat['cb-rp-secondary-source-pack'];
  if (pack) {
    c.push(pageBreak());
    c.push(H1('Appendix A - Secondary source pack (facilitator copy)'));
    if (pack.educatorContent) c.push(...mdBlocks(pack.educatorContent));
    if (pack.learnerContent) { c.push(pageBreak()); c.push(H2('The source cards, as learners read them')); c.push(...mdBlocks(pack.learnerContent)); }
  }

  // Appendix B — full original articles (facilitator reference only)
  c.push(pageBreak());
  c.push(H1('Appendix B - Full original articles (facilitator reference)'));
  c.push(P('The complete originals behind the graded source cards. For your reference and the strongest readers; the student workbook carries the graded versions only.', { size: 22, color: GREY }));
  for (const key of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']) {
    const o = ORIGINALS[key];
    c.push(H2(`Source ${key}`));
    c.push(P(o.ref, { size: 20, color: GREY, italics: true }));
    if (o.text) o.text.forEach((t) => c.push(P(t, { size: 22 })));
    if (o.note) c.push(label('Note:', o.note));
    c.push(hr());
  }

  c.push(pageBreak());
  c.push(H2('The offline pack'));
  c.push(P('This guide is part of a fully offline pack: this Facilitator Unit Plan & Guide, and the Student Workbook (the source cards, word bank, and evidence log). Both are editable so you can adapt and distribute them without the internet.', { size: 22 }));
  c.push(P("Cox's Bazar edition · Research Project component of Learning Bridge+ · not for redistribution outside the programme. Reproduced articles are used with attribution under educational / non-commercial permission; see the copyright notes in Appendix A.", { size: 18, color: GREY, before: 120 }));
  return new Document({ styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } }, sections: [{ properties: { page: LETTER }, children: c }] });
}

// ============================================================ STUDENT WORKBOOK
const evidenceGrid = (nRows) => {
  const cols = ['Which source', 'What it tells us about our question', 'New words I met', 'Can I trust it?'];
  const colW = [1700, 4600, 2200, 2300];
  const headRow = new TableRow({ tableHeader: true, children: cols.map((t, i) => new TableCell({
    width: { size: colW[i], type: WidthType.DXA },
    children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 20, color: NAVY })] })],
  })) });
  const rows = [headRow];
  for (let r = 0; r < nRows; r++) {
    rows.push(new TableRow({ height: { value: 1100, rule: 'atLeast' }, children: cols.map((_, i) => new TableCell({
      width: { size: colW[i], type: WidthType.DXA }, children: [new Paragraph('')],
    })) }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: colW, rows });
};

// A full-width blank box for the learner to draw/mark/write in.
const box = (h, labelText) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  columnWidths: [10800],
  rows: [new TableRow({ height: { value: h, rule: 'atLeast' }, children: [new TableCell({
    width: { size: 10800, type: WidthType.DXA },
    children: labelText ? [new Paragraph({ children: [new TextRun({ text: labelText, size: 18, color: GREY })] })] : [new Paragraph('')],
  })] })],
});

// The student workbook IS the research book: the source cards to read, then one labelled page per
// activity (in course order), each = the worksheet's instructions + space to fill. Compiled from the
// unit + cb-rp materials, so it stays a faithful copy of the site.
function workbook() {
  const c = [];
  c.push(new Paragraph({ children: [new TextRun({ text: 'Research Project', bold: true, size: 52, color: NAVY })], spacing: { after: 40 } }));
  c.push(P('Student Workbook — Our Research Book', { size: 30, bold: true, color: PLUM, after: 40 }));
  c.push(P("The trees on our hills  ·  Learning Bridge+ (Cox's Bazar)", { size: 22, color: GREY, after: 200 }));
  c.push(P('This is your research book. It has the sources we read, our research words, and a page for each step of our investigation. Read the version that is right for you, or listen while your teacher reads. You can use drawings, marks, and a few words — no neat writing needed.', { size: 22 }));

  // The source pack, as learners read it (graded readings + word bank; no full originals)
  const pack = mat['cb-rp-secondary-source-pack'];
  if (pack && pack.learnerContent) {
    c.push(pageBreak());
    c.push(H1('Our sources'));
    c.push(...mdBlocks(pack.learnerContent));
  }

  // One research-book page per activity worksheet, in unit (course) order.
  const gridSlugs = new Set(['cb-rp-source-pack-evidence-log', 'cb-rp-gathering-record']);
  unit.phases.forEach((ph) => {
    ph.blocks.forEach((b) => {
      const m = b.materialSlug ? mat[b.materialSlug] : null;
      if (!m || !m.worksheet || !m.worksheet.slug) return;
      const ws = mat[m.worksheet.slug];
      if (!ws) return;
      c.push(pageBreak());
      c.push(new Paragraph({ children: [new TextRun({ text: ('Research book · ' + m.title).toUpperCase(), bold: true, size: 15, color: PLUM })], spacing: { after: 40 } }));
      c.push(new Paragraph({ children: [new TextRun({ text: ws.title, bold: true, size: 30, color: NAVY })], spacing: { after: 120 } }));
      if (ws.learnerContent) c.push(...mdBlocks(ws.learnerContent));
      if (gridSlugs.has(ws.slug)) {
        c.push(P('Fill one space for each source or person.', { size: 20, color: GREY, before: 80 }));
        c.push(evidenceGrid(6));
      } else {
        c.push(box(3200, 'My drawing, marks, and words'));
      }
    });
  });

  c.push(pageBreak());
  c.push(P("Cox's Bazar edition · Research Project component of Learning Bridge+ · not for redistribution outside the programme.", { size: 18, color: GREY }));
  return new Document({ styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } }, sections: [{ properties: { page: LETTER }, children: c }] });
}

// ============================================================ PICTURE-WORD CARDS
// Parse the programme word bank out of the source pack's learnerContent (bullets "term — meaning (Source X)").
function wordBank() {
  const pack = mat['cb-rp-secondary-source-pack'];
  const lc = (pack && pack.learnerContent) || '';
  const out = [];
  let inWB = false;
  for (const raw of lc.split('\n')) {
    const t = raw.trim();
    if (t.startsWith('## Programme word bank')) { inWB = true; continue; }
    if (inWB && t.startsWith('## ')) break;
    if (inWB && t.startsWith('- ')) {
      const item = t.slice(2);
      const parts = item.split(' — ');
      const term = parts[0].trim();
      const meaning = parts.slice(1).join(' — ').replace(/\s*\(Sources?[^)]*\)\s*$/, '').trim();
      if (term) out.push({ term, meaning });
    }
  }
  return out;
}
const cardCell = (term, meaning) => new TableCell({
  width: { size: 5400, type: WidthType.DXA },
  children: [
    new Paragraph({ children: [new TextRun({ text: term || ' ', bold: true, size: 30, color: NAVY })], spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: meaning || '', size: 18, color: GREY })], spacing: { after: 200 } }),
    new Paragraph({ children: [new TextRun({ text: term ? '(draw it here)' : '(your own word)', italics: true, size: 14, color: LINE })] }),
  ],
});
function cards() {
  const c = [];
  c.push(new Paragraph({ children: [new TextRun({ text: 'Research Project', bold: true, size: 44, color: NAVY })], spacing: { after: 40 } }));
  c.push(P('Picture-word cards — our research words', { size: 26, bold: true, color: PLUM, after: 40 }));
  c.push(P("Learning Bridge+ (Cox's Bazar)  ·  The trees on our hills", { size: 20, color: GREY, after: 160 }));
  c.push(P('Print and cut out along the lines. Each card has a research word, what it means, and a space to draw it. Draw the picture together with the group, and build the cards into the word wall as the course goes. There are blank cards at the end for learners’ own words.', { size: 22, after: 160 }));
  const items = [
    { term: 'Our hills — before', meaning: 'the hills full of trees, long ago (draw the forested hills)' },
    { term: 'Our hills — now', meaning: 'the bare slopes today (draw the bare hills)' },
    ...wordBank(),
    { term: '', meaning: '' }, { term: '', meaning: '' },
  ];
  if (items.length % 2 === 1) items.push({ term: '', meaning: '' });
  const rows = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(new TableRow({ height: { value: 2600, rule: 'atLeast' }, cantSplit: true, children: [cardCell(items[i].term, items[i].meaning), cardCell(items[i + 1].term, items[i + 1].meaning)] }));
  }
  c.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [5400, 5400], rows }));
  return new Document({ styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } }, sections: [{ properties: { page: LETTER }, children: c }] });
}

// ============================================================ ASSESSMENT RECORD (facilitator, copy per learner)
// The levels, GPA values and generic descriptors come from framework/proficiency-scale.yaml — Amala's
// official scale — so the record can never drift from it. Only the FSI1 reading is written here.
const FSI1_READING = {
  none: 'Cannot say what they would try to find out about the issue, or how, and why.',
  theorist: 'Can say what they want to find out, who they would ask and what they would read, and why — but has not acted on it.',
  practitioner: 'Actually investigated — asked and looked, and used the source pack — with reasons for how they went about it, even if it has not yet become an insight.',
  reflective: 'The research reached an evidence-backed insight they can communicate, and they can say what worked in how they investigated, what did not, and what they would do differently, with evidence.',
  expert: 'A second, distinct investigation in which they carried through an improvement identified in the first.',
};
const scaleTable = () => {
  const colW = [300, 2500, 5200, 2800];
  const head = ['', 'Level', 'The learner (Amala’s scale)', 'In this component (FSI1)'];
  const rows = [new TableRow({ tableHeader: true, children: head.map((t, i) => new TableCell({
    width: { size: colW[i], type: WidthType.DXA },
    children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 18, color: NAVY })] })],
  })) })];
  for (const lv of scale.levels) {
    const title = lv.title + (lv.creditAwarded ? '' : '  (no credit)') + `\nGPA ${lv.gpa.toFixed(1)}`;
    const cells = ['☐', title, lv.genericDescriptor, FSI1_READING[lv.id] || ''];
    rows.push(new TableRow({ height: { value: 900, rule: 'atLeast' }, cantSplit: true, children: cells.map((t, i) => new TableCell({
      width: { size: colW[i], type: WidthType.DXA },
      children: String(t).split('\n').map((line, j) => new Paragraph({ children: [new TextRun({ text: line, size: i === 0 ? 26 : 17, bold: i === 1 && j === 0, color: i === 1 ? NAVY : (i === 3 ? GREY : undefined) })] })),
    })) }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: colW, rows });
};
function rubricDoc() {
  const c = [];
  c.push(new Paragraph({ children: [new TextRun({ text: 'Research Project', bold: true, size: 44, color: NAVY })], spacing: { after: 40 } }));
  c.push(P('Assessment record — Investigate real-world issues (FSI1)', { size: 24, bold: true, color: PLUM, after: 40 }));
  c.push(P("Learning Bridge+ (Cox's Bazar)  ·  Facilitator — make one copy per learner", { size: 20, color: GREY, after: 160 }));
  c.push(P('Judge each learner by your professional judgement against Amala’s proficiency scale, from evidence gathered across the whole research book — not from the final output alone. Full guidance is in the facilitator guide ("Assessing the investigation"). Tick the level and write one or two lines of evidence for why.', { size: 22, after: 120 }));
  c.push(P('The scale is generic: one ladder, read against the goal FSI1 names — the learner can conduct primary and secondary research into challenges affecting people and the planet to develop actionable insights. Credit begins at Practitioner, which is also the readiness bar for the accredited secondary pathway. Expert needs two or more genuinely different scenarios, so it rarely comes from this component alone.', { size: 20, color: GREY, after: 160 }));
  c.push(P('Learner: ______________________________', { size: 22, after: 200 }));
  const point = (title) => {
    c.push(H2(title));
    c.push(scaleTable());
    c.push(P('Evidence for the judgement (question & plan · evidence log & how they weighed sources · findings → insight · output & answering questions):', { size: 18, color: GREY, after: 40, before: 160 }));
    c.push(box(2200, ''));
  };
  point('Midway (formative) — around the end of "Plan and conduct research"');
  c.push(P('Provisional, made with Amala’s support and calibration: a checkpoint that tells you where to put your support next, not the final grade.', { size: 18, italics: true, color: GREY, before: 80 }));
  c.push(pageBreak());
  point('End (summative) — at the showcase');
  c.push(P('This is the judgement that counts towards the certificated competency and the readiness decision.', { size: 18, italics: true, color: GREY, before: 80 }));
  c.push(P('Levels, GPA values and generic descriptors are Amala’s official Competency Framework and Proficiency Scale (cohorts starting 2025).', { size: 16, color: GREY, before: 200 }));
  return new Document({ styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } }, sections: [{ properties: { page: LETTER }, children: c }] });
}

// ============================================================ WRITE
async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const jobs = [
    ['research-project-facilitator-unit-plan.docx', facilitatorPlan()],
    ['research-project-student-workbook.docx', workbook()],
    ['research-project-assessment-rubric.docx', rubricDoc()],
    ['research-project-picture-cards.docx', cards()],
  ];
  for (const [name, doc] of jobs) {
    const buf = await Packer.toBuffer(doc);
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log('wrote', path.join(OUT, name));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
