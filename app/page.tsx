import { getDatasetSummary } from "@/lib/content";

export default function Home() {
  const s = getDatasetSummary();

  const stats: { label: string; value: number; accent: string }[] = [
    { label: "Programme", value: s.programmes, accent: "text-navy" },
    { label: "Courses", value: s.courses, accent: "text-teal" },
    { label: "Competency areas", value: s.areas, accent: "text-olive" },
    { label: "Competencies", value: s.competencies, accent: "text-orange" },
    { label: "Principles", value: s.principles, accent: "text-plum" },
    { label: "Objectives", value: s.objectives, accent: "text-aqua" },
    { label: "Competency links", value: s.evidenceLinks, accent: "text-terracotta" },
  ];

  return (
    <main className="min-h-screen bg-white">
      <header className="bg-navy px-6 py-16 text-white sm:px-12">
        <div className="mx-auto max-w-4xl">
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
      </header>

      <section className="px-6 py-14 sm:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">
            Curriculum dataset
          </h2>
          <p className="mt-2 text-cool-grey">
            Live counts read from the verified content source at build time.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-cool-grey/25 bg-white p-5 shadow-sm"
              >
                <dt className="text-sm font-medium text-cool-grey">{stat.label}</dt>
                <dd className={`mt-1 font-heading text-3xl font-bold ${stat.accent}`}>
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 rounded-lg bg-olive/10 p-4 text-sm text-dark-navy">
            Phase 0 scaffold. Next: Zod schemas, the build-time validation harness, and the
            navigable relational web (competencies → objectives → courses).
          </p>
        </div>
      </section>
    </main>
  );
}
