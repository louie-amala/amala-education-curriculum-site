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
};

export function typeMeta(type: string): TypeMeta {
  return TYPE_META[type] ?? TYPE_META.resource;
}

export const CONTEXT_LABEL: Record<string, string> = {
  group: "Group",
  "one-to-one-mentoring": "One-to-one mentoring",
  independent: "Independent",
};

export function creditBadge(level: string): string {
  return level === "Foundational"
    ? "bg-navy/10 text-navy"
    : "bg-gold/20 text-terracotta";
}
