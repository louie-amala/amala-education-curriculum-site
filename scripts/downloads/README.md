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
