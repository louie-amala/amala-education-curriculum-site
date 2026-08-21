# Learning Bridge+ (Cox's Bazar) — programme-wide Student Workbook

**Goal.** One document a learner needs for the whole 12 weeks, so a site prints one book per
learner instead of chasing three files. The learner-side mirror of the one-stop Educator Guide.

**Output.** `public/downloads/lb-coxs-bazar-student-workbook.docx` — *"My Learning Book"*.
**Built 2026-08-20**: 62 explicit page breaks (~70–80 pages once the Research Project source pack
reflows), 97 KB. Wired as the third programme-level download, beside the Coordinator and Educator
guides.

## Principle: compose, never re-author

Exactly the rule the Educator Guide already follows. `generate-lb-guides.js` `require()`s the three
component generators and calls their exported children builders, so the one-stop document and the
standalone downloads are the same content *by construction*. The Student Workbook does the same with
`workbookChildren()`. If a `cb-*` material changes, both books change together or neither does.

## Structure

| | Part | Source |
|---|---|---|
| Front | Cover — name / place / group / my mentor | new |
| Front | How to use this book (oral- and visual-first) | new |
| Front | Visual contents — one icon per part | new |
| Front | My 12 weeks — week map showing which pages, when | new, from the shared example-week table |
| 1 | My Learning Book — Agency in Learning | `AIL.workbookChildren({ embedded: true })` |
| 2 | My Voice book — English Language Development | `MV.workbookChildren({ embedded: true })` |
| 3 | Our Research Book — Research Project | `RP.workbookChildren({ embedded: true })` |
| 4 | My progress — mentoring pages + week-6/week-12 growth | new |

### Decisions taken (2026-08-20)

- **Ordered by component, not by week.** The three components run in parallel (3h each per week), so
  a week-ordered book would match delivery — but it would shred the three authored sequences, could
  not be composed from the existing builders, and would break the no-drift guarantee. Component
  order plus a front-of-book week map instead.
- **Cards excluded.** The My Voice letter cards and Research Project picture-word cards are *one set
  per group*, printed and cut out. Putting them in a per-learner book multiplies card printing by
  cohort size and means learners cut up their own book. They stay in the Educator Guide (Parts 8A/8B)
  and as standalone files; the workbook's contents page says where they are.
- **The gaps get authored now**, not deferred — a Part 4 stub would ship a book with a hole in it.

## Work

### 1. Add `opts.embedded` to the three `workbookChildren()`

Mirrors what `facilitatorPlanChildren({ embedded: true })` already does at
`generate-docx.js:93` and `generate-rp.js:148`: drop the per-component cover block and the closing
"offline pack" note, so the composed book has one cover, not four. Standalone calls pass no opts,
so `agency-in-learning-student-workbook.docx`, `my-voice-student-workbook.docx` and
`research-project-student-workbook.docx` are unchanged.

### 2. Author the missing learner-facing content

New `cb-*` materials, so the site and the printed book share one source:

- **`cb-mentoring-my-conversations`** — a learner page for the mentoring conversation: what we talked
  about, my next step, when we meet again. The programme calls 1:1 mentoring "the spine of wellbeing
  support" and the place learning goals are kept alive between sessions, but there is currently no
  learner-facing artefact for it at all. Must carry the same no-one-has-to-share framing as the
  educator guidance.
- **`cb-how-i-have-grown`** — a growth self-assessment across *both* graded competencies (Set and
  Pursue Goals, Investigate Real World Issues), filled at week 6 and again at week 12, matching the
  two assessment windows the programme protects. Distinct from the existing AIL "Getting better at
  goals" (one competency) and `cb-rp-how-i-have-grown` (the other); this is the page that spans them.
- Cover, how-to-use, visual contents and week map — programme-level, authored in the generator.

### 3. Build it in `generate-lb-guides.js`

Not a fourth script. That file already requires all three generators, already owns `titleBlock` and
`PACK_ROWS`, and is already the documented run-last step — one file keeps the run order unbreakable.
Update its header comment from "the two programme guides" to three documents.

### 4. Wire and document

- Third entry in `downloads:` on `content-source/programmes/learning-bridge-coxs-bazar.yaml`.
- New row in `PACK_ROWS` (`generate-lb-guides.js:119`) so the Educator Guide's "What to print, and
  for whom" table names the workbook and its print quantity (one per learner).
- README table + run command in `scripts/downloads/README.md`.
- Access gate needs no work: `generate-protected-paths.js` derives protected downloads from the
  content that references them, and the programme is `access: partner`.
- `npm run build` validates that every referenced `downloads.file` exists.

## Out of scope, but noted

`public/downloads/agency-in-learning-picture-cards.pdf` is a committed binary with **no generator** —
the only file in the pack that cannot be rebuilt from source, and the last remaining drift risk.


## Built — what changed

| File | Change |
|---|---|
| `scripts/downloads/generate-ail.js` | `workbookChildren(opts)` — `opts.embedded` drops the cover page |
| `scripts/downloads/generate-docx.js` | `workbookChildren(opts)` — `opts.embedded` drops the cover branding (keeps the "draw yourself" activity) and retitles the part contents |
| `scripts/downloads/generate-rp.js` | `workbookChildren(opts)` — `opts.embedded` drops the cover block and closing colophon |
| `scripts/downloads/generate-lb-guides.js` | `studentWorkbook()`, the learner furniture (`twiceMarkedLadder`, `mentoringRows`, `weekStrip`), the YAML section readers, and the new `PACK_ROWS` row |
| `content-source/materials/cb-my-mentoring-conversations.yaml` | new |
| `content-source/materials/cb-my-growth-across-the-programme.yaml` | new |
| `content-source/programmes/learning-bridge-coxs-bazar.yaml` | third `downloads` entry |
| `scripts/downloads/README.md` | retitled section + new table row |

**Verified.** The three standalone student workbooks, the Coordinator Guide and the Educator Guide
were regenerated and their `word/document.xml` compared byte-for-byte against the committed files
before the `PACK_ROWS` edit: all unchanged, so `opts.embedded` is a pure addition. `npm run build`
passes with no warnings; the gate picks up all three new paths (`protected paths: 88 pages,
29 downloads`).

**One thing found on the way.** `components/Prose.tsx` has no `**bold**` support, so markdown emphasis
in a material's `learnerContent` / `educatorContent` renders as literal asterisks on the site (the
docx generators strip it via `plain()`, so print is unaffected). The two new materials were written
without emphasis markers. `content-source/materials/cb-rp-findings-to-insights.yaml` has the same
issue in its `learnerContent` and was left alone — it predates this work.
