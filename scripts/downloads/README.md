# My Voice (Cox's Bazar) — offline pack generators

These scripts regenerate the downloadable offline pack for the **English Language Development**
component of Learning Bridge+ (Cox's Bazar). The pack is served from `public/downloads/` and wired
as `downloads` on `content-source/units/coxs-bazar-my-voice.yaml`.

The **facilitator plan is rendered from the YAML** (`coxs-bazar-my-voice.yaml`, `efi-my-voice.yaml`,
and the `cb-mv-*` materials), so it stays a faithful copy of the authored unit. **Re-run these after
editing the unit or its materials** so the printed plan matches the site.

## Files produced (in `public/downloads/`)

| Script | Output | Contents |
|---|---|---|
| `generate-docx.js` | `my-voice-facilitator-unit-plan.docx` | Full 50-hour plan, all session guidance inline, + phonics progression/table appendix |
| `generate-docx.js` | `my-voice-student-workbook.docx` | Visual-first learner "My Voice book" |
| `generate-docx.js` | `my-voice-letter-and-picture-cards.docx` | Printable alphabet, key-sound, and blank picture-word cards |
| `generate-slides.py` | `my-voice-slides.pptx` | Optional one-idea-per-slide deck |
| `generate-iceberg.js` | `iceberg-model-worksheet.docx`, `iceberg-model-template.docx` | The Iceberg model artefact pair — reference example for the worksheet/template split (see `content-source/materials/iceberg-model.yaml`, `downloads[].role`) |
| `generate-pn-worksheets.js` | `pn-peer-review-sheet.docx`, `pn-provocation-response.docx` | Powerful Narratives printable worksheets — a story peer-review form and the generic provocation-response task + rubric (wired to `pn-peer-review-sheet.yaml` and `pn-provocation-response.yaml`) |
| `generate-pip.js` | 8 files (`pip-*-worksheet.docx`, `pip-*-template.docx`, `pip-examples-of-student-journeys.docx`, `pip-assessment-rubric.docx`) | The Personal Interest Project artefacts: the strengths reflection, challenges brainstorm and planning-template worksheet/template pairs, the student-journeys reading, and the facilitator assessment rubric (see the `pip-*` materials, `downloads[].role`). No learner data from the source pack is reproduced. |
| `generate-rp.js` | `research-project-facilitator-unit-plan.docx`, `research-project-student-workbook.docx` | The Research Project (Cox's Bazar) offline pack. Rendered from `coxs-bazar-research-project.yaml` + the `cb-rp-*` materials, and wired as `downloads` on that unit. Facilitator guide = full plan + source pack (Appendix A) + full original articles for reference (Appendix B). Student workbook = graded B1/A1–A2 source cards + word bank + blank evidence log. Per the 2026-08-04 decision, the **full originals go in the facilitator guide only**; The Conversation article (CC BY-ND) is referenced for verbatim insertion at print, Grow Billion Trees is not reproduced. Re-run after editing the unit or `cb-rp-*` materials. |

## Run

```bash
# 1. The three Word docs (uses the repo's node_modules: `docx` + `yaml`)
node scripts/downloads/generate-docx.js

# 2. The slides (needs python-pptx: pip install python-pptx)
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
