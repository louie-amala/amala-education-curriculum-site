import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GlossedText } from "@/components/GlossedText";
import { Prose } from "@/components/Prose";
import {
  agency as agencyDoc,
  findGlossaryMatches,
  getCompetencyByCode,
  getEvidenceConditionsForMaterial,
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
  const conditions = getEvidenceConditionsForMaterial(m);

  // Plan glossary marking in reading order so each term links once per page.
  const usedTerms = new Set<string>();
  const takeSkip = (s?: string | null) => {
    const snapshot = [...usedTerms];
    if (s) findGlossaryMatches(s, usedTerms).forEach((g) => usedTerms.add(g.slug));
    return snapshot;
  };
  const summarySkip = takeSkip(m.summary);
  const notesSkip = takeSkip(m.facilitationNotes);
  const stepSkips = m.steps.map((s) => takeSkip(s.guidance));

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
      {m.summary && (
        <p className="mt-2 text-lg text-dark-navy">
          <GlossedText text={m.summary} skip={summarySkip} />
        </p>
      )}
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-cool-grey">
        {m.duration && <span>⏱ {m.duration}</span>}
        {m.grouping && <span>👥 {m.grouping}</span>}
        {m.facilitationContext.length > 0 && (
          <span>For: {m.facilitationContext.map((c) => CONTEXT_LABEL[c] ?? c).join(" · ")}</span>
        )}
      </p>

      {/* Resources for this activity — surfaced at the top so educators do not have to go digging */}
      {m.type !== "resource" &&
        (() => {
          const used = m.relatedSlugs
            .map((s) => getMaterial(s))
            .filter((r): r is NonNullable<typeof r> => r != null && r.type === "resource");
          if (used.length === 0) return null;
          return (
            <section className="mt-6 rounded-xl border-l-4 border-teal border-y border-r border-cool-grey/20 bg-teal/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-teal">
                Resources for this activity
              </p>
              <ul className="mt-3 space-y-3">
                {used.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/materials/${r.slug}`} className="font-medium text-navy hover:underline">
                      {r.title}
                    </Link>
                    {r.summary && <span className="text-sm text-cool-grey"> &mdash; {r.summary}</span>}
                    {r.links.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {r.links.map((l) => (
                          <a
                            key={l.url}
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded border border-teal/40 bg-white px-2.5 py-1 text-xs font-medium text-navy transition hover:shadow-sm"
                          >
                            <span aria-hidden>↗</span> {l.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })()}

      {/* Diagram (e.g. a 2x2 tool grid) */}
      {m.diagram && (
        <figure className="mt-6 rounded-xl border border-cool-grey/20 bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.diagram.src} alt={m.diagram.alt} className="mx-auto h-auto w-full max-w-xl" />
          {m.diagram.caption && (
            <figcaption className="mt-2 text-center text-xs text-cool-grey">{m.diagram.caption}</figcaption>
          )}
        </figure>
      )}

      {/* External links (e.g. the video a resource is built around) */}
      {m.links.length > 0 && (
        <section className="mt-6">
          <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {m.links.map((l) => (
              <li key={l.url}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border-l-4 border-teal border-y border-r border-cool-grey/20 bg-white px-4 py-2 font-medium text-navy shadow-sm transition hover:shadow-md"
                >
                  <span aria-hidden>↗</span> {l.label}
                </a>
                {l.note && <p className="mt-1 text-xs text-cool-grey">{l.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Why this material earns its place — each link explained */}
      <section className="mt-8 divide-y divide-cool-grey/15 overflow-hidden rounded-xl border border-cool-grey/20 bg-white">
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange">
            Builds agency for positive change
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {m.agencyContribution.indicators.map((i) => (
              <span
                key={i}
                className="rounded-full bg-orange/10 px-3 py-1 text-sm font-medium text-dark-navy"
              >
                {INDICATOR_LABEL[i] ?? i}
              </span>
            ))}
          </div>
          {m.agencyContribution.how && (
            <p className="mt-3 text-sm leading-relaxed text-dark-navy/75">{m.agencyContribution.how}</p>
          )}
        </div>

        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-plum">
            Principles in the learning design
          </p>
          <p className="mt-1 text-sm text-dark-navy/70">
            How the design of this {t.label.toLowerCase()} puts Amala&rsquo;s principles into practice.
          </p>
          <ul className="mt-3 space-y-3">
            {(m.principleAlignment.length > 0
              ? m.principleAlignment
              : m.principlesForegrounded.map((pid) => ({ principle: pid, how: "" }))
            ).map(({ principle: pid, how }) => {
              const p = getPrinciple(pid);
              if (!p) return <li key={pid}>{pid}</li>;
              return (
                <li key={pid}>
                  <Link
                    href={`/foundations#${pid}`}
                    className="font-medium text-dark-navy hover:text-plum hover:underline"
                  >
                    {p.statement}
                  </Link>
                  <p className="mt-0.5 text-sm text-dark-navy/70">{how || p.gloss}</p>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-navy">
            Develop and demonstrate proficiency in
          </p>
          <p className="mt-1 text-sm text-dark-navy/70">
            How this {t.label.toLowerCase()} gives learners the chance to build proficiency, and to
            show it.
          </p>
          <ul className="mt-3 space-y-3">
            {(m.competencyDevelopment.length > 0
              ? m.competencyDevelopment
              : m.competencyCodes.map((code) => ({ code, how: "" }))
            ).map(({ code, how }) => {
              const c = getCompetencyByCode(code);
              const fallback = (conditions.get(code) ?? [])[0] ?? "";
              return (
                <li key={code}>
                  <Link
                    href={`/competencies/${code.toLowerCase()}`}
                    className="font-medium text-dark-navy hover:text-navy hover:underline"
                  >
                    <span className="font-mono text-xs text-cool-grey">{code}</span> {c?.title ?? code}
                  </Link>
                  {(how || fallback) && (
                    <p className="mt-0.5 text-sm text-dark-navy/70">{how || fallback}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* What learners do */}
      {m.whatLearnersDo.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">What learners do</h2>
          <ul className="mt-3 list-disc space-y-1 rounded-lg border-l-4 border-aqua bg-aqua/5 p-5 pl-9 text-dark-navy/90">
            {m.whatLearnersDo.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Materials and preparation */}
      {m.materialsAndPreparation.length > 0 && (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">Materials and preparation</h2>
          <div className="mt-3">
            <Prose text={m.materialsAndPreparation.map((t) => `- ${t}`).join("\n")} />
          </div>
        </section>
      )}

      {/* Downloadable resources this material provides */}
      {m.downloads.length > 0 && (
        <section className="mt-8 rounded-xl border border-olive/30 bg-olive/[0.06] p-5">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">Resources to download</h2>
          <ul className="mt-3 space-y-3">
            {m.downloads.map((d) => (
              <li key={d.file}>
                <a href={d.file} download className="inline-flex items-baseline gap-2 font-medium text-navy hover:underline">
                  <span className="rounded bg-olive px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{d.format ?? "File"}</span>
                  {d.label}
                </a>
                {d.note && <p className="mt-0.5 text-sm text-cool-grey">{d.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Running this in different settings — the delivery-mode axis */}
      {m.deliveryAdaptations.length > 0 && (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">
            Running this in different settings
          </h2>
          <ul className="mt-3 divide-y divide-cool-grey/15 overflow-hidden rounded-xl border border-cool-grey/20 bg-white">
            {m.deliveryAdaptations.map((d) => {
              const isPrimary = m.primaryContext === d.context;
              return (
                <li key={d.context} className="p-4">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-heading font-semibold text-dark-navy">
                      {CONTEXT_LABEL[d.context] ?? d.context}
                    </span>
                    {isPrimary && (
                      <span className="rounded-full bg-teal/15 px-2 py-0.5 text-xs font-medium text-teal">
                        designed for this
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-dark-navy/80">{d.how}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Facilitation notes */}
      {m.facilitationNotes && (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">Facilitation notes</h2>
          <div className="mt-3 rounded-lg border border-cool-grey/20 bg-white p-5">
            <Prose text={m.facilitationNotes} gloss skip={notesSkip} />
          </div>
        </section>
      )}

      {/* Step-by-step flow */}
      {m.steps.length > 0 && (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">Step by step</h2>
          <ol className="mt-4 space-y-5">
            {m.steps.map((step, i) => (
              <li key={i} className="rounded-lg border border-cool-grey/20 bg-white p-5 shadow-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-heading font-semibold text-navy">
                    <span className="text-cool-grey">Step {i + 1}.</span> {step.title}
                  </h3>
                  {step.duration && (
                    <span className="shrink-0 text-xs text-cool-grey">{step.duration}</span>
                  )}
                </div>
                {step.guidance && (
                  <div className="mt-2 text-sm">
                    <Prose text={step.guidance} gloss skip={stepSkips[i]} />
                  </div>
                )}
                {step.keyPrompts.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal">Key prompts</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-dark-navy/90">
                      {step.keyPrompts.map((p, j) => (
                        <li key={j}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {step.watchOuts.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-terracotta">Watch-outs</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-dark-navy/90">
                      {step.watchOuts.map((w, j) => (
                        <li key={j}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {step.adaptation && (
                  <div className="mt-3 rounded-md bg-olive/10 p-3 text-sm text-dark-navy/90">
                    <span className="font-semibold text-olive">Low-bandwidth / async: </span>
                    {step.adaptation}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Closing */}
      {m.closing && (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">Closing the activity</h2>
          <div className="mt-3 rounded-lg border-l-4 border-gold bg-gold/5 p-5">
            <Prose text={m.closing} />
          </div>
        </section>
      )}

      {/* Fallback content faces (concepts, tools, resources, case studies) */}
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

    </main>
  );
}
