# Pathway Opportunities — section plan

_Planning doc. Nothing here is built yet. Companion to the existing **Pathways** course
(`content-source/courses/pathways.yaml`) and its 20 `pathways-*` materials._

## What this is

A curated, filterable board of **real, external opportunities** a learner can act on —
scholarships, courses, jobs, training, grants, fellowships, mentoring, and the support
services that make those reachable. It sits on the curriculum site as its own section,
next to (not inside) the Pathways course.

The distinction to hold onto:

| | Pathways **course** | Pathway **Opportunities** |
|---|---|---|
| What it is | Curriculum — how to find, judge, prepare for and apply to a pathway | Data — the specific things currently open |
| Changes | Rarely (a course revision) | Weekly |
| Owned by | Curriculum team | Programme partners, per context |
| Lives at | `/courses/pathways` | `/opportunities` |

## Why it belongs on this site

This is not a speculative feature. The curriculum already depends on it and the dependency
is currently unmet:

- **`pathways-opportunity-database`** (a `tools-approaches` material) runs a whole session on
  "the Pathways Opportunity Database" — searching it, filtering it for fit, contributing back
  to it. Its preparation list carries a `[to verify]`: _"Amala does not ship a universal list.
  Partners must curate and maintain their own local version."_ Right now that means every
  partner builds a spreadsheet from nothing.
- **`pathways-requirements-for-accessing-pathways`** asks learners to _"take one opportunity
  from the Pathways Database and research its actual requirements"_.
- **`pathways-prioritising-pathway-opportunities`** and **`pathways-strategy-for-identifying-opportunities`**
  both assume a running list the learner adds to.
- The mentor moves tagged **`pathways`** ("Supporting mentees to identify, apply for and move
  towards further education, employment or entrepreneurial pathways") have nothing concrete to
  point a mentee at.

So the section closes a named gap, and it gives the site something it does not yet have:
content with a **shelf life**.

## Design rules

These are the decisions that make this a refugee pathways board rather than a generic jobs
board. They come from the curriculum's own framing and from the Cox's Bazar constraints.

**1. Mirror the five requirement categories the course teaches.**
`pathways-requirements-for-accessing-pathways` teaches learners to check exactly five things:
**qualifications · documents · deadlines · language level · cost**. Those become the required
structured fields on every entry, and the primary filter axes. The board's data model *is* the
checklist the course teaches — a learner who has done the course already knows how to read a card.

**2. Never make the learner's judgement for them.**
The course teaches learners to sort opportunities into **realistic / ambitious / wildcard** —
explicitly _"the learner's own judgement to make, not yours to hand down"_. So the board carries
**facts** (places available, published acceptance rate, entry requirements) and **never a
difficulty rating, a match score, or a personalised recommendation**. Ranking by "fit" would
quietly undo the pedagogy.

**3. A blank field means "not stated", never "not required".**
Half-known entries are normal in this domain. The card must render an unknown document
requirement as _"Documents required: not stated — check before applying"_, not as silence. A
learner who assumes no passport is needed and finds out at submission has lost weeks.

**4. Do not assume a URL.**
The course's own strategy activity lists sources as _"people, organisations, online, your
community and local notice boards"_. In camp contexts the real application route is an office,
a phone number, or a named person. `howToApply` must support offline routes as first-class,
not as a footnote.

**5. No accounts, no tracking, no saved applications.**
Legal status, documents and cost are, in the curriculum's own words, _"sensitive for some
learners… never ask a learner to disclose their own status to the group"_. Filtering happens
entirely client-side; no filter state is logged; there is no "my applications" feature holding
learner PII. If application tracking is ever wanted, it belongs in the learner's own Pathways
Journal (paper), which is where the course already puts it.

**6. Treat fraud as a live risk, on every single entry.**
Refugee-facing opportunity listings attract scholarship scams and trafficking-adjacent "job
offers", and the learners using this board are precisely the people those target. So the safety
warning is **not a line on the board** — it renders on every opportunity, every printed card, and
immediately next to every "How to apply" block. Two things it must always say: **check with an
adult you trust before you apply**, and **never hand over money**. Every entry also carries a
verification status and a `lastVerified` date, and unverified community submissions are visibly
labelled and never mixed in unmarked. See **Safety on every opportunity** below — it is phase 1,
not polish.

**7. Say what a "full" award does NOT cover — with a number.**
"100% scholarship" almost never means "costs you nothing". The Habesha call says so in its own
words: a 100% academic scholarship that "does not cover registration fees, books, or degree costs.
These costs will have to be absorbed by the selected candidates." A learner from Kakuma or Cox's
Bazar can win a full scholarship and still be unable to take it up — which is a worse outcome than
never applying, because it costs them months and their hope. So every funded entry carries
`fundingExcludes` **and** `estimatedUnfundedCost`, rendered as a **"What you would still have to
pay"** block with the same prominence as the award itself. See **Funding transparency** below.

**8. Staleness is the failure mode.**
A closed opportunity presented as open is worse than no board. Freshness machinery is not a
polish item — it is in phase 1 (see **Freshness & trust**).

## The taxonomy

Six top-level categories. Sub-categories are the working grain — a learner filtering for
"apprenticeships" should not have to scan all of "employment".

**1. Further education & training**
university degree · foundation / bridging / preparatory · vocational & technical (TVET) ·
short courses & certificates · language programmes (host language, IELTS/TOEFL prep) ·
secondary completion & equivalency exams · online / distance degrees

**2. Employment & work experience**
jobs (full / part-time) · internships & traineeships · apprenticeships · volunteering &
community roles · incentive-based volunteering (camp contexts) · freelance & online work ·
work-readiness placements

**3. Entrepreneurship & livelihoods**
start-up support & incubators · seed grants & microfinance · cooperatives & collectives ·
market-linkage & skills-to-income programmes · business training

**4. Funding**
scholarships (full / partial) · bursaries & fee waivers · project & seed grants · stipends &
living costs · travel & exam-fee support · device & connectivity support

**5. Fellowships, competitions & exchange**
youth fellowships & leadership programmes · competitions, hackathons & prizes · conferences &
delegate places · exchanges & summer schools

**6. Guidance, networks & support services**
mentoring schemes · alumni & peer networks · career counselling · **credential recognition**
(e.g. UNESCO Qualifications Passport) · legal advice on right to study/work · documentation
support · psychosocial support

### Mobility is a facet, not a category

Complementary pathways (DAFI, UNICORE, WUSC SRP, Talent Beyond Boundaries) are the routes
learners most want to find — but each one *is* already a scholarship or a job. Making
"complementary pathways" a seventh category would file the same entry twice. Instead every
entry carries `relocation` (`none` / `in-country` / `third-country`) and `visaSupport`, and the
board offers a prominent **"Includes relocation & visa support"** toggle plus a curated landing
page that reads across categories.

## Filters

Three tiers. Tier 1 is always on screen; tier 2 is one click away; tier 3 is card metadata,
not a control. Resist the urge to promote everything — a wall of twenty selects is unusable
on a shared phone.

**Tier 1 — always visible**

| Filter | Values |
|---|---|
| Category | the six above, then sub-category |
| How you take part | **online / remote · in-person · hybrid · by post or phone** |
| Where you must live to apply | country → region/camp · "anywhere" |
| Deadline | open now · closing in 30 days · rolling / always open · closed (hidden by default) |

**Tier 2 — the ones that decide whether a refugee learner can actually apply**

- **Documents** — accepts applicants **without a passport** · refugee ID / UNHCR number accepted ·
  no formal certificate required · national ID required
- **Status eligibility** — refugee · asylum seeker · stateless · displaced · host community · any
- **Cost** — free to apply · no application fee · fully funded · stipend paid
- **Language** — language of delivery, and level required (A1–C2, or IELTS band)
- **What you need to take part** — no internet needed · works on low bandwidth · needs a phone ·
  needs a computer
- **Right to work required** — yes / no (decisive where refugees cannot legally work; it is what
  makes volunteering, IBV and online freelance the real options)
- **Age** — min/max
- **Open to women specifically** · childcare provided · accessible to learners with disabilities
- **Support offered** — stipend · travel · device or data · accommodation · mentoring · visa
- **Relocation** — none · within this country · to another country

**Tier 3 — shown on the card, not filterable**
provider and provider type · certificate awarded and who recognises it · places available ·
last verified date · verification status · where the entry came from.

Two filter behaviours worth specifying now: filters are **additive and non-destructive** (an
empty result set shows the nearest matches with the blocking filter named, rather than an empty
page), and **"deadline passed" entries are hidden but not deleted** — a learner researching for
next year needs to see that DAFI exists and roughly when it opens.

## Content model

New collection `content-source/opportunities/`, one YAML per opportunity, new
`OpportunitySchema` in `lib/schema.ts`, loaded and cross-validated exactly like materials.
**One content type with a `kind` field**, not six types — same call as `MaterialType`.

Required set is deliberately small so an entry takes five minutes: `id · slug · kind · title ·
provider · summary · deadline · eligibility.status · delivery.mode · howToApply · verification`.
Everything else is optional and renders as "not stated" (rule 3).

```yaml
id: dafi-scholarship
slug: dafi-scholarship
access: public
# edition: learning-bridge-coxs-bazar   # optional — scopes to one programme edition
kind: funding
subKind: scholarship
title: DAFI Tertiary Scholarship Programme
provider:
  name: UNHCR
  type: un-agency          # un-agency | ngo | university | employer | government | community
summary: >-
  Full scholarships for refugee students to study an undergraduate degree in their
  country of asylum.
whoItIsFor: >-             # plain language, readable aloud by a mentor
  Refugee students who have finished secondary school and want to study at a
  university in the country they are living in now.

applicant:
  appliedBy: learner       # learner | educator | team-with-educator | institution
                           # | third-party (an employer opts in) | referral (a service you are sent to)
  note: null               # e.g. "An educator must submit on behalf of the team"
team:                      # omit entirely for individual opportunities
  required: false
  minMembers: null
  maxMembers: null
  adultLead: null

# the five categories the Pathways course teaches learners to check
requirements:
  qualifications: ["Completed secondary school with results that meet the university's entry bar"]
  documents:
    required: [refugee-id, secondary-certificate]
    passportRequired: false
    alternativesAccepted: "Certified statement of results where the original certificate is lost"
    note: null
  deadline:
    type: annual-cycle     # fixed | rolling | annual-cycle | unknown
    date: 2027-03-31
    opensAround: "July"    # so a CLOSED recurring entry is still useful, not hidden
    note: "Dates vary by country office — confirm locally"
  language:
    ofDelivery: [en]           # the language you study in
    required:                  # the level you must ALREADY have to apply — may be another language
      - { language: en, level: B2, reason: null }
    supportProvided: null      # e.g. a funded intensive language year before coursework
    proofRequired: none
  cost:
    toApply: free            # free | fee
    applicationFee: null     # if set, `paidTo` is REQUIRED (validateGraph errors otherwise)
    paidTo: null             # the official body the fee goes to — never an individual
    toParticipate: funded
    fundingIncludes: [tuition, stipend, travel, materials]
    fundingExcludes: []        # REQUIRED when funded — validateGraph errors if empty
    estimatedUnfundedCost:     # what the learner must still find. Never guess the number.
      status: needs-research   # needs-research | estimated | confirmed
      amount: null
      currency: null
      basis: null              # provider quote | past participant | local price check
      note: null

eligibility:
  status: [refugee]
  nationalities: any
  residingIn:               # `resolved: false` when the provider hides the list behind a link
    resolved: true
    countries: [bangladesh, jordan, kenya]
    sourceUrl: null
    note: null
  ageRange: { min: 17, max: 28 }
  gender: any              # any | women | men
  maritalStatus: null      # e.g. "Single and without children" — a real bar; show it, never bury it
  otherConditions: ["Must be registered with UNHCR"]

delivery:
  mode: in-person          # in-person | online | hybrid | by-post-or-phone
  location: { country: bangladesh, place: "Host-country universities" }
  relocation: none         # none | in-country | third-country
  visaSupport: false
  duration: "3–4 years"
  timeCommitment: full-time
  startDate: "September"

keyDates:                  # multi-stage timelines; `deadline` above stays the filterable one
  - { label: "Applications close", date: 2027-03-31, note: null }

access:                    # what a learner must have to take part at all
  connectivity: stable-internet   # none-needed | low-bandwidth | stable-internet
  device: computer                # none | shared-phone | own-phone | computer
  rightToWorkRequired: false
  childcareProvided: false
  disabilityInclusion: null

# Risks the PROVIDER discloses, quoted. Distinct from safetyNote (our warning to the learner) —
# this is the provider being honest about what is not guaranteed.
risksDisclosed: []

# A published channel for reporting corruption in the application process. A strong legitimacy
# signal; surface it beside the safety notice where a provider offers one.
integrityContact:
  statement: null
  reportTo: null

outcome:
  certificate: { awarded: true, title: "Bachelor's degree", recognisedBy: "Host-country ministry" }
  placesAvailable: null      # show prominently when small — "2 places" is decision-changing
  leadsTo: ["Graduate employment", "Postgraduate study"]

howToApply:
  online: { url: "https://…", note: null }
  offline: "Apply in person at the UNHCR field office"     # rule 4 — first-class
  contact: { name: "UNHCR education focal point", phone: null, email: null }
  steps: ["Gather documents", "Complete the application form", "Attend interview"]

support: [stipend, travel, materials]
supportNote: null

# For one programme run in many countries with different deadlines and contacts (DAFI, WUSC,
# UNICORE). Shared description above; per-country facts here. The board shows the instance
# matching the learner's location. Omit for single-instance opportunities.
instances:
  - country: rwanda
    deadline: { type: annual-cycle, date: 2026-08-07, opensAround: "July" }
    contact: { name: "UNHCR Rwanda", email: null, phone: null }
    howToApply: { url: "https://help.unhcr.org/rwanda/…", offline: null }

dataRequested:             # what the application asks for, and about whom
  aboutStudents: []
  aboutEducator: []
  note: null

# Adds to the standing safety notice — never replaces it. Optional; use for a risk specific to
# this entry (e.g. "a visa fee is payable later, direct to the embassy — to no one else").
safetyNote: null

# curriculum wiring — same fields the rest of the graph uses
preparedBy: [pathways-producing-a-personal-statement, pathways-producing-a-cv]
competencyCodes: [FR1, FR2]
objectiveIds: [pathways--o1]

# trust & freshness
verification:
  status: verified          # verified | reported | unverified
  lastVerified: 2026-08-27
  verifiedBy: "Amala Pathways team"
  reviewEveryDays: 90
source: "UNHCR DAFI programme page"
```

`validateGraph()` additions: `preparedBy` slugs exist in materials · `competencyCodes` exist ·
`objectiveIds` resolve · `edition` names a real programme · a protected edition's opportunities
are not `access: public` · **warn** when `lastVerified` is older than `reviewEveryDays` · **error**
when a fixed deadline is in the past and `status` is not `closed` · **error** when
`cost.applicationFee` is set without `cost.paidTo`.

## What the first real listing changed

The EFA Global Action Hackathon (mapped in full as a worked example) broke four assumptions
in the first draft of the schema. Recording them here because they will not be one-offs:

1. **The learner is often not the applicant.** This one is entered by an *educator*, on behalf of
   a team. School-brokered competitions, institutional scholarships and employer schemes all work
   this way. Added `applicant.appliedBy` (`learner` / `educator` / `team-with-educator` /
   `institution`). It changes the card's whole call to action — "bring this to an educator or
   facilitator", not "apply now" — and it changes the safety notice (see below).

   Say **educator** or **facilitator**, never "teacher", in any text we write. It is the site's own
   vocabulary (`/educators` — mentor, course facilitator, assessor), and in a Learning Bridge
   context there is often no one called a teacher at all. Where a *provider's* form demands a role
   it calls "teacher", say so once, in the apply steps, so the person filling it in is not thrown.
2. **Some opportunities are team entries.** Added a `team` block. Individual eligibility fields
   could not express "4–6 students plus one educator".
3. **One `deadline` is not a timeline.** This listing has six dated stages across four months.
   Added `keyDates[]`, while `deadline` stays the single filterable date.
4. **Eligibility is routinely unresolvable from the page.** "Open to 44 countries" — with the list
   behind a Google Doc. For a refugee board, *whether our host countries are on that list* is the
   single most decisive fact, and it is the one thing not published. So `eligibility.residingIn`
   gained a `resolved: false` state carrying the source link. An entry may not go live with
   `resolved: false`; it is a curation task the schema now makes visible instead of letting an
   author quietly write `any`.

It also surfaced a field I had not thought of at all: **`dataRequested`**. This application asks
for a student roster plus the educator's date of birth, gender and ethnicity. Sending a list of
named refugee children to a third party is a safeguarding and data protection decision, not an
administrative one. The board should state what an application asks for, about whom, so a partner
can check it against their own policy *before* submitting. I would make this a required field for
any entry with `appliedBy: educator` or `institution`.

Two smaller confirmations that the design rules are earning their place:

- **Rule 3 (blank means "not stated")** — no fee is mentioned anywhere on either page. Probably
  free; we publish "not stated", not a guess.
- **The connectivity filter is doing real work** — live Zoom sessions and a computer. Honest
  answer for a camp context: this is out of reach, and the board should say so rather than raise
  hopes.

**The safety notice adapts for educator-applied entries.** "Talk to an adult you trust before you
apply" does not parse when the adult *is* the applicant. For `appliedBy: educator` the learner-facing
line becomes _"Your educator applies for this, not you — ask them to look at it with you"_, and the
never-pay lines stay exactly as they are.

## What the research shortlist changed

Fourteen candidate opportunities were researched across all six categories (shortlist held
separately). Four further findings, on top of the four from the first listing:

1. **Search is heavily biased towards Europe and North America.** Much of what surfaces under
   "refugee opportunities" is resettlement-country content, unreachable from Kakuma or Cox's Bazar.
   **Filtering that out is the board's core value**, which confirms `residingIn` belongs in tier 1.
   It also means curation cannot be search-and-paste — it needs someone who knows the contexts.
2. **Closed ≠ useless, but the schema made it so.** The biggest opportunities are annual (DAFI,
   WUSC, UNICORE, Mastercard, Elimu). A learner in September needs to know DAFI exists and roughly
   when it opens, so they can get documents ready. Added **`deadline.opensAround`**; closed
   recurring entries render as _"Opens around July each year — start getting ready now"_.
3. **One programme, many country deadlines.** DAFI is one programme with a different deadline,
   contact and route in ~50 countries. Listing it once is wrong for everyone; listing it fifty times
   is unmaintainable. Added an **`instances[]`** block — shared description, per-country facts, board
   filters to the instance matching the learner's location. This is the hard modelling problem in the
   set, and it recurs for every large agency programme.
4. **Sometimes nobody applies.** Remote for Refugees is a scheme *employers* opt into; the UNESCO
   Qualifications Passport is a service you are referred into. Extended `appliedBy` with
   `third-party` and `referral` — which also settles open decision #3: category 6 entries live on
   the board but follow different rules (no deadline sorting, never "closing soon").

5. **Some "free" competitions are marketing funnels — include them, with disclosure.** Several
   prominent essay prizes are run by for-profit education companies whose prize is a place on their
   *own* paid programme. Entry is free; the pathway it opens costs thousands. Excluding them would
   strip real chances from learners who have few, so the rule is **include, on two conditions**:

   - **The award must be full.** A partial award or a percentage discount does not qualify — that is
     a voucher, and it leaves the learner needing money they do not have.
   - **The learner must be told, on the card.** A new field `providerInterest` becomes **required**
     whenever the prize is credit towards the organiser's own product, enforced in `validateGraph()`.
     Making it a required field is the difference between learners being "very aware" and an author
     having remembered. Rendered plainly: _"The prize is a place on a programme run by the same
     company. Winners pay nothing. If you do not win, their programme costs money — you do not have
     to take it."_

   One trap this exposes: **"full scholarship" usually means tuition only.** For a residential
   programme, flights, visa and insurance can exceed the tuition. So `cost.fundingIncludes` must be
   filled in for every one of these, and an entry claiming a full award while leaving it empty
   should warn at build time.

   There is also a teaching moment here rather than only a warning. *Who benefits from you entering?*
   is exactly the kind of question the phase 2 `pathways-checking-an-opportunity-is-real` activity
   should teach — the course already trains learners to read an opportunity against their own real
   circumstances.

6. **A real call exposed four more gaps** (Habesha Protection Scholarship, mapped as worked
   example 2). **Two languages, two roles** — instruction in Spanish, but B1 *English* required to
   apply, with a funded Spanish year in between; `language` became
   `{ ofDelivery, required[], supportProvided }`. **`maritalStatus`** — "single and without
   children" is a genuine bar that falls hardest on young women, and cannot sit buried in
   `otherConditions`. **`risksDisclosed`** — the provider states plainly that "refugee recognition
   is not ensured"; a provider's own honest risk statement is not our safety warning and deserves
   its own quoted field. **`integrityContact`** — this provider publishes that "all stages of the
   application process are entirely free of charge" *and* an address for reporting corruption. That
   is a provider doing what our safety notice teaches, and a strong legitimacy signal worth
   surfacing and worth feeding into verification.

   Also **`placesAvailable: 2`** — two places, for all of Kakuma. Publishing that is not
   discouragement, it is respect: it is exactly the fact a learner needs in order to sort this into
   "ambitious" or "wildcard", which is the judgement the Pathways course teaches them to make.

And a confirmation worth recording: **the most valuable entries often have no website.** The Kenyan
Elimu scholarship form is collected in person from the Camp Manager. That is not a degraded case to
handle politely — for a camp-based learner it is the *best* kind of entry on the board.

## Information architecture

```
/opportunities                        the board — filterable, the default landing
  /opportunities/[slug]               one opportunity
  /opportunities/c/[category]          category landing (six of them) + sub-category chips
  /opportunities/relocation            curated cross-category: complementary pathways
  /opportunities/about                 how the list is curated, how to spot a scam,
                                       how to report a listing, how to submit
```

Nav label: **Opportunities** — a new top-level entry in `NAV` (`components/SiteHeader.tsx`),
alongside Programmes, Courses, Modules, Materials. Recommended over "Pathways" because
`/courses/pathways` already exists and two things called Pathways in one nav will be read as one
thing.

### It is its own section, with its own filtering — not a view over `/materials`

Worth stating plainly, because the tempting shortcut is to add an `opportunity` material type and
reuse `MaterialsBrowser`. Don't:

- **The filter axes do not overlap.** `MaterialsBrowser` filters on type, facilitation context and
  course — the axes an educator uses to plan a session. This board filters on deadline, documents,
  cost, language level, right to work, connectivity. Nothing transfers.
- **The audiences differ.** `/materials` is for educators designing learning. This is for a learner
  (or a mentor sitting beside one) deciding what to apply for.
- **The lifecycles differ.** A material is stable and has no expiry. An opportunity closes, and the
  whole freshness and safety apparatus below exists only for this collection.

So: its own collection, its own schema, its own route tree, its own **`OpportunitiesBrowser`**
component with the tier 1 / tier 2 filter model, and its own card. It shares the site's loader,
validation, access-gating and search-index patterns — but none of the materials UI. The section header
says "Pathway Opportunities" and links to the course; the course page gains a prominent link
back to the board.

Also wire in:
- **Course page** `/courses/pathways` → "Live opportunities" panel.
- **`pathways-opportunity-database` material** → its `[to verify]` note is replaced with a link
  to the board, which is what the session now opens.
- **`/educators/mentoring`**, `pathways` tag → link, so a mentor preparing a session lands here.
- **Home page** → a seventh card.
- **Search index** → new `Opportunity` record kind in `getSearchIndex()`.

## Freshness & trust

The board is statically built, which creates one real trap: **anything computed from today's date
at build time is wrong the next morning.** So:

- `deadline.date` is shipped as data; **"open / closing soon / closed" is computed in the browser**,
  never baked into the HTML.
- A **scheduled rebuild** (nightly, via the host's cron or a GitHub Action) so
  server-rendered counts and sorting stay honest.
- Every card shows **"Checked 3 weeks ago"**, derived from `lastVerified`. Over the review
  interval it degrades visibly to _"Not checked recently — confirm before applying"_.
- A **review queue** page (staff-gated) listing everything past its review date. The build warns;
  the queue is where someone actually clears it.
- **Community submissions** land as `verification.status: reported`, render with a visible
  "not yet checked by Amala" badge, and are excluded from any printed pack.

## Safety on every opportunity

Not a line on the board — a block that renders on **every** opportunity page, on every card in the
printed pack, and immediately next to **every** "How to apply" block, because that is the moment
of action. Three design consequences:

**1. It is a component, not a content field.** Authors cannot omit it, forget it, or write their
own version. `<OpportunitySafetyNotice>` renders unconditionally from the detail page template,
the card, and the pack generator. A per-entry `safetyNote` exists only to *add* an entry-specific
caution — never to replace the standing one.

**2. It appears at the point of action.** A warning at the top of a long page is a warning the
learner scrolls past on the way to the link. The block sits directly before the apply steps, URL
and contact details. In the printed pack it goes on every page, because pack pages get separated
and handed around.

**3. It has to survive being read aloud, and being read by someone who cannot read.** Short
sentences, plain language, no conditionals, and a pictogram set for the printed version (reusing
the icon set in `public/brand/icons/`). Written for translation from the start.

### The standing notice

Draft wording — **to be reviewed with safeguarding before it ships**, and translated:

> **Before you apply — check first**
>
> - **Talk to an adult you trust before you apply** — your mentor, your facilitator, a family
>   member, or another adult you trust. Show them this opportunity and ask what they think.
> - **Never give money to anyone to get a place, a job, or an application form.** A real job pays
>   you; it does not ask you to pay.
> - Never hand over your original documents. Copies only.
> - Never give your bank details, your passwords, or your family's details to get an opportunity.
> - If someone promises you a job or a visa for certain, asks you to keep it secret, or rushes you
>   to decide today — stop, and talk to an adult you trust.
> - We check the opportunities on this list, but things change. If anything feels wrong, it is
>   always alright to walk away.

### The money rule needs care to stay credible

A flat "never pay anything" is contradicted by the board's own data — some genuine routes carry
real, legitimate costs (an IELTS fee, a visa fee, an exam fee). A warning that the listings
themselves disprove teaches learners to ignore warnings. So the rule is written as **never pay a
person**, and the data has to back it up:

- Where `cost.applicationFee` is set, the entry must also carry **`paidTo`** — the official body
  the fee goes to — rendered as _"$X, paid to [body]. Never pay an individual."_
- `validateGraph()` **errors** when `applicationFee` is set without `paidTo`. A fee with no named
  recipient is exactly the shape of a scam; we should not be able to publish one by accident.
- Any entry with a fee gains an extra automatic line: _"Check with an adult you trust before you
  pay anything."_

### Who "an adult you trust" is

Deliberately wider than "your mentor". Every Amala programme has mentors, and the mentor is named
first — but a learner may be between mentors, may not trust the one they have, or may be reading a
printed pack months after the programme ended. Family members, facilitators and community leaders are
named alongside. This has a matching obligation on the other side: the `pathways` and
`safeguarding` mentor moves should tell mentors to expect these conversations and how to handle
one where the opportunity turns out to be fake. Cross-link both ways.

### Reporting

`/opportunities/about` carries the fuller version — how to spot a scam, what a real provider does
and does not ask for, and a route for a learner, mentor or partner to **report a suspicious
listing**. A reported entry is pulled from the board immediately and returns only after
re-verification, rather than waiting on the review cycle.

## Funding transparency

The single most consequential number on a scholarship card is not the award — it is the gap.

**Required whenever `cost.toParticipate` is `funded` or the entry claims a full award:**

- **`fundingExcludes`** — an explicit list. Not "everything unlisted is excluded"; a written list,
  because a learner reads a list and cannot read an absence. `validateGraph()` **errors** if a
  funded entry leaves it empty.
- **`estimatedUnfundedCost`** — `{ status, amount, currency, basis, note }`, with `status` one of
  `needs-research` / `estimated` / `confirmed`, and `basis` recording *how* the figure was reached
  (provider quote, past participant, local price check). An estimate without a basis is a rumour.

**Rendered as its own block**, headed _"What you would still have to pay"_, sitting beside the
award, never below the fold. Where the figure is unknown it says _"We do not know yet — ask the
provider before you apply, and ask your mentor to help you work out whether you could cover it."_

**Never invent the number.** A confident wrong figure either frightens off a learner who could have
gone, or strands one who could not. `needs-research` is an honest published state; a guess is not.
Getting real figures is a curation task with a named owner, and it is often a single email to the
provider.

**Count the invisible costs.** They are what actually stop people, and providers rarely list them:

- Obtaining, certifying, translating and apostilling original documents
- Passport or travel-document fees, and the travel to the office that issues them
- Medical checks, vaccinations, insurance
- Exam and language-test fees (IELTS, TOEFL)
- Data and airtime to complete an online application at all
- Income the family loses while the learner studies

The Habesha entry shows the pattern: it funds flights, tuition, a laptop, health cover and a
9,000 MXN monthly allowance — and still leaves registration fees, books, graduation costs, family
relocation and document revalidation to a learner living in a camp.

There is a curriculum tie here too. `pathways-requirements-for-accessing-pathways` already teaches
learners to check **cost** as one of its five requirement categories. This block is that lesson
made concrete on every card.

## Offline & low-connectivity

The Cox's Bazar programme is offline-first, and a board a learner cannot reach is not a board.
Two answers, both reusing existing machinery:

1. **A printable opportunities pack** per context — generated by a script in `scripts/downloads/`
   the way the programme guides already are. One page per opportunity, the five requirement
   categories, the offline application route, the **safety notice on every page** (pack pages get
   separated and handed around), and a "checked on" date printed on it so a stale pack announces
   itself. This is what actually goes into a camp session.
2. **`connectivity` and `device` as first-class filters**, so a mentor can pull "everything a
   learner can do with no internet and a shared phone" in one click.

The primary user in an offline context is the **mentor or facilitator brokering opportunities**,
not the learner browsing alone. The board should read well when projected, printed, or read
aloud — which is why `whoItIsFor` is plain language and separate from `summary`.

## Access, gating & data protection

- Partner-specific opportunities use the existing `edition:` mechanism
  (e.g. `learning-bridge-coxs-bazar`) plus `access: partner`; `scripts/generate-protected-paths.js`
  picks up `/opportunities/[slug]` with no change beyond adding the collection.
- No learner data is collected anywhere in this section (rule 5). Submissions come from partners
  and educators, not learners, and carry no personal data about the submitter's status.
- Provider contact details are published only where they are already public.

## Editorial workflow

Phase 1: **YAML in the repo**, same as every other collection — versioned, build-validated,
one source of truth. Phase 3: a **sync script** that pulls partner-maintained sheets into YAML
at build time, so a non-technical country team can add entries without touching git. Design the
schema now so that sync is a straight column mapping later; do not introduce a second store.

Per-context curation is the expected pattern (the material already says so): a global core of
genuinely open-to-all opportunities, plus edition-scoped local sets that partners own.

## Phases

**Phase 1 — the board.** Schema, loader, `validateGraph` rules, board + detail + category pages,
tier 1 and tier 2 filters, freshness machinery, the **safety notice component** and the
`paidTo` validation rule, ~20 seed opportunities across all six categories. Ships useful on its
own.

**Phase 2 — curriculum wiring.** `preparedBy` / competency / objective links rendered both ways;
"what prepares you for this" on the opportunity, "live opportunities" on the course and mentor
pages; the printable pack generator; the relocation landing page; a new
`pathways-checking-an-opportunity-is-real` activity, so verifying a listing is *taught*, not only
warned about.

**Phase 3 — scale.** Partner sheet sync; the staff-gated review queue; community submission
route; per-context packs generated per programme edition.

## Open decisions

1. **Route and nav label** — `/opportunities` (recommended) vs `/pathways`.
2. **Global or per-context first** — seed a global core, or start with one context (Cox's Bazar)
   and generalise? Recommendation: global core in phase 1, because it is what makes the section
   demonstrable; Cox's Bazar edition set in phase 2 alongside the printable pack.
3. **Do support services belong on the same board** as applicable opportunities? Recommendation:
   yes, as category 6 — a learner who cannot get their qualification recognised cannot use any of
   the other five — but they are excluded from deadline sorting and never shown as "closing soon".
4. **Who owns verification**, and what the review interval is per category (jobs go stale far
   faster than scholarships). Suggested defaults: jobs 30 days, courses and funding 90, services 180.
5. **Community submission in scope for phase 1 or 3?** The `pathways-opportunity-database` session
   asks learners to _contribute_ to the database, so there is pedagogical pull for it early — but it
   is also the main fraud vector. Recommendation: phase 3, with the session's contribution step
   routed through the facilitator until then.
