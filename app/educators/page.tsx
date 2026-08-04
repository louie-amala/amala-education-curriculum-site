import type { Metadata } from "next";
import Link from "next/link";
import { educatorModules, educatorMoves } from "@/lib/content";
import { EDUCATOR_FUNCTIONS, functionAreas } from "@/lib/ui";

export const metadata: Metadata = { title: "Educators" };

export default function EducatorsPage() {
  const moduleCount = educatorModules.filter((m) => m.status !== "in-development").length;
  return (
    <main>
      <section className="bg-navy px-6 py-14 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="font-heading text-sm uppercase tracking-widest text-aqua">Educators</p>
          <h1 className="mt-3 font-heading text-4xl font-bold">The Amala educator</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/85">
            Everything for the people who deliver Amala&rsquo;s learning. There are two sides to it:
            the <span className="font-semibold">training</span> that qualifies an educator to
            deliver, and the day-to-day <span className="font-semibold">craft</span> of doing the job
            well.
          </p>
        </div>
      </section>

      {/* Track 1 — Qualification & training */}
      <div className="mx-auto max-w-4xl px-6 pt-12">
        <p className="font-heading text-sm uppercase tracking-widest text-teal">
          Qualification &amp; training
        </p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-dark-navy">
          The training an educator takes
        </h2>
        <p className="mt-2 max-w-3xl text-cool-grey">
          Self-contained training modules a trainer runs with a cohort &mdash; each with a
          session-by-session structure, a deliverable, and every resource to download. Modules are held
          by the person and carry across programmes.
        </p>
        <Link href="/educators/training" className="mt-5 block">
          <div className="block rounded-xl border-l-4 border-navy border-y border-r border-cool-grey/20 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-heading text-xl font-semibold text-dark-navy">Training modules</h3>
              <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">
                {moduleCount} {moduleCount === 1 ? "module" : "modules"} available
              </span>
            </div>
            <p className="mt-2 text-cool-grey">
              Browse the modules, their session structure, and their trainer and participant resources.
            </p>
            <p className="mt-4 text-sm font-semibold text-navy">Browse the modules &rarr;</p>
          </div>
        </Link>
      </div>

      {/* Track 2 — The craft & moves */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="font-heading text-sm uppercase tracking-widest text-terracotta">
          The craft &amp; moves
        </p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-dark-navy">Doing the job well</h2>
        <p className="mt-2 max-w-3xl text-cool-grey">
          An educator performs one or more of three functions: mentor, course facilitator, and assessor
          of competencies. These pages collect the <span className="font-semibold">moves</span> for each
          &mdash; small, named, repeatable things a good educator does, written to work in any programme.
        </p>
        <div className="mt-5 grid gap-5">
          {EDUCATOR_FUNCTIONS.map((f) => {
            const areas = functionAreas(f.key);
            const areaIds = new Set(areas.map((a) => a.id));
            const count = educatorMoves.filter((m) => m.tags.some((t) => areaIds.has(t.id))).length;
            return (
              <Link key={f.key} href={f.href} className="block">
                <div
                  className={`block h-full rounded-xl border-l-4 ${f.accent} border-y border-r border-cool-grey/20 bg-white p-6 shadow-sm transition hover:shadow-md`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-heading text-xl font-semibold text-dark-navy">{f.label}</h3>
                    <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">
                      {count} {count === 1 ? "move" : "moves"}
                    </span>
                  </div>
                  <p className="mt-2 text-cool-grey">{f.blurb}</p>
                  <p className="mt-3 text-sm text-dark-navy/70">
                    {areas.map((a) => a.meta.label).join(" · ")}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-navy">Explore the moves &rarr;</p>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-10 text-sm text-cool-grey">
          Every move is also a material in the{" "}
          <Link href="/materials" className="font-medium text-navy hover:underline">
            library
          </Link>
          , filterable by the <span className="font-medium">Educator moves</span> type, and carries
          its agency, principle and competency mapping like any other material.
        </p>
      </div>
    </main>
  );
}
