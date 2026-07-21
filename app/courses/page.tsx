import type { Metadata } from "next";
import Link from "next/link";
import { courses, getCourse, getProgramme } from "@/lib/content";

export const metadata: Metadata = { title: "Courses" };

export default function CoursesIndex() {
  const gsd = getProgramme("gsd");

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-heading text-3xl font-bold text-navy">Courses</h1>
      <p className="mt-2 max-w-2xl text-cool-grey">
        Ten Changemaker Courses across five streams, plus the ongoing components. Each course lists
        its objectives and the competencies they evidence.
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
