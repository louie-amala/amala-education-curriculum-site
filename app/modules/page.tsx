import type { Metadata } from "next";
import Link from "next/link";
import {
  competencyModules,
  getCompetencyByCode,
  getModuleMaterials,
  getSkillModulesFor,
  modules,
} from "@/lib/content";
import { areaStyle } from "@/lib/ui";

export const metadata: Metadata = { title: "Modules" };

// Count the distinct materials a competency module reaches, directly and through its skill modules.
function moduleMaterialCount(slug: string): number {
  const mod = competencyModules.find((m) => m.slug === slug);
  if (!mod) return 0;
  const slugs = new Set<string>(mod.materialSlugs);
  for (const s of getSkillModulesFor(mod)) for (const ms of s.materialSlugs) slugs.add(ms);
  return slugs.size;
}

export default function ModulesIndex() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-heading text-3xl font-bold text-navy">Modules</h1>
      <p className="mt-2 max-w-2xl text-cool-grey">
        A finer grain than a course. A <strong>competency module</strong> develops one framework
        competency; it is made of <strong>skill modules</strong>, each pulling together the materials
        that build one specific skill. Modules regroup the material library around a competency, so
        the same skills can be reused across the courses that develop it.
      </p>

      {modules.length === 0 ? (
        <p className="mt-10 text-cool-grey">No modules yet.</p>
      ) : (
        <div className="mt-10 space-y-8">
          {competencyModules.map((mod) => {
            const comp = getCompetencyByCode(mod.competencyCode);
            const s = comp ? areaStyle(comp.areaId) : areaStyle("");
            const skills = getSkillModulesFor(mod);
            return (
              <section
                key={mod.slug}
                className={`rounded-2xl border-l-4 ${s.border} border-y border-r border-cool-grey/20 bg-white p-6 shadow-sm`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
                    Competency module
                  </span>
                  {comp && (
                    <Link
                      href={`/competencies/${comp.code.toLowerCase()}`}
                      className="font-mono text-xs font-semibold text-cool-grey hover:text-navy hover:underline"
                    >
                      {comp.code}
                    </Link>
                  )}
                  <span className="text-xs text-cool-grey">
                    · {skills.length} skills · {moduleMaterialCount(mod.slug)} materials
                  </span>
                </div>
                <h2 className="mt-2 font-heading text-2xl font-bold text-dark-navy">
                  <Link href={`/modules/${mod.slug}`} className="hover:text-navy hover:underline">
                    {mod.title}
                  </Link>
                </h2>
                <p className="mt-2 text-cool-grey">{mod.summary}</p>

                <ol className="mt-5 space-y-2">
                  {skills.map((sk, i) => (
                    <li key={sk.slug}>
                      <Link
                        href={`/modules/${sk.slug}`}
                        className="group flex items-baseline gap-3 rounded-lg border border-cool-grey/15 bg-paper/60 px-4 py-3 transition hover:border-navy/30 hover:bg-white"
                      >
                        <span className={`w-5 shrink-0 font-heading text-sm font-bold ${s.text}`}>
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-dark-navy group-hover:underline">
                            {sk.title}
                          </span>
                          {sk.skill && (
                            <span className="mt-0.5 block text-sm text-cool-grey">
                              {sk.skill.label}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-cool-grey">
                          {getModuleMaterials(sk).length} materials
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
