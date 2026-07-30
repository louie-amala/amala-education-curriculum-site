"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { SearchKind, SearchRecord } from "@/lib/content";

// Order groups appear in the results.
const KIND_ORDER: SearchKind[] = [
  "Material",
  "Module",
  "Course",
  "Competency",
  "Objective",
  "Glossary",
  "Programme",
  "Foundation",
];

const KIND_GROUP_LABEL: Record<SearchKind, string> = {
  Material: "Materials",
  Module: "Modules",
  Course: "Courses",
  Competency: "Competencies",
  Objective: "Objectives",
  Glossary: "Glossary",
  Programme: "Programmes",
  Foundation: "Foundations",
};

const BADGE_CLASS: Record<SearchKind, string> = {
  Material: "bg-teal/10 text-teal",
  Module: "bg-plum/10 text-plum",
  Course: "bg-navy/10 text-navy",
  Competency: "bg-olive/15 text-olive",
  Objective: "bg-dark-navy/10 text-dark-navy",
  Glossary: "bg-orange/10 text-orange",
  Programme: "bg-terracotta/10 text-terracotta",
  Foundation: "bg-cool-grey/15 text-cool-grey",
};

interface Scored {
  record: SearchRecord;
  score: number;
}

// Split a query into lowercased tokens.
function tokens(q: string): string[] {
  return q.toLowerCase().split(/\s+/).filter(Boolean);
}

function scoreRecord(record: SearchRecord, qTokens: string[]): number {
  const title = record.title.toLowerCase();
  const subtitle = record.subtitle.toLowerCase();
  const keywords = record.keywords.toLowerCase();
  const haystack = `${title} ${subtitle} ${keywords}`;

  let score = 0;
  for (const t of qTokens) {
    if (!haystack.includes(t)) return 0; // every token must appear (AND)
    if (title.startsWith(t)) score += 6;
    else if (title.includes(t)) score += 4;
    else if (subtitle.includes(t)) score += 2;
    else score += 1; // keyword-only hit
  }
  return score;
}

export function SearchExplorer({ index }: { index: SearchRecord[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initial);

  // Keep the box in sync if the user navigates with a different ?q= (e.g. header search).
  useEffect(() => {
    setQuery(initial);
  }, [initial]);

  // Reflect the query in the URL (replace, so we don't spam history) for shareable links.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (query === current) return;
    const t = setTimeout(() => {
      const qs = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      router.replace(`/search${qs}`, { scroll: false });
    }, 250);
    return () => clearTimeout(t);
  }, [query, router, searchParams]);

  const results = useMemo(() => {
    const qTokens = tokens(query);
    if (qTokens.length === 0) return [] as Scored[];
    const scored: Scored[] = [];
    for (const record of index) {
      const score = scoreRecord(record, qTokens);
      if (score > 0) scored.push({ record, score });
    }
    scored.sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title));
    return scored;
  }, [index, query]);

  const grouped = useMemo(() => {
    const byKind = new Map<SearchKind, SearchRecord[]>();
    for (const { record } of results) {
      const list = byKind.get(record.kind);
      if (list) list.push(record);
      else byKind.set(record.kind, [record]);
    }
    return KIND_ORDER.filter((k) => byKind.has(k)).map((k) => ({
      kind: k,
      label: KIND_GROUP_LABEL[k],
      records: byKind.get(k)!,
    }));
  }, [results]);

  const trimmed = query.trim();

  return (
    <div>
      <div className="relative">
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search materials, courses, competencies, glossary…"
          aria-label="Search the curriculum"
          className="w-full rounded-lg border border-cool-grey/40 bg-white px-4 py-3 text-dark-navy shadow-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
        />
      </div>

      {trimmed === "" ? (
        <p className="mt-6 text-cool-grey">
          Start typing to search across everything: activities and resources, courses, competencies,
          learning objectives, glossary terms, programmes, and the foundations.
        </p>
      ) : results.length === 0 ? (
        <p className="mt-6 rounded-lg bg-cool-grey/5 p-4 text-cool-grey">
          Nothing matches “{trimmed}”. Try fewer or different words.
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm text-cool-grey">
            {results.length} {results.length === 1 ? "result" : "results"} for “{trimmed}”
          </p>
          <div className="mt-4 space-y-8">
            {grouped.map((group) => (
              <section key={group.kind}>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-cool-grey">
                  {group.label} ({group.records.length})
                </h2>
                <ul className="mt-3 space-y-2">
                  {group.records.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={r.url}
                        className="block rounded-lg border border-cool-grey/20 bg-white p-4 transition hover:border-navy/40 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-heading font-semibold text-navy">{r.title}</span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_CLASS[r.kind]}`}
                          >
                            {r.kindLabel}
                          </span>
                        </div>
                        {r.subtitle && (
                          <p className="mt-1 text-sm text-cool-grey">{r.subtitle}</p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
