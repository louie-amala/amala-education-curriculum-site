import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  agency,
  educatorMoves,
  getCompetencyByCode,
  getCourse,
  getProgramme,
  getUnitsForProgramme,
  programmes,
} from "@/lib/content";
import { tagMeta } from "@/lib/ui";

// Indicator ids are stable slugs; their wording lives in foundations/agency.yaml and is read from
// there rather than re-typed, so a change to the Foundations flows through.
const indicatorLabel = (id: string) =>
  agency.indicators.find((i) => i.id === id)?.label ?? id;

export function generateStaticParams() {
  return programmes.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProgramme(slug);
  return { title: p?.title ?? "Programme" };
}

export default async function ProgrammePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prog = getProgramme(slug);
  if (!prog) notFound();

  return (
    <main>
      <section className="bg-navy px-6 py-14 text-white">
        <div className="mx-auto max-w-5xl">
          {prog.shortName && (
            <p className="font-heading text-sm uppercase tracking-widest text-aqua">
              {prog.shortName}
            </p>
          )}
          <h1 className="mt-3 font-heading text-4xl font-bold">{prog.title}</h1>
          {prog.tagline && <p className="mt-4 max-w-3xl text-lg text-white/85">{prog.tagline}</p>}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="max-w-3xl text-dark-navy">{prog.summary}</p>

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {prog.ageRange && <Stat label="Ages" value={prog.ageRange} />}
          {prog.durationMonthsTypical && <Stat label="Typical duration" value={`${prog.durationMonthsTypical} months`} />}
          {prog.minDurationWeeks && <Stat label="Minimum duration" value={`${prog.minDurationWeeks}+ weeks`} />}
          {prog.totalStructuredHoursMin && <Stat label="Structured hours" value={`${prog.totalStructuredHoursMin}+`} />}
          {prog.liveFacilitatedHoursMin && <Stat label="Live hours" value={`${prog.liveFacilitatedHoursMin}+`} />}
          {prog.accreditation && <Stat label="Accreditation" value="NEASC + CIS" />}
        </dl>

        {prog.accreditation && <p className="mt-4 text-sm text-cool-grey">{prog.accreditation}</p>}
        {prog.targetContext && (
          <p className="mt-4 max-w-3xl text-sm text-dark-navy/90">{prog.targetContext}</p>
        )}

        {/* Programme-level downloads (e.g. Coordinator Guide + Educator Guide). Kept near the top so
            the people running the programme can grab their guide first. */}
        {prog.downloads.length > 0 && (
          <section className="mt-10 rounded-2xl border border-cool-grey/25 bg-white p-6 shadow-sm">
            <p className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-olive">
              Start here · for the people running it
            </p>
            <h2 className="mt-1 font-heading text-lg font-bold text-navy">Programme guides to download</h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {prog.downloads.map((d) => (
                <li key={d.file}>
                  <a
                    href={d.file}
                    download
                    className="group flex items-start gap-3 rounded-xl border border-cool-grey/25 bg-aqua/[0.04] p-3.5 transition hover:border-navy/40 hover:bg-white"
                  >
                    <span className="mt-0.5 rounded-lg bg-navy px-2 py-1 font-heading text-[10px] font-bold uppercase tracking-wide text-white">
                      {d.format ?? "File"}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-navy group-hover:underline">{d.label}</span>
                      {d.note && (
                        <span className="mt-0.5 block text-[13px] leading-snug text-cool-grey">{d.note}</span>
                      )}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Versions (e.g. Learning Bridge / Learning Bridge+) */}
        {prog.versions.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-semibold text-navy">Two versions</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {prog.versions.map((v) => (
                <div key={v.name} className="rounded-lg border-l-4 border-teal border-y border-r border-cool-grey/20 bg-white p-5 shadow-sm">
                  <h3 className="font-heading text-lg font-semibold text-dark-navy">{v.name}</h3>
                  <p className="mt-2 text-sm text-cool-grey">{v.summary}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* What students gain */}
        {prog.studentGains.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-semibold text-navy">What students gain</h2>
            <ul className="mt-4 space-y-2">
              {prog.studentGains.map((g, i) => (
                <li key={i} className="flex gap-3 rounded-lg bg-aqua/5 p-3 text-dark-navy">
                  <span className="font-heading font-bold text-aqua">→</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* The agency thread. What the whole programme is for, and what each part contributes to it.
            Agency for positive change is Amala's required outcome (foundations/agency.yaml); before
            this block it was visible only on /foundations and on individual material pages, with
            nothing joining them at programme level. Placed directly above the components, so a reader
            meets the purpose before the parts. */}
        {prog.agencyThread && (
          <section id="agency" className="mt-12 scroll-mt-6">
            <p className="font-heading text-xs font-bold uppercase tracking-widest text-plum">
              What this programme is for
            </p>
            <h2 className="mt-1 font-heading text-2xl font-semibold text-navy">
              Agency for positive change
            </h2>
            <p className="mt-3 max-w-3xl text-lg text-dark-navy">{prog.agencyThread.statement}</p>
            {prog.agencyThread.inThisProgramme && (
              <p className="mt-3 max-w-3xl text-dark-navy/90">{prog.agencyThread.inThisProgramme}</p>
            )}
            <p className="mt-4 text-sm text-cool-grey">
              Measured against the three indicators of agency, {" "}
              <Link href="/foundations" className="font-medium text-navy hover:underline">
                see the Learning Foundations
              </Link>
              .
            </p>

            {prog.agencyThread.byComponent.length > 0 && (
              <>
                <h3 className="mt-8 font-heading text-lg font-semibold text-dark-navy">
                  What each component contributes
                </h3>
                <div className="mt-4 space-y-4">
                  {prog.agencyThread.byComponent.map((row) => (
                    <div
                      key={row.component}
                      className="rounded-xl border border-cool-grey/25 bg-white p-5 shadow-sm"
                    >
                      <h4 className="font-heading font-bold text-navy">{row.component}</h4>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {row.indicators.map((id) => (
                          <li
                            key={id}
                            className="rounded-full bg-plum/10 px-3 py-1 text-xs font-medium text-plum"
                          >
                            {indicatorLabel(id)}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-dark-navy/90">{row.how}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {prog.agencyThread.byCompetency.length > 0 && (
              <>
                <h3 className="mt-8 font-heading text-lg font-semibold text-dark-navy">
                  What developing each competency contributes
                </h3>
                <div className="mt-4 space-y-4">
                  {prog.agencyThread.byCompetency.map((row) => {
                    const comp = getCompetencyByCode(row.code);
                    return (
                      <div
                        key={row.code}
                        className="rounded-xl border border-cool-grey/25 bg-white p-5 shadow-sm"
                      >
                        <h4 className="font-heading font-bold text-navy">
                          <span className="text-aqua">{row.code}</span>{" "}
                          {comp ? comp.title : row.code}
                        </h4>
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {row.indicators.map((id) => (
                            <li
                              key={id}
                              className="rounded-full bg-plum/10 px-3 py-1 text-xs font-medium text-plum"
                            >
                              {indicatorLabel(id)}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-dark-navy/90">{row.how}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {prog.agencyThread.howWeSeeIt.length > 0 && (
              <>
                <h3 className="mt-8 font-heading text-lg font-semibold text-dark-navy">
                  How we see it, and how we do not
                </h3>
                <ul className="mt-3 space-y-2">
                  {prog.agencyThread.howWeSeeIt.map((x, i) => (
                    <li key={i} className="flex gap-3 rounded-lg bg-plum/5 p-3 text-dark-navy">
                      <span className="font-heading font-bold text-plum">·</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

        {/* Components (component-based programme, e.g. Learning Bridge) */}
        {prog.components.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-semibold text-navy">
              {prog.components.some((c) => c.structuredHours != null)
                ? "Components and hours"
                : "Programme components"}
            </h2>
            <div className="mt-6 space-y-4">
              {prog.components.map((c) => {
                const linked = c.courseSlug ? getCourse(c.courseSlug) : undefined;
                const unit = getUnitsForProgramme(prog.slug).find(
                  (u) => u.componentTitle === c.title || (c.courseSlug && u.courseSlug === c.courseSlug),
                );
                return (
                <div key={c.title} className="rounded-lg border-l-4 border-plum border-y border-r border-cool-grey/20 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-heading text-lg font-semibold text-dark-navy">
                      {linked ? (
                        <Link href={`/courses/${linked.slug}`} className="hover:text-navy hover:underline">
                          {c.title}
                        </Link>
                      ) : (
                        c.title
                      )}
                      {c.optional && (
                        <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-terracotta">
                          Optional
                        </span>
                      )}
                    </h3>
                    {c.structuredHours != null ? (
                      <span className="font-heading text-sm font-semibold text-plum">
                        {c.structuredHours} hours
                        {c.facilitatedHours != null && c.independentHours != null && (
                          <span className="font-normal text-cool-grey">
                            {" "}· {c.facilitatedHours} facilitated / {c.independentHours} independent
                          </span>
                        )}
                      </span>
                    ) : (
                      c.cadence && (
                        <span className="font-heading text-sm font-semibold text-plum">{c.cadence}</span>
                      )
                    )}
                  </div>
                  {c.summary && <p className="mt-2 text-sm text-cool-grey">{c.summary}</p>}
                  {c.deliveryOptions.length > 0 && (
                    <p className="mt-3 text-xs text-cool-grey">
                      <span className="font-medium text-dark-navy">Delivery: </span>
                      {c.deliveryOptions.join(" · ")}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    {linked && (
                      <Link
                        href={`/courses/${linked.slug}`}
                        className="inline-block text-sm font-medium text-navy hover:underline"
                      >
                        View course guide →
                      </Link>
                    )}
                    {unit && (
                      <Link
                        href={`/units/${unit.slug}`}
                        className="inline-block text-sm font-medium text-orange hover:underline"
                      >
                        View the unit plan →
                      </Link>
                    )}
                    {prog.mentoring && c.title === "Mentoring and Wellbeing" && (
                      <Link
                        href="#mentoring"
                        className="inline-block text-sm font-medium text-plum hover:underline"
                      >
                        How mentoring works here →
                      </Link>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Mentoring and Wellbeing, programme-specific mentoring guidance, contextualising the
            generic mentor moves by role area (e.g. the Cox's Bazar Learning Bridge+). */}
        {prog.mentoring && (
          <section id="mentoring" className="mt-12 scroll-mt-6">
            <h2 className="font-heading text-2xl font-semibold text-navy">
              Mentoring and Wellbeing in this programme
            </h2>
            <p className="mt-3 max-w-3xl text-dark-navy">{prog.mentoring.intro}</p>

            {prog.mentoring.context.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {prog.mentoring.context.map((c) => (
                  <div
                    key={c.title}
                    className="rounded-lg border-l-4 border-plum border-y border-r border-cool-grey/20 bg-white p-5 shadow-sm"
                  >
                    <h3 className="font-heading text-lg font-semibold text-dark-navy">{c.title}</h3>
                    <p className="mt-2 text-sm text-cool-grey">{c.detail}</p>
                  </div>
                ))}
              </div>
            )}

            {prog.mentoring.areas.length > 0 && (
              <>
                <p className="mt-8 max-w-3xl text-sm text-dark-navy/90">
                  The shared practice is the{" "}
                  <Link href="/educators/mentoring" className="font-medium text-navy hover:underline">
                    mentor moves
                  </Link>{" "}
                  on the Educators pages. Here is how each part of the mentor role is held in this
                  context, with the moves that apply.
                </p>
                <div className="mt-6 space-y-4">
                  {prog.mentoring.areas.map((a) => {
                    const meta = tagMeta(a.area);
                    const moves = educatorMoves.filter((m) => m.tags.some((t) => t.id === a.area));
                    return (
                      <div
                        key={a.area}
                        className="rounded-lg border border-cool-grey/20 bg-white p-5 shadow-sm"
                      >
                        <h3 className="font-heading text-lg font-semibold text-dark-navy">
                          {meta.label}
                        </h3>
                        <p className="mt-2 text-sm text-dark-navy/90">{a.contextNote}</p>
                        {moves.length > 0 && (
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {moves.map((m) => (
                              <li key={m.slug}>
                                <Link
                                  href={`/materials/${m.slug}`}
                                  className="inline-block rounded-full border border-terracotta/40 bg-terracotta/5 px-3 py-1 text-xs font-medium text-terracotta hover:bg-terracotta/10"
                                >
                                  {m.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {/* Streams (course-based programme, e.g. GSD) */}
        {(prog.streams.length > 0 || prog.ongoingComponents.length > 0) && (
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-semibold text-navy">Streams and courses</h2>
            <div className="mt-6 space-y-6">
              {prog.streams.map((stream) => (
                <div key={stream.id} className="rounded-lg border border-cool-grey/20 bg-white p-5 shadow-sm">
                  <h3 className="font-heading text-lg font-semibold text-dark-navy">{stream.title}</h3>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {stream.courses.map((ref) => {
                      const c = getCourse(ref.courseId);
                      return (
                        <li key={ref.courseId}>
                          <Link
                            href={`/courses/${c?.slug ?? ref.courseId}`}
                            className="block rounded-md border-l-4 border-teal border-y border-r border-cool-grey/20 p-3 hover:shadow-sm"
                          >
                            <span className="font-medium text-dark-navy">{c?.title ?? ref.courseId}</span>
                            {ref.exampleProductTask && (
                              <span className="mt-1 block text-xs text-cool-grey">
                                Example task: {ref.exampleProductTask}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              {prog.ongoingComponents.length > 0 && (
                <div className="rounded-lg border border-cool-grey/20 bg-white p-5 shadow-sm">
                  <h3 className="font-heading text-lg font-semibold text-dark-navy">Ongoing components</h3>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {prog.ongoingComponents.map((ref) => {
                      const c = getCourse(ref.courseId);
                      return (
                        <li key={ref.courseId}>
                          <Link
                            href={`/courses/${c?.slug ?? ref.courseId}`}
                            className="block rounded-md border-l-4 border-plum border-y border-r border-cool-grey/20 p-3 hover:shadow-sm"
                          >
                            <span className="font-medium text-dark-navy">{c?.title ?? ref.courseId}</span>
                            <span className="mt-1 block text-xs text-cool-grey">
                              {ref.structuredHours ? `${ref.structuredHours} hours` : ""}
                              {ref.graduationRequirement ? " · graduation requirement" : ""}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Version comparison (e.g. LB vs LB+) */}
        {prog.versionComparison.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-semibold text-navy">
              {prog.versions.length === 2
                ? `${prog.versions[0].name} vs ${prog.versions[1].name}`
                : "How the versions compare"}
            </h2>
            <dl className="mt-6 divide-y divide-cool-grey/20 overflow-hidden rounded-lg border border-cool-grey/20 bg-white shadow-sm">
              {prog.versionComparison.map((row) => (
                <div key={row.aspect} className="grid gap-1 p-4 sm:grid-cols-3 sm:gap-4">
                  <dt className="font-heading text-sm font-semibold text-dark-navy">{row.aspect}</dt>
                  <dd className="text-sm text-cool-grey sm:col-span-2">{row.detail}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* What it takes to deliver */}
        {prog.delivery.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-semibold text-navy">What it takes to deliver</h2>
            <div className="mt-6 space-y-4">
              {prog.delivery.map((d) => (
                <div key={d.title} className="rounded-lg border border-cool-grey/20 bg-white p-5 shadow-sm">
                  <h3 className="font-heading text-lg font-semibold text-dark-navy">{d.title}</h3>
                  {d.detail && <p className="mt-2 text-sm text-cool-grey">{d.detail}</p>}
                  {d.items.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-cool-grey">
                      {d.items.map((it, i) => (
                        <li key={i}>{it}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* What Amala provides */}
        {prog.support.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-semibold text-navy">What Amala provides</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {prog.support.map((s) => (
                <div key={s.title} className="rounded-lg border-l-4 border-olive border-y border-r border-cool-grey/20 bg-white p-5 shadow-sm">
                  <h3 className="font-heading text-lg font-semibold text-dark-navy">{s.title}</h3>
                  <p className="mt-2 text-sm text-cool-grey">{s.detail}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Intended outcomes / theory of change (e.g. WELP) */}
        {prog.outcomes.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-semibold text-navy">
              Outcomes the programme works toward
            </h2>
            <div className="mt-6 space-y-4">
              {prog.outcomes.map((o) => (
                <div key={o.title} className="rounded-lg border-l-4 border-terracotta border-y border-r border-cool-grey/20 bg-white p-5 shadow-sm">
                  <h3 className="font-heading text-lg font-semibold text-dark-navy">{o.title}</h3>
                  {o.points.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-cool-grey">
                      {o.points.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Grading and certification (e.g. Learning Bridge+) */}
        {prog.grading && (
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-semibold text-navy">Grading and certification</h2>
            {prog.grading.intro && (
              <p className="mt-3 max-w-3xl text-dark-navy">{prog.grading.intro}</p>
            )}
            {prog.grading.assessedCompetencies.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {prog.grading.assessedCompetencies.map((c) => (
                  <div key={c.title} className="rounded-lg border-l-4 border-navy border-y border-r border-cool-grey/20 bg-white p-5 shadow-sm">
                    <h3 className="font-heading font-semibold text-dark-navy">{c.title}</h3>
                    <p className="mt-2 text-sm text-cool-grey">{c.description}</p>
                  </div>
                ))}
              </div>
            )}
            {prog.grading.scale.length > 0 && (
              <dl className="mt-6 divide-y divide-cool-grey/20 overflow-hidden rounded-lg border border-cool-grey/20 bg-white shadow-sm">
                {prog.grading.scale.map((g) => (
                  <div key={g.grade} className="grid gap-1 p-4 sm:grid-cols-3 sm:gap-4">
                    <dt className="font-heading text-sm font-semibold text-plum">{g.grade}</dt>
                    <dd className="text-sm text-cool-grey sm:col-span-2">{g.requirement}</dd>
                  </div>
                ))}
              </dl>
            )}
            {prog.grading.note && (
              <p className="mt-4 max-w-3xl text-sm text-dark-navy/90">{prog.grading.note}</p>
            )}
          </section>
        )}

        {/* Graduation criteria (course-based programme) */}
        {prog.graduationCriteria.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-semibold text-navy">Criteria for the award</h2>
            <ul className="mt-4 space-y-2">
              {prog.graduationCriteria.map((crit, i) => (
                <li key={i} className="flex gap-3 rounded-lg bg-olive/5 p-3 text-dark-navy">
                  <span className="font-heading font-bold text-olive">✓</span>
                  <span>{crit}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cool-grey/20 bg-white p-3">
      <dt className="text-xs text-cool-grey">{label}</dt>
      <dd className="mt-0.5 font-heading font-semibold text-dark-navy">{value}</dd>
    </div>
  );
}
