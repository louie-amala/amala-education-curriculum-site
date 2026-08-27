"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CONNECTIVITY_LABEL,
  DEVICE_LABEL,
  KIND_META,
  MODE_LABEL,
  deadlineState,
  eligibleWhereLabel,
  freshness,
  placeLabel,
  titleCase,
} from "@/lib/opportunities";
import type { Opportunity } from "@/lib/schema";

// The board. Every date-derived value is computed AFTER mount from a client clock - the site is
// statically built, so a "closes in 4 days" baked into the HTML would be wrong tomorrow.

const KIND_OPTIONS = Object.entries(KIND_META).map(([value, m]) => ({ value, label: m.label }));

const MODE_OPTIONS = [
  { value: "online", label: "Online" },
  { value: "in-person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
  { value: "by-post-or-phone", label: "By post or phone" },
];

const DEADLINE_OPTIONS = [
  { value: "open", label: "Open now" },
  { value: "closing", label: "Closing within 30 days" },
  { value: "rolling", label: "Always open" },
  { value: "closed", label: "Closed (but returns)" },
];

const COST_OPTIONS = [
  { value: "free-to-apply", label: "Free to apply" },
  { value: "funded", label: "Funded place" },
  { value: "paid", label: "Pays you" },
];

const DOC_OPTIONS = [
  { value: "no-passport", label: "No passport needed" },
  { value: "no-documents", label: "No documents needed" },
];

const CONNECTIVITY_OPTIONS = [
  { value: "none-needed", label: "No internet needed" },
  { value: "low-bandwidth", label: "Works on low bandwidth" },
];

const SORTS = [
  { value: "closing", label: "Closing soonest" },
  { value: "checked", label: "Recently checked" },
  { value: "title", label: "A–Z" },
];

export function OpportunitiesBrowser({ items }: { items: Opportunity[] }) {
  // null until mounted, so server and client render the same HTML.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [mode, setMode] = useState("all");
  const [where, setWhere] = useState("all");
  const [deadline, setDeadline] = useState("all");
  const [cost, setCost] = useState("all");
  const [docs, setDocs] = useState("all");
  const [conn, setConn] = useState("all");
  const [sort, setSort] = useState("closing");

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const o of items) for (const c of o.eligibility.residingIn.countries) set.add(c);
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const rows = items.filter((o) => {
      if (kind !== "all" && o.kind !== kind) return false;
      if (mode !== "all" && o.delivery.mode !== mode) return false;
      if (where !== "all") {
        const r = o.eligibility.residingIn;
        // An entry open worldwide matches every country; one that names countries must include it.
        const open = r.resolved && r.countries.length === 0;
        if (!open && !r.countries.includes(where)) return false;
      }
      if (cost !== "all") {
        const c = o.requirements.cost;
        if (cost === "free-to-apply" && c.toApply !== "free") return false;
        if (cost === "funded" && c.toParticipate !== "funded") return false;
        if (cost === "paid" && !o.support.includes("stipend")) return false;
      }
      if (docs !== "all") {
        const d = o.requirements.documents;
        if (docs === "no-passport" && d.passportRequired !== false) return false;
        if (docs === "no-documents" && d.required.length > 0) return false;
      }
      if (conn !== "all") {
        const need = o.needs?.connectivity;
        if (conn === "none-needed" && need !== "none-needed") return false;
        if (conn === "low-bandwidth" && !(need === "none-needed" || need === "low-bandwidth"))
          return false;
      }
      if (deadline !== "all" && now) {
        const st = deadlineState(o, now);
        if (deadline === "open" && (st.kind === "closed" || st.kind === "unknown")) return false;
        if (deadline === "closing" && st.kind !== "closing") return false;
        if (deadline === "rolling" && st.kind !== "rolling") return false;
        if (deadline === "closed" && st.kind !== "closed") return false;
      }
      // Closed entries are de-emphasised but never hidden by default: a learner researching for next
      // year needs to know the big annual programmes exist, and when they come back.
      if (tokens.length > 0) {
        const hay = `${o.title} ${o.summary} ${o.provider.name} ${o.subKind ?? ""} ${o.kind} ${
          o.whoItIsFor ?? ""
        }`.toLowerCase();
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    });

    return rows.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "checked") {
        return (b.verification.lastVerified ?? "").localeCompare(a.verification.lastVerified ?? "");
      }
      // closing soonest: live deadlines first, then rolling, then closed
      const rank = (o: Opportunity) => {
        if (!now) return 2;
        const st = deadlineState(o, now);
        if (st.kind === "closing" || st.kind === "open") return 0;
        if (st.kind === "rolling") return 1;
        if (st.kind === "unknown") return 2;
        return 3;
      };
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      const da = a.requirements.deadline.date ?? "9999";
      const db = b.requirements.deadline.date ?? "9999";
      return da.localeCompare(db);
    });
  }, [items, query, kind, mode, where, deadline, cost, docs, conn, sort, now]);

  const reset = () => {
    setQuery("");
    setKind("all");
    setMode("all");
    setWhere("all");
    setDeadline("all");
    setCost("all");
    setDocs("all");
    setConn("all");
  };

  const anyFilter =
    query || [kind, mode, where, deadline, cost, docs, conn].some((v) => v !== "all");

  return (
    <div>
      <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search opportunities…"
            aria-label="Search opportunities"
            className="min-w-[14rem] flex-1 rounded border border-line bg-white px-3 py-2 text-ink outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
          <p className="text-sm font-medium text-ink-soft">
            {filtered.length} / {items.length} opportunities
          </p>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Category" value={kind} onChange={setKind} all="All categories" options={KIND_OPTIONS} />
          <Select
            label="Where you live"
            value={where}
            onChange={setWhere}
            all="Anywhere"
            options={countries.map((c) => ({ value: c, label: titleCase(c) }))}
          />
          <Select label="How you take part" value={mode} onChange={setMode} all="Any way" options={MODE_OPTIONS} />
          <Select label="Deadline" value={deadline} onChange={setDeadline} all="Any deadline" options={DEADLINE_OPTIONS} />
          <Select label="Cost" value={cost} onChange={setCost} all="Any cost" options={COST_OPTIONS} />
          <Select label="Documents" value={docs} onChange={setDocs} all="Any documents" options={DOC_OPTIONS} />
          <Select label="Internet needed" value={conn} onChange={setConn} all="Any" options={CONNECTIVITY_OPTIONS} />
          <Select label="Sort by" value={sort} onChange={setSort} all={null} options={SORTS} />
        </div>

        {anyFilter && (
          <button
            type="button"
            onClick={reset}
            className="mt-3 text-sm font-medium text-navy underline hover:no-underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-lg border border-line bg-white p-5 text-ink-soft">
          Nothing matches these filters. Try removing the most specific one — most often that is
          &ldquo;where you live&rdquo; or &ldquo;documents&rdquo;.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {filtered.map((o) => (
            <li key={o.slug}>
              <OpportunityRow opportunity={o} now={now} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpportunityRow({ opportunity: o, now }: { opportunity: Opportunity; now: Date | null }) {
  const meta = KIND_META[o.kind];
  const state = now ? deadlineState(o, now) : null;
  const fresh = now ? freshness(o, now) : null;
  const closed = state?.kind === "closed";

  const chips: string[] = [];
  if (o.subKind) chips.push(titleCase(o.subKind));
  chips.push(MODE_LABEL[o.delivery.mode] ?? o.delivery.mode);
  if (o.requirements.cost.toParticipate === "funded") chips.push("Funded");
  if (o.requirements.documents.passportRequired === false) chips.push("No passport needed");
  if (o.needs?.connectivity) chips.push(CONNECTIVITY_LABEL[o.needs.connectivity]);
  if (o.needs?.device && o.needs.device !== "none") chips.push(DEVICE_LABEL[o.needs.device]);
  if (o.delivery.relocation !== "none") chips.push("Includes relocation");
  if (o.eligibility.gender === "women") chips.push("For women");
  if (o.outcome?.placesAvailable) chips.push(`${o.outcome.placesAvailable} places`);

  return (
    <Link
      href={`/opportunities/${o.slug}`}
      className={`block rounded-lg border-l-4 ${meta.accent} border-y border-r border-line bg-white p-4 shadow-sm transition hover:shadow-md ${
        closed ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-lg font-semibold text-dark-navy">{o.title}</h3>
          <p className="mt-0.5 text-sm text-ink-soft">
            {o.provider.name} · {placeLabel(o)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {state && <DeadlinePill state={state} />}
          <p className="mt-1 text-xs text-ink-soft">{eligibleWhereLabel(o)}</p>
        </div>
      </div>

      <p className="mt-2 text-sm text-ink">{o.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${meta.chip}`}>{meta.short}</span>
        {chips.map((c) => (
          <span key={c} className="rounded bg-cool-grey/10 px-2 py-0.5 text-xs text-ink-soft">
            {c}
          </span>
        ))}
        {fresh && (
          <span
            className={`ml-auto text-xs ${fresh.stale ? "font-medium text-terracotta" : "text-ink-soft"}`}
          >
            {fresh.label}
          </span>
        )}
      </div>
    </Link>
  );
}

export function DeadlinePill({ state }: { state: { label: string; tone: string } }) {
  const tone =
    state.tone === "closing"
      ? "bg-orange/15 text-[#8a5200]"
      : state.tone === "closed"
        ? "bg-cool-grey/15 text-ink-soft"
        : state.tone === "open"
          ? "bg-olive/15 text-[#5b6229]"
          : "bg-cool-grey/10 text-ink-soft";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${tone}`}>
      {state.label}
    </span>
  );
}

function Select({
  label,
  value,
  onChange,
  all,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  all: string | null;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-line bg-white px-3 py-2 text-ink outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
      >
        {all && <option value="all">{all}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
