import Link from "next/link";
import { areas, competencies, courses, principles, programmes } from "@/lib/content";

export default function Home() {
  const objectives = courses.reduce((n, c) => n + c.objectives.length, 0);
  const links = courses.reduce(
    (n, c) => n + c.objectives.reduce((m, o) => m + o.competencyEvidence.length, 0),
    0,
  );

  const entries = [
    { href: "/programmes/gsd", title: "Global Secondary Diploma", desc: "The flagship programme: five streams, ten courses, PIP and Pathways.", accent: "border-navy" },
    { href: "/competencies", title: "Competencies", desc: `${competencies.length} competencies across ${areas.length} areas. See what each one evidences.`, accent: "border-orange" },
    { href: "/courses", title: "Courses", desc: `${courses.length} courses, their objectives, and the competencies they build.`, accent: "border-teal" },
    { href: "/foundations", title: "Learning Foundations", desc: "Agency for positive change and the nine principles that guide design.", accent: "border-olive" },
  ];

  return (
    <main>
      <section className="bg-navy px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="font-heading text-sm uppercase tracking-widest text-aqua">
            Amala — Education for Change
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold leading-tight sm:text-5xl">
            The Amala Curriculum
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">
            A design tool with the curriculum built in. Understand the model, navigate the
            relational web, and design programmes and learning experiences you can take away and
            deliver.
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-2">
            {entries.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className={`block rounded-lg border-l-4 ${e.accent} border-y border-r border-cool-grey/20 bg-white p-6 shadow-sm transition hover:shadow-md`}
              >
                <h2 className="font-heading text-xl font-semibold text-dark-navy">{e.title}</h2>
                <p className="mt-2 text-cool-grey">{e.desc}</p>
              </Link>
            ))}
          </div>

          <p className="mt-10 text-sm text-cool-grey">
            {programmes.length} programme · {courses.length} courses · {areas.length} competency
            areas · {competencies.length} competencies · {principles.length} principles ·{" "}
            {objectives} objectives · {links} competency links — all validated at build time.
          </p>
        </div>
      </section>
    </main>
  );
}
