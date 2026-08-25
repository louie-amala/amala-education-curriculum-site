# Amala materials content standard

Rules for authoring facilitation materials. The primary audience is an **educator or facilitator**,
often at a partner organisation, with varied experience, working in a context we have never seen.
They must be able to understand the point of a material, run it, know what it costs them to prepare,
judge whether it fits their time, and adapt it honestly.

Each rule is tagged with where it comes from:

- **[evidence]** — supported by verified research, cited inline.
- **[audit]** — derived from measuring our own 22 materials.
- **[judgement]** — reasoned house decision, not research-backed. Argue with these freely.

> Research status: the intended wide research pass failed part-way (authentication expired mid-run),
> so only two claims reached verification. Rules tagged **[evidence]** rest on those two. The rest are
> **[audit]** or **[judgement]** and should be treated as proposals, not settled findings.

---

## 1. The governing idea

**Educators will adapt these materials. Design for that, do not resist it.** [evidence]

> "Teachers will adapt curriculum materials. These adaptations are likely to be informed by teachers'
> concerns about time and student capabilities and experiences. By anticipating these adaptations,
> educative features can facilitate principled and productive adaptations."
> — Davis, Palincsar, Smith, Arias & Kademian (2017), *Educational Researcher* 46(6), 293-304

Two consequences run through everything below: **time pressure is the main driver of adaptation**, so
we must pre-authorise a shorter version; and adaptation should be **principled**, so we must say what
the material is actually for, and what must not be lost.

## 2. Put guidance where the work happens

**Actionable guidance belongs in the step it applies to, not in a preamble.** [evidence]

> "some supports ... were provided as unit front matter; hence, they were less situated in the
> day-to-day teaching of the unit than our findings suggest would have been optimal." — *ibid.*

Practical rules:
- `facilitationNotes` is for the **one thing to get right** and why the material exists. Cap it at
  **120 words**. [audit: current median 103, max 134]
- Anything a facilitator must *do* at a moment belongs in that step's `guidance`, `keyPrompts`,
  `watchOuts` or `adaptation`.
- If a note in `facilitationNotes` names a specific step, move it into the step.

---

## 3. Required fields by material type

Our types drifted into two tiers by accident of authoring order: activities carry full running
detail, everything else carries prose blobs. [audit] That is right for a resource and wrong for a
tool or case study, which are used live in a session and need preparation and timing.

| Field | activity | tools-approaches | case-study | concept | resource |
| --- | --- | --- | --- | --- | --- |
| summary | required | required | required | required | required |
| agency / principles / competencies (with explanations) | required | required | required | required | required |
| timing (§4) | required | required | required | — | — |
| materialsAndPreparation | required | required | required | — | if any |
| whatLearnersDo | required | required | required | — | — |
| steps (§5) | required | required | optional | — | — |
| facilitationNotes | required | required | required | required | required |
| closing | required | optional | optional | — | — |
| learnerContent | via steps | required | required | required | optional |
| deliveryAdaptations + primaryContext | required | required | required | required | optional |
| shortVersion (§4) | required | required | — | — | — |
| sensitivity note (§7) | if applicable | if applicable | if applicable | if applicable | if applicable |

A **concept** is knowledge used inside other materials, so it needs no timing or steps of its own. A
**resource** is deliberately thin: what it is, how to use it, and any localisation warning. [judgement]

---

## 4. Timing

Current timings are free prose and therefore not scannable, comparable, or summable into a scheme of
work. [audit] Examples in the corpus today range from "About 2 hours" to "A multi-session phase of
roughly 10-20 hours across class time and independent time".

Rules:
1. **Facilitated time is a numeric range in minutes**, held as structured data, not prose. A range,
   never a single number, because a single number is always wrong somewhere.
2. **Independent or out-of-session time is recorded separately** from facilitated time. Never add
   them together; they are different asks on a partner's timetable.
3. **A prose `timingNote`** carries anything irregular (recurring upkeep, spread across weeks, an
   event with preparation before and follow-up after).
4. **Every step carries its own range** in minutes. [audit: already 47/47, keep it]
5. **Step ranges should reconcile with the facilitated range.** Mismatch is a warning, not an error,
   since not every minute is inside a step.
6. **Every activity and tool ships a `shortVersion`** [evidence]: what to cut, merge or set as
   pre-work to run it in materially less time, and what must survive the cut. This is the single
   most evidence-backed new rule here, because time pressure is the main driver of adaptation.

Write timings as digits ("3 to 4 hours", "15-20 min"), never words. [audit: currently inconsistent]

---

## 5. Steps

- **3 to 7 steps.** Fewer is usually an activity that has not been thought through; more is usually
  two activities. [audit: current range 4-6]
- **Step titles are imperative and concrete**: "Rank three sources by trustworthiness", not "Source
  evaluation".
- **`guidance`: 30 to 110 words.** [audit: current median 61, max 103] It says what the facilitator
  does and why, not what the learner produces.
- **At least one `keyPrompt` per step.** Real questions in the words a facilitator would say aloud,
  ending in a question mark.
- **At least one `watchOut` per step.** [audit: currently 4-13 per activity, unevenly spread] Each
  names a **real failure mode and the response to it**, in that order. Watch-outs are the highest
  value support we offer a facilitator who has not run this before. [judgement]
- **`adaptation` covers the constraint axis only**: low bandwidth, no devices, short time, thin
  attendance. Delivery mode belongs in §6.

---

## 6. Adaptation has two axes, and they must not blur

- **Mode axis** (`deliveryAdaptations`): group, one-to-one mentoring, independent. One note per mode
  the material claims in `facilitationContext`. Mark the mode it is designed around with
  `primaryContext`; the others read as adaptations.
- **Constraint axis** (step `adaptation`): connectivity, devices, time, attendance.

**Be honest when a mode is a weak fit.** Name what is lost and how to compensate, or say plainly that
it does not survive in that mode. A material that claims all three modes work equally well is almost
always wrong. [judgement]

---

## 7. Context, safety and assumptions

Amala's learners are refugee and conflict-affected young people, and delivery partners work in very
different conditions. [judgement — the intended INEE/trauma-informed evidence did not verify, so treat
this section as house policy pending re-research]

- **Never assume a resource without an alternative.** If an item in `materialsAndPreparation` needs
  connectivity, printing, devices or money, either offer a no-resource route or flag the dependency
  plainly so a partner can decide before the session, not during it.
- **Flag sensitive ground.** If a material can surface conflict, displacement, family, money, health,
  or personal loss, it carries a short note: what may come up, how to prepare, and how a learner can
  step back without singling themselves out.
- **Localisation warnings are mandatory on borrowed material.** Anything carrying one country's legal,
  financial or institutional detail must say so (we already do this on the UK social-enterprise guide).
- **Never invent** citations, statistics, or facts about real organisations. Mark uncertainty
  `[to verify]`.

---

## 8. Writing style

- UK English. **No em dashes.** Use a hyphen with spaces around it (` - `), or a comma, colon or
  full stop. This rule pre-dated the Cox's Bazar pack and was broken 4,300 times before anyone
  noticed, so treat it as load-bearing rather than cosmetic.
- **`summary`: 15 to 35 words, one sentence** saying what learners do or what the thing is.
  [audit: current range 18-31]
- Learner-facing text addresses the learner as "you". Educator-facing text addresses the facilitator
  directly and uses the imperative.
- Explanations of the spine (agency, principles, competencies) must be **specific to this material**.
  Restating what a principle or competency means is not an explanation of the link.
- Prefer structure over prose wherever a facilitator will read it while facilitating. [judgement]

### 8.1 Plain, not clever

The reader is a facilitator with limited training, often working in a second language, often tired.
Writing that performs costs them attention they need for the session. The failure mode is not padding
or jargon; it is **mannered prose that reads as though it wants to be quoted**.

Five habits to avoid, each with the fix:

| Avoid | Why | Instead |
|---|---|---|
| **Antithesis as a punchline.** "The point of the first step is not progress. It is that the learner finds out they can move at all." | The shape carries the emphasis, so the reader has to unpack it to find the instruction. | State it once. "A very small first step shows the learner they can get started." |
| **The epigram closing a paragraph.** "Most of what looks like poor motivation later is a bad goal set here." | It summarises rather than tells anyone what to do. | Turn it into an action. "When a learner looks unmotivated in week nine, look back at the goal they set in week five." |
| **Diagnostic register.** "The tell is that…", "Guards against…", "X beats Y." | Positions the writer as the expert observer rather than addressing the reader. | "You can tell because…", "Stops…", "Do X rather than Y." |
| **Headings that announce a discovery.** "The trap:", "The one thing that changes everything". | The facilitator is scanning for what to do, not reading an argument. | "Watch for…", "Before they leave this block". |
| **Explaining why the advice is clever.** "This is not a concession to low literacy; it is better than writing for everyone." | Justifies the author to the reader. | Give the instruction and stop. Keep the reason only where it changes what someone does. |

A short sentence after a long one is fine, and emphasis is fine. What is not fine is a sentence whose
main job is to sound good.

### 8.2 Where this bites hardest

Learner-facing text is largely self-correcting: writing for A1 readers forces plain language anyway.
The problem lives in **facilitator-facing prose** - `educatorContent`, the programme guides, and the
narrative fields on courses and programmes. Check those hardest.

---

## 9. How this is enforced

Three tiers, so the standard bites without blocking authoring:

**Build errors** (fail the build; content cannot ship):
- Required fields present for the material's type (§3)
- Every cross-reference resolves (competency codes, principle ids, objective ids, glossary terms)
- Every step has at least one key prompt and at least one watch-out (§5)
- `deliveryAdaptations` covers every mode in `facilitationContext`, and `primaryContext` is one of them
- `shortVersion` present on activities and tools (§4)
- Rights are settled before a material is publicly readable (§12)

**Warnings** (reported, do not block):
- Word counts outside the ranges in §5 and §8
- Step count outside 3 to 7
- Step durations that do not reconcile with facilitated time
- A material claiming all three delivery modes with no weak-fit acknowledged
- Sensitive-topic material with no sensitivity note
- Materials with no `rights` block at all (§12), reported as a single count

**Editorial** (human judgement, no automation):
- Whether prompts are genuinely useful questions
- Whether watch-outs describe real failure modes
- Whether adaptations are honest
- Tone and register

A **content health view** lists every material against these checks, so gaps are visible rather than
discovered by a partner mid-session.

---

## 10. Student worksheets (components with a unit plan)

Where a component has a **unit plan** (a scheme of work that sequences activities), every **activity**
carries a **student worksheet**: the learner-facing sheet the activity refers to, so a facilitator can
see at a glance what a step means by "the sheet in their book". [judgement]

- The worksheet is its own `resource` material in the bank, paired to the activity through the
  activity's `worksheet: { slug, note }` field. The activity page renders it as a prominent **Student
  worksheet** callout.
- The worksheet resource is thin (§3): what the sheet is, how the learner uses it, and any sensitivity
  note. It does **not** ship its own download file.
- The **printable** version of every worksheet is compiled into one file, the component's downloadable
  **workbook**, and the worksheet says so (its `note` and content name the workbook page). One workbook
  per component, not a file per sheet.
- Enforcement (`validateGraph`): it errors if `worksheet.slug` does not resolve, warns if the target is
  not a `resource`, and warns when an activity in a unit plan has no `worksheet`.

This applies to every unit-planned component (the Cox's Bazar editions first). Components that predate
the rule and ship per-activity download files (e.g. Agency in Learning) are migrated as they are next
touched, not all at once.

**Standalone bank materials are the exception.** A material used across courses that does not belong to a
unit-planned component (e.g. the iceberg tool in Social Entrepreneurship) has no component workbook to
compile into. It therefore ships its **own** artefacts as `downloads`, each tagged with a `role`
(§11.1): a guided **worksheet** (scaffolding, ends with the template embedded) and, where useful, a
blank **template**. So the delivery vehicle is decided by context: unit-planned component → one
workbook; standalone bank method → its own role-tagged files. The `role` tag is the same either way, so
the worksheet/template distinction is machine-real regardless of how the file is delivered.

### 10.1 Teaching content: an offline workbook is a textbook too

A learner working offline has nothing to look anything up in. So in a **fully offline** unit-planned
component, the workbook must **teach the method**, not only capture the answer. [judgement]

The failure this rule exists to prevent: a workbook page that asks a learner to write interview
questions, having never told them what makes a question good. A worked example shows them the *shape*
of an answer; it does not teach the method behind it.

- Every **activity** in such a component carries `learnerTeaching`: a `title` phrased as the skill
  ("How to ask a good question"), the teaching itself in `readAloud` (graded to the component's English
  level, short sentences, concrete examples, a good/poor contrast), the `words` it introduces, and a
  short `tryIt` rehearsal.
- The workbook page for the activity becomes a spread with a fixed grammar: **Learn it** (the
  `learnerTeaching` page) → **Like this** (the worked example) → **Your turn** (the slots to fill). Learn
  it is its **own page**, never a header on the working page, so a learner can re-read the method while
  their own page is already filled in.
- Every such activity also carries `educatorContent`: the **subject brief** — what the facilitator needs
  to *know* to teach the block, distinct from `facilitationNotes`, which is how to *run* it. It renders
  in the component's facilitator unit plan as "What you need to know before you teach this", before the
  practical detail (§11). Offline, that guide is the only place a facilitator can read it.
- `learnerTeaching.words` feed the component's picture-word cards and word wall alongside the subject
  vocabulary, so method vocabulary is taught the same way.
- **`tryIt` must never script the facilitator.** "Your teacher will read four questions aloud" is wrong
  twice over: a facilitator may want to run the group version their own way or not at all, and a learner
  catching up after a missed session has no facilitator at all. Print the items on the page so the
  learner can do it alone (`chooseFrom` renders them as options to circle, for learners not yet writing).
  `validateGraph` warns on "your teacher" / "your facilitator" in `tryIt.intro`.
- **Where the skill has right answers, put them at the BACK of the workbook**, not on the page — the
  learner tries it first, then checks themselves. `validateGraph` errors if `answers` and `items` differ
  in length, because a mis-aligned key is worse than none.
- **When a `tryIt` key is needed, and when it is wrong.** A key belongs to skills with a *right answer* —
  classifying (open / closed / leading), judging (is this all right to do?), spotting (which claim has no
  evidence?). A generative or personal task — draw your map, choose your audience, say how you have
  grown — has no key: give `intro` and `then` only, and say so, so the absence reads as deliberate rather
  than missing.
- Authored `visuals` are rendered into the printed facilitator guide as well as the site, so a
  facilitator working only from paper has the diagrams too.
- Enforcement (`validateGraph`): warns when an activity in a unit plan has no `learnerTeaching`, and
  when it has no `educatorContent`.

First built on `cb-rp-design-our-questions` (Research Project, Cox's Bazar). Other activities and
components are migrated as they are next touched, not all at once — the warnings are the backlog.

## 11. Reading order on the page

**A material page is read top-to-bottom in the order an educator works, not in the order the curriculum
is modelled.** [judgement, reinforcing §2] §2 forbids actionable guidance as front-matter preamble; the
same logic governs the whole page. Curriculum-mapping (agency, principles, competencies) is justification
for the designer and moderator, not instructions for the person about to teach. It must sit **after** the
educator can already understand and run the material, never above it.

The canonical section order, each block appearing only when the material populates it:

1. **Does it fit** — type, title, `summary`, timing (§4), grouping, contexts. A fit decision in seconds.
2. **Understand it** — what the material is for and, for a concept or tool, the method itself
   (`educatorContent`; the "one thing to get right" from `facilitationNotes`). This is how an educator
   *understands it themselves*.
3. **Prepare** — `materialsAndPreparation`, resource-dependency flags, sensitivity note (§7).
4. **Run it** — `steps`, `whatLearnersDo`, `deliveryAdaptations`, `shortVersion`, `closing`. This is how
   they *use it with students*.
5. **For your students** — `learnerContent`, the Student worksheet callout (§10), and any `downloads`
   (workbook, or role-tagged worksheet/template). The artefacts learners actually receive.
6. **How it fits the curriculum** — agency, principles, competencies, objectives. Demoted here on
   purpose: it answers *why this belongs in the curriculum*, for designers and moderators.
7. **Connections** — modules, related materials.

This order is enforced structurally in the one shared material-page template, so it applies to every
material at once; authoring only decides which blocks are populated, never their sequence.

### 11.1 Download roles

Every entry in `downloads` may carry a `role` so artefacts render under labelled, ordered groups rather
than one undifferentiated list: `explainer` (the method written up) → `worksheet` (guided, embeds the
template) → `example` (a worked/filled sheet) → `template` (the blank final product). The worksheet
*contains* the template; the standalone `template` is for a learner who has done it once and wants a
clean sheet. See §10 for which materials ship their own files versus a component workbook.

## 12. Rights: may we publish this?

Almost everything in this bank descends from something. **Running an activity with a group and
publishing its instructions on a public website are different acts**, and training publishers
routinely permit the first while prohibiting the second. "We use this in class" is therefore not
evidence that we may put it online. [judgement — this is house policy, not legal advice]

Two facts make the rule workable:

- **Copyright reaches expression, not method.** Describing how an activity works, in our own words,
  is a different act from reproducing its role cards, statement banks, case texts or tables.
- **The risk concentrates in a few artefacts.** Rule sheets, briefing sheets, position cards,
  sorting-statement sets and comparison tables are what a publisher sells. Steps, watch-outs and
  learner content that we write are ours.

### 12.1 The `rights` field

Every material carries a `rights` block. `provenanceNote` says where it came from in prose; `rights`
says whether we may publish it, in a form the build can check.

| Status | Use when |
| --- | --- |
| `amala-own` | Amala wrote it, or it descends only from Amala's own course materials. |
| `own-expression` | The method is someone else's, or has no traceable author, but every word on the page is ours. Credit the originator in `holder`. |
| `public-domain` | Out of copyright, or a fact or method copyright does not reach. |
| `openly-licensed` | Third party, under a licence permitting republication. Name the licence in `basis`. |
| `cleared` | Third party, and we hold written permission. Record who granted it and when. |
| `linked-not-reproduced` | Third party, deliberately not reproduced: the page describes the method and points at the source. Requires at least one `links` entry. |
| `permission-needed` | Third party, reproduced here, no permission. **Blocks publication.** |
| `unknown-provenance` | We cannot establish where it came from, so we cannot clear it. **Blocks publication.** |

`basis` states *why* the status holds. `note` carries what an editor must not do, for example "never
add the rule sheets to this page".

### 12.2 Enforcement

**Build errors:**
- A material carrying `permission-needed` or `unknown-provenance` cannot also be publicly readable.
  The three ways out are: clear the rights, rewrite it to the `linked-not-reproduced` pattern, or set
  `access` to a gated value so it stays internal.
- `linked-not-reproduced` with no `links` is incoherent and fails.

**Warning:** materials with no `rights` block are counted in one summary line, so the gap is visible
without swamping the report.

### 12.3 The linked-not-reproduced pattern

This is the default answer for a published third-party activity we want in the curriculum, and it is
usually better than either reproducing it or dropping it. The page carries:

1. **What it is**, in our own words, in enough detail to judge whether it fits.
2. **Where it belongs in the course**, and what it does that our own materials do not. This is the
   part only Amala can write, and it is the reason the page exists.
3. **What to protect in the debrief**, which is where most of the value of a simulation sits.
4. **How to get it**: publisher link first, then any freely published adaptations, with the
   attribution their authors use.
5. **Cautions**, including anything that might mislead someone into thinking it is free to reuse.

Type it as a `resource` (§3), which is deliberately thin. `pb-barnga` is the worked example.

### 12.4 Simulations: whose life is being played?

Simulations are among the most effective materials in this bank and the most exposed, both on rights
and on safeguarding. Two rules. [judgement]

**On rights:** a simulation's value is concentrated in exactly the artefacts a publisher sells — role
cards, briefing sheets, payoff tables, rule sheets. Assume `linked-not-reproduced` (§12.3) unless the
licence says otherwise, and check whether a free author's copy exists: several excellent simulations
are published free on SSRN, on university teaching repositories, or by NGOs.

**On safeguarding:** before running any conflict simulation, ask **is anyone in this room being asked
to play their own life?** Amala teaches people who have lived through displacement, war and
persecution. A simulation of a structure they can recognise (flour mills, planets, invented countries)
teaches; a re-enactment of the situation they fled does not, and can do real harm.

This is a judgement for the educator in the room, not a decision to make centrally, because Amala
works across very different contexts: a simulation that would be indefensible with one cohort may be
exactly right with another. So the house position is **publish with the judgement written into the
page**, rather than withhold. Where a material carries this risk, its page must:

1. Name the risk plainly and say who it applies to.
2. Give the test, so an educator elsewhere can apply it to their own room.
3. Offer the adaptation — usually transposing the structure onto an invented setting — or point at a
   fictional alternative.
4. Tell learners, in `learnerContent`, that they may step out without explaining.

`pb-flashpoint-syria` is the worked example.

## 13. Open questions

1. Should tools and case studies really carry full steps, or is "how to use it" enough?
2. Is `shortVersion` sufficient, or do we also need a longer/extended variant?
3. Who signs off content changes, and does that differ for assessment-related material?
4. Do we rewrite em dashes inherited verbatim from the course guides and Learning Foundations, or
   preserve source fidelity and accept the house-style breach?
