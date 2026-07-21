import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getProgramme, programmes } from "@/lib/content";

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
          {prog.durationMonthsTypical && <Stat label="Typical duration" value={`${prog.durationMonthsTypical} months`} />}
          {prog.totalStructuredHoursMin && <Stat label="Structured hours" value={`${prog.totalStructuredHoursMin}+`} />}
          {prog.liveFacilitatedHoursMin && <Stat label="Live hours" value={`${prog.liveFacilitatedHoursMin}+`} />}
          {prog.accreditation && <Stat label="Accreditation" value="NEASC + CIS" />}
        </dl>

        {prog.accreditation && <p className="mt-4 text-sm text-cool-grey">{prog.accreditation}</p>}
        {prog.targetContext && (
          <p className="mt-4 max-w-3xl text-sm text-dark-navy/90">{prog.targetContext}</p>
        )}

        {/* Streams */}
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
          </div>
        </section>

        {/* Graduation criteria */}
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
