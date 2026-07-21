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
