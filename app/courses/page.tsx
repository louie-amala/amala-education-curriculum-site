import type { Metadata } from "next";
import Link from "next/link";
import { courses, getCourse, getProgramme, publicProgrammes } from "@/lib/content";

export const metadata: Metadata = { title: "Courses" };

export default function CoursesIndex() {
  const gsd = getProgramme("gsd");

  // Component-based programmes (e.g. Learning Bridge) deliver some components as full courses.
  // Public programmes only throughout this page - a password-protected programme must not be
  // named here, even though the courses it shares with a public programme are themselves public.
  const componentProgrammes = publicProgrammes
    .filter((p) => p.components.some((c) => c.courseSlug))
    .map((p) => ({
      programme: p,
      courses: p.components
        .filter((c) => c.courseSlug)
        .map((c) => getCourse(c.courseSlug!))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    }));

  // Standalone courses: authored courses not placed in any GSD stream/component or programme
  // component (e.g. English for Impact, whose programme placement is still to be decided).
  const placedCourseIds = new Set<string>([
    ...publicProgrammes.flatMap((p) => p.streams.flatMap((s) => s.courses.map((c) => c.courseId))),
    ...publicProgrammes.flatMap((p) => p.ongoingComponents.map((c) => c.courseId)),
    ...publicProgrammes.flatMap((p) =>
      p.components.filter((c) => c.courseSlug).map((c) => getCourse(c.courseSlug!)?.id ?? ""),
    ),
  ]);
  const standaloneCourses = courses.filter((c) => !placedCourseIds.has(c.id));

  // Other stream-based programmes (e.g. English for Impact): a programme whose courses are its
  // units. GSD is rendered above with its streams as headers; these render under the programme name.
  const streamProgrammes = publicProgrammes.filter(
    (p) => p.id !== "gsd" && p.streams.length > 0,
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-heading text-3xl font-bold text-navy">Courses</h1>
      <p className="mt-2 max-w-2xl text-cool-grey">
        The Global Secondary Diploma&apos;s ten Changemaker Courses across five streams and its
        ongoing components, plus the Learning Bridge courses. Each course lists its objectives and the
        competencies they evidence.
      </p>

      {gsd && (
        <div className="mt-10 space-y-8">
          {gsd.streams.map((stream) => (
            <section key={stream.id}>
              <h2 className="font-heading text-lg font-semibold text-dark-navy">{stream.title}</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {stream.courses.map((ref) => {
                  const c = getCourse(ref.courseId);
                  if (!c) return null;
                  return (
                    <li key={ref.courseId}>
                      <CourseCard slug={c.slug} title={c.title} purpose={c.purpose} />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <section>
            <h2 className="font-heading text-lg font-semibold text-dark-navy">Ongoing components</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {gsd.ongoingComponents.map((ref) => {
                const c = getCourse(ref.courseId);
                if (!c) return null;
                return (
                  <li key={ref.courseId}>
                    <CourseCard slug={c.slug} title={c.title} purpose={c.purpose} />
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}

      {componentProgrammes.map(({ programme, courses: progCourses }) => (
        <section key={programme.id} className="mt-12">
          <h2 className="font-heading text-lg font-semibold text-dark-navy">
            <Link href={`/programmes/${programme.slug}`} className="hover:text-navy hover:underline">
              {programme.title}
            </Link>
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {progCourses.map((c) => (
              <li key={c.id}>
                <CourseCard slug={c.slug} title={c.title} purpose={c.purpose} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {streamProgrammes.map((programme) => (
        <section key={programme.id} className="mt-12">
          <h2 className="font-heading text-lg font-semibold text-dark-navy">
            <Link href={`/programmes/${programme.slug}`} className="hover:text-navy hover:underline">
              {programme.title}
            </Link>
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {programme.streams.flatMap((s) => s.courses).map((ref) => {
              const c = getCourse(ref.courseId);
              if (!c) return null;
              return (
                <li key={ref.courseId}>
                  <CourseCard slug={c.slug} title={c.title} purpose={c.purpose} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {standaloneCourses.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-lg font-semibold text-dark-navy">Standalone courses</h2>
          <p className="mt-1 max-w-2xl text-sm text-cool-grey">
            Courses developed on their own, not yet placed within a programme.
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {standaloneCourses.map((c) => (
              <li key={c.id}>
                <CourseCard slug={c.slug} title={c.title} purpose={c.purpose} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function CourseCard({ slug, title, purpose }: { slug: string; title: string; purpose: string }) {
  return (
    <Link
      href={`/courses/${slug}`}
      className="block h-full rounded-lg border-l-4 border-teal border-y border-r border-cool-grey/20 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <h3 className="font-heading font-semibold text-dark-navy">{title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-cool-grey">{purpose}</p>
    </Link>
  );
}
