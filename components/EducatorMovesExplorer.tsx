"use client";

import { useState } from "react";
import Link from "next/link";

export interface ExplorerMove {
  slug: string;
  title: string;
  summary: string | null;
  // The context-specific note for the bucket this move is shown under (falls back to summary).
  how: string | null;
  purposes: { id: string; label: string }[];
}

export interface ExplorerBucket {
  id: string;
  label: string;
  blurb: string;
  moves: ExplorerMove[];
}

// Client-side explorer for a function page: a "filter by purpose" control over the moves, grouped into
// their area buckets. A move can appear under more than one bucket, with the right note in each.
export function EducatorMovesExplorer({
  buckets,
  purposeOptions,
}: {
  buckets: ExplorerBucket[];
  purposeOptions: { id: string; label: string }[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const matches = (m: ExplorerMove) =>
    selected.size === 0 || m.purposes.some((p) => selected.has(p.id));

  const shown = buckets
    .map((b) => ({ ...b, moves: b.moves.filter(matches) }))
    .filter((b) => b.moves.length > 0);

  return (
    <div>
      {purposeOptions.length > 0 && (
        <div className="mt-8 rounded-lg border border-cool-grey/20 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cool-grey">
            Filter by purpose
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {purposeOptions.map((p) => {
              const on = selected.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(p.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    on
                      ? "border-navy bg-navy text-white"
                      : "border-cool-grey/40 bg-white text-dark-navy hover:border-navy/50"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="rounded-full px-3 py-1 text-sm text-cool-grey underline hover:text-navy"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="mt-8 rounded-lg bg-cool-grey/5 p-4 text-cool-grey">
          No moves match that filter.
        </p>
      ) : (
        <div className="mt-10 space-y-12">
          {shown.map((bucket) => (
            <section key={bucket.id} id={bucket.id} className="scroll-mt-24">
              <h2 className="font-heading text-2xl font-semibold text-navy">{bucket.label}</h2>
              <p className="mt-2 max-w-3xl text-cool-grey">{bucket.blurb}</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {bucket.moves.map((m) => (
                  <li key={m.slug}>
                    <Link
                      href={`/materials/${m.slug}`}
                      className="block h-full rounded-lg border-l-4 border-terracotta border-y border-r border-cool-grey/20 bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                      <span className="rounded bg-terracotta/10 px-2 py-0.5 text-xs font-medium text-terracotta">
                        Educator move
                      </span>
                      <h3 className="mt-2 font-heading font-semibold text-dark-navy">{m.title}</h3>
                      <p className="mt-1 text-sm text-cool-grey">{m.how ?? m.summary}</p>
                      {m.purposes.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {m.purposes.map((p) => (
                            <span
                              key={p.id}
                              className="rounded-full bg-navy/[0.06] px-2 py-0.5 text-[11px] font-medium text-navy"
                            >
                              {p.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
