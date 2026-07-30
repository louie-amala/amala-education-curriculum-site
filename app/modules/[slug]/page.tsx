import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GlossedText } from "@/components/GlossedText";
import { MaterialCard } from "@/components/MaterialCard";
import {
  getCompetencyByCode,
  getModule,
  getModuleMaterials,
  getSkillModulesFor,
  modules,
} from "@/lib/content";
import { areaStyle } from "@/lib/ui";

export function generateStaticParams() {
  return modules.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = getModule(slug);
  return { title: m?.title ?? "Module" };
}

const eyebrow = "text-[11px] font-bold uppercase tracking-[0.14em]";

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mod = getModule(slug);
  if (!mod) notFound();

  const comp = getCompetencyByCode(mod.competencyCode);
  const s = comp ? areaStyle(comp.areaId) : areaStyle("");
  const isCompetency = mod.grain === "competency";
  const skills = isCompetency ? getSkillModulesFor(mod) : [];
  const parent = mod.parentModuleSlug ? getModule(mod.parentModuleSlug) : undefined;
  const directMaterials = getModuleMaterials(mod);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb: Modules / (parent competency module for a skill module) */}
      <nav className="text-sm text-cool-grey">
        <Link href="/modules" className="hover:text-navy hover:underline">
          Modules
        </Link>
        {parent && (
          <>
            <span className="px-1.5">·</span>
            <Link href={`/modules/${parent.slug}`} className="hover:text-navy hover:underline">
              {parent.title}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
          {isCompetency ? "Competency module" : "Skill module"}
        </span>
        {comp && (
          <Link
            href={`/competencies/${comp.code.toLowerCase()}`}
            className="font-mono text-xs font-semibold text-cool-grey hover:text-navy hover:underline"
          >
            {comp.code} — {comp.title}
          </Link>
        )}
      </div>

      <h1 className={`mt-2 font-heading text-3xl font-bold ${s.text}`}>{mod.title}</h1>
      {mod.skill && (
        <p className="mt-2 text-lg text-dark-navy">
          <span className="font-semibold">The skill: </span>
          <GlossedText text={mod.skill.description} />
        </p>
      )}
      <p className="mt-4 text-cool-grey">
        <GlossedText text={mod.summary} />
      </p>

      {mod.agencyNote && (
        <section className={`mt-6 rounded-xl border-l-4 ${s.border} border-y border-r border-cool-grey/20 ${s.bg} p-5`}>
          <p className={`${eyebrow} ${s.text}`}>Why it builds agency</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-dark-navy/90">
            <GlossedText text={mod.agencyNote} />
          </p>
        </section>
      )}

      {/* Competency module: the skills that make it up */}
      {isCompetency && skills.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">
            The skills that make it up
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-dark-navy/70">
            Work them in order for a first, guided investigation, or drop into a single skill.
          </p>
          <ol className="mt-4 space-y-4">
            {skills.map((sk, i) => {
              const mats = getModuleMaterials(sk);
              return (
                <li
                  key={sk.slug}
                  className="rounded-xl border border-cool-grey/20 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-baseline gap-3">
                    <span className={`font-heading text-lg font-bold ${s.text}`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-lg font-semibold text-dark-navy">
                        <Link href={`/modules/${sk.slug}`} className="hover:text-navy hover:underline">
                          {sk.title}
                        </Link>
                      </h3>
                      {sk.skill && <p className="mt-0.5 text-sm text-cool-grey">{sk.skill.label}</p>}
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-cool-grey">
                      {mats.length} materials
                    </span>
                  </div>
                  {mats.length > 0 && (
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {mats.map((m) => (
                        <li key={m.slug}>
                          <MaterialCard material={m} />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Skill module: its materials, in order */}
      {!isCompetency && directMaterials.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">
            Materials for this skill ({directMaterials.length})
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-dark-navy/70">
            Facilitation materials, in a suggested order, that build this skill.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {directMaterials.map((m) => (
              <li key={m.slug}>
                <MaterialCard material={m} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Competency module may also carry its own framing materials */}
      {isCompetency && directMaterials.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-dark-navy">
            Across the whole module
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {directMaterials.map((m) => (
              <li key={m.slug}>
                <MaterialCard material={m} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Where the whole competency is developed and demonstrated */}
      {comp && (
        <section className="mt-10 rounded-xl border border-cool-grey/20 bg-white p-5">
          <p className={`${eyebrow} text-cool-grey`}>Part of a bigger picture</p>
          <p className="mt-1.5 text-sm text-dark-navy/80">
            This {isCompetency ? "module develops" : "skill builds toward"} the competency{" "}
            <Link
              href={`/competencies/${comp.code.toLowerCase()}`}
              className="font-medium text-navy hover:underline"
            >
              {comp.code} — {comp.title}
            </Link>
            . See the competency page for the proficiency scale and the courses that develop and
            demonstrate it.
          </p>
        </section>
      )}

      {mod.sourceNotes.length > 0 && (
        <section className="mt-10 border-t border-cool-grey/20 pt-6">
          <p className={`${eyebrow} text-cool-grey`}>Notes on this module</p>
          <ul className="mt-2 space-y-2 text-sm text-cool-grey">
            {mod.sourceNotes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
