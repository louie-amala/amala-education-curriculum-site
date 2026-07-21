import type { Metadata } from "next";
import Link from "next/link";
import { areas, getAreaCompetencies, getEvidenceForCompetency } from "@/lib/content";
import { areaStyle, creditBadge } from "@/lib/ui";

export const metadata: Metadata = { title: "Competencies" };

export default function CompetenciesIndex() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-heading text-3xl font-bold text-navy">Competencies</h1>
      <p className="mt-2 max-w-2xl text-cool-grey">
        Seven areas, 47 competencies. Each is Foundational or Advanced; Foundational competencies
        are required for the GSD. Select one to see every course and objective that evidences it.
      </p>

      <div className="mt-10 space-y-10">
        {areas.map((area) => {
          const s = areaStyle(area.id);
          const comps = getAreaCompetencies(area.id);
          return (
            <section key={area.id}>
              <div className="flex items-baseline gap-3">
                <span className={`h-3 w-3 rounded-full ${s.dot}`} aria-hidden />
                <h2 className={`font-heading text-xl font-semibold ${s.text}`}>{area.title}</h2>
              </div>
              {area.gloss && <p className="ml-6 mt-1 text-sm italic text-cool-grey">{area.gloss}</p>}
              <ul className="ml-6 mt-4 grid gap-3 sm:grid-cols-2">
                {comps.map((c) => {
                  const uses = getEvidenceForCompetency(c.code).length;
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/competencies/${c.code.toLowerCase()}`}
                        className={`block rounded-lg border-l-4 ${s.border} border-y border-r border-cool-grey/20 bg-white p-4 shadow-sm transition hover:shadow-md`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-cool-grey">{c.code}</span>
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${creditBadge(c.creditLevel)}`}>
                            {c.creditLevel}
                          </span>
                        </div>
                        <p className="mt-1 font-medium text-dark-navy">{c.title}</p>
                        <p className="mt-1 text-xs text-cool-grey">
                          {uses} evidencing {uses === 1 ? "objective" : "objectives"}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
