import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  competencies,
  getArea,
  getCompetencyByCode,
  getEvidenceForCompetency,
  proficiencyScale,
} from "@/lib/content";
import { areaStyle, creditBadge } from "@/lib/ui";

export function generateStaticParams() {
  return competencies.map((c) => ({ code: c.code.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const c = getCompetencyByCode(code.toUpperCase());
  return { title: c ? `${c.code} — ${c.title}` : "Competency" };
}

export default async function CompetencyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const comp = getCompetencyByCode(code.toUpperCase());
  if (!comp) notFound();

  const area = getArea(comp.areaId);
  const s = areaStyle(comp.areaId);
  const evidence = getEvidenceForCompetency(comp.code);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <nav className="text-sm text-cool-grey">
        <Link href="/competencies" className="hover:text-navy hover:underline">
          Competencies
        </Link>
        {area && <span> · {area.title}</span>}
      </nav>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm font-semibold text-cool-grey">{comp.code}</span>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${creditBadge(comp.creditLevel)}`}>
          {comp.creditLevel}
        </span>
      </div>
      <h1 className={`mt-2 font-heading text-3xl font-bold ${s.text}`}>{comp.title}</h1>
      {comp.goal && <p className="mt-4 text-lg text-dark-navy">{comp.goal}</p>}

      {/* Proficiency scale, read through this competency's goal */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-dark-navy">Proficiency scale</h2>
        <p className="mt-1 text-sm text-cool-grey">
          One shared, cumulative rubric read against the goal above. Progression:{" "}
          {proficiencyScale.progressionAxes}.
        </p>
        <ol className="mt-4 space-y-3">
          {proficiencyScale.levels.map((lvl) => (
            <li
              key={lvl.id}
              className={`rounded-lg border-l-4 p-4 ${
                lvl.creditAwarded ? "border-olive bg-olive/5" : "border-cool-grey/40 bg-cool-grey/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-semibold text-dark-navy">{lvl.title}</span>
                <span className="text-xs text-cool-grey">
                  GPA {lvl.gpa}
                  {lvl.creditAwarded ? " · credit" : ""}
                </span>
              </div>
              <p className="mt-1 text-sm text-dark-navy/90">{lvl.genericDescriptor}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Reverse web: where this competency is evidenced */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-dark-navy">
          Evidenced in {evidence.length} {evidence.length === 1 ? "objective" : "objectives"}
        </h2>
        {evidence.length === 0 ? (
          <p className="mt-2 text-cool-grey">No course objective currently evidences this competency.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {evidence.map((e, i) => (
              <li key={i} className="rounded-lg border border-cool-grey/20 bg-white p-4 shadow-sm">
                <Link
                  href={`/courses/${e.courseSlug}`}
                  className="font-heading font-semibold text-navy hover:underline"
                >
                  {e.courseTitle}
                </Link>
                <p className="mt-1 text-sm font-medium text-dark-navy">{e.objectiveStatement}</p>
                <p className="mt-1 text-sm text-cool-grey">{e.condition}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
