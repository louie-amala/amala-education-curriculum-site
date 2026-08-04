import type { Metadata } from "next";
import Link from "next/link";
import { educatorModules } from "@/lib/content";
import { EDUCATOR_MODULE_CATEGORY } from "@/lib/ui";

export const metadata: Metadata = { title: "Educator training modules" };

// The order categories are shown in on the index.
const CATEGORY_ORDER = ["foundation", "component", "delivery-mode"] as const;

export default function EducatorTrainingPage() {
  return (
    <main>
      <section className="bg-navy px-6 py-14 text-white">
        <div className="mx-auto max-w-4xl">
          <nav className="text-sm text-white/70">
            <Link href="/educators" className="hover:text-white hover:underline">
              Educators
            </Link>
            <span className="px-2">/</span>
            <span className="text-white/90">Training modules</span>
          </nav>
          <h1 className="mt-3 font-heading text-4xl font-bold">Educator training modules</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/85">
            The training an educator takes to be able to deliver an Amala programme. Each module is a
            self-contained training a trainer runs with a cohort &mdash; an overview, a session-by-session
            structure, a deliverable, and every trainer and participant resource to download. Modules are
            held by the person and carry across programmes.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {CATEGORY_ORDER.map((cat) => {
          const mods = educatorModules.filter((m) => m.category === cat);
          if (mods.length === 0) return null;
          const meta = EDUCATOR_MODULE_CATEGORY[cat];
          return (
            <section key={cat} className="mb-10">
              <div className="mb-4">
                <h2 className="font-heading text-xl font-semibold text-dark-navy">{meta.label}</h2>
                <p className="mt-1 text-sm text-cool-grey">{meta.blurb}</p>
              </div>
              <div className="grid gap-5">
                {mods.map((m) => {
                  const inDev = m.status === "in-development";
                  const card = (
                    <div
                      className={`block h-full rounded-xl border-l-4 ${meta.accent} border-y border-r border-cool-grey/20 bg-white p-6 shadow-sm transition ${
                        inDev ? "opacity-70" : "hover:shadow-md"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-heading text-lg font-semibold text-dark-navy">{m.title}</h3>
                        {inDev ? (
                          <span className="rounded-full bg-cool-grey/15 px-2.5 py-0.5 text-xs font-medium text-cool-grey">
                            In development
                          </span>
                        ) : (
                          <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">
                            {m.resources.length} {m.resources.length === 1 ? "resource" : "resources"}
                          </span>
                        )}
                      </div>
                      {m.requirement && (
                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-terracotta">
                          {m.requirement}
                        </p>
                      )}
                      <p className="mt-2 text-cool-grey">{m.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-dark-navy/70">
                        {m.hours?.total != null && <span>{m.hours.total} hrs total</span>}
                        {m.hours?.synchronous != null && <span>{m.hours.synchronous} hrs live</span>}
                        {m.sessions.length > 0 && (
                          <span>
                            {m.sessions.length} {m.sessions.length === 1 ? "session" : "sessions"}
                          </span>
                        )}
                      </div>
                      {!inDev && (
                        <p className="mt-4 text-sm font-semibold text-navy">Open the module &rarr;</p>
                      )}
                    </div>
                  );
                  return inDev ? (
                    <div key={m.slug}>{card}</div>
                  ) : (
                    <Link key={m.slug} href={`/educators/training/${m.slug}`} className="block">
                      {card}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
