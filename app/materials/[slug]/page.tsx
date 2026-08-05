import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityVisuals } from "@/components/ActivityVisual";
import { GlossedText } from "@/components/GlossedText";
import { Prose } from "@/components/Prose";
import {
  agency as agencyDoc,
  findGlossaryMatches,
  getCompetencyByCode,
  getEvidenceConditionsForMaterial,
  getMaterial,
  getModulesForMaterial,
  getObjectiveById,
  getPrinciple,
  materials,
} from "@/lib/content";
import { CONTEXT_LABEL, downloadRoleMeta, tagMeta, typeMeta } from "@/lib/ui";

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
  const inModules = getModulesForMaterial(m.slug);

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

      <span className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${t.bg} ${t.text}`}>
          {t.label}
          {m.toolsFacet ? ` · ${m.toolsFacet}` : ""}
        </span>
        {m.tags
          .filter((tag) => tagMeta(tag.id).kind === "area")
          .map((tag) => (
            <span
              key={tag.id}
              className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-terracotta/10 text-terracotta"
            >
              {tagMeta(tag.id).label}
            </span>
          ))}
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

      {/* Student worksheet — the learner-facing sheet for this activity, surfaced prominently */}
      {m.worksheet &&
        (() => {
          const ws = getMaterial(m.worksheet.slug);
          if (!ws) return null;
          return (
            <section className="mt-6 rounded-xl border-l-4 border-gold border-y border-r border-cool-grey/20 bg-gold/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-terracotta">
                Student worksheet
              </p>
              <p className="mt-2">
                <Link href={`/materials/${ws.slug}`} className="font-semibold text-navy hover:underline">
                  {ws.title} →
                </Link>
                {ws.summary && <span className="text-sm text-cool-grey"> &mdash; {ws.summary}</span>}
              </p>
              <p className="mt-2 text-sm text-cool-grey">
                {m.worksheet.note ?? "The printable version is included in this component's downloadable workbook."}
              </p>
            </section>
          );
        })()}

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

      {/* Understand it — the educator-facing explanation of what this is and how it works, lifted to
          lead so a facilitator understands the material before the running detail and, lower down, the
          curriculum mapping. See MATERIALS_STANDARD.md §11 (reading order). */}
      {m.educatorContent && (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">For educators</h2>
          <div className="mt-3 rounded-lg border border-cool-grey/20 bg-white p-5">
            <Prose text={m.educatorContent} />
          </div>
        </section>
      )}

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

      {/* Activity-wide "how to set it up" diagrams — a schematic so an educator can picture the
          arrangement at a glance. "Example" (what-good-looks-like) visuals render after the steps. */}
      {m.visuals.some((v) => v.kind === "setup") && (
        <section className="mt-6">
          <ActivityVisuals visuals={m.visuals.filter((v) => v.kind === "setup")} />
        </section>
      )}

      {/* Downloadable resources this material provides. Grouped by role so the guided worksheet and the
          blank template read as distinct artefacts (explainer → worksheet → example → template). */}
      {m.downloads.length > 0 &&
        (() => {
          // Group by role, then order the groups (and preserve authoring order within each).
          const groups = new Map<string, { label: string; order: number; items: typeof m.downloads }>();
          for (const d of m.downloads) {
            const meta = downloadRoleMeta(d.role);
            const key = d.role ?? "_other";
            if (!groups.has(key)) groups.set(key, { label: meta.label, order: meta.order, items: [] });
            groups.get(key)!.items.push(d);
          }
          const ordered = [...groups.values()].sort((a, b) => a.order - b.order);
          return (
            <section className="mt-8 rounded-xl border border-olive/30 bg-olive/[0.06] p-5">
              <h2 className="font-heading text-xl font-semibold text-dark-navy">Resources to download</h2>
              <div className="mt-3 space-y-5">
                {ordered.map((g) => (
                  <div key={g.label}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-cool-grey">{g.label}</h3>
                    <ul className="mt-2 space-y-3">
                      {g.items.map((d) => (
                        <li key={d.file}>
                          <a href={d.file} download className="inline-flex items-baseline gap-2 font-medium text-navy hover:underline">
                            <span className="rounded bg-olive px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{d.format ?? "File"}</span>
                            {d.label}
                          </a>
                          {d.note && <p className="mt-0.5 text-sm text-cool-grey">{d.note}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

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
                {step.visuals.length > 0 && <ActivityVisuals visuals={step.visuals} className="mt-3" />}
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

      {/* "What it looks like when it's working" — the finished-output visual(s), placed after the flow
          so an educator can check what they're steering toward. */}
      {m.visuals.some((v) => v.kind === "example") && (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">What it looks like when it&rsquo;s working</h2>
          <div className="mt-3">
            <ActivityVisuals visuals={m.visuals.filter((v) => v.kind === "example")} />
          </div>
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

      {/* How this fits the curriculum — the agency/principles/competency mapping. Demoted below the
          teaching content on purpose (MATERIALS_STANDARD.md §11): it is justification for the designer
          and moderator, read after an educator can already understand and run the material. */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-dark-navy">How this fits the curriculum</h2>
        <div className="mt-3 divide-y divide-cool-grey/15 overflow-hidden rounded-xl border border-cool-grey/20 bg-white">
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

          {(m.principleAlignment.length > 0 || m.principlesForegrounded.length > 0) && (
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
          )}

          {(m.competencyDevelopment.length > 0 || m.competencyCodes.length > 0) && (
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
          )}
        </div>
      </section>

      {/* Part of these modules (skill / competency modules) */}
      {inModules.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-dark-navy">Part of these modules</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {inModules.map((mod) => (
              <li key={mod.slug}>
                <Link
                  href={`/modules/${mod.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-cool-grey/25 bg-white px-3 py-1 text-sm text-dark-navy transition hover:border-navy/40 hover:text-navy"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-cool-grey">
                    {mod.grain === "competency" ? "Competency" : "Skill"}
                  </span>
                  {mod.title}
                </Link>
              </li>
            ))}
          </ul>
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
