import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  courses,
  getCompetencyByCode,
  getCourse,
  getCourseCompetencies,
  getCourseObjectives,
  getCourseStream,
  getMaterialsForObjective,
  getPrinciple,
  getProgrammeForCourse,
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
  const programme = getProgrammeForCourse(course.id);
  const req = course.requirements;
  const courseComps = getCourseCompetencies(course);
  const anchor = course.throughline
    ? getCompetencyByCode(course.throughline.anchorCompetency)
    : undefined;
  const supportingComps = anchor ? courseComps.filter((c) => c.code !== anchor.code) : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <nav className="text-sm text-cool-grey">
        <Link href="/courses" className="hover:text-navy hover:underline">
          Courses
        </Link>
        {stream ? (
          <span> · {stream.stream.title}</span>
        ) : (
          programme && (
            <>
              {" · "}
              <Link href={`/programmes/${programme.slug}`} className="hover:text-navy hover:underline">
                {programme.title}
              </Link>
            </>
          )
        )}
      </nav>

      <h1 className="mt-3 font-heading text-3xl font-bold text-navy">{course.title}</h1>
      <p className="mt-4 text-dark-navy">{course.purpose}</p>

      {course.testimonial && (
        <blockquote className="mt-6 border-l-4 border-gold bg-gold/5 p-4 text-dark-navy">
          <p className="italic">“{course.testimonial.quote}”</p>
          <footer className="mt-2 text-sm text-cool-grey">— {course.testimonial.attribution}</footer>
        </blockquote>
      )}

      {/* Throughline — agency → anchor competency → objectives */}
      {course.throughline && (
        <section className="mt-8 rounded-lg border border-navy/15 bg-navy/[0.03] p-5">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">Course throughline</h2>
          <ol className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <li className="rounded-full border border-olive bg-white px-3 py-1 font-medium text-olive">
              Agency for positive change
            </li>
            <li aria-hidden className="text-cool-grey">→</li>
            <li>
              <Link
                href={`/competencies/${course.throughline.anchorCompetency.toLowerCase()}`}
                className="inline-flex items-center gap-2 rounded-full border border-navy bg-white px-3 py-1 hover:shadow-sm"
              >
                <span className="font-mono text-xs text-cool-grey">{course.throughline.anchorCompetency}</span>
                <span className="font-medium text-navy">{anchor?.title ?? "Anchor competency"}</span>
              </Link>
            </li>
            <li aria-hidden className="text-cool-grey">→</li>
            <li className="rounded-full border border-teal bg-white px-3 py-1 font-medium text-teal">
              {course.objectives.length} objectives
            </li>
          </ol>
          <div className="mt-4 space-y-3 text-sm text-dark-navy/90">
            <p>
              <span className="font-semibold text-dark-navy">Why this builds agency: </span>
              {course.throughline.fromAgency}
            </p>
            <p>
              <span className="font-semibold text-dark-navy">How the objectives get there: </span>
              {course.throughline.toObjectives}
            </p>
          </div>
        </section>
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

      {/* Competencies — anchored layout when the course has a throughline, else a flat map */}
      {anchor ? (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">Competencies</h2>

          {/* The main competency this course develops and demonstrates */}
          <div className={`mt-4 rounded-lg border-l-4 ${areaStyle(anchor.areaId).border} border-y border-r border-cool-grey/20 bg-white p-5 shadow-sm`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-cool-grey">
              This course develops and demonstrates
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <Link
                href={`/competencies/${anchor.code.toLowerCase()}`}
                className="font-mono text-sm font-semibold text-navy hover:underline"
              >
                {anchor.code}
              </Link>
              <span className="font-heading text-lg font-semibold text-dark-navy">{anchor.title}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${creditBadge(anchor.creditLevel)}`}>
                {anchor.creditLevel}
              </span>
            </div>
            {anchor.goal && <p className="mt-2 text-sm text-cool-grey">{anchor.goal}</p>}
            {course.throughline?.develops && (
              <div className="mt-4 border-t border-cool-grey/15 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy">
                  How this course develops it
                </p>
                <p className="mt-1 text-sm text-dark-navy/90">{course.throughline.develops}</p>
              </div>
            )}
            {course.throughline?.demonstrates && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy">
                  How learners demonstrate it
                </p>
                <p className="mt-1 text-sm text-dark-navy/90">{course.throughline.demonstrates}</p>
              </div>
            )}
          </div>

          {/* The supporting competencies, each explained */}
          {supportingComps.length > 0 && (
            <>
              <p className="mt-6 text-sm text-dark-navy">
                In addition to developing{" "}
                <span className="font-semibold">{anchor.title}</span>, students might also develop and
                demonstrate proficiency in:
              </p>
              <ul className="mt-3 space-y-2">
                {supportingComps.map((c) => (
                  <li
                    key={c.id}
                    className={`rounded-lg border-l-4 ${areaStyle(c.areaId).border} border-y border-r border-cool-grey/20 bg-white p-4 shadow-sm`}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <Link
                        href={`/competencies/${c.code.toLowerCase()}`}
                        className="font-mono text-xs font-semibold text-navy hover:underline"
                      >
                        {c.code}
                      </Link>
                      <span className="font-medium text-dark-navy">{c.title}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${creditBadge(c.creditLevel)}`}>
                        {c.creditLevel}
                      </span>
                    </div>
                    {c.goal && <p className="mt-1 text-sm text-cool-grey">{explainGoal(c.goal)}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      ) : (
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
      )}

      {/* Objectives */}
      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-dark-navy">
          Objectives ({course.objectives.length})
        </h2>
        <ol className="mt-4 space-y-6">
          {getCourseObjectives(course).map(({ id, index, objective: obj }) => {
            const materialCount = getMaterialsForObjective(id).length;
            const anchorEvidence = anchor
              ? obj.competencyEvidence.filter((ev) => ev.code === anchor.code)
              : [];
            const otherEvidence = anchor
              ? obj.competencyEvidence.filter((ev) => ev.code !== anchor.code)
              : obj.competencyEvidence;
            return (
            <li key={id} className="rounded-lg border border-cool-grey/20 bg-white p-5 shadow-sm">
              <Link href={`/objectives/${id}`} className="group block">
                <span className="text-xs font-semibold uppercase tracking-wide text-cool-grey">
                  Objective {index}
                </span>
                <h3 className="font-heading font-semibold text-navy group-hover:underline">
                  {obj.statement}
                </h3>
              </Link>
              <p className="mt-1 text-xs text-cool-grey">
                {materialCount > 0
                  ? `${materialCount} material${materialCount === 1 ? "" : "s"} · view objective for activities, tools and resources`
                  : "View objective"}
              </p>

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

              {/* Anchored courses lead with how the main competency is developed here */}
              {anchor && (anchorEvidence.length > 0 || obj.anchorContribution) && (
                <div className="mt-4 rounded-md border border-navy/15 bg-navy/[0.03] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy">
                    Develops &amp; demonstrates the main competency
                  </p>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <Link
                      href={`/competencies/${anchor.code.toLowerCase()}`}
                      className="font-mono text-xs font-semibold text-navy hover:underline"
                    >
                      {anchor.code}
                    </Link>
                    <span className="font-semibold text-dark-navy">{anchor.title}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${creditBadge(anchor.creditLevel)}`}>
                      {anchor.creditLevel}
                    </span>
                  </div>
                  {obj.anchorContribution ? (
                    <div className="mt-2 space-y-2 text-sm">
                      <p>
                        <span className="font-semibold text-navy">Develops — </span>
                        <span className="text-dark-navy/90">{obj.anchorContribution.develops}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-navy">Demonstrates — </span>
                        <span className="text-dark-navy/90">{obj.anchorContribution.demonstrates}</span>
                      </p>
                    </div>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {anchorEvidence.map((ev, j) => (
                        <li key={j} className="text-sm text-dark-navy/90">
                          {ev.condition}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {otherEvidence.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cool-grey">
                    {anchor
                      ? "Additional competencies that might be developed & demonstrated"
                      : "May evidence"}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {otherEvidence.map((ev, j) => (
                      <EvidenceRow key={j} ev={ev} />
                    ))}
                  </ul>
                </div>
              )}
            </li>
            );
          })}
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

// One competency-evidence row inside an objective: the code, title, credit level, and the
// "If learners…" condition describing how this objective develops/demonstrates it.
function EvidenceRow({
  ev,
  emphasise = false,
}: {
  ev: { code: string; citedTitle?: string | null; condition: string };
  emphasise?: boolean;
}) {
  const comp = getCompetencyByCode(ev.code);
  return (
    <li className="text-sm">
      <Link
        href={`/competencies/${ev.code.toLowerCase()}`}
        className="font-mono text-xs font-semibold text-navy hover:underline"
      >
        {ev.code}
      </Link>{" "}
      <span className={emphasise ? "font-semibold text-dark-navy" : "text-dark-navy"}>
        {comp?.title ?? ev.citedTitle}
      </span>
      {comp && (
        <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${creditBadge(comp.creditLevel)}`}>
          {comp.creditLevel}
        </span>
      )}
      <span className={`mt-0.5 block ${emphasise ? "text-dark-navy/90" : "text-cool-grey"}`}>
        {ev.condition}
      </span>
    </li>
  );
}

// Competency goals read "The learner can …"; strip that lead-in so the goal reads as a plain
// explanation ("Assess the credibility …") in the supporting-competency list.
function explainGoal(goal: string): string {
  const stripped = goal.replace(/^The learner can\s+/i, "").trim();
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cool-grey/20 bg-white p-3">
      <dt className="text-xs text-cool-grey">{label}</dt>
      <dd className="mt-0.5 font-heading font-semibold text-dark-navy">{value}</dd>
    </div>
  );
}
