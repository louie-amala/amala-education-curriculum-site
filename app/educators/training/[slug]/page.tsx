import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { educatorModules, getEducatorModule } from "@/lib/content";
import { EDUCATOR_MODULE_CATEGORY } from "@/lib/ui";
import type { EducatorModule } from "@/lib/schema";

export function generateStaticParams() {
  return educatorModules.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = getEducatorModule(slug);
  return { title: m?.title ?? "Training module" };
}

const eyebrow = "text-[11px] font-bold uppercase tracking-[0.14em]";

// Resources grouped for download, with the trainer-facing set first (trainers are the primary
// audience for this page) then participant, then shared.
const AUDIENCE_GROUPS: { key: EducatorModule["resources"][number]["audience"]; label: string; blurb: string }[] = [
  { key: "trainer", label: "For the trainer", blurb: "To prepare and run the module, and to sign it off." },
  { key: "participant", label: "For participants", blurb: "What each educator receives and works in." },
  { key: "shared", label: "Used live in the sessions", blurb: "Shared on screen during delivery." },
];

export default async function EducatorModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const m = getEducatorModule(slug);
  if (!m) notFound();

  const cat = EDUCATOR_MODULE_CATEGORY[m.category];

  return (
    <main>
      {/* Hero */}
      <section className="bg-navy px-6 py-14 text-white">
        <div className="mx-auto max-w-4xl">
          <nav className="text-sm text-white/70">
            <Link href="/educators" className="hover:text-white hover:underline">
              Educators
            </Link>
            <span className="px-2">/</span>
            <Link href="/educators/training" className="hover:text-white hover:underline">
              Training modules
            </Link>
            <span className="px-2">/</span>
            <span className="text-white/90">{m.title}</span>
          </nav>
          <p className={`${eyebrow} mt-4 text-aqua`}>{cat.label.replace(/ modules$/, "")}</p>
          <h1 className="mt-2 font-heading text-4xl font-bold">{m.title}</h1>
          {m.requirement && <p className="mt-2 text-sm font-medium text-aqua/90">{m.requirement}</p>}
          <p className="mt-4 max-w-3xl text-lg text-white/85">{m.summary}</p>

          {/* At-a-glance facts */}
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {m.hours?.total != null && (
              <div>
                <dt className="text-white/60">Total time</dt>
                <dd className="font-semibold">{m.hours.total} hrs</dd>
              </div>
            )}
            {m.hours?.synchronous != null && (
              <div>
                <dt className="text-white/60">Live</dt>
                <dd className="font-semibold">{m.hours.synchronous} hrs</dd>
              </div>
            )}
            {m.hours?.independent != null && (
              <div>
                <dt className="text-white/60">Independent</dt>
                <dd className="font-semibold">{m.hours.independent} hrs</dd>
              </div>
            )}
            {m.sessions.length > 0 && (
              <div>
                <dt className="text-white/60">Sessions</dt>
                <dd className="font-semibold">{m.sessions.length}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Resources — first, because trainers come here for them */}
        {m.resources.length > 0 && (
          <section className="rounded-xl border border-olive/30 bg-olive/[0.06] p-6">
            <h2 className="font-heading text-2xl font-semibold text-dark-navy">Resources to download</h2>
            <p className="mt-1 text-sm text-cool-grey">
              Everything you need to prepare, deliver, and sign off this module.
            </p>
            <div className="mt-5 space-y-6">
              {AUDIENCE_GROUPS.map((g) => {
                const items = m.resources.filter((r) => r.audience === g.key);
                if (items.length === 0) return null;
                return (
                  <div key={g.key}>
                    <h3 className={`${eyebrow} text-cool-grey`}>{g.label}</h3>
                    <p className="mt-0.5 text-xs text-cool-grey">{g.blurb}</p>
                    <ul className="mt-2 space-y-3">
                      {items.map((r) => (
                        <li key={r.file}>
                          <a
                            href={r.file}
                            download
                            className="inline-flex items-baseline gap-2 font-medium text-navy hover:underline"
                          >
                            <span className="rounded bg-olive px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              {r.format ?? "File"}
                            </span>
                            {r.label}
                          </a>
                          {r.note && <p className="mt-0.5 text-sm text-cool-grey">{r.note}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* What it is — outcome, who it's for, format */}
        {(m.outcome || m.forWho || m.format) && (
          <section className="mt-10">
            <h2 className="font-heading text-2xl font-semibold text-dark-navy">About this module</h2>
            <dl className="mt-4 space-y-4">
              {m.outcome && (
                <div>
                  <dt className={`${eyebrow} text-terracotta`}>What you leave with</dt>
                  <dd className="mt-1 text-dark-navy/90">{m.outcome}</dd>
                </div>
              )}
              {m.forWho && (
                <div>
                  <dt className={`${eyebrow} text-terracotta`}>Who it's for</dt>
                  <dd className="mt-1 text-dark-navy/90">{m.forWho}</dd>
                </div>
              )}
              {m.format && (
                <div>
                  <dt className={`${eyebrow} text-terracotta`}>How it runs</dt>
                  <dd className="mt-1 text-dark-navy/90">{m.format}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {/* The deliverable + workbook sections */}
        {m.deliverable && (
          <section className="mt-10 rounded-xl border border-teal/25 bg-teal/[0.05] p-6">
            <h2 className="font-heading text-xl font-semibold text-dark-navy">
              The deliverable: {m.deliverable.title}
            </h2>
            {m.deliverable.detail && <p className="mt-2 text-dark-navy/90">{m.deliverable.detail}</p>}
            {m.workbookSections.length > 0 && (
              <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                {m.workbookSections.map((s) => (
                  <li key={`${s.n}-${s.title}`} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/15 text-xs font-bold text-teal">
                      {s.n ?? "•"}
                    </span>
                    <div>
                      <p className="font-medium text-dark-navy">{s.title}</p>
                      {s.detail && <p className="text-sm text-cool-grey">{s.detail}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {/* Session-by-session structure, with independent work interleaved */}
        {m.sessions.length > 0 && (
          <section className="mt-10">
            <h2 className="font-heading text-2xl font-semibold text-dark-navy">How the training runs</h2>
            <div className="mt-5 space-y-6">
              {/* Any pre-work / independent work that comes before session 1 */}
              {m.independentWork
                .filter((iw) => (iw.afterSession ?? 0) === 0)
                .map((iw) => (
                  <IndependentWorkBlock key={iw.label} iw={iw} />
                ))}

              {m.sessions.map((session) => (
                <div key={session.n}>
                  <div className="rounded-xl border border-cool-grey/20 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                        {session.n}
                      </span>
                      <h3 className="font-heading text-lg font-semibold text-dark-navy">
                        {session.title}
                      </h3>
                      {session.durationHours != null && (
                        <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-medium text-navy">
                          {session.durationHours} hrs
                        </span>
                      )}
                    </div>
                    {session.focus && <p className="mt-1 text-sm text-cool-grey">{session.focus}</p>}
                    {session.blocks.length > 0 && (
                      <ul className="mt-4 divide-y divide-cool-grey/15">
                        {session.blocks.map((b, i) => (
                          <li key={i} className="flex gap-4 py-3">
                            {b.time && (
                              <span className="w-24 shrink-0 font-mono text-xs text-cool-grey">
                                {b.time}
                              </span>
                            )}
                            <div>
                              <p className="font-medium text-dark-navy">{b.title}</p>
                              {b.detail && <p className="text-sm text-cool-grey">{b.detail}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Independent work that follows this session */}
                  {m.independentWork
                    .filter((iw) => iw.afterSession === session.n)
                    .map((iw) => (
                      <IndependentWorkBlock key={iw.label} iw={iw} />
                    ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sign-off */}
        {m.signOff && (
          <section className="mt-10 rounded-xl border border-plum/25 bg-plum/[0.04] p-6">
            <h2 className="font-heading text-2xl font-semibold text-dark-navy">Sign-off</h2>
            {m.signOff.intro && <p className="mt-2 text-dark-navy/90">{m.signOff.intro}</p>}

            {m.signOff.submits.length > 0 && (
              <div className="mt-4">
                <h3 className={`${eyebrow} text-plum`}>What the educator submits</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-dark-navy/90">
                  {m.signOff.submits.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {m.signOff.criteria.length > 0 && (
              <div className="mt-5">
                <h3 className={`${eyebrow} text-plum`}>Criteria — each judged Met or Not yet</h3>
                <div className="mt-2 space-y-3">
                  {m.signOff.criteria.map((c) => (
                    <div key={c.title} className="rounded-lg border border-plum/15 bg-white p-4">
                      <p className="font-semibold text-dark-navy">{c.title}</p>
                      <p className="mt-1 text-sm text-cool-grey">{c.met}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {m.signOff.threshold && (
              <p className="mt-4 text-sm text-dark-navy/80">{m.signOff.threshold}</p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function IndependentWorkBlock({ iw }: { iw: EducatorModule["independentWork"][number] }) {
  return (
    <div className="ml-4 border-l-2 border-dashed border-gold/50 pl-5 py-2">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <p className="font-heading text-sm font-semibold uppercase tracking-wide text-terracotta">
          {iw.label}
        </p>
        {iw.hours && <span className="text-xs text-cool-grey">{iw.hours}</span>}
        {iw.when && <span className="text-xs text-cool-grey">· {iw.when}</span>}
      </div>
      {iw.tasks.length > 0 && (
        <ul className="mt-2 space-y-2">
          {iw.tasks.map((t, i) => (
            <li key={i}>
              <p className="text-sm font-medium text-dark-navy">
                {t.title}
                {t.hours && <span className="ml-2 font-normal text-cool-grey">{t.hours}</span>}
              </p>
              {t.detail && <p className="text-sm text-cool-grey">{t.detail}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
