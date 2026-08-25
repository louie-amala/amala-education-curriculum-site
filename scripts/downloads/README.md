# Learning Bridge+ (Cox's Bazar) - offline pack generators

These scripts regenerate the downloadable offline pack for Learning Bridge+ (Cox's Bazar). The pack
is served from `public/downloads/` and wired as `downloads` on the programme, its units, and some
materials.

## Two one-stop documents: the Educator Guide, and the Student Workbook

`generate-lb-guides.js` builds `lb-coxs-bazar-educator-guide.docx` - **everything an educator needs
in one document**: the orientation and assessment guidance, the full mentoring component, then the
full facilitator unit plan for all three taught components, the three learner books, the printable
cards, and the records.

It does **not** re-author any of that. It `require()`s the **four** component generators and composes
their exported *children builders* (`facilitatorPlanChildren`, `workbookChildren`, `cardsChildren`,
`rubricChildren`, and mentoring's `guideChildren` / `recordChildren`), so the guide and the standalone downloads are the same content by construction and
cannot drift. Each component generator is also runnable on its own (`if (require.main === module)`).

`generate-lb-guides.js` also builds `lb-coxs-bazar-student-workbook.docx` - the same idea for the
learner. **One book per learner for the whole twelve weeks**, so a site runs one print job instead of
three. Parts 1–3 are the three component learner books, composed from the same `workbookChildren()`
builders as the standalone downloads but called with `{ embedded: true }` (which drops each
component's own cover, so the book has a single front). Part 4 is programme-level: the learner's
mentoring page and the growth self-check, rendered from `cb-my-mentoring-conversations` and
`cb-my-growth-across-the-programme`.

The group cards are deliberately **not** in the Student Workbook. They are one set per group, printed
and cut up - putting them in a per-learner book would multiply card printing by the cohort size and
mean learners cutting pages out of their own book. They stay in the Educator Guide (Part 8) and in the
component packs.

**Re-run `generate-lb-guides.js` last**, after any of the four component generators, and after editing any Cox's
Bazar unit or `cb-*` material.

## The agency thread

Agency for positive change is Amala's required outcome, and it used to appear in **none** of the three
distributed documents - a facilitator holding the complete manual was never told what the programme was
ultimately for. `generate-lb-guides.js` now renders `agencyThread` from
`programmes/learning-bridge-coxs-bazar.yaml` into the Educator Guide (§1.0, ahead of the three roles)
and the Coordinator Guide (inside §1). It is rendered from the authored YAML, never re-typed, so the
guides and the programme page cannot drift. `validateGraph()` checks that every component the thread
names exists and that every competency code resolves.

## What is programme-level, and where it lives

These belong to no single taught component and are read directly by `generate-lb-guides.js`:

| Material | Where it lands |
|---|---|
| `cb-my-showcase` | Educator Guide §1.6, and referenced from all three taught components' closing blocks |
| `cb-mn-*` (8 materials) | The mentoring pack, via `generate-mentoring.js` → Educator Guide Part 2 and Part 9C |
| `cb-my-mentoring-conversations`, `cb-my-growth-across-the-programme` | Student Workbook Part 4 |

## Facilitator-facing vs internal notes

A unit block's `flexNote` is **rendered into the printed plans**; `authoringNote` never is. The split
exists because authoring to-dos ("the pack is still to be authored") were reaching facilitators in the
Educator Guide, printed alongside the finished thing they described. Put anything meant for whoever is
authoring the curriculum in `authoringNote`.

Shared docx house style lives in `lib/docx-style.js`. Brand assets (`public/brand/amala-logo.png`,
`public/brand/icons/*.png`) are committed so every document is reproducible from source.

Every **facilitator plan is rendered from the YAML** (the `coxs-bazar-*` units, their courses, and the
`cb-*` materials), so each stays a faithful copy of the authored unit. **Re-run these after editing a
unit or its materials** so the printed plans match the site.

## Files produced (in `public/downloads/`)

| Script | Output | Contents |
|---|---|---|
| `generate-lb-guides.js` | `lb-coxs-bazar-educator-guide.docx` | The complete educator manual (see above). Composed from the other generators - run it last. |
| `generate-lb-guides.js` | `lb-coxs-bazar-student-workbook.docx` | The complete learner book (see above). One per learner for all twelve weeks. Composed from the other generators - run it last. |
| `generate-mentoring.js` | `lb-coxs-bazar-mentoring-guide.docx` | The Mentoring and Wellbeing component in full: setting up, safeguarding and referral, the ten-minute conversation shape, the mentor's record, the arc across twelve weeks, and the four situational conversations (return after absence, surfacing growth, the optional significant adult meeting, and what-next). Composes into Educator Guide Part 2. |
| `generate-mentoring.js` | `lb-coxs-bazar-mentor-record.docx` | One page per learner for twelve weeks - the step agreed each conversation, what was noticed, and the flags. Composes into Educator Guide Part 9C. |
| `generate-lb-guides.js` | `lb-coxs-bazar-coordinator-guide.docx` | For the NRC coordinator: what the programme is, who does what, setting up a cohort, the 12-week rhythm, and coordinating assessment and moderation |
| `generate-ail.js` | `agency-in-learning-facilitator-unit-plan.docx` | The full 50-hour Agency in Learning plan, rendered from `coxs-bazar-agency-in-learning.yaml` + the `cb-ail-*` materials. Carries "Before you start", "Safeguarding and protection" and "Assessing the goal work (FSL2)" around the phases, matching the Research Project's structure. |
| `generate-ail.js` | `agency-in-learning-student-workbook.docx` | "My Learning Book" - the visual-first learner pages |
| `generate-ail.js` | `agency-in-learning-assessment-record.docx` | Facilitator record for judging FSL2 at the week-6 and week-12 points, against `framework/proficiency-scale.yaml` |
| `generate-docx.js` | `my-voice-facilitator-unit-plan.docx` | Full 50-hour plan, all session guidance inline, + phonics progression/table appendix |
| `generate-docx.js` | `my-voice-student-workbook.docx` | Visual-first learner "My Voice book" |
| `generate-docx.js` | `my-voice-letter-and-picture-cards.docx` | Printable alphabet, key-sound, and blank picture-word cards |
| `generate-slides.py` | `my-voice-slides.pptx` | Optional one-idea-per-slide deck |
| `generate-iceberg.js` | `iceberg-model-worksheet.docx`, `iceberg-model-template.docx` | The Iceberg model artefact pair - reference example for the worksheet/template split (see `content-source/materials/iceberg-model.yaml`, `downloads[].role`) |
| `generate-pn-worksheets.js` | `pn-peer-review-sheet.docx`, `pn-provocation-response.docx` | Powerful Narratives printable worksheets - a story peer-review form and the generic provocation-response task + rubric (wired to `pn-peer-review-sheet.yaml` and `pn-provocation-response.yaml`) |
| `generate-pip.js` | 8 files (`pip-*-worksheet.docx`, `pip-*-template.docx`, `pip-examples-of-student-journeys.docx`, `pip-assessment-rubric.docx`) | The Personal Interest Project artefacts: the strengths reflection, challenges brainstorm and planning-template worksheet/template pairs, the student-journeys reading, and the facilitator assessment rubric (see the `pip-*` materials, `downloads[].role`). No learner data from the source pack is reproduced. |
| `generate-rp.js` | `research-project-facilitator-unit-plan.docx`, `research-project-student-workbook.docx`, `research-project-assessment-rubric.docx`, `research-project-picture-cards.docx` | The Research Project (Cox's Bazar) offline pack. Rendered from `coxs-bazar-research-project.yaml` + the `cb-rp-*` materials, and wired as `downloads` on that unit. Facilitator guide = full plan + source pack (Appendix A) + full original articles for reference (Appendix B). Student workbook = graded B1/A1–A2 source cards + word bank + blank evidence log. Per the 2026-08-04 decision, the **full originals go in the facilitator guide only**; The Conversation article (CC BY-ND) is referenced for verbatim insertion at print, Grow Billion Trees is not reproduced. Re-run after editing the unit or `cb-rp-*` materials. |

## Run

```bash
node scripts/downloads/generate-ail.js && node scripts/downloads/generate-docx.js && node scripts/downloads/generate-rp.js && node scripts/downloads/generate-mentoring.js && node scripts/downloads/generate-lb-guides.js
```

Set `OUT_DIR` to write elsewhere without touching the committed files, e.g. to preview a change:

```bash
OUT_DIR=/tmp/pack node scripts/downloads/generate-docx.js
```

## Notes

- **Slides were dropped from the pack.** They were the one artefact that could drift -
  `generate-slides.py` hand-authored the My Voice deck rather than rendering the unit YAML, and
  `agency-in-learning-slides.pptx` had no generator at all - and both predated the current plans. The
  pack now assumes no screen anywhere. `generate-slides.py` is kept if slides are ever asked for; the
  two `.pptx` files were removed from `public/downloads` (recover with
  `git show <commit>:public/downloads/<file>`), because a download nothing references drops out of the
  access gate and would become publicly fetchable.
- Cards are a `.docx` (editable) rather than a PDF - there is no PDF library assumed in the toolchain.
  Swap in `reportlab`/`fpdf2` if a print-ready PDF is preferred.
- The generators embed creation timestamps, so re-running produces byte-different files even with no
  content change; only re-commit the binaries when the content actually changed.
- After regenerating, run `npm run build` - it validates that every `downloads.file` referenced by the
  unit exists.
