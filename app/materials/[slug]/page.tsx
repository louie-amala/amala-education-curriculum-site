import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prose } from "@/components/Prose";
import {
  agency as agencyDoc,
  getCompetencyByCode,
  getMaterial,
  getObjectiveById,
  getPrinciple,
  materials,
} from "@/lib/content";
import { CONTEXT_LABEL, typeMeta } from "@/lib/ui";

export function generateStaticParams() {
  return materials.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = getMaterial(slug);
  return { title: m?.title ?? "Material" };
}

const INDICATOR_LABEL = Object.fromEntries(agencyDoc.indicators.map((i) => [i.id, i.label]));

export default async function MaterialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = getMaterial(slug);
  if (!m) notFound();
  const t = typeMeta(m.type);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <nav className="text-sm text-cool-grey">
        <Link href="/materials" className="hover:text-navy hover:underline">Materials</Link>
      </nav>

      <span className={`mt-3 inline-block rounded px-2 py-0.5 text-xs font-medium ${t.bg} ${t.text}`}>
        {t.label}
        {m.toolsFacet ? ` · ${m.toolsFacet}` : ""}
      </span>
      <h1 className="mt-2 font-heading text-3xl font-bold text-navy">{m.title}</h1>
      {m.summary && <p className="mt-2 text-lg text-dark-navy">{m.summary}</p>}
      {m.facilitationContext.length > 0 && (
        <p className="mt-3 text-sm text-cool-grey">
          For: {m.facilitationContext.map((c) => CONTEXT_LABEL[c] ?? c).join(" · ")}
        </p>
      )}

      {/* Pedagogical spine */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-cool-grey/20 bg-white p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-cool-grey">Builds agency</h2>
          <ul className="mt-2 space-y-1 text-sm font-medium text-dark-navy">
            {m.agencyContribution.indicators.map((i) => (
              <li key={i}>{INDICATOR_LABEL[i] ?? i}</li>
            ))}
          </ul>
          {m.agencyContribution.how && (
            <p className="mt-2 border-t border-cool-grey/15 pt-2 text-sm text-dark-navy/80">
              {m.agencyContribution.how}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-cool-grey/20 bg-white p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-cool-grey">Foregrounds principles</h2>
          <ul className="mt-2 space-y-1 text-sm text-dark-navy">
            {m.principlesForegrounded.map((pid) => {
              const p = getPrinciple(pid);
              return <li key={pid}>{p ? p.statement : pid}</li>;
            })}
          </ul>
        </div>
        <div className="rounded-lg border border-cool-grey/20 bg-white p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-cool-grey">May evidence</h2>
          <ul className="mt-2 flex flex-wrap gap-1">
            {m.competencyCodes.map((code) => (
              <li key={code}>
                <Link
                  href={`/competencies/${code.toLowerCase()}`}
                  className="rounded bg-navy/10 px-1.5 py-0.5 font-mono text-xs text-navy hover:underline"
                >
                  {code}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Content faces */}
      {m.learnerContent && (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">For learners</h2>
          <div className="mt-3 rounded-lg border-l-4 border-aqua bg-aqua/5 p-5">
            <Prose text={m.learnerContent} />
          </div>
        </section>
      )}
      {m.educatorContent && (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">For educators</h2>
          <div className="mt-3 rounded-lg border border-cool-grey/20 bg-white p-5">
            <Prose text={m.educatorContent} />
          </div>
        </section>
      )}

      {/* Links */}
      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        {m.objectiveIds.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-dark-navy">Serves objectives</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {m.objectiveIds.map((oid) => {
                const o = getObjectiveById(oid);
                if (!o) return null;
                return (
                  <li key={oid}>
                    <Link href={`/objectives/${oid}`} className="text-navy hover:underline">
                      {o.course.title}: {o.objective.statement}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {m.relatedSlugs.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-dark-navy">Related</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {m.relatedSlugs.map((rel) => {
                const r = getMaterial(rel);
                if (!r) return null;
                return (
                  <li key={rel}>
                    <Link href={`/materials/${rel}`} className="text-navy hover:underline">
                      {r.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {m.provenanceNote && (
        <p className="mt-10 border-t border-cool-grey/20 pt-4 text-xs text-cool-grey">
          {m.provenanceNote}
        </p>
      )}
    </main>
  );
}
