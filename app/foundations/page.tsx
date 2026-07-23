import type { Metadata } from "next";
import { agency, principles } from "@/lib/content";

export const metadata: Metadata = { title: "Learning Foundations" };

export default function FoundationsPage() {
  return (
    <main>
      <section className="bg-navy px-6 py-14 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="font-heading text-sm uppercase tracking-widest text-aqua">
            The Learning Foundations
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold">Agency for positive change</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/85">{agency.definition}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <section>
          <h2 className="font-heading text-xl font-semibold text-dark-navy">
            Demonstrated through three indicators
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {agency.indicators.map((ind) => (
              <li key={ind.id} className="rounded-lg border-l-4 border-orange border-y border-r border-cool-grey/20 bg-white p-4">
                <p className="font-medium text-dark-navy">{ind.label}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-3xl text-dark-navy/90">{agency.why}</p>
        </section>

        <section className="mt-12">
          <h2 className="font-heading text-2xl font-semibold text-navy">The nine principles</h2>
          <p className="mt-2 max-w-3xl text-cool-grey">{agency.placement}</p>
          <div className="mt-6 space-y-5">
            {principles.map((p) => (
              <div
                key={p.id}
                id={p.id}
                className="scroll-mt-24 rounded-lg border border-cool-grey/20 bg-white p-5 shadow-sm"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-heading text-2xl font-bold text-olive">{p.number}</span>
                  <h3 className="font-heading text-lg font-semibold text-dark-navy">{p.statement}</h3>
                </div>
                <p className="mt-2 text-dark-navy/90">{p.gloss}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-cool-grey">
                      In design and facilitation
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-dark-navy/90">
                      {p.designLooksLike.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-cool-grey">
                      We know it is working when
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-dark-navy/90">
                      {p.workingWhen.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
