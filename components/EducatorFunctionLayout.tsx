import type { ReactNode } from "react";
import Link from "next/link";
import { MaterialCard } from "@/components/MaterialCard";
import type { FacilitationMaterial } from "@/lib/schema";

export interface MoveBucket {
  id: string;
  label: string;
  blurb: string;
  moves: FacilitationMaterial[];
}

// Shared layout for an educator-function page (mentor / course facilitator / assessor): a hero with a
// breadcrumb back to the hub, an optional notice, then the moves grouped into buckets.
export function EducatorFunctionLayout({
  functionLabel,
  title,
  intro,
  notice,
  buckets,
  emptyLabel,
}: {
  functionLabel: string;
  title: string;
  intro: ReactNode;
  notice?: ReactNode;
  buckets: MoveBucket[];
  emptyLabel: string;
}) {
  return (
    <main>
      <section className="bg-navy px-6 py-14 text-white">
        <div className="mx-auto max-w-4xl">
          <nav className="text-sm text-white/70">
            <Link href="/educators" className="hover:text-white hover:underline">
              Educators
            </Link>
            <span className="px-2">/</span>
            <span className="text-white/90">{functionLabel}</span>
          </nav>
          <h1 className="mt-3 font-heading text-4xl font-bold">{title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/85">{intro}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {notice}

        {buckets.every((b) => b.moves.length === 0) ? (
          <p className="mt-2 rounded-lg bg-cool-grey/5 p-4 text-cool-grey">{emptyLabel}</p>
        ) : (
          <div className={`${notice ? "mt-10" : ""} space-y-12`}>
            {buckets
              .filter((b) => b.moves.length > 0)
              .map((b) => (
                <section key={b.id} id={b.id} className="scroll-mt-24">
                  <h2 className="font-heading text-2xl font-semibold text-navy">{b.label}</h2>
                  <p className="mt-2 max-w-3xl text-cool-grey">{b.blurb}</p>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {b.moves.map((m) => (
                      <li key={m.slug}>
                        <MaterialCard
                          material={{
                            slug: m.slug,
                            title: m.title,
                            summary: m.summary,
                            type: m.type,
                            facilitationContext: m.facilitationContext,
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        )}
      </div>
    </main>
  );
}

// Group a function's moves into ordered buckets from the area-meta map. Reused by every function page.
export function bucketise(
  moves: FacilitationMaterial[],
  field: "mentorRole" | "facilitationArea" | "assessmentArea",
  areaMeta: Record<string, { label: string; blurb: string; order: number }>,
): MoveBucket[] {
  return Object.entries(areaMeta)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([id, meta]) => ({
      id,
      label: meta.label,
      blurb: meta.blurb,
      moves: moves.filter((m) => m[field] === id),
    }));
}
