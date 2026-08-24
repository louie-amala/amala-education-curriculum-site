# Amala content-source — extraction notes

This directory is the **intermediate, human-readable dataset** extracted from Amala's source
documents. It is the migration source for the eventual MDX + Zod content in the Next.js app
(see the Build Specification). Format is YAML mirroring the spec's TypeScript interfaces.

Golden rule during extraction: **source values are preserved verbatim; problems are logged, not fixed.**

## What's in here

```
framework/
  areas.yaml              7 competency areas (id, title, gloss, description, competencyIds)
  competencies.yaml       47 competencies (id, code, areaId, creditLevel, title, goal)
  proficiency-scale.yaml  5 levels (none/theorist/practitioner/reflective/expert), GPA, descriptors
foundations/
  principles.yaml         9 principles, each with designLooksLike + workingWhen markers
  agency.yaml             agency-for-positive-change definition, 3 indicators, rationale
courses/
  <slug>.yaml             12 courses, each with objectives → competencyEvidence, principleMappings
```

Generated directly from source (zero transcription error): `framework/*` (from the Competency
Framework spreadsheet). Hand-transcribed from source: `foundations/*` (from Learning Foundations
VS14). Extracted per-guide: `courses/*`.

## Source documents used

- Competency Framework & Proficiency Scale spreadsheet (2025 cohorts) → framework/
- Amala Learning Foundations, Draft VS14 (PDF) → foundations/
- 12 Course Guides (2025 Onwards, .docx) → courses/

## Confirmed against source

- **7 areas, 47 competencies** exactly. Codes are `[F|A] + area + n`; F = Foundational, A = Advanced.
- **5-level proficiency scale**, GPA 0 / 2 / 3 / 3.5 / 4; credit begins at Practitioner. Progression
  axes: articulation → action → achievement → evidenced self-critique → breadth & sustained improvement.
- **9 principles** (Learning Foundations is authoritative). Agency definition + 3 indicators match spec §5.1.

## Open issues / decisions for Louie

1. **Principle 7 missing from every course guide.** The 2025 course guides map only **8** principles;
   they omit *"Learners connect their learning to the futures they are building"* (connect-to-futures).
   So each course lacks a principle-7 "in this course this might look like" mapping. Decision: author
   these, or accept 8-principle guides? (Logged per-course as `missing-principle`.)

2. **Systemic checklist copy-paste error.** Multiple course guides' design checklist reads
   *"Meets the time and contextualisation requirements for the **Social Entrepreneurship** course"*
   regardless of the actual course. Confirm intended text per course. (Logged per-course.)

3. **Mis-cited competency in Living Peacefully.** Objective 1 cites *"FTS3 – Science Communication"*.
   Authoritative: FTS3 = "Gather and organise data"; Science communication = ATS2. This is the exact
   error class the rebuild designs out — preserved verbatim + flagged.

4. **`observableBehaviours` are NOT in any source.** The spreadsheet holds only the generic scale +
   each competency's goal. Per-competency observable behaviours = genuine Phase-4 authoring, not migration.

5. **Learning Foundations is a draft.** Marked "Draft VS14" (references-page footer says VS13); model
   diagram is a "to be redrawn" placeholder. Treat as near-final but not frozen.

## Verification results (all 12 courses)

Automated pass over `courses/*.yaml` against `framework/competencies.yaml`:

- **12 courses, 40 objectives, 190 competency-evidence links.** All files parse as valid YAML.
- **Every cited competency code resolves against the 47.** No dangling codes.
- Every course maps **8 principles** (all missing connect-to-futures) — consistent with issue #1.
- Hours: 10 courses at 100h; PIP and Pathways at 50h.

Consolidated `sourceIssues` across the corpus:

| Type | Count | Meaning |
| --- | --- | --- |
| miscited-competency | 13 | but only **1 genuine** (see below); the rest are title-wording drift |
| strapline-missing | 12 | no strapline in any guide — author later |
| cross-course-copy-paste | 11 | "Social Entrepreneurship" checklist line (correct only in the SE guide) |
| missing-principle | 11 | connect-to-futures absent everywhere |
| programme-membership-to-confirm | 11 | `programmes: [gsd]` placeholder pending programme docs |
| other / typo / naming / wording | 5 | see per-file sourceIssues |

**Miscited competencies — the important distinction:**
- **Genuine wrong competency (1):** Living Peacefully cites `FTS3 – Science Communication`. FTS3 =
  "Gather and organise data"; Science communication = ATS2. This is the real error class.
- **Cosmetic title drift (12):** the code is correct; only the transcribed title differs — e.g.
  "Analyse"/"Analyze", "Engaging"/"Engage", "decision-making"/"decision making", a stray "(F)".
  On the site these vanish automatically because titles render from the framework, not the guide.

One garbled source clause preserved verbatim: Economics for Positive Change, objective 1, FPS3
condition reads "If learners have problems in local economic activity." (incomplete) — flag for review.

## Facilitation-materials source inventory (for the authoring phase — NOT yet processed)

Provided as authoring inspiration; held for the facilitation-materials workstream:

- **Social Entrepreneurship**: old + new course planners, workbook (aligned to new objectives),
  concept PDFs (iceberg, Meadows' leverage points, wicked problems self-assessment), external
  reference reports (OECD, British Council Kenya, scoping report, start-your-social-enterprise guide).
- **Artistic & Cultural Expression** (`~/Downloads/Artistic & Cultural Expression/`): course planner +
  online unit planner; Resources/ with ~20 artefact templates, ~25 evidencing-opportunity templates,
  case-study cards/worksheets, and per-week (1–10) activity decks/docs (BaFa BaFa, cultural iceberg, etc.).
- **Economics for Positive Change** (`~/Downloads/Economics for positive change/`): course planner;
  Resources/ with artefact + evidencing templates, per-week (1–9) decks/docs, and importantly a
  **`_TEMPLATE_ Glossary of Terms.xlsx`** — a first source for the glossary layer.

Shape observed: each course runs on a weekly planner + reusable **artefact templates** (learner-facing
task scaffolds) paired with **evidencing templates** (assessment capture). This maps onto the spec's
Activity + Asset model, and the artefact/evidence pairing is a strong real-world signal for how the
educator/learner dual-face and the assessment layer should work.

### Peacebuilding — PROCESSED (2026-08)

Source: the 2025 Changemaker Course Planner (65pp) plus `~/Downloads/Resources/` (161 files: per-week
activity docs, simulations, case studies, protocols, a term list, 21 evidencing-opportunity templates,
and a student workbook). Extracted into 55 materials, 23 glossary terms and 6 educator moves; the
planner's weeks 7-10 (design thinking, networking, project) were wired to existing `dc-*` and project
materials rather than duplicated. Not yet processed from that folder: the SEE Learning compassion,
happiness and mindfulness set; several long simulations (Palmyra, Plane Hijacking, Doughnut
Negotiation, Barnga); the check-in and icebreaker banks; the evidencing-opportunity templates (these
belong to the assessment layer, not the materials layer); and the student workbook.

**Rights pass (August 2026).** Every peacebuilding material now carries a `rights` status
(docs/MATERIALS_STANDARD.md §12). Nine are `linked-not-reproduced`: we describe the method, argue
where it fits the course, and link to the source rather than copying it. That covers Barnga, the two
Noam Ebner simulations (Pasta Wars, Ore Wars), the University of Michigan identity wheels and name
story, Kopin's stereotype activity, Mote Oo's spheres, the Web of Connectedness protocol, and the
Arun Gandhi account.

Provenance traced during that pass:
- **Jah and Kay** descends from "Aid to Minorians" / "Minoria-Majoria" (Intercultural Sourcebook,
  Hoopes and Ventura eds.; Kohls and Knight, Developing Intercultural Awareness) — Intercultural Press.
- **Choose your Engineer** is Kopin's "The apprentice" (Malta), free slide deck and educator notes.
- **Tower of Arzenia** adapts page 53 of the University of Houston "Diversity Activities Resource
  Guide", withdrawn when UH closed its Center for Diversity and Inclusion in 2023; page unverified.
- **Finish the Story** links only to an internal Amala doc; no external origin found.
- **Paper Factory** remains unidentified. Transboundary-water negotiation genre; a published ancestor
  is likely.

### YPAR Hub team-building and oppression plans — PROCESSED (2026-08)

Source: ten "Get Started" lesson plans from UC Berkeley's [YPAR Hub](https://yparhub.berkeley.edu/getting-started)
(eight from Team Building, two from Understanding Oppression), supplied August 2026. Extracted into
19 `ypar-*` materials plus one educator move (`cf-physical-and-contact-activities`) and two glossary
terms (`stereotype-threat`, `consensus`). The plans bundle several activities each, so the split is by
activity rather than by document: banks stayed banks where a facilitator picks one (icebreakers,
energisers, getting to know each other, quick communication games, trust-building games) and
individual activities were separated out where they earn a page (four corners, the web of concerns,
follow the leader, trust walk, team trail, tallest tower, community superhero, island paradise).

**Rights.** All are `own-expression`. The YPAR Hub plans carry a footer permitting non-profit
reprinting by schools, colleges and universities with credit; we do not rely on it, because publishing
on an open website is a wider act than reprinting a sheet for a class, and because the upstream works
(Stanford's YELL curriculum, Youth in Focus' Youth REP, the Center for Education in Law and Democracy)
are not the YPAR Hub's to sub-licence. Every word is written from scratch and the originators are
credited and linked. The two YELL "Forms of Decision Making" handouts, which carry a 2007 John W.
Gardner Center copyright line, are deliberately not reproduced: `ypar-forms-of-decision-making` argues
the trade-offs in Amala's own words and `ypar-decision-making-in-practice` is an original,
clearly-labelled illustrative case study written to do the same job.

**Editorial decisions worth knowing.**
- **Government, Rights and Power** is a United States civics lesson built on the Constitution and Bill
  of Rights, which does not travel and is actively misleading for a learner without citizenship. Its
  structure is kept in `ypar-rights-and-power`; its content is replaced with a rights instrument the
  facilitator chooses (usually the UDHR), and its rights-removal exercise carries the materials
  standard's simulation test (§12.4) with an invented-setting route and an analysis-only route,
  because for many Amala cohorts that exercise re-enacts their own history.
- **Physical and contact activities.** Several plans involve holding hands, taking another person's
  weight or being blindfolded, with no adaptation offered. `cf-physical-and-contact-activities` carries
  the judgement that has to sit alongside them, and `ypar-trust-walk` substitutes closed eyes for a
  blindfold on purpose.
- **Stereotype threat** is given its own page because the source states the effect more confidently
  than the current evidence supports (its example is the girls-and-mathematics literature, the part
  most affected by the publication-bias reassessment).
- **Not carried across:** Widget Assembly (needs a large LEGO collection, craft-paper rolls and
  partitions; `ypar-trust-walk` teaches the same lesson at no cost).
- **Source issue, logged not fixed:** the "Understanding Roles in Teams" plan's stated objectives are
  copy-pasted from "Decision Making Processes" and describe forms of decision making rather than team
  roles.

Not yet processed from the same YPAR Hub section: Introductions, Youth & Adult Power Sharing,
Building Community Support, and YPAR Basics.

## Still needed to complete the content set

- **GSD programme structure — DONE.** `programmes/gsd.yaml` now holds the 5 streams × 2 courses,
  PIP + Pathways as ongoing components, graduation criteria, accreditation (NEASC + CIS), target
  learners, and per-course end-of-course tasks. The `programme-membership-to-confirm` flag on each
  course is now resolved: all 12 GSD course guides belong to the GSD. Stream membership is owned by
  gsd.yaml (courses do not hardcode it). **The curriculum skeleton is now complete.** (There are now
  14 courses in total — the 12 GSD guides plus the two authored Learning Bridge courses below.)
- **Learning Bridge — DONE.** `programmes/learning-bridge.yaml` holds the preparatory programme
  (ages 14–16) from the "Learning Bridge Programme Overview for Delivery Partners" document. Unlike
  the GSD, it is **component-based, not course-based**: its components (Research Project, Agency in
  Learning, Mentoring and Wellbeing, and optional English Language Development) are not GSD
  Changemaker Courses, so `streams`/`ongoingComponents` stay empty and the component-based programme
  fields (`components`, `versions`, `versionComparison`, `delivery`, `support`, `grading`) carry the
  structure. Two versions: Learning Bridge and Learning Bridge+ (adds formal assessment, Amala
  moderation, and certification). Open item: the two assessed competencies (Investigate Real World
  Issues, Set and Pursue Goals) are named in the source but not yet cross-linked to framework codes.
- **Research Project course — DONE (authored).** `courses/research-project.yaml` is the first
  **authored** course (all others are verbatim source extractions). It is designed backward from the
  anchor competency **FSI1 "Investigate real-world issues"**, with an explicit `throughline` (agency
  for positive change → FSI1 → the objectives) rendered on the course page. It is the Learning Bridge
  Research Project component (linked via `component.courseSlug`) and covers all **9** principles
  (including connect-to-futures, which the legacy GSD guides omit). The supplied draft was largely a
  Social Entrepreneurship copy; see the file's `sourceIssues`.
- **Agency in Learning course — DONE (authored).** `courses/agency-in-learning.yaml`, the second
  authored Learning Bridge course, anchored on **FSL2 "Set and pursue goals"** — the other LB+
  certificated competency (Research Project is the vehicle for FSI1). Same pattern: `throughline`
  (agency → FSL2 → objectives), a 4-objective self-directed-learning arc (understand yourself → set
  goals → plan & act → track/reflect), all 9 principles, linked from the LB component. No dedicated
  source guide existed; authored from the Learning Bridge Programme Overview's component description.
- **Facilitation materials** — the large authoring lift. Course guides name ~40-60 concepts/tools/
  activities (captured per objective under `furtherDetails.concepts` / `.activities`) but contain none
  of their content. The Social Entrepreneurship planners + workbook + concept PDFs (iceberg, leverage
  points, wicked problems) are provided as authoring inspiration.
- **Glossary terms** — not yet sourced.
- **Assessment examples** — Phase 4; illustrative-first.
