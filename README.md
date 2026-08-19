# Amala Curriculum Site

Rebuild of the Amala curriculum site — a design tool with the curriculum built in
(understand → navigate → design). Private repository; the deployed site is public.

## Status

- **`content-source/`** — the verified curriculum dataset extracted from Amala's source
  documents (competency framework, Learning Foundations, 12 course guides, GSD structure),
  as intermediate YAML mirroring the build spec's interfaces. See
  [`content-source/NOTES.md`](content-source/NOTES.md) for coverage, source issues, and what's outstanding.
- **App** — Next.js (App Router) + TypeScript on Vercel, not yet scaffolded (Phase 0 next).

The authoritative brief is the Build Specification (kept with the project owner).

## Content dataset

```
content-source/
  framework/     7 areas · 47 competencies · 5-level proficiency scale
  foundations/   9 principles · agency-for-positive-change
  courses/       12 courses (40 objectives · 190 competency-evidence links)
  programmes/    GSD structure (5 streams × 2 courses + PIP + Pathways)
```

Extraction rule: source values preserved verbatim; problems logged in per-file `sourceIssues`, never silently corrected.

## Password-protected content

Content tagged `access: partner` (or `staff`) in `content-source/` sits behind a shared password.
Today that is the whole Learning Bridge+ (Cox's Bazar) / NRC programme: the programme page, its
three units, its 82 `cb-*` materials, and the 27 files under `public/downloads/` that only it
offers.

- **Set the password** in Vercel → Project Settings → Environment Variables as `LB_NRC_PASSWORD`
  (Production and Preview), and locally in `.env.local`. See [`.env.example`](.env.example).
  With it unset, the section is inaccessible in production and open in local development.
- **How it works** — `scripts/generate-protected-paths.js` turns the `access:` tags into
  `lib/protected-paths.generated.ts`; [`middleware.ts`](middleware.ts) checks a signed cookie
  against that list and otherwise serves `/unlock`. The generator runs as part of `npm run build`,
  and `validateGraph()` fails the build if the generated file is stale.
- **To protect something else**, set `access: partner` on it and run `npm run gen:protected-paths`.
  Public listings, the search index, and course breadcrumbs already filter on `isPublic()`.

It is a single shared secret, not user accounts — good for keeping partner material out of search
results and casual browsing, not a control to rely on for anything genuinely sensitive.
