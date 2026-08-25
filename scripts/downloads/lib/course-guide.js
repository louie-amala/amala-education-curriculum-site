/* The component's course guide, as document children.
 *
 * Why this exists: each component's part of the Educator Guide went straight from the summary into
 * "Before you start" and then the phases. A facilitator was told what to do, session by session, and
 * never told what the component was WORKING TOWARDS - no purpose, no objectives, no statement of the
 * competency the whole thing is built to develop. The objectives existed all along in the course YAML
 * (statement, anchorContribution, competencyEvidence) and were rendered only on the website.
 *
 * Rendered from courses/<slug>.yaml, so the printed guide and the course page cannot drift. Used by
 * all three taught components; the mentoring component has no course and does not call this.
 */
const S = require('./docx-style');
const { NAVY, PLUM, GREY, OLIVE, P, H1, H2, H3, body, bullet, mini, twoCol, callout,
        pageBreak, Paragraph, TextRun } = S;

const toText = (v) => (Array.isArray(v) ? v.join(' ') : String(v || '')).replace(/\s+/g, ' ').trim();

// competencies.yaml, for the anchor competency's official title and goal.
function competencyLine(competencies, code) {
  const c = (competencies || []).find((x) => x.code === code);
  return c ? { title: c.title, goal: c.goal, level: c.creditLevel } : null;
}

/**
 * @param course       parsed courses/<slug>.yaml
 * @param unit         parsed units/<slug>.yaml (for hours/cadence)
 * @param competencies parsed framework/competencies.yaml
 * @param opts.heading  h1-equivalent builder (so the Educator Guide can demote it)
 */
function courseGuideChildren(course, unit, competencies, opts = {}) {
  const H = opts.heading || ((t) => H1(t));
  const Sub = opts.sub || ((t) => H2(t));
  const Sub2 = opts.sub2 || ((t) => H3(t));
  const c = [];
  const th = course.throughline || {};

  c.push(H('What this component is for'));
  c.push(P('Read this before the plan. It is what the sessions are working towards - the plan is how, this is why.', { size: 21, italics: true, color: GREY, after: 140 }));

  if (course.purpose) c.push(...body(course.purpose));

  // The anchor competency: the one thing the whole component is built to develop.
  const anchor = competencyLine(competencies, th.anchorCompetency);
  if (anchor) {
    c.push(callout(`The competency this component builds: ${th.anchorCompetency} - ${anchor.title}`, [
      anchor.goal,
      ...(th.fromAgency ? [`Why it matters: ${toText(th.fromAgency)}`] : []),
    ], PLUM));
  }

  // The objectives, in order, each with what it contributes to the anchor competency. This is the
  // part that was missing: a facilitator can now see which objective a phase is serving.
  if ((course.objectives || []).length) {
    c.push(Sub('What learners will be able to do'));
    c.push(P('These are the objectives the phases of the plan are built on. Each phase of the unit plan names the objective it develops.', { size: 22, after: 120 }));
    course.objectives.forEach((o, i) => {
      c.push(Sub2(`${i + 1}.  ${o.statement}`));
      const ac = o.anchorContribution || {};
      if (ac.develops) c.push(P(`How it builds ${th.anchorCompetency || 'the competency'}:  ${toText(ac.develops)}`, { size: 21 }));
      if (ac.demonstrates) c.push(P(`How a learner shows it:  ${toText(ac.demonstrates)}`, { size: 21, color: GREY }));
      const ev = (o.competencyEvidence || []).filter((e) => e.code !== th.anchorCompetency);
      if (ev.length) {
        c.push(P(`Also draws on:  ${ev.map((e) => `${e.code} ${e.citedTitle || ''}`.trim()).join('  ·  ')}`, { size: 19, color: OLIVE }));
      }
    });
  }

  if (th.develops || th.demonstrates) {
    c.push(Sub('Across the whole component'));
    if (th.develops) { c.push(mini('How it is developed')); c.push(...body(th.develops)); }
    if (th.demonstrates) { c.push(mini('How a learner demonstrates it')); c.push(...body(th.demonstrates)); }
  }

  // Hours, from the unit (the authored plan), not from the course guide's generic requirements.
  if (unit) {
    const hours = unit.cadence
      ? unit.cadence
      : `${unit.totalFacilitatedHours + unit.totalIndependentHours} hours - ${unit.totalFacilitatedHours}h in-person + ${unit.totalIndependentHours}h independent, over a minimum of 10 weeks`;
    c.push(mini('What it takes'));
    c.push(P(hours, { size: 22 }));
  }

  return c;
}

/**
 * The same section for a COURSE-LESS component. Mentoring and Wellbeing has no course guide to render,
 * so its unit carries `purpose` and `aims` instead - otherwise it would be the one component whose plan
 * says what to do and never what it is working towards.
 */
function componentGuideChildren(unit, opts = {}) {
  const H = opts.heading || ((t) => H1(t));
  const Sub = opts.sub || ((t) => H2(t));
  const Sub2 = opts.sub2 || ((t) => H3(t));
  const c = [];
  if (!unit || (!unit.purpose && !(unit.aims || []).length)) return c;

  c.push(H('What this component is for'));
  c.push(P('Read this before the plan. It is what the conversations are working towards - the plan is how, this is why.', { size: 21, italics: true, color: GREY, after: 140 }));
  if (unit.purpose) c.push(...body(unit.purpose));

  if ((unit.aims || []).length) {
    c.push(Sub('What it is working towards'));
    c.push(P('Five aims, and they are the same five things Amala\u2019s shared mentoring practice covers. The arc later in this guide is how they are reached across twelve weeks.', { size: 22, after: 120 }));
    unit.aims.forEach((a, i) => {
      c.push(Sub2(`${i + 1}.  ${a.aim}`));
      if (a.how) c.push(P(`What you do:  ${toText(a.how)}`, { size: 21 }));
      if (a.lookLike) c.push(P(`What it looks like when it is working:  ${toText(a.lookLike)}`, { size: 21, color: GREY }));
    });
  }

  if (unit.cadence) {
    c.push(mini('What it takes'));
    c.push(P(`${unit.cadence}. It adds no hours of its own - it runs inside the in-person time the taught components already use.`, { size: 22 }));
  }
  return c;
}

module.exports = { courseGuideChildren, componentGuideChildren };
