// Colour-encoding for competency areas (Build Spec §9.1 — use colour to aid scannability).
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

// The five parts of the mentor role an educator move can belong to (see MentorRoleSchema). `blurb`
// heads each bucket on /educator-moves; `order` fixes the reading order (wellbeing → safeguarding →
// progress → recognising growth → pathways).
export interface MentorRoleMeta {
  label: string;
  blurb: string;
  order: number;
}

export const MENTOR_ROLE_META: Record<string, MentorRoleMeta> = {
  wellbeing: {
    label: "Wellbeing & belonging",
    blurb:
      "Helping mentees feel safe, supported and able to raise concerns — and building their own tools for the challenges they face.",
    order: 0,
  },
  safeguarding: {
    label: "Safeguarding & referral",
    blurb:
      "Protecting mentees from harm by knowing and following your setting's own safeguarding policy and referral pathways. These moves never replace that policy.",
    order: 1,
  },
  progress: {
    label: "Progress & achievement",
    blurb:
      "Coaching mentees through their work, tracking how they are doing, and giving feedback that moves them forward.",
    order: 2,
  },
  "recognising-growth": {
    label: "Recognising & evidencing growth",
    blurb:
      "Helping mentees notice, name and evidence the skills they are developing — including from life outside the classroom.",
    order: 3,
  },
  pathways: {
    label: "Pathways & futures",
    blurb:
      "Supporting mentees to identify, apply for and move towards further education, employment or entrepreneurial pathways.",
    order: 4,
  },
};

export function mentorRoleMeta(role: string): MentorRoleMeta {
  return MENTOR_ROLE_META[role] ?? { label: role, blurb: "", order: 99 };
}

// Buckets within the course-facilitator function (mirrors the Course Facilitator Playbook's sections).
export const FACILITATION_AREA_META: Record<string, MentorRoleMeta> = {
  "learning-design": {
    label: "Learning design",
    blurb:
      "Deciding what is worth learning and what success looks like — and designing a journey that gets learners there.",
    order: 0,
  },
  "learning-facilitation": {
    label: "Learning facilitation",
    blurb:
      "Running the room well — making thinking visible, handling difficulty with care, and meeting learners where they are.",
    order: 1,
  },
  "improving-practice": {
    label: "Improving learning design & facilitation",
    blurb:
      "Getting better together — opening your practice to colleagues and learners, and acting on what you find.",
    order: 2,
  },
};

// Buckets within the assessor function. The competency lives in the person, not the artefact: build a
// picture of proficiency, judge it against the scale, and use tools to draw evidence out.
export const ASSESSMENT_AREA_META: Record<string, MentorRoleMeta> = {
  "seeking-evidence": {
    label: "Seeking evidence of proficiency",
    blurb:
      "Building the fullest possible picture of what a learner can do — by knowing them well, questioning them, and watching them work in real contexts.",
    order: 0,
  },
  "making-judgements": {
    label: "Making the judgement",
    blurb:
      "Bringing the evidence together to judge a competency against the proficiency scale — fairly, holistically, and with others.",
    order: 1,
  },
  "assessment-tools": {
    label: "Assessment tools",
    blurb:
      "Structured ways to draw evidence out — competency reflections, showcases, portfolios and rubrics.",
    order: 2,
  },
};

// The three functions an Amala educator can perform. Educators take on one or more of these; few do
// all three, and none do all of them all the time. Each function has its own set of educator moves.
export interface EducatorFunctionMeta {
  key: string;
  label: string;
  blurb: string;
  href: string;
  // Whether the function's moves are authored yet. Un-built functions are shown on the hub but not
  // linked, so we never surface an empty page.
  status: "active" | "in-development";
  accent: string;
  // The material field that assigns a move to this function, and the bucket metadata within it.
  field: "mentorRole" | "facilitationArea" | "assessmentArea";
  areas: Record<string, MentorRoleMeta>;
}

export const EDUCATOR_FUNCTIONS: EducatorFunctionMeta[] = [
  {
    key: "mentor",
    label: "Mentor",
    blurb:
      "Walking alongside individual learners — supporting their academic progress and their wellbeing, and helping them recognise growth and reach their pathways.",
    href: "/educators/mentoring",
    status: "active",
    accent: "border-terracotta",
    field: "mentorRole",
    areas: MENTOR_ROLE_META,
  },
  {
    key: "course-facilitator",
    label: "Course facilitator",
    blurb:
      "Designing and facilitating learning — clarifying what success looks like, making thinking visible, and handling discussion and difficulty well.",
    href: "/educators/course-facilitation",
    status: "active",
    accent: "border-teal",
    field: "facilitationArea",
    areas: FACILITATION_AREA_META,
  },
  {
    key: "assessor",
    label: "Assessor of competencies",
    blurb:
      "Judging learners' competencies fairly and with evidence — getting to know learners, seeking evidence of proficiency, and making sound, moderated judgements.",
    href: "/educators/assessment",
    status: "active",
    accent: "border-plum",
    field: "assessmentArea",
    areas: ASSESSMENT_AREA_META,
  },
];

export const CONTEXT_LABEL: Record<string, string> = {
  group: "Group",
  "one-to-one-mentoring": "One-to-one mentoring",
  independent: "Independent",
};

// Downloadable-artefact roles (Build Spec — worksheet/template distinction). The label is the group
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
