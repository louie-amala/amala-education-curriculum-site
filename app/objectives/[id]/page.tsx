import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MaterialCard } from "@/components/MaterialCard";
import {
  getAllObjectives,
  getCompetencyByCode,
  getMaterialsForObjective,
  getObjectiveById,
} from "@/lib/content";
import { creditBadge } from "@/lib/ui";

export function generateStaticParams() {
  return getAllObjectives().map((o) => ({ id: o.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const o = getObjectiveById(id);
  return { title: o ? `Objective — ${o.course.title}` : "Objective" };
}

export default async function ObjectivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entity = getObjectiveById(id);
  if (!entity) notFound();

  const { course, objective, index } = entity;
  const materials = getMaterialsForObjective(id);
  const byType = (t: string) => materials.filter((m) => m.type === t);
  const groups: { type: string; label: string }[] = [
    { type: "activity", label: "Activities" },
    { type: "tools-approaches", label: "Tools and approaches" },
    { type: "concept", label: "Concepts and theories" },
    { type: "case-study", label: "Case studies" },
    { type: "resource", label: "Resources" },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <nav className="text-sm text-cool-grey">
        <Link href="/courses" className="hover:text-navy hover:underline">Courses</Link>
        {" · "}
        <Link href={`/courses/${course.slug}`} className="hover:text-navy hover:underline">
          {course.title}
        </Link>
      </nav>

      <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-cool-grey">
        Objective {index}
      </p>
      <h1 className="mt-1 font-heading text-2xl font-bold text-navy">{objective.statement}</h1>

      {objective.supportedTo.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-cool-grey">
            Learners are supported to
          </h2>
          <ul className="mt-2 list-disc pl-5 text-dark-navy/90">
            {objective.supportedTo.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Materials that develop this objective */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-dark-navy">
          Materials that develop this objective ({materials.length})
        </h2>
        {materials.length === 0 ? (
          <p className="mt-2 rounded-lg bg-cool-grey/5 p-4 text-sm text-cool-grey">
            No facilitation materials are linked to this objective yet.
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            {groups.map((g) => {
              const items = byType(g.type);
              if (items.length === 0) return null;
              return (
                <div key={g.type}>
                  <h3 className="text-sm font-semibold text-dark-navy">{g.label}</h3>
                  <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                    {items.map((m) => (
                      <li key={m.slug}>
                        <MaterialCard material={m} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Competencies this objective may evidence */}
      {objective.competencyEvidence.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">May evidence</h2>
          <ul className="mt-3 space-y-2">
            {objective.competencyEvidence.map((ev, i) => {
              const c = getCompetencyByCode(ev.code);
              return (
                <li key={i} className="text-sm">
                  <Link
                    href={`/competencies/${ev.code.toLowerCase()}`}
                    className="font-mono text-xs font-semibold text-navy hover:underline"
                  >
                    {ev.code}
                  </Link>{" "}
                  <span className="text-dark-navy">{c?.title ?? ev.citedTitle}</span>
                  {c && (
                    <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${creditBadge(c.creditLevel)}`}>
                      {c.creditLevel}
                    </span>
                  )}
                  <span className="mt-0.5 block text-cool-grey">{ev.condition}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
