# Session overview & handoff — 2026-08-01

For a fresh assistant (ChatGPT or otherwise) to pick up the in-flight work. Everything
described here is **uncommitted on `main`** at the time of writing. `npm run build` is
**green** — the build runs `validateGraph()`, so a green build proves the whole content
graph is internally consistent.

> Also read `LEARNING-BRIDGE-HANDOFF.md` (dated 2026-07-29) for the prior programme-shape
> work — it is still accurate, this doc is the newer layer on top.

---

## Repo basics

- **`Amala Curriculum Site V2`** — Next.js 16 App Router, TypeScript, Tailwind, Zod-validated
  YAML content. Deployed on Vercel at https://amala-education-curriculum-site.vercel.app.
- **Content lives in `content-source/`** as YAML: `courses/`, `materials/`, `glossary/`,
  `programmes/`, `units/`, `foundations/`. Schemas in `lib/schema.ts`; loaders + the
  build-time validator in `lib/content.ts`.
- **Build / validate:** `npm run build`. It gates on `validateGraph()` — any dangling
  cross-reference (a course keyConcept with no glossary term, a material objective that
  doesn't exist, a missing diagram file, etc.) **fails the build**. Treat a green build as
  the definition of "done and consistent."
- **Dev preview gotcha:** content is read from disk once at module-eval time; the dev server
  does **not** watch `content-source/`. A YAML change only shows after a code file changes
  (or a restart). Also port 3000 is often taken — use a temporary `autoPort`
  `.claude/launch.json` and remove it before committing. (See note added to `lib/content.ts`.)
- **Publish flow:** branch → commit → `git checkout main` → `git merge --ff-only` →
  `git push origin main`; Vercel auto-deploys (~1 min). Revert `next-env.d.ts` and drop
  `tsconfig.tsbuildinfo` before committing (build touches them).
- **Commit trailer:** `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **YAML colon trap:** any scalar containing `": "` (colon-space) must be double-quoted, or
  YAML parses it as a mapping. This bites repeatedly in machine-authored files.

---

## What this session did (all uncommitted)

Four related threads, plus the infrastructure that supports them.

### 1. Material-page reading order — the big structural change

**Reordered the shared material-page template so a page reads top-to-bottom in the order an
educator works, not the order the curriculum is modelled.** Curriculum-mapping (agency,
principles, competencies) was previously near the top; it is now **demoted to the bottom** as
a "How this fits the curriculum" section, because it is justification for designers/moderators,
not instructions for whoever is about to teach.

- Codified in `docs/MATERIALS_STANDARD.md` **§11 "Reading order on the page"** (new), with
  the canonical 7-section order: (1) Does it fit → (2) Understand it → (3) Prepare →
  (4) Run it → (5) For your students → (6) How it fits the curriculum → (7) Connections.
- Implemented in **`app/materials/[slug]/page.tsx`**: `educatorContent` ("For educators")
  lifted to lead; the agency/principles/competency block moved into a bottom
  "How this fits the curriculum" section. Enforced structurally in the one shared template, so
  it applies to every material at once.

### 2. Download roles — the worksheet / template distinction

**Downloadable artefacts now carry a `role` and render under labelled, ordered groups**
instead of one flat list.

- Schema: `DownloadRoleSchema = enum(["explainer","worksheet","template","example"])`, optional
  `role` on each download (`lib/schema.ts`).
- UI: `downloadRoleMeta()` + `DOWNLOAD_ROLE_META` in `lib/ui.ts` map role → group label +
  stable order (explainer → worksheet → example → template; untagged → "Other resources", last).
- `app/materials/[slug]/page.tsx` groups downloads by role.
- `docs/MATERIALS_STANDARD.md` **§11.1 "Download roles"** documents it, and §10 now records the
  **standalone-bank exception**: a cross-course method that isn't part of a unit-planned
  component (e.g. the iceberg tool) ships its **own** role-tagged files rather than compiling
  into a component workbook. The `role` tag is the same either way.
- **Reference example:** `content-source/materials/iceberg-model.yaml` now has a
  worksheet+template download pair.

### 3. Key concepts on courses — the course-key-concepts pattern, extended

Courses declare `keyConcepts: [glossary-slug, …]`; the page renders a **"Key concepts for
facilitators"** section (hover for definition, click through to the enriched term). Depth
(definition + "In depth" explainer + further reading) lives on the **glossary term**, not
duplicated in the course. This pattern already existed for Peacebuilding; this session applied
it to more courses and enriched the glossary layer.

- `lib/content.ts`: `getExploredIn()` now also returns **courses** (a term is "explored in" a
  course if the course names it in `keyConcepts`, or mentions it in `purpose`). `validateGraph()`
  now checks every `keyConcepts` slug resolves to a real glossary term.
- `app/glossary/[slug]/page.tsx`: renders the `explainer` ("In depth"), `furtherReading`, and a
  "Courses" group under "Explored in".
- `app/courses/[slug]/page.tsx`: renders the "Key concepts for facilitators" section.
- Courses given `keyConcepts` this session: **powerful-narratives** (12 terms),
  **peacebuilding** (9), **artistic-and-cultural-expression** (8).
- **28 new glossary terms** in `content-source/glossary/` (peace/violence family, narrative
  family, art/culture family) — each an enriched entry with `explainer` + `furtherReading`.

### 4. Course content extraction + printable worksheets

New authored materials, extracted from source packs, plus reproducible Word-doc generators.

- **Powerful Narratives:** 18 new `pn-*` materials in `content-source/materials/`. Two ship
  printable worksheets: `pn-peer-review-sheet` and `pn-provocation-response`.
- **Personal Interest Project (PIP):** 10 new `pip-*` materials, with 8 generated docx artefacts
  (strengths reflection, challenges brainstorm, planning template — each worksheet/template pair —
  plus a student-journeys reading and a facilitator assessment rubric).
- **Generators** in `scripts/downloads/` (documented in its `README.md`):
  `generate-iceberg.js`, `generate-pn-worksheets.js`, `generate-pip.js`. They emit the `.docx`
  files in `public/downloads/`. Run with node from repo root; regenerate when the source
  material changes so the printed sheet matches the site.
- **12 new files in `public/downloads/`** (iceberg ×2, pip ×8, pn ×2).

> ⚠️ **PII — do not publish source packs.** The PIP and ACE (Artistic & Cultural Expression)
> source packs contain **real student PII** (filled brainstorms, presentation videos). The
> generated artefacts deliberately reproduce **none** of it — they are blank/templated. Never
> commit or publish anything from the source packs themselves. (See memory:
> `pip-materials-and-source-pii`, `ace-source-pack`.)

---

## Files touched (uncommitted)

**Modified (11):**
`app/courses/[slug]/page.tsx`, `app/glossary/[slug]/page.tsx`, `app/materials/[slug]/page.tsx`,
`content-source/courses/{artistic-and-cultural-expression,peacebuilding,powerful-narratives}.yaml`,
`content-source/materials/iceberg-model.yaml`, `docs/MATERIALS_STANDARD.md`, `lib/content.ts`,
`lib/ui.ts`, `scripts/downloads/README.md`.

**New (untracked):** 28 glossary YAMLs, 18 `pn-*` + 10 `pip-*` material YAMLs, 1 material
(`galtungs-violence-triangle.yaml`), 12 `public/downloads/*.docx`, 1
`public/diagrams/galtungs-violence-triangle.svg`, 3 `scripts/downloads/generate-*.js`, and
this handoff doc. (`tsconfig.tsbuildinfo` is build junk — do not commit.)

---

## Suggested next steps (nothing is mid-edit)

1. **Commit & publish** the current work. It's a coherent, build-green batch. A sensible split
   into a few commits: (a) the material-page reading-order + download-roles infra
   (docs/§11, `lib/ui.ts`, `app/materials`, `iceberg` example); (b) key-concepts-on-courses +
   the 28 glossary terms + `lib/content.ts`/glossary/course page changes; (c) the PN materials
   + worksheets; (d) the PIP materials + worksheets. Or one squashed content commit — the
   maintainer prefers small, themed commits (see git log).
2. **Verify live** after deploy: spot-check a material page (e.g. `/materials/iceberg-model`) for
   the new section order + grouped downloads, a course page (`/courses/powerful-narratives`) for
   key concepts, and a glossary term (`/glossary/single-story`) for "In depth" + further reading +
   "Explored in → Courses".
3. **Migrate other materials to the new reading order.** The template change applies site-wide
   already, but individual materials that previously leaned on the old order (or lack
   `educatorContent`) may read thin at the top — audit high-traffic materials and fill
   `educatorContent` where the "Understand it" section is empty. §10 says migrate as touched, not
   all at once.
4. **Extend key concepts to remaining courses** that would benefit (see the full course list in
   `content-source/courses/`) — each needs its terms enriched with `explainer`+`furtherReading`
   in the glossary first.

---

## How to verify anything you change

Always finish by running:

```bash
npm run build
```

Green build = content graph valid (all cross-refs resolve, diagrams exist, keyConcepts resolve).
If it's red, the error message names the exact offending course/material/term.
