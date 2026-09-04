# The English Check — why it is built this way

_The design record. The specification is in `ENGLISH-ASSESSMENT-BLUEPRINT.md`; the papers themselves
are `ENGLISH-ASSESSMENT-BASELINE.md` and `ENGLISH-ASSESSMENT-ENDLINE.md`._

## What it answers

The English Language Development component of Learning Bridge+ (Cox's Bazar) assesses formatively,
and its unit plan says so plainly: evidence gathered warmly across the whole component, never a
single test. That tells a facilitator what to teach next.

It does not tell a partner whether English improved over fifty hours. This does, and only this. Two
papers — a baseline in the first session, an endline in the final week — sat by the whole class on
paper, marked by counting.

## The cohort decides the shape

The programme summary says learners are below B1, **many are not yet literate in any language**, and
My Voice is built as emergent literacy, targeting A1−.

So the instrument is thick at the bottom and thin at the top. Its easiest task is circling a letter
you hear; its hardest is a 150-word article and a 100-word letter. Everyone sits all of it and
leaves what they cannot do.

### Why the levels run Pre-A1 to B1

The CEFR assumes literacy even at A1 — its A1 reading descriptor is already "familiar names, words
and very simple sentences… on notices and posters". A learner who is learning to read *at all* sits
underneath the framework, not at the bottom of it. Reported as "A1, not achieved", a fifty-hour
course would show no movement for the learners it is designed around. The Council of Europe's
**LASLLIAM** guide (2022) covers exactly this span, and Pre-A1 here is shaped by it.

It stops at B1 because B1 is the entry requirement for the Global Secondary Diploma — a result that
means something outside this programme — and because a band no marker on the ground can apply
reliably produces numbers that only look like measurement.

### Why the raw score matters more than the level

Fifty hours moves a beginner a long way inside a level and rarely across one. A learner going from
12 to 24 on Reading has gained a great deal and is "A1" at both ends. Report levels alone and that
learner looks static.

So the record spreadsheet holds both, and a gain is a rise of **four or more raw marks on a part** —
one or two is ordinary day-to-day variation. This is also why there are no half-levels: the raw
score already carries the fine detail, and inventing sub-bands on top of it would be precision we
cannot defend.

## What the design refuses to do

**No routing.** An earlier draft split learners into a lower and a higher booklet on their Part 1
score. That required marking twenty-five papers mid-session with a class in the room, which no
facilitator can do. One paper, easiest first, solves it.

**No modes.** An earlier draft had one-to-one and group variants of the first part, with separate
conversion tables. Two tables is two chances to read the wrong one, for information not worth the
cost.

**No averaging.** Reading, writing and speaking are reported separately. A learner is routinely a
level higher in speaking than in writing, and that gap is the most useful thing the sheet says.

**No CEFR lookup by the facilitator.** They record three raw totals. The spreadsheet applies the
levels by formula.

## Speaking is optional, and worth protecting

Speaking is the one part that cannot be done on paper, and it is very probably where this component
produces its largest gain: the unit leads with the ear and the voice and treats writing as something
that grows out of speaking. A paper-only endline will understate the course, most of all for the
lowest learners, who may move from silence to a spoken self-introduction while their writing barely
moves.

So it is offered three ways — whole class, a sample of any size chosen at random, or not at all —
and the guide asks that a report says which was done.

## Content safety

Part 1 tests only the taught sounds, the learner's own name and the three frames; the plosive pairs
come last in the phonics sequence, so no decoding task uses b, d, g or p. Content is drawn from camp
life. Repatriation, violence, fire, loss of family, boat journeys and camp politics are excluded
without exception; "I am from ___" is never a required answer, because the component's own materials
flag that it can touch displacement and separation; every writing and speaking prompt offers a
lighter everyday choice that counts as a full answer; and every scenario must work for a young woman
answering in a same-gender group.

## What ships

| Output | For |
|---|---|
| Baseline paper · Endline paper | one per learner, each sitting |
| Marking pack | the marker only — both answer keys and the tick schemes |
| The complete guide | Part A coordinator, Part B facilitator |
| Class record spreadsheet | the coordinator — raw scores in, levels by formula |
| Learner profile sheet | the learner, at the end |

Content lives as a `resource` material at `access: partner` — the answer keys must not be public.
The pack is generated from these docs by `scripts/downloads/generate-en-check.js`, and the pictures
by `generate-en-check-pictures.js`, so the site and the printed papers cannot drift.

## Still outstanding

1. **A pilot** — 10 to 15 learners, and two facilitators marking the same eight papers separately.
   Where they disagree, the tick box is unclear rather than the marker being wrong. Item content may
   change as a result.
2. **Two independent readers on the answers**, neither of them the author.
3. **A context read** on the invented names and the line drawings, by someone who knows the camps.
