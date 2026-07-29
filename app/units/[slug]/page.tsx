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

function mins(n: number): string {
  if (n <= 0) return "0 min";
  if (n % 60 === 0) return `${n / 60}h`;
  if (n > 60) return `${Math.floor(n / 60)}h ${n % 60}min`;
  return `${n} min`;
}

export default async function UnitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = getUnit(slug);
  if (!u) notFound();
  const programme = getProgramme(u.programmeSlug);

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
        <span>📅 {u.weeks.length} {u.weeks.length === 1 ? "week authored" : "weeks authored"}</span>
        <span>⏱ Weekly budget: {mins(u.weeklyFacilitatedMin)} in-person + {mins(u.weeklyIndependentMin)} independent</span>
      </p>

      {u.weeks.map((wk) => {
        const objective = wk.objectiveId ? getObjectiveById(wk.objectiveId) : undefined;
        const facSum = wk.sessions.reduce((a, s) => a + s.facilitatedMin, 0);
        const indSum = wk.sessions.reduce((a, s) => a + s.independentMin, 0);
        return (
          <section key={wk.number} className="mt-12">
            <div className="flex items-baseline gap-3 border-b-2 border-olive pb-2">
              <span className="font-heading text-sm font-bold uppercase tracking-wide text-orange">
                Week {wk.number}
              </span>
              <h2 className="font-heading text-2xl font-bold text-navy">{wk.title}</h2>
            </div>

            {objective && (
              <p className="mt-3 text-sm text-cool-grey">
                Objective {objective.index}:{" "}
                <Link href={`/objectives/${objective.id}`} className="text-navy hover:underline">
                  {objective.objective.statement}
                </Link>
              </p>
            )}
            {wk.outcome && (
              <div className="mt-3 rounded-r-lg border-l-4 border-gold bg-gold/10 px-4 py-3 text-sm text-dark-navy">
                <span className="font-heading text-xs font-bold uppercase tracking-wide text-navy">Outcome</span>
                <p className="mt-1">{wk.outcome}</p>
              </div>
            )}
            <p className="mt-3 text-sm text-cool-grey">
              This week: {mins(facSum)} in-person · {mins(indSum)} independent, across {wk.sessions.length} sessions.
            </p>

            <ol className="mt-6 space-y-8">
              {wk.sessions.map((s, i) => {
                const m = getMaterial(s.materialSlug);
                return (
                  <li key={i} className="rounded-xl border border-cool-grey/25 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-heading text-xs font-bold text-white bg-navy rounded px-2 py-0.5">
                        Session {i + 1}
                      </span>
                      <h3 className="font-heading text-lg font-bold text-dark-navy">{s.title}</h3>
                      <span className="ml-auto font-heading text-xs text-cool-grey">
                        {mins(s.facilitatedMin)} in-person
                        {s.independentMin > 0 ? ` · ${mins(s.independentMin)} independent` : ""}
                      </span>
                    </div>

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
                    ) : (
                      <p className="mt-3 text-sm text-terracotta">Material &ldquo;{s.materialSlug}&rdquo; not found.</p>
                    )}

                    {s.independentTask && (
                      <div className="mt-4 rounded-r-lg border-l-4 border-teal bg-teal/10 px-4 py-3">
                        <span className="font-heading text-xs font-bold uppercase tracking-wide text-teal">
                          Independent task ({mins(s.independentMin)})
                        </span>
                        <p className="mt-1 text-sm text-dark-navy">{s.independentTask}</p>
                      </div>
                    )}
                    {s.flexNote && (
                      <p className="mt-2 text-xs text-cool-grey">
                        <span className="font-semibold">Flex:</span> {s.flexNote}
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
