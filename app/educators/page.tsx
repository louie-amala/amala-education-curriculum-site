import type { Metadata } from "next";
import Link from "next/link";
import { educatorMoves } from "@/lib/content";
import { EDUCATOR_FUNCTIONS } from "@/lib/ui";

export const metadata: Metadata = { title: "Educators" };

export default function EducatorsPage() {
  return (
    <main>
      <section className="bg-navy px-6 py-14 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="font-heading text-sm uppercase tracking-widest text-aqua">Educators</p>
          <h1 className="mt-3 font-heading text-4xl font-bold">The Amala educator</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/85">
            An educator at Amala performs one or more of three functions: mentor, course
            facilitator, and assessor of competencies. Few educators do all three, and none do all
            of them all the time &mdash; the mix depends on the programme, the partner, and the
            moment. These pages collect the <span className="font-semibold">moves</span> for each
            function: small, named, repeatable things a good educator does, written to work in any
            programme. Adopt the ones for the role you are holding.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-5">
          {EDUCATOR_FUNCTIONS.map((f) => {
            const isActive = f.status === "active";
            const count = educatorMoves.filter((m) => m[f.field]).length;
            const bucketLabels = Object.values(f.areas)
              .sort((a, b) => a.order - b.order)
              .map((a) => a.label);
            const inner = (
              <div
                className={`block h-full rounded-xl border-l-4 ${f.accent} border-y border-r border-cool-grey/20 bg-white p-6 shadow-sm ${
                  isActive ? "transition hover:shadow-md" : "opacity-90"
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-heading text-xl font-semibold text-dark-navy">{f.label}</h2>
                  {isActive ? (
                    <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">
                      {count} {count === 1 ? "move" : "moves"}
                    </span>
                  ) : (
                    <span className="rounded-full bg-cool-grey/10 px-2.5 py-0.5 text-xs font-medium text-cool-grey">
                      In development
                    </span>
                  )}
                </div>
                <p className="mt-2 text-cool-grey">{f.blurb}</p>
                <p className="mt-3 text-sm text-dark-navy/70">{bucketLabels.join(" · ")}</p>
                {isActive && (
                  <p className="mt-4 text-sm font-semibold text-navy">Explore the moves &rarr;</p>
                )}
              </div>
            );
            return isActive ? (
              <Link key={f.key} href={f.href} className="block">
                {inner}
              </Link>
            ) : (
              <div key={f.key}>{inner}</div>
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
