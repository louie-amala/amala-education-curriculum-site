import type { Opportunity, OpportunityKind } from "@/lib/schema";

// Shared vocabulary + the deadline logic for the opportunities board.
//
// IMPORTANT: every function that depends on "today" takes `now` as an argument and is called from a
// client component. The site is statically built, so anything date-derived that were baked into the
// HTML would be wrong by the next morning - and a closed opportunity shown as open is the single
// worst failure this board can have. See docs/PATHWAY-OPPORTUNITIES-PLAN.md, "Freshness & trust".

export const KIND_META: Record<OpportunityKind, { label: string; short: string; accent: string; chip: string }> = {
  "further-education": {
    label: "Further education & training",
    short: "Education",
    accent: "border-navy",
    chip: "bg-navy/10 text-navy",
  },
  employment: {
    label: "Employment & work experience",
    short: "Work",
    accent: "border-teal",
    chip: "bg-teal/10 text-teal",
  },
  entrepreneurship: {
    label: "Entrepreneurship & livelihoods",
    short: "Enterprise",
    accent: "border-olive",
    chip: "bg-olive/10 text-olive",
  },
  funding: {
    label: "Funding",
    short: "Funding",
    accent: "border-gold",
    chip: "bg-gold/15 text-[#8a6300]",
  },
  "fellowships-competitions": {
    label: "Fellowships, competitions & exchange",
    short: "Fellowship",
    accent: "border-plum",
    chip: "bg-plum/10 text-plum",
  },
  "guidance-support": {
    label: "Guidance, networks & support",
    short: "Support",
    accent: "border-terracotta",
    chip: "bg-terracotta/10 text-terracotta",
  },
};

export const MODE_LABEL: Record<string, string> = {
  online: "Online",
  "in-person": "In person",
  hybrid: "Hybrid",
  "by-post-or-phone": "By post or phone",
};

export const CONNECTIVITY_LABEL: Record<string, string> = {
  "none-needed": "No internet needed",
  "low-bandwidth": "Works on low bandwidth",
  "stable-internet": "Needs stable internet",
};

export const DEVICE_LABEL: Record<string, string> = {
  none: "No device needed",
  "shared-phone": "A shared phone is enough",
  "own-phone": "Needs your own phone",
  computer: "Needs a computer",
};

export const PROVIDER_TYPE_LABEL: Record<string, string> = {
  "un-agency": "UN agency",
  ngo: "NGO",
  university: "University",
  employer: "Employer",
  government: "Government",
  company: "Company",
  community: "Community organisation",
};

export const APPLIED_BY_LABEL: Record<string, string> = {
  learner: "You apply yourself",
  educator: "An educator applies for you",
  "team-with-educator": "A team applies, led by an educator",
  institution: "Your school or organisation applies",
  "third-party": "An employer opts in - you do not apply",
  referral: "You are referred to this service",
};

/** The call to action, which changes entirely with who submits. */
export function callToAction(o: Opportunity): string {
  switch (o.applicant.appliedBy) {
    case "educator":
    case "team-with-educator":
      return "Bring this to an educator or facilitator";
    case "institution":
      return "Ask your school or organisation to apply";
    case "third-party":
      return "Share this with an employer";
    case "referral":
      return "Ask how to be referred";
    default:
      return "How to apply";
  }
}

export type DeadlineState =
  | { kind: "rolling"; label: string; tone: "open" }
  | { kind: "open"; label: string; tone: "open"; days: number }
  | { kind: "closing"; label: string; tone: "closing"; days: number }
  | { kind: "closed"; label: string; tone: "closed" }
  | { kind: "unknown"; label: string; tone: "neutral" };

const DAY = 24 * 60 * 60 * 1000;

function daysBetween(fromISO: string, now: Date): number {
  const target = Date.parse(`${fromISO}T23:59:59Z`);
  if (Number.isNaN(target)) return NaN;
  // floor, never ceil: telling a learner they have 5 days when they have 4 is the one
  // rounding error this must not make.
  return Math.floor((target - now.getTime()) / DAY);
}

/**
 * Computed in the browser, never at build time. `now` is injected so this stays pure and testable.
 */
export function deadlineState(o: Opportunity, now: Date): DeadlineState {
  const d = o.requirements.deadline;
  if (d.type === "rolling") return { kind: "rolling", label: "Always open", tone: "open" };
  if (!d.date) {
    if (d.opensAround) {
      return { kind: "unknown", label: `Opens around ${d.opensAround}`, tone: "neutral" };
    }
    return { kind: "unknown", label: "Deadline not stated", tone: "neutral" };
  }
  const days = daysBetween(d.date, now);
  if (Number.isNaN(days)) return { kind: "unknown", label: "Deadline not stated", tone: "neutral" };
  if (days < 0) {
    // Closed, but the big opportunities are annual - so say when it comes back rather than hiding it.
    return {
      kind: "closed",
      label: d.opensAround ? `Closed - opens around ${d.opensAround}` : "Closed",
      tone: "closed",
    };
  }
  if (days === 0) return { kind: "closing", label: "Closes today", tone: "closing", days };
  if (days <= 30) {
    return {
      kind: "closing",
      label: days === 1 ? "Closes tomorrow" : `Closes in ${days} days`,
      tone: "closing",
      days,
    };
  }
  return { kind: "open", label: `Closes ${formatDate(d.date)}`, tone: "open", days };
}

export function formatDate(iso: string): string {
  const t = Date.parse(`${iso}T12:00:00Z`);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "Checked 3 weeks ago", degrading to a warning once past the review interval. */
export function freshness(
  o: Opportunity,
  now: Date,
): { label: string; stale: boolean } {
  const { lastVerified, reviewEveryDays, status } = o.verification;
  if (status !== "verified" || !lastVerified) {
    return { label: "Not yet checked by Amala", stale: true };
  }
  const age = Math.floor((now.getTime() - Date.parse(`${lastVerified}T12:00:00Z`)) / DAY);
  if (Number.isNaN(age)) return { label: "Not yet checked by Amala", stale: true };
  const stale = age > reviewEveryDays;
  if (stale) return { label: "Not checked recently - confirm before applying", stale };
  if (age <= 1) return { label: "Checked today", stale };
  if (age < 14) return { label: `Checked ${age} days ago`, stale };
  if (age < 60) return { label: `Checked ${Math.floor(age / 7)} weeks ago`, stale };
  return { label: `Checked ${Math.floor(age / 30)} months ago`, stale };
}

/** Where the opportunity happens, as one short string. */
export function placeLabel(o: Opportunity): string {
  if (o.delivery.mode === "online") return "Online";
  const loc = o.delivery.location;
  const place = loc?.place ?? null;
  const country = loc?.country ? titleCase(loc.country) : null;
  // Don't print "Senior schools in Kenya, Kenya" when the place already names the country.
  const needsCountry =
    country && !(place && place.toLowerCase().includes(country.toLowerCase()));
  const parts = [place, needsCountry ? country : null].filter(Boolean);
  return parts.length ? parts.join(", ") : MODE_LABEL[o.delivery.mode] ?? o.delivery.mode;
}

/** Where you must be living to apply. The most decisive filter on the board. */
export function eligibleWhereLabel(o: Opportunity): string {
  const r = o.eligibility.residingIn;
  if (!r.resolved) return "Eligible countries not confirmed";
  if (r.countries.length === 0) return "Anywhere";
  const named = r.countries.map(titleCase);
  const head = r.place ? `${r.place}, ` : "";
  return head + (named.length > 3 ? `${named.slice(0, 3).join(", ")} +${named.length - 3}` : named.join(", "));
}

// Country slugs that title-casing gets wrong.
const NAME_OVERRIDES: Record<string, string> = {
  usa: "USA",
  uk: "UK",
  drc: "DRC",
  "south-sudan": "South Sudan",
};

export function titleCase(slug: string): string {
  const override = NAME_OVERRIDES[slug];
  if (override) return override;
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Does this entry claim funding while hiding the gap? Drives the "still to pay" block. */
export function hasFundingGap(o: Opportunity): boolean {
  return o.requirements.cost.fundingExcludes.length > 0;
}


