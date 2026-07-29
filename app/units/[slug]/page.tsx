import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMaterial, getObjectiveById, getProgramme, getUnit, units } from "@/lib/content";

export function generateStaticParams() {
  return units.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const u = getUnit(slug);
  return { title: u?.title ?? "Unit plan" };
}

function hrs(h: number): string {
  if (h <= 0) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${h}h`;
}

const KIND_LABEL: Record<string, string> = {
  activity: "Activity",
  practice: "Practice",
  orientation: "Orientation",
  consolidation: "Consolidation",
  assessment: "Assessment",
};

export default async function UnitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = getUnit(slug);
  if (!u) notFound();
  const programme = getProgramme(u.programmeSlug);
  const total = u.totalFacilitatedHours + u.totalIndependentHours;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <nav className="text-sm text-cool-grey">
        <Link href="/programmes" className="hover:text-navy hover:underline">Programmes</Link>
        {programme && (
          <>
            {" / "}
            <Link href={`/programmes/${programme.slug}`} className="hover:text-navy hover:underline">
              {programme.title}
            </Link>
          </>
        )}
      </nav>

      <span className="mt-3 inline-block rounded bg-gold/20 px-2 py-0.5 text-xs font-medium text-navy">
        Unit plan · {u.componentTitle}
      </span>
      <h1 className="mt-2 font-heading text-3xl font-bold text-navy">{u.title}</h1>
      <p className="mt-3 max-w-2xl text-dark-navy">{u.summary}</p>
      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-cool-grey">
        <span>⏱ {total}h total: {u.totalFacilitatedHours}h in-person + {u.totalIndependentHours}h independent</span>
        <span>🗓 Set out in hours — fit it to your own weekly schedule (minimum 10 weeks)</span>
      </p>

      {u.downloads.length > 0 && (
        <section className="mt-6 rounded-xl border border-cool-grey/25 bg-white p-5 shadow-sm">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-navy">Editable downloads</h2>
          <p className="mt-1 text-sm text-cool-grey">Ready-made files to print or edit. No internet needed once downloaded.</p>
          <ul className="mt-3 flex flex-wrap gap-3">
            {u.downloads.map((d) => (
              <li key={d.file}>
                <a
                  href={d.file}
                  download
                  className="inline-flex items-center gap-2 rounded-lg border border-navy bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-dark-navy"
                >
                  ⬇ {d.label}
                  {d.format && <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs uppercase">{d.format}</span>}
                </a>
                {d.note && <p className="mt-1 max-w-[16rem] text-xs text-cool-grey">{d.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {u.phases.map((phase, pi) => {
        const objective = phase.objectiveId ? getObjectiveById(phase.objectiveId) : undefined;
        const facSum = phase.blocks.reduce((a, b) => a + b.facilitatedHours, 0);
        const indSum = phase.blocks.reduce((a, b) => a + b.independentHours, 0);
        return (
          <section key={pi} className="mt-12">
            <div className="flex items-baseline gap-3 border-b-2 border-olive pb-2">
              <span className="font-heading text-sm font-bold uppercase tracking-wide text-orange">
                Phase {pi + 1}
              </span>
              <h2 className="font-heading text-2xl font-bold text-navy">{phase.title}</h2>
            </div>

            {objective && (
              <p className="mt-3 text-sm text-cool-grey">
                Objective {objective.index}:{" "}
                <Link href={`/objectives/${objective.id}`} className="text-navy hover:underline">
                  {objective.objective.statement}
                </Link>
              </p>
            )}
            {phase.summary && <p className="mt-3 max-w-2xl text-sm text-dark-navy">{phase.summary}</p>}
            <p className="mt-2 text-sm text-cool-grey">
              {hrs(facSum)} in-person · {hrs(indSum)} independent, across {phase.blocks.length} {phase.blocks.length === 1 ? "block" : "blocks"}.
            </p>

            <ol className="mt-6 space-y-8">
              {phase.blocks.map((b, i) => {
                const m = b.materialSlug ? getMaterial(b.materialSlug) : undefined;
                return (
                  <li key={i} className="rounded-xl border border-cool-grey/25 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      {b.kind && (
                        <span className="font-heading text-xs font-bold uppercase tracking-wide text-white bg-plum rounded px-2 py-0.5">
                          {KIND_LABEL[b.kind] ?? b.kind}
                        </span>
                      )}
                      <h3 className="font-heading text-lg font-bold text-dark-navy">{b.title}</h3>
                      <span className="ml-auto font-heading text-xs text-cool-grey">
                        {hrs(b.facilitatedHours)} in-person
                        {b.independentHours > 0 ? ` · ${hrs(b.independentHours)} independent` : ""}
                      </span>
                    </div>

                    {b.description && (
                      <p className="mt-3 whitespace-pre-line text-sm text-dark-navy">{b.description}</p>
                    )}

                    {m ? (
                      <div className="mt-4">
                        {m.facilitationNotes && (
                          <div className="rounded-r-lg border-l-4 border-orange bg-orange/5 px-4 py-3">
                            <span className="font-heading text-xs font-bold uppercase tracking-wide text-orange">
                              The one thing to get right
                            </span>
                            <p className="mt-1 whitespace-pre-line text-sm text-dark-navy">{m.facilitationNotes}</p>
                          </div>
                        )}

                        {m.materialsAndPreparation.length > 0 && (
                          <div className="mt-4">
                            <span className="font-heading text-xs font-bold uppercase tracking-wide text-navy">Prepare</span>
                            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-dark-navy">
                              {m.materialsAndPreparation.map((p, j) => <li key={j}>{p}</li>)}
                            </ul>
                          </div>
                        )}

                        <div className="mt-4 space-y-4">
                          {m.steps.map((step, j) => (
                            <div key={j} className="border-t border-cool-grey/20 pt-3">
                              <div className="flex items-baseline gap-2">
                                <span className="font-heading text-xs font-bold text-navy">{j + 1}</span>
                                <h4 className="font-heading text-sm font-bold text-dark-navy">{step.title}</h4>
                                {step.duration && (
                                  <span className="ml-auto font-heading text-xs text-cool-grey">{step.duration}</span>
                                )}
                              </div>
                              <p className="mt-1 whitespace-pre-line text-sm text-dark-navy">{step.guidance}</p>
                              {step.keyPrompts.length > 0 && (
                                <ul className="mt-2 space-y-1 text-sm text-navy">
                                  {step.keyPrompts.map((p, k) => (
                                    <li key={k} className="pl-4 -indent-4">? {p}</li>
                                  ))}
                                </ul>
                              )}
                              {step.watchOuts.length > 0 && (
                                <ul className="mt-2 space-y-1 text-sm text-terracotta">
                                  {step.watchOuts.map((w, k) => (
                                    <li key={k} className="pl-4 -indent-4">! {w}</li>
                                  ))}
                                </ul>
                              )}
                              {step.adaptation && (
                                <p className="mt-2 rounded bg-cool-grey/10 px-3 py-2 text-xs text-cool-grey whitespace-pre-line">
                                  🏠 {step.adaptation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {m.closing && (
                          <div className="mt-4 border-t border-cool-grey/20 pt-3">
                            <span className="font-heading text-xs font-bold uppercase tracking-wide text-navy">Closing</span>
                            <p className="mt-1 whitespace-pre-line text-sm text-dark-navy">{m.closing}</p>
                          </div>
                        )}

                        <p className="mt-4 text-xs text-cool-grey">
                          Full activity:{" "}
                          <Link href={`/materials/${m.slug}`} className="text-navy hover:underline">{m.title}</Link>
                        </p>
                      </div>
                    ) : b.materialSlug ? (
                      <p className="mt-3 text-sm text-terracotta">Material &ldquo;{b.materialSlug}&rdquo; not found.</p>
                    ) : null}

                    {b.independentTask && (
                      <div className="mt-4 rounded-r-lg border-l-4 border-teal bg-teal/10 px-4 py-3">
                        <span className="font-heading text-xs font-bold uppercase tracking-wide text-teal">
                          Independent task ({hrs(b.independentHours)})
                        </span>
                        <p className="mt-1 text-sm text-dark-navy">{b.independentTask}</p>
                      </div>
                    )}
                    {b.flexNote && (
                      <p className="mt-2 text-xs text-cool-grey">
                        <span className="font-semibold">Note:</span> {b.flexNote}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </main>
  );
}
