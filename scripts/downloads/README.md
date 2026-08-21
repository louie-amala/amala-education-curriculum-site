# Learning Bridge+ (Cox's Bazar) — offline pack generators

These scripts regenerate the downloadable offline pack for Learning Bridge+ (Cox's Bazar). The pack
is served from `public/downloads/` and wired as `downloads` on the programme, its units, and some
materials.

## Two one-stop documents: the Educator Guide, and the Student Workbook

`generate-lb-guides.js` builds `lb-coxs-bazar-educator-guide.docx` — **everything an educator needs
in one document**: the orientation, mentoring and assessment guidance, then the full facilitator unit
plan for all three taught components, the three learner books, the printable cards, and the two
assessment records.

It does **not** re-author any of that. It `require()`s the component generators and composes their
exported *children builders* (`facilitatorPlanChildren`, `workbookChildren`, `cardsChildren`,
`rubricChildren`), so the guide and the standalone downloads are the same content by construction and
cannot drift. Each component generator is also runnable on its own (`if (require.main === module)`).

`generate-lb-guides.js` also builds `lb-coxs-bazar-student-workbook.docx` — the same idea for the
learner. **One book per learner for the whole twelve weeks**, so a site runs one print job instead of
three. Parts 1–3 are the three component learner books, composed from the same `workbookChildren()`
builders as the standalone downloads but called with `{ embedded: true }` (which drops each
component's own cover, so the book has a single front). Part 4 is programme-level: the learner's
mentoring page and the growth self-check, rendered from `cb-my-mentoring-conversations` and
`cb-my-growth-across-the-programme`.

The group cards are deliberately **not** in the Student Workbook. They are one set per group, printed
and cut up — putting them in a per-learner book would multiply card printing by the cohort size and
mean learners cutting pages out of their own book. They stay in the Educator Guide (Part 8) and in the
component packs.

**Re-run `generate-lb-guides.js` last**, after any component generator, and after editing any Cox's
Bazar unit or `cb-*` material.

Shared docx house style lives in `lib/docx-style.js`. Brand assets (`public/brand/amala-logo.png`,
`public/brand/icons/*.png`) are committed so every document is reproducible from source.

Every **facilitator plan is rendered from the YAML** (the `coxs-bazar-*` units, their courses, and the
`cb-*` materials), so each stays a faithful copy of the authored unit. **Re-run these after editing a
unit or its materials** so the printed plans match the site.

## Files produced (in `public/downloads/`)

| Script | Output | Contents |
|---|---|---|
| `generate-lb-guides.js` | `lb-coxs-bazar-educator-guide.docx` | The complete educator manual (see above). Composed from the other generators — run it last. |
| `generate-lb-guides.js` | `lb-coxs-bazar-student-workbook.docx` | The complete learner book (see above). One per learner for all twelve weeks. Composed from the other generators — run it last. |
| `generate-lb-guides.js` | `lb-coxs-bazar-coordinator-guide.docx` | For the NRC coordinator: what the programme is, who does what, setting up a cohort, the 12-week rhythm, and coordinating assessment and moderation |
| `generate-ail.js` | `agency-in-learning-facilitator-unit-plan.docx` | The full 50-hour Agency in Learning plan, rendered from `coxs-bazar-agency-in-learning.yaml` + the `cb-ail-*` materials |
| `generate-ail.js` | `agency-in-learning-student-workbook.docx` | "My Learning Book" — the visual-first learner pages |
| `generate-ail.js` | `agency-in-learning-assessment-record.docx` | Facilitator record for judging FSL2 at the week-6 and week-12 points, against `framework/proficiency-scale.yaml` |
| `generate-docx.js` | `my-voice-facilitator-unit-plan.docx` | Full 50-hour plan, all session guidance inline, + phonics progression/table appendix |
| `generate-docx.js` | `my-voice-student-workbook.docx` | Visual-first learner "My Voice book" |
| `generate-docx.js` | `my-voice-letter-and-picture-cards.docx` | Printable alphabet, key-sound, and blank picture-word cards |
| `generate-slides.py` | `my-voice-slides.pptx` | Optional one-idea-per-slide deck |
| `generate-iceberg.js` | `iceberg-model-worksheet.docx`, `iceberg-model-template.docx` | The Iceberg model artefact pair — reference example for the worksheet/template split (see `content-source/materials/iceberg-model.yaml`, `downloads[].role`) |
| `generate-pn-worksheets.js` | `pn-peer-review-sheet.docx`, `pn-provocation-response.docx` | Powerful Narratives printable worksheets — a story peer-review form and the generic provocation-response task + rubric (wired to `pn-peer-review-sheet.yaml` and `pn-provocation-response.yaml`) |
| `generate-pip.js` | 8 files (`pip-*-worksheet.docx`, `pip-*-template.docx`, `pip-examples-of-student-journeys.docx`, `pip-assessment-rubric.docx`) | The Personal Interest Project artefacts: the strengths reflection, challenges brainstorm and planning-template worksheet/template pairs, the student-journeys reading, and the facilitator assessment rubric (see the `pip-*` materials, `downloads[].role`). No learner data from the source pack is reproduced. |
| `generate-rp.js` | `research-project-facilitator-unit-plan.docx`, `research-project-student-workbook.docx`, `research-project-assessment-rubric.docx`, `research-project-picture-cards.docx` | The Research Project (Cox's Bazar) offline pack. Rendered from `coxs-bazar-research-project.yaml` + the `cb-rp-*` materials, and wired as `downloads` on that unit. Facilitator guide = full plan + source pack (Appendix A) + full original articles for reference (Appendix B). Student workbook = graded B1/A1–A2 source cards + word bank + blank evidence log. Per the 2026-08-04 decision, the **full originals go in the facilitator guide only**; The Conversation article (CC BY-ND) is referenced for verbatim insertion at print, Grow Billion Trees is not reproduced. Re-run after editing the unit or `cb-rp-*` materials. |

## Run

```bash
node scripts/downloads/generate-ail.js && node scripts/downloads/generate-docx.js && node scripts/downloads/generate-rp.js && node scripts/downloads/generate-lb-guides.js
```

The slides are separate and need python-pptx (`pip install python-pptx`):

```bash
python3 scripts/downloads/generate-slides.py
```

Set `OUT_DIR` to write elsewhere without touching the committed files, e.g. to preview a change:

```bash
OUT_DIR=/tmp/pack node scripts/downloads/generate-docx.js
```

## Notes

- Cards are a `.docx` (editable) rather than a PDF — there is no PDF library assumed in the toolchain.
  Swap in `reportlab`/`fpdf2` if a print-ready PDF is preferred.
- The generators embed creation timestamps, so re-running produces byte-different files even with no
  content change; only re-commit the binaries when the content actually changed.
- After regenerating, run `npm run build` — it validates that every `downloads.file` referenced by the
  unit exists.
