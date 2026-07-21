import type { Metadata } from "next";
import { MaterialsBrowser, type BrowserItem } from "@/components/MaterialsBrowser";
import { courses, getObjectiveById, materials } from "@/lib/content";

export const metadata: Metadata = { title: "Materials" };

export default function MaterialsIndex() {
  const items: BrowserItem[] = materials.map((m) => ({
    slug: m.slug,
    title: m.title,
    summary: m.summary,
    type: m.type,
    toolsFacet: m.toolsFacet,
    facilitationContext: m.facilitationContext,
    courseIds: [
      ...new Set(
        m.objectiveIds.map((oid) => getObjectiveById(oid)?.course.id).filter((x): x is string => Boolean(x)),
      ),
    ],
  }));

  const courseList = courses
    .filter((c) => items.some((it) => it.courseIds.includes(c.id)))
    .map((c) => ({ id: c.id, title: c.title }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-heading text-3xl font-bold text-navy">Materials</h1>
      <p className="mt-2 max-w-2xl text-cool-grey">
        Activities, tools and approaches, concepts, case studies, and resources. Each carries the
        pedagogical spine: the agency it builds, the principles it foregrounds, and the competencies
        it may evidence. Filter to find what fits your session.
      </p>

      {items.length === 0 ? (
        <p className="mt-8 rounded-lg bg-cool-grey/5 p-4 text-cool-grey">
          No materials authored yet.
        </p>
      ) : (
        <div className="mt-8">
          <MaterialsBrowser items={items} courses={courseList} />
        </div>
      )}
    </main>
  );
}
