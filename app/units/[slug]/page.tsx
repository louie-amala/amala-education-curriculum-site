import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lato, Roboto } from "next/font/google";
import { Prose } from "@/components/Prose";
import { getMaterial, getObjectiveById, getProgramme, getUnit, units } from "@/lib/content";

// Scoped to this page only: the Learning Bridge+ (Cox's Bazar) unit planner gets the brand faces
// (Lato body, Roboto headings) so it reads warmly, without changing the rest of the site yet.
const bodyFont = Lato({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });
const headFont = Roboto({ subsets: ["latin"], weight: ["500", "700"], display: "swap" });

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

const LEAD_LABEL: Record<string, string> = {
  "facilitator-led": "You lead",
  shared: "Shared",
  "learner-led": "Learners lead",
};
const LEAD_STYLE: Record<string, string> = {
  "facilitator-led": "bg-navy/10 text-navy",
  shared: "bg-teal/15 text-teal",
  "learner-led": "bg-olive/15 text-[#6E7A2E]",
};

// Parse inline [label](href) links in a single line (e.g. the Picture Cards pack reference).
function inline(s: string): React.ReactNode {
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const [, label, href] = m;
    out.push(
      <Link key={i++} href={href} className="font-medium text-navy underline decoration-gold/70 decoration-2 underline-offset-2 hover:decoration-gold">
        {label}
      </Link>,
    );
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out.length ? out : s;
}

const eyebrow = "text-[11px] font-bold uppercase tracking-[0.14em]";

export default async function UnitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = getUnit(slug);
  if (!u) notFound();
  const programme = getProgramme(u.programmeSlug);
  const total = u.totalFacilitatedHours + u.totalIndependentHours;

  return (
    <div className={`${bodyFont.className} bg-[#F7F5F0] text-[#26303F]`}>
      <div className="mx-auto max-w-3xl px-6 py-14 leading-relaxed">

        {/* Hero */}
        <nav className="text-sm text-[#6B7482]">
          <Link href="/programmes" className="hover:text-navy">Programmes</Link>
          {programme && (
            <>
              <span className="px-1.5 text-[#B9B3A6]">/</span>
              <Link href={`/programmes/${programme.slug}`} className="hover:text-navy">{programme.title}</Link>
            </>
          )}
        </nav>

        <p className={`${eyebrow} mt-8 text-orange`}>Unit plan · {u.componentTitle}</p>
        <h1 className={`${headFont.className} mt-2 text-4xl font-bold leading-[1.1] tracking-tight text-navy`}>
          {u.title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-[#3C4655]">{u.summary}</p>

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-[#E7E3DA] bg-white px-3.5 py-1.5 font-semibold text-navy">{total} hours</span>
          <span className="rounded-full border border-[#E7E3DA] bg-white px-3.5 py-1.5 text-[#5A6473]">{u.totalFacilitatedHours}h in-person · {u.totalIndependentHours}h independent</span>
          <span className="rounded-full border border-[#E7E3DA] bg-white px-3.5 py-1.5 text-[#5A6473]">Set out in hours — fit your own schedule</span>
        </div>

        {/* Downloads */}
        {u.downloads.length > 0 && (
          <section className="mt-8 rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-[0_1px_2px_rgba(4,30,66,0.04),0_10px_30px_-12px_rgba(4,30,66,0.12)]">
            <p className={`${eyebrow} text-olive`}>Ready to use, offline</p>
            <h2 className={`${headFont.className} mt-1 text-lg font-bold text-navy`}>Download everything you need</h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {u.downloads.map((d) => (
                <li key={d.file}>
                  <a href={d.file} download className="group flex items-start gap-3 rounded-xl border border-[#E7E3DA] bg-[#FBFAF7] p-3.5 transition hover:border-navy/40 hover:bg-white">
                    <span className={`${headFont.className} mt-0.5 rounded-lg bg-navy px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white`}>{d.format ?? "File"}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-navy group-hover:underline">{d.label}</span>
                      {d.note && <span className="mt-0.5 block text-[13px] leading-snug text-[#6B7482]">{d.note}</span>}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-[#F0ECE3] pt-3 text-[13px] leading-relaxed text-[#6B7482]">
              Your team chooses what to print. The student workbook and the per-activity sheets cover the same activities, so you do not need both: use the bound workbook, or print individual sheets, whichever suits your setting. No printer? Show one copy on a screen, or hold up a printed sheet, and learners use their own notebooks.
            </p>
          </section>
        )}

        {u.deliveryApproach && (
          <section className="mt-8 rounded-2xl border border-navy/15 bg-navy/[0.04] p-6">
            <p className={`${eyebrow} text-navy`}>How this unit hands over control</p>
            <div className="mt-2 text-[15px] leading-relaxed text-[#3C4655]"><Prose text={u.deliveryApproach} /></div>
          </section>
        )}

        {u.assessmentNote && (
          <section className="mt-5 rounded-2xl border border-plum/20 bg-plum/[0.04] p-6">
            <p className={`${eyebrow} text-plum`}>How the competency is assessed</p>
            <div className="mt-2 text-[15px] leading-relaxed text-[#3C4655]"><Prose text={u.assessmentNote} /></div>
          </section>
        )}

        {/* In this unit — overview */}
        <section className="mt-10">
          <p className={`${eyebrow} text-[#8A93A1]`}>In this unit</p>
          <ol className="mt-3 divide-y divide-[#ECE8DF] overflow-hidden rounded-xl border border-[#E7E3DA] bg-white">
            {u.phases.map((phase, pi) => {
              const fac = phase.blocks.reduce((a, b) => a + b.facilitatedHours, 0);
              const ind = phase.blocks.reduce((a, b) => a + b.independentHours, 0);
              return (
                <li key={pi}>
                  <a href={`#phase-${pi + 1}`} className="flex items-baseline gap-3 px-4 py-3 hover:bg-[#FBFAF7]">
                    <span className={`${headFont.className} w-5 shrink-0 text-sm font-bold text-orange`}>{pi + 1}</span>
                    <span className="flex-1 font-semibold text-navy">{phase.title}</span>
                    <span className="shrink-0 text-[13px] tabular-nums text-[#8A93A1]">{hrs(fac)} · {hrs(ind)}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Phases */}
        {u.phases.map((phase, pi) => {
          const objective = phase.objectiveId ? getObjectiveById(phase.objectiveId) : undefined;
          const fac = phase.blocks.reduce((a, b) => a + b.facilitatedHours, 0);
          const ind = phase.blocks.reduce((a, b) => a + b.independentHours, 0);
          return (
            <section key={pi} id={`phase-${pi + 1}`} className="mt-14 scroll-mt-6">
              <div className="flex items-center gap-3">
                <p className={`${eyebrow} text-orange`}>Phase {pi + 1}</p>
                {phase.lead && (
                  <span className={`${headFont.className} rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${LEAD_STYLE[phase.lead] ?? ""}`}>
                    {LEAD_LABEL[phase.lead] ?? phase.lead}
                  </span>
                )}
              </div>
              <h2 className={`${headFont.className} mt-1.5 text-[26px] font-bold leading-tight text-navy`}>{phase.title}</h2>
              {objective && (
                <p className="mt-2 text-sm text-[#6B7482]">
                  Develops objective {objective.index}:{" "}
                  <Link href={`/objectives/${objective.id}`} className="text-navy underline decoration-[#D8D2C6] underline-offset-2 hover:decoration-navy">
                    {objective.objective.statement}
                  </Link>
                </p>
              )}
              {phase.summary && <p className="mt-3 text-[15px] leading-relaxed text-[#3C4655]">{phase.summary}</p>}
              <p className={`${eyebrow} mt-4 text-[#A29B8C]`}>{hrs(fac)} in-person · {hrs(ind)} independent · {phase.blocks.length} {phase.blocks.length === 1 ? "part" : "parts"}</p>

              <div className="mt-5 space-y-5">
                {phase.blocks.map((b, i) => {
                  const m = b.materialSlug ? getMaterial(b.materialSlug) : undefined;
                  return (
                    <article key={i} className="overflow-hidden rounded-2xl border border-[#E7E3DA] bg-white shadow-[0_1px_2px_rgba(4,30,66,0.03)]">
                      {/* header */}
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[#F0ECE3] bg-[#FBFAF7] px-5 py-4">
                        {b.kind && <span className={`${headFont.className} rounded-md bg-plum/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-plum`}>{KIND_LABEL[b.kind] ?? b.kind}</span>}
                        <h3 className={`${headFont.className} text-lg font-bold text-[#26303F]`}>{b.title}</h3>
                        <span className="ml-auto text-[13px] font-semibold tabular-nums text-[#5A6473]">
                          {hrs(b.facilitatedHours)} in-person{b.independentHours > 0 ? ` · ${hrs(b.independentHours)} independent` : ""}
                        </span>
                      </div>

                      <div className="px-5 py-5">
                        {b.description && <div className="text-[15px] leading-relaxed text-[#3C4655]"><Prose text={b.description} /></div>}

                        {m?.facilitationNotes && (
                          <div className="mt-4 rounded-r-lg border-l-[3px] border-orange bg-orange/[0.06] px-4 py-3">
                            <p className={`${eyebrow} text-orange`}>The one thing to get right</p>
                            <div className="mt-1 text-[14px] leading-relaxed text-[#3C4655]"><Prose text={m.facilitationNotes} /></div>
                          </div>
                        )}

                        {b.independentTask && (
                          <div className="mt-4 rounded-r-lg border-l-[3px] border-teal bg-teal/[0.07] px-4 py-3">
                            <p className={`${eyebrow} text-teal`}>Independent task · {hrs(b.independentHours)}</p>
                            <p className="mt-1 text-[14px] leading-relaxed text-[#3C4655]">{b.independentTask}</p>
                          </div>
                        )}

                        {m && m.downloads.length > 0 && (
                          <div className="mt-4 rounded-xl border border-olive/30 bg-olive/[0.06] px-4 py-3.5">
                            <p className={`${eyebrow} text-olive`}>Resource for this activity</p>
                            <ul className="mt-2 space-y-2">
                              {m.downloads.map((d) => (
                                <li key={d.file}>
                                  <a href={d.file} download className="group flex items-start gap-2.5">
                                    <span className={`${headFont.className} mt-0.5 rounded-md bg-olive px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white`}>{d.format ?? "File"}</span>
                                    <span className="min-w-0">
                                      <span className="font-semibold text-navy group-hover:underline">{d.label}</span>
                                      {d.note && <span className="mt-0.5 block text-[13px] leading-snug text-[#6B7482]">{d.note}</span>}
                                    </span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Progressive disclosure: the full run */}
                        {m && (m.steps.length > 0 || m.materialsAndPreparation.length > 0) && (
                          <details className="group mt-4">
                            <summary className={`${headFont.className} flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-navy`}>
                              <svg className="h-4 w-4 shrink-0 text-orange transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                              Show the full run{m.steps.length ? ` · ${m.steps.length} steps` : ""}
                            </summary>

                            <div className="mt-4 border-t border-[#F0ECE3] pt-4">
                              {m.materialsAndPreparation.length > 0 && (
                                <div className="mb-5">
                                  <p className={`${eyebrow} text-[#8A93A1]`}>Prepare</p>
                                  <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-[#3C4655]">
                                    {m.materialsAndPreparation.map((p, j) => (
                                      <li key={j} className="flex gap-2.5">
                                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#C7C0B2]" />
                                        <span>{inline(p)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <ol className="space-y-5">
                                {m.steps.map((step, j) => (
                                  <li key={j}>
                                    <div className="flex items-baseline gap-2.5">
                                      <span className={`${headFont.className} flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-bold text-white`}>{j + 1}</span>
                                      <h4 className={`${headFont.className} font-bold text-[#26303F]`}>{step.title}</h4>
                                      {step.duration && <span className="ml-auto text-xs text-[#8A93A1]">{step.duration}</span>}
                                    </div>
                                    <div className="mt-1.5 pl-8 text-[14px] leading-relaxed text-[#3C4655]"><Prose text={step.guidance} /></div>
                                    <div className="mt-2 space-y-2 pl-8">
                                      {step.keyPrompts.length > 0 && (
                                        <div>
                                          <span className={`${eyebrow} text-olive`}>Ask</span>
                                          <ul className="mt-1 space-y-1 text-[14px] italic text-navy">
                                            {step.keyPrompts.map((p, k) => <li key={k}>&ldquo;{p}&rdquo;</li>)}
                                          </ul>
                                        </div>
                                      )}
                                      {step.watchOuts.length > 0 && (
                                        <div>
                                          <span className={`${eyebrow} text-terracotta`}>Watch out</span>
                                          <ul className="mt-1 space-y-1 text-[14px] text-[#5A6473]">
                                            {step.watchOuts.map((w, k) => <li key={k}>{w}</li>)}
                                          </ul>
                                        </div>
                                      )}
                                      {step.adaptation && (
                                        <p className="rounded-lg bg-[#F4F1EA] px-3 py-2 text-[13px] leading-relaxed text-[#6B7482]">
                                          <span className="font-semibold text-[#5A6473]">If low-resource: </span>{step.adaptation}
                                        </p>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ol>

                              {m.closing && (
                                <div className="mt-5 border-t border-[#F0ECE3] pt-4">
                                  <p className={`${eyebrow} text-[#8A93A1]`}>Closing</p>
                                  <div className="mt-1 text-[14px] leading-relaxed text-[#3C4655]"><Prose text={m.closing} /></div>
                                </div>
                              )}

                              <p className="mt-5 text-[13px] text-[#8A93A1]">
                                Full activity page:{" "}
                                <Link href={`/materials/${m.slug}`} className="text-navy underline decoration-[#D8D2C6] underline-offset-2 hover:decoration-navy">{m.title}</Link>
                              </p>
                            </div>
                          </details>
                        )}

                        {b.flexNote && (
                          <p className="mt-4 border-t border-[#F0ECE3] pt-3 text-[13px] leading-relaxed text-[#8A93A1]">
                            <span className="font-semibold text-[#6B7482]">Flexing the time: </span>{b.flexNote}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
