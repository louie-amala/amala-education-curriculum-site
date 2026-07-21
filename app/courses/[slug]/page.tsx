import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  courses,
  getCompetencyByCode,
  getCourse,
  getCourseCompetencies,
  getCourseStream,
  getPrinciple,
} from "@/lib/content";
import { areaStyle, creditBadge } from "@/lib/ui";

export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getCourse(slug);
  return { title: c?.title ?? "Course" };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  const stream = getCourseStream(course.id);
  const req = course.requirements;
  const courseComps = getCourseCompetencies(course);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <nav className="text-sm text-cool-grey">
        <Link href="/courses" className="hover:text-navy hover:underline">
          Courses
        </Link>
        {stream && <span> · {stream.stream.title}</span>}
      </nav>

      <h1 className="mt-3 font-heading text-3xl font-bold text-navy">{course.title}</h1>
      <p className="mt-4 text-dark-navy">{course.purpose}</p>

      {course.testimonial && (
        <blockquote className="mt-6 border-l-4 border-gold bg-gold/5 p-4 text-dark-navy">
          <p className="italic">“{course.testimonial.quote}”</p>
          <footer className="mt-2 text-sm text-cool-grey">— {course.testimonial.attribution}</footer>
        </blockquote>
      )}

      {/* Requirements */}
      {req && (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">Requirements</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {req.structuredHours != null && <Stat label="Structured hours" value={String(req.structuredHours)} />}
            {req.cadence && <Stat label="Cadence" value={req.cadence} />}
            {req.durationWeeks != null && <Stat label="Duration (weeks)" value={String(req.durationWeeks)} />}
            {req.liveIndependentSplit && <Stat label="Live / independent" value={req.liveIndependentSplit} />}
          </dl>
          {req.notes && <p className="mt-3 text-sm text-cool-grey">{req.notes}</p>}
        </section>
      )}

      {/* Competency map */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-dark-navy">
          Competency map ({courseComps.length})
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {courseComps.map((c) => (
            <li key={c.id}>
              <Link
                href={`/competencies/${c.code.toLowerCase()}`}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${areaStyle(c.areaId).border} bg-white hover:shadow-sm`}
              >
                <span className="font-mono text-xs text-cool-grey">{c.code}</span>
                <span className="text-dark-navy">{c.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Objectives */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-dark-navy">
          Objectives ({course.objectives.length})
        </h2>
        <ol className="mt-4 space-y-6">
          {course.objectives.map((obj, i) => (
            <li key={i} className="rounded-lg border border-cool-grey/20 bg-white p-5 shadow-sm">
              <h3 className="font-heading font-semibold text-dark-navy">{obj.statement}</h3>

              {obj.supportedTo.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cool-grey">
                    Learners are supported to
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-dark-navy/90">
                    {obj.supportedTo.map((t, j) => (
                      <li key={j}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {obj.competencyEvidence.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cool-grey">
                    May evidence
                  </p>
                  <ul className="mt-2 space-y-2">
                    {obj.competencyEvidence.map((ev, j) => {
                      const comp = getCompetencyByCode(ev.code);
                      return (
                        <li key={j} className="text-sm">
                          <Link
                            href={`/competencies/${ev.code.toLowerCase()}`}
                            className="font-mono text-xs font-semibold text-navy hover:underline"
                          >
                            {ev.code}
                          </Link>{" "}
                          <span className="text-dark-navy">{comp?.title ?? ev.citedTitle}</span>
                          {comp && (
                            <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${creditBadge(comp.creditLevel)}`}>
                              {comp.creditLevel}
                            </span>
                          )}
                          <span className="mt-0.5 block text-cool-grey">{ev.condition}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Principle mappings */}
      {course.principleMappings.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">
            Principles in this course
          </h2>
          <div className="mt-4 space-y-4">
            {course.principleMappings.map((pm, i) => {
              const p = getPrinciple(pm.principle);
              return (
                <div key={i} className="rounded-lg border border-cool-grey/20 bg-white p-4">
                  <p className="font-heading font-semibold text-dark-navy">
                    {p ? p.statement : pm.principle}
                  </p>
                  {pm.inThisCourse.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-sm text-dark-navy/90">
                      {pm.inThisCourse.map((t, j) => (
                        <li key={j}>{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
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
