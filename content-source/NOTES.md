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

## Still needed to complete the content set

- **GSD programme structure — DONE.** `programmes/gsd.yaml` now holds the 5 streams × 2 courses,
  PIP + Pathways as ongoing components, graduation criteria, accreditation (NEASC + CIS), target
  learners, and per-course end-of-course tasks. The `programme-membership-to-confirm` flag on each
  course is now resolved: all 12 courses belong to the GSD. Stream membership is owned by gsd.yaml
  (courses do not hardcode it). **The curriculum skeleton is now complete.**
- **Learning Bridge** — the other programme (low-bandwidth audience) is still not sourced.
- **Facilitation materials** — the large authoring lift. Course guides name ~40-60 concepts/tools/
  activities (captured per objective under `furtherDetails.concepts` / `.activities`) but contain none
  of their content. The Social Entrepreneurship planners + workbook + concept PDFs (iceberg, leverage
  points, wicked problems) are provided as authoring inspiration.
- **Glossary terms** — not yet sourced.
- **Assessment examples** — Phase 4; illustrative-first.
