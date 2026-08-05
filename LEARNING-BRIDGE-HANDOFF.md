# Learning Bridge — session handoff

**Repo:** `Amala Curriculum Site V2` — Next.js 16 App Router, TypeScript, Tailwind,
Zod-validated YAML content, deployed on Vercel. `main` is clean and fully deployed at
https://amala-education-curriculum-site.vercel.app.

_Last updated: 2026-07-29._

## What Learning Bridge is, in the model
Learning Bridge (LB) is the **second programme** on the site, alongside GSD. GSD is
**stream-based**; LB is **component-based** — a distinct programme shape added to the
schema/rendering specifically for it. Defined in
`content-source/programmes/learning-bridge.yaml`, with two delivery tiers
(**Learning Bridge** and the certificated **Learning Bridge+**).

Its four components:

| Component | Has a course guide? |
|---|---|
| **Research Project** | ✅ `research-project` course |
| **Agency in Learning** | ✅ `agency-in-learning` course |
| Mentoring and Wellbeing | — (programme text only) |
| English Language Development | — (optional, programme text only) |

## Courses authored (the two that back LB components)
Both are **competency-anchored** — a deliberate improvement over the legacy GSD guides,
with an explicit *agency → anchor competency → objectives* "throughline" narrative
rendered near the top of the course page.

- **`content-source/courses/research-project.yaml`** — anchored on **FSI1**
  "Investigate real-world issues". 4 objectives (frame a challenge → plan/conduct ethical
  research → evaluate evidence into actionable insights → communicate findings). All 9
  principles mapped.
- **`content-source/courses/agency-in-learning.yaml`** — anchored on **FSL2**. 4 objectives.

Both appear at `/courses`, link from `/programmes/learning-bridge`, and reverse-index onto
their competency pages.

## Materials coverage
Coverage was audited per objective and every gap filled. Current mapped-material counts:

- **Research Project:** o1 = 14, o2 = 8, o3 = 6, o4 = 4
- **Agency in Learning:** o1 = 9, o2 = 4, o3 = 3, o4 = 3

Material families in `content-source/materials/`:

- `rp-*` (4) → Research Project
- `ail-*` (11) → Agency in Learning
- `dc-*` (28) → Design Challenge — the design-thinking arc for the shared real-world
  challenge; these double-map to **research-project** (19) and **social-entrepreneurship**
  (18) objectives
- `pathways-*` (22) + `video-*` (9) → the **Pathways** course — a *separate GSD course, not
  an LB component*. Don't conflate them.

## Infrastructure added along the way
- **Schema** (`lib/schema.ts`): `components[].courseSlug` on programmes; `throughline` on
  courses; `diagram` and `links` on materials.
- **Validation** (`lib/content.ts` `validateGraph`): component→course refs, throughline
  anchor-competency resolution, and diagram-file existence are all checked at build time —
  **a green `npm run build` proves the whole content graph is valid.**
- **Glossary/tooltip layer**: research/design terms with auto-linking via `GlossedText`.
- **Resources UX**: each activity surfaces its video/resource links in a "Resources for this
  activity" callout, and `Prose` renders inline markdown links so guidance points straight at
  the resource. The **effort/impact matrix** is a proper tool material with an SVG diagram.
- **Site-wide search**: `/search` page + header search box + a text filter on the
  `/materials` browser. Index built at build time by `getSearchIndex()` in `lib/content.ts`.

## Conventions / gotchas
- **YAML colon trap:** any scalar containing `": "` must be double-quoted or it parses as a
  mapping. This bit repeatedly with subagent-authored files.
- **Publish flow:** branch → commit → `git checkout main` → `git merge --ff-only` →
  `git push origin main`; Vercel auto-deploys (~1 min). Verify live with `curl`/browser.
  Revert `next-env.d.ts` (`git checkout next-env.d.ts`) before committing — builds touch it.
- **Commit trailer:** `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Dev preview:** port 3000 is often occupied by another local app; use a temporary
  `autoPort` launch config in `.claude/launch.json` and remove it before committing.

## Possible next steps (none in progress)
- Give **Design Challenge** activities the same inline video-in-guidance treatment (they
  currently have no video resources — would need sources).
- Flesh out the two **component-only** parts (Mentoring & Wellbeing, English Language
  Development) if they should become real course guides.
- Resume the parked **downloads pilot** (printable student/educator files).
- Search polish: `/` or ⌘K to focus, suggested searches.
