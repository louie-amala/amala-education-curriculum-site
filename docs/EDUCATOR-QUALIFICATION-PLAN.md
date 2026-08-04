# Educator Initial Training & Qualification — integration plan

_Planning doc. Nothing here is built yet. Source materials live in
`~/Downloads/Amala Programme Delivery Qualification Framework/`._

## What this is

Amala qualifies educators through a **modular qualification framework**. This plan brings
that framework — and the initial training modules that sit under it — onto the curriculum
site, alongside (but clearly separated from) the existing learner-facing curriculum.

Two source artefacts drove the design:

1. **`Qualifying Amala Educators.pptx`** — the *framework*: the qualification rule, the seven
   modules, and the programme→module matrix.
2. **`Designing and Facilitation Group Learning …/`** — one *worked module* (DFGBL), with its
   full asset set: Slides · Trainer Guide · Participant Guide · Course Planning Guide
   (the deliverable/workbook) · Sign-off Guide.

## The mental model (from the framework deck)

> **Qualified to deliver a programme = hold the right modules + complete the programme induction.**

- **Modules** are *portable* — held by the person, carried across programmes. Training compounds.
- **Programme inductions** are *programme-specific* — QA, tools, admin. Do not transfer.

**Seven modules**, in three categories:

| Category | Module | Required when |
|---|---|---|
| Foundation | Introduction to Amala's TEM | Every educator |
| Foundation | Safeguarding | Every educator |
| Component | Designing & facilitating group-based learning | Every programme |
| Component | Being a mentor | Programme has 1-1 mentoring |
| Component | Teaching English as a second language | Programme has ELD |
| Component | Conducting assessments of competence | Programme has assessment |
| Delivery mode | Designing & facilitating online learning | Delivery is fully online |

Programme→module matrix (derived, from the deck):

| Programme | Intro | SG | D+F | Mentor | ESL | Assess |
|---|---|---|---|---|---|---|
| Short Courses (Changemaker) | ✓ | ✓ | ✓ | | | |
| Learning Bridge | ✓ | ✓ | ✓ | ✓ | | |
| Learning Bridge+ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| GSD | ✓ | ✓ | ✓ | ✓ | | ✓ |

## How it relates to what's already on the site

The site already has an **Educators** section — but it's the *craft* side: three functions
(mentor / course facilitator / assessor) and a library of **moves** (small repeatable
practices), which also live in `/materials` as `educator-move` type.

What's new is the *qualification* side: **how you become authorised**. These are
complementary, and the integration is the payoff:

- The **"Being a mentor" training module** trains the exact repertoire the **mentoring
  moves** already document. The module = the formal training; the moves = the living
  repertoire it builds. Each training module cross-links to its function's moves.
- Each module also maps to the **foundations/principles** it uses and the **competencies**
  it develops — the same mapping systems the rest of the content already carries.

## Decisions locked (this session)

1. **New content type** `educatorModule`, in its **own collection** — NOT folded into the
   shared `/materials` library the way moves are. Training modules are structured units with
   sign-off, not library cards.
2. **Costing model** (participant hours, trainer-time formulas, gap analysis, £/educator from
   deck slides 8–11): captured as data now, surfaced later as a **staff-gated** tool. Phase 3.
3. **Public** — framework + modules browse like the rest of the site.
4. **Separation: umbrella, two tracks.** One `/educators` front door, split into two visibly
   distinct tracks. Training modules get their own routes; moves stay where they are.

## Information architecture

```
/educators                        hub — reframed: two tracks
  ├─ Qualification & training  ← NEW
  │   /educators/qualification     the framework: rule · 7-module grid · programme×module matrix · inductions
  │   /educators/training/[slug]   a training module (sessions, deliverable, sign-off, guides, linked moves)
  └─ The craft & moves         ← EXISTING, unchanged
      /educators/mentoring
      /educators/course-facilitation
      /educators/assessment
```

Programme pages gain a **"What educators need to deliver this"** section (required modules +
induction). The matrix on the framework page is *derived* from every programme's
requirements — single source of truth, no hand-maintained table.

## Content model

### New: `EducatorModule` schema (`lib/schema.ts`)

Mirrors how `Course`/`Unit` already model timed blocks.

```
id, slug, access
title
category: "foundation" | "component" | "delivery-mode"
requirement: string            # "Required when a programme has 1-1 mentoring"
summary, purpose
deliverable: string            # what the participant produces (e.g. "first 10 hrs of your course planned")
sessions: [{
  n, title, focus, durationHours,
  blocks: [{ time, title, detail }]      # e.g. "0:30–0:55  Sharing context and learners  …"
}]
independentWork: [{ afterSession, tasks: [{ title, hours, detail }] }]
signOff: { criteria: string[], note? }   # from the Sign-off Guide
links: {
  function?: "mentor" | "course-facilitator" | "assessor"   # → moves pages
  moveTags?: EducatorTag[]                                    # pull the relevant moves
  principles?: […]                                           # foundations it uses
  competencies?: […]                                         # (optional) what it builds in the educator
}
downloads: Download[]          # Slides · Trainer Guide · Participant Guide · Workbook · Sign-off Guide
hours: { live, independent, total }
trainerTime?: { fixed, perParticipant }   # STAFF-gated surface, Phase 3
```

### Programme schema addition (`ProgrammeSchema`)

```
qualification?: {
  requiredModules: string[]      # educatorModule slugs
  inductionSummary?: string
  inductionHours?: number
}
```

`validateGraph()` checks `requiredModules` resolve to real modules; the framework matrix is
built by inverting these across all programmes.

### Data namespace

```
content-source/
  educator-modules/            NEW collection (the 7 modules)
    designing-facilitating-group-learning.yaml   ← authored first (all assets exist)
    …
  framework/                   qualification framework copy/config can live here or in the page
```

Loaders + `validateGraph()` in `lib/content.ts`; nav entry in `components/SiteHeader.tsx`
stays a single "Educators" item (the hub splits internally).

## Phasing

**Phase 1 — spine + pattern module**
- `EducatorModule` schema + loader + validation.
- `/educators` hub reframed into two tracks.
- `/educators/qualification` — the rule, the 7-module grid, the derived matrix, an inductions
  explainer.
- **DFGBL authored end-to-end** as the reference module (sessions, deliverable, sign-off,
  the 5 downloads, linked mentoring/facilitation moves).
- `qualification` blocks added to the four programmes in the matrix.
- Green `npm run build` (validates the whole graph).

**Phase 2 — fill out**
- Author the remaining 6 modules from their source folders (Being a Mentor, Assessing
  Competencies, Teaching ESL each already have resource folders; Intro-to-TEM, Safeguarding,
  Online each are lighter foundation/delivery-mode modules).
- Per-programme induction detail as it's confirmed (deck says hours are TBC).

**Phase 3 — staff tools (gated)**
- Surface `hours` + `trainerTime` and the gap-analysis / costing calculator from slides
  8–11, behind `access: staff`. This is proposal-design material, not learner/educator-facing.

## Open items to confirm before/while building

- **Module downloads**: are the 5 guides (docx/pptx) to be hosted as downloadable files, or
  rendered as pages? (Moves currently render; courses currently link downloads. DFGBL guides
  are heavy docx — likely download links + a rendered overview.)
- **Competency mapping for educators**: do we map modules to the *learner* competency
  framework, or is there a separate educator-competency set implied by the workbooks
  (`AF2 Educator Training Workbook`, `Amala_Foundation_Modules_Completion_Record`)? Worth a
  look before finalising the schema `links.competencies`.
- **"Short Courses (Changemaker)"** appears in the matrix but may map to an existing
  programme/course on the site under a different name — reconcile before writing the matrix.
```
