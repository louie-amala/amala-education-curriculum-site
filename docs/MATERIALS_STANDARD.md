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

- UK English. **No em dashes**; use commas, colons, semicolons or parentheses.
- Plain, direct prose. No AI-decorative language, no marketing tone.
- **`summary`: 15 to 35 words, one sentence** saying what learners do or what the thing is.
  [audit: current range 18-31]
- Learner-facing text addresses the learner as "you". Educator-facing text addresses the facilitator
  directly and uses the imperative.
- Explanations of the spine (agency, principles, competencies) must be **specific to this material**.
  Restating what a principle or competency means is not an explanation of the link.
- Prefer structure over prose wherever a facilitator will read it while facilitating. [judgement]

---

## 9. How this is enforced

Three tiers, so the standard bites without blocking authoring:

**Build errors** (fail the build; content cannot ship):
- Required fields present for the material's type (§3)
- Every cross-reference resolves (competency codes, principle ids, objective ids, glossary terms)
- Every step has at least one key prompt and at least one watch-out (§5)
- `deliveryAdaptations` covers every mode in `facilitationContext`, and `primaryContext` is one of them
- `shortVersion` present on activities and tools (§4)

**Warnings** (reported, do not block):
- Word counts outside the ranges in §5 and §8
- Step count outside 3 to 7
- Step durations that do not reconcile with facilitated time
- A material claiming all three delivery modes with no weak-fit acknowledged
- Sensitive-topic material with no sensitivity note

**Editorial** (human judgement, no automation):
- Whether prompts are genuinely useful questions
- Whether watch-outs describe real failure modes
- Whether adaptations are honest
- Tone and register

A **content health view** lists every material against these checks, so gaps are visible rather than
discovered by a partner mid-session.

---

## 10. Open questions

1. Should tools and case studies really carry full steps, or is "how to use it" enough?
2. Is `shortVersion` sufficient, or do we also need a longer/extended variant?
3. Who signs off content changes, and does that differ for assessment-related material?
4. Do we rewrite em dashes inherited verbatim from the course guides and Learning Foundations, or
   preserve source fidelity and accept the house-style breach?
