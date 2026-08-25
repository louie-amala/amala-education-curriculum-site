// Colour-encoding for competency areas (Build Spec §9.1 - use colour to aid scannability).
// Full class strings so Tailwind's scanner keeps them.
export interface AreaStyle {
  text: string;
  bg: string;
  border: string;
  dot: string;
}

const AREA_STYLES: Record<string, AreaStyle> = {
  "sustainable-innovation": { text: "text-olive", bg: "bg-olive/10", border: "border-olive", dot: "bg-olive" },
  resourcefulness: { text: "text-teal", bg: "bg-teal/10", border: "border-teal", dot: "bg-teal" },
  "leading-change": { text: "text-orange", bg: "bg-orange/10", border: "border-orange", dot: "bg-orange" },
  "self-navigated-learning": { text: "text-plum", bg: "bg-plum/10", border: "border-plum", dot: "bg-plum" },
  "understanding-self-others-cultures": { text: "text-aqua", bg: "bg-aqua/10", border: "border-aqua", dot: "bg-aqua" },
  "technical-scientific-numerical-literacy": { text: "text-navy", bg: "bg-navy/10", border: "border-navy", dot: "bg-navy" },
  "problem-solving-critical-thinking": { text: "text-terracotta", bg: "bg-terracotta/10", border: "border-terracotta", dot: "bg-terracotta" },
};

const FALLBACK: AreaStyle = { text: "text-cool-grey", bg: "bg-cool-grey/10", border: "border-cool-grey", dot: "bg-cool-grey" };

export function areaStyle(areaId: string): AreaStyle {
  return AREA_STYLES[areaId] ?? FALLBACK;
}

// Material type encoding (label + colour), Build Spec §9.1 (colour by content type).
export interface TypeMeta {
  label: string;
  border: string;
  text: string;
  bg: string;
}

const TYPE_META: Record<string, TypeMeta> = {
  activity: { label: "Activity", border: "border-navy", text: "text-navy", bg: "bg-navy/10" },
  "case-study": { label: "Case study", border: "border-olive", text: "text-olive", bg: "bg-olive/10" },
  "tools-approaches": { label: "Tool or approach", border: "border-teal", text: "text-teal", bg: "bg-teal/10" },
  concept: { label: "Concept or theory", border: "border-plum", text: "text-plum", bg: "bg-plum/10" },
  resource: { label: "Resource", border: "border-cool-grey", text: "text-cool-grey", bg: "bg-cool-grey/10" },
  "educator-move": { label: "Educator move", border: "border-terracotta", text: "text-terracotta", bg: "bg-terracotta/10" },
};

export function typeMeta(type: string): TypeMeta {
  return TYPE_META[type] ?? TYPE_META.resource;
}

// ---- Educator-move tags ----
// One taxonomy for both AREA tags (which function bucket(s) a move appears under) and cross-cutting
// PURPOSE tags (filter lenses). `function` + `order` apply to area tags; purpose tags carry `order`
// among themselves. A move can carry several, and its per-tag `how` explains it in that context.
export type EducatorFunctionKey = "mentor" | "course-facilitator" | "assessor";

export interface TagMeta {
  label: string;
  blurb: string;
  kind: "area" | "purpose";
  function?: EducatorFunctionKey; // area tags only
  order: number;
}

export const TAG_META: Record<string, TagMeta> = {
  // ---- Area tags: Mentor ----
  wellbeing: {
    label: "Wellbeing & belonging",
    kind: "area",
    function: "mentor",
    order: 0,
    blurb:
      "Helping mentees feel safe, supported and able to raise concerns - and building their own tools for the challenges they face.",
  },
  safeguarding: {
    label: "Safeguarding & referral",
    kind: "area",
    function: "mentor",
    order: 1,
    blurb:
      "Protecting mentees from harm by knowing and following your setting's own safeguarding policy and referral pathways. These moves never replace that policy.",
  },
  progress: {
    label: "Progress & achievement",
    kind: "area",
    function: "mentor",
    order: 2,
    blurb:
      "Coaching mentees through their work, tracking how they are doing, and giving feedback that moves them forward.",
  },
  "recognising-growth": {
    label: "Recognising & evidencing growth",
    kind: "area",
    function: "mentor",
    order: 3,
    blurb:
      "Helping mentees notice, name and evidence the skills they are developing - including from life outside the classroom.",
  },
  pathways: {
    label: "Pathways & futures",
    kind: "area",
    function: "mentor",
    order: 4,
    blurb:
      "Supporting mentees to identify, apply for and move towards further education, employment or entrepreneurial pathways.",
  },
  // ---- Area tags: Course facilitator ----
  "learning-design": {
    label: "Learning design",
    kind: "area",
    function: "course-facilitator",
    order: 0,
    blurb:
      "Deciding what is worth learning and what success looks like - and designing a journey that gets learners there.",
  },
  "learning-facilitation": {
    label: "Learning facilitation",
    kind: "area",
    function: "course-facilitator",
    order: 1,
    blurb:
      "Running the room well - making thinking visible, handling difficulty with care, and meeting learners where they are.",
  },
  "improving-practice": {
    label: "Improving learning design & facilitation",
    kind: "area",
    function: "course-facilitator",
    order: 2,
    blurb:
      "Getting better together - opening your practice to colleagues and learners, and acting on what you find.",
  },
  // ---- Area tags: Assessor ----
  "seeking-evidence": {
    label: "Seeking evidence of proficiency",
    kind: "area",
    function: "assessor",
    order: 0,
    blurb:
      "Building the fullest possible picture of what a learner can do - by knowing them well, questioning them, and watching them work in real contexts.",
  },
  "making-judgements": {
    label: "Making the judgement",
    kind: "area",
    function: "assessor",
    order: 1,
    blurb:
      "Bringing the evidence together to judge a competency against the proficiency scale - fairly, holistically, and with others.",
  },
  "assessment-tools": {
    label: "Assessment tools",
    kind: "area",
    function: "assessor",
    order: 2,
    blurb:
      "Structured ways to draw evidence out - competency reflections, showcases, portfolios and rubrics.",
  },
  // ---- Purpose tags (cross-cutting lenses) ----
  "making-thinking-visible": {
    label: "Making thinking visible",
    kind: "purpose",
    order: 0,
    blurb: "Surfacing what learners actually know and think, so it can be supported and built on.",
  },
  "checking-for-understanding": {
    label: "Checking for understanding",
    kind: "purpose",
    order: 1,
    blurb: "Finding out, in the moment, whether learning has landed - so you know what to do next.",
  },
  questioning: {
    label: "Questioning",
    kind: "purpose",
    order: 2,
    blurb: "Using questions well - to reveal thinking, probe depth, and move learning forward.",
  },
  feedback: {
    label: "Feedback",
    kind: "purpose",
    order: 3,
    blurb: "Giving and using feedback that moves the learner forward rather than judging them.",
  },
  "reflection-self-assessment": {
    label: "Reflection & self-assessment",
    kind: "purpose",
    order: 4,
    blurb: "Helping learners look back, judge their own work, and name what they are learning.",
  },
  "dialogue-climate": {
    label: "Dialogue & climate",
    kind: "purpose",
    order: 5,
    blurb: "Building a safe, inclusive space where hard conversations can happen well.",
  },
};

export function tagMeta(id: string): TagMeta {
  return TAG_META[id] ?? { label: id, blurb: "", kind: "purpose", order: 99 };
}

// The ordered AREA tags belonging to one function - the buckets on that function's page.
export function functionAreas(fn: EducatorFunctionKey): { id: string; meta: TagMeta }[] {
  return Object.entries(TAG_META)
    .filter(([, m]) => m.kind === "area" && m.function === fn)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([id, meta]) => ({ id, meta }));
}

// All cross-cutting purpose tags, ordered - the options for the "filter by purpose" control.
export const PURPOSE_TAGS: { id: string; meta: TagMeta }[] = Object.entries(TAG_META)
  .filter(([, m]) => m.kind === "purpose")
  .sort((a, b) => a[1].order - b[1].order)
  .map(([id, meta]) => ({ id, meta }));

// The three functions an Amala educator can perform. Educators take on one or more of these; few do
// all three, and none do all of them all the time. Buckets are derived from the area tags (TAG_META).
export interface EducatorFunctionMeta {
  key: EducatorFunctionKey;
  label: string;
  blurb: string;
  href: string;
  accent: string;
}

export const EDUCATOR_FUNCTIONS: EducatorFunctionMeta[] = [
  {
    key: "mentor",
    label: "Mentor",
    blurb:
      "Walking alongside individual learners - supporting their academic progress and their wellbeing, and helping them recognise growth and reach their pathways.",
    href: "/educators/mentoring",
    accent: "border-terracotta",
  },
  {
    key: "course-facilitator",
    label: "Course facilitator",
    blurb:
      "Designing and facilitating learning - clarifying what success looks like, making thinking visible, and handling discussion and difficulty well.",
    href: "/educators/course-facilitation",
    accent: "border-teal",
  },
  {
    key: "assessor",
    label: "Assessor of competencies",
    blurb:
      "Judging learners' competencies fairly and with evidence - getting to know learners, seeking evidence of proficiency, and making sound, moderated judgements.",
    href: "/educators/assessment",
    accent: "border-plum",
  },
];

// Educator training module categories (foundation / component / delivery-mode). Label + a one-line
// blurb for the index, and a left-border accent colour matching the site's palette.
export const EDUCATOR_MODULE_CATEGORY: Record<
  string,
  { label: string; blurb: string; accent: string }
> = {
  foundation: {
    label: "Foundation modules",
    blurb: "The groundwork every Amala educator needs, whatever they deliver.",
    accent: "border-navy",
  },
  component: {
    label: "Component modules",
    blurb: "Tied to what a programme is made of - the training a specific component calls for.",
    accent: "border-teal",
  },
  "delivery-mode": {
    label: "Delivery-mode modules",
    blurb: "Needed when a programme is delivered in a particular way, such as fully online.",
    accent: "border-plum",
  },
};

export const CONTEXT_LABEL: Record<string, string> = {
  group: "Group",
  "one-to-one-mentoring": "One-to-one mentoring",
  independent: "Independent",
};

// Downloadable-artefact roles (Build Spec - worksheet/template distinction). The label is the group
// heading a download renders under; `order` sets a stable reading order (explainer → worksheet →
// example → template) so the guided sheet leads and the blank template trails. Untagged downloads
// fall back to a generic group, ordered last.
export interface DownloadRoleMeta {
  label: string;
  order: number;
}

const DOWNLOAD_ROLE_META: Record<string, DownloadRoleMeta> = {
  explainer: { label: "The method explained", order: 0 },
  worksheet: { label: "Guided worksheet", order: 1 },
  example: { label: "Worked example", order: 2 },
  template: { label: "Blank template", order: 3 },
};

const DOWNLOAD_ROLE_FALLBACK: DownloadRoleMeta = { label: "Other resources", order: 4 };

export function downloadRoleMeta(role?: string | null): DownloadRoleMeta {
  return (role && DOWNLOAD_ROLE_META[role]) || DOWNLOAD_ROLE_FALLBACK;
}

export function creditBadge(level: string): string {
  return level === "Foundational"
    ? "bg-navy/10 text-navy"
    : "bg-gold/20 text-terracotta";
}

// ---- Rights and provenance (see RightsSchema in lib/schema.ts) ----
// `label` names the status for an editor; `blurb` says what it means for whoever is about to use the
// material. Two statuses block publication entirely and are enforced in validateGraph().
export type RightsMeta = { label: string; blurb: string; tone: "neutral" | "notice" | "blocked" };

export const RIGHTS_META: Record<string, RightsMeta> = {
  "amala-own": {
    label: "Amala's own",
    blurb: "Written by Amala, or built only from Amala's own course materials.",
    tone: "neutral",
  },
  "own-expression": {
    label: "Our words, credited method",
    blurb:
      "The method is someone else's, or has no traceable author. Nothing on this page is copied: the write-up is Amala's own, and the originator is credited where known.",
    tone: "neutral",
  },
  "public-domain": {
    label: "Public domain",
    blurb: "Out of copyright, or a method that copyright does not reach.",
    tone: "neutral",
  },
  "openly-licensed": {
    label: "Openly licensed",
    blurb: "Third-party work under a licence that permits us to republish it.",
    tone: "neutral",
  },
  cleared: {
    label: "Permission held",
    blurb: "Third-party work we have written permission to publish.",
    tone: "neutral",
  },
  "linked-not-reproduced": {
    label: "Linked, not reproduced",
    blurb:
      "The original is someone else's and is not reproduced here. This page explains the method and how to use it; you obtain the activity itself from the source.",
    tone: "notice",
  },
  "permission-needed": {
    label: "Permission needed",
    blurb: "Third-party work reproduced here without permission. Not publishable.",
    tone: "blocked",
  },
  "unknown-provenance": {
    label: "Provenance unknown",
    blurb: "We cannot establish where this came from, so we cannot clear it. Not publishable.",
    tone: "blocked",
  },
};

export function rightsMeta(status: string): RightsMeta {
  return (
    RIGHTS_META[status] ?? { label: status, blurb: "", tone: "neutral" as const }
  );
}
