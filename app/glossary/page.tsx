import type { Metadata } from "next";
import Link from "next/link";
import { glossaryTerms } from "@/lib/content";
import type { GlossaryCategory } from "@/lib/schema";

export const metadata: Metadata = { title: "Glossary" };

const CATEGORY_LABEL: Record<GlossaryCategory, string> = {
  "curriculum-system": "Curriculum and system",
  content: "Content",
  assessment: "Assessment",
};

export default function GlossaryIndex() {
  const categories = [...new Set(glossaryTerms.map((t) => t.category))];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-heading text-3xl font-bold text-navy">Glossary</h1>
      <p className="mt-2 max-w-2xl text-cool-grey">
        Shared definitions used across the curriculum. Each term is defined once here; wherever it
        appears in the site, the definition is the same.
      </p>

      {glossaryTerms.length === 0 ? (
        <p className="mt-8 rounded-lg bg-cool-grey/5 p-4 text-cool-grey">No terms yet.</p>
      ) : (
        <div className="mt-10 space-y-10">
          {categories.map((cat) => (
            <section key={cat}>
              <h2 className="font-heading text-lg font-semibold text-dark-navy">
                {CATEGORY_LABEL[cat] ?? cat}
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {glossaryTerms
                  .filter((t) => t.category === cat)
                  .sort((a, b) => a.term.localeCompare(b.term))
                  .map((t) => (
                    <li key={t.slug}>
                      <Link
                        href={`/glossary/${t.slug}`}
                        className="block h-full rounded-lg border border-cool-grey/20 bg-white p-4 shadow-sm transition hover:shadow-md"
                      >
                        <h3 className="font-heading font-semibold text-navy">{t.term}</h3>
                        <p className="mt-1 line-clamp-3 text-sm text-dark-navy/75">{t.definition}</p>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
