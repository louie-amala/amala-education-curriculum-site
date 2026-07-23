import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getExploredIn, getGlossaryTerm, glossaryTerms } from "@/lib/content";
import { typeMeta } from "@/lib/ui";

export function generateStaticParams() {
  return glossaryTerms.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = getGlossaryTerm(slug);
  return { title: t ? t.term : "Term" };
}

export default async function TermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const term = getGlossaryTerm(slug);
  if (!term) notFound();

  const explored = getExploredIn(term);
  const related = term.relatedTermIds
    .map((id) => getGlossaryTerm(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav className="text-sm text-cool-grey">
        <Link href="/glossary" className="hover:text-navy hover:underline">
          Glossary
        </Link>
      </nav>

      <h1 className="mt-3 font-heading text-3xl font-bold text-navy">{term.term}</h1>
      <p className="mt-4 text-lg text-dark-navy">{term.definition}</p>

      {term.useInContext && (
        <p className="mt-4 rounded-lg border-l-4 border-teal bg-teal/5 p-4 text-dark-navy/90">
          {term.useInContext}
        </p>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {term.examples.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-olive">Examples</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-dark-navy/90">
              {term.examples.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        {term.nonExamples.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-terracotta">
              What it is not
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-dark-navy/90">
              {term.nonExamples.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-cool-grey">Related terms</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/glossary/${r.slug}`}
                  className="rounded-full border border-cool-grey/30 px-3 py-1 text-sm text-navy hover:bg-navy/5"
                >
                  {r.term}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Explored in — generated from the reverse index */}
      {(explored.competencies.length > 0 || explored.materials.length > 0) && (
        <section className="mt-10 border-t border-cool-grey/20 pt-6">
          <h2 className="font-heading text-lg font-semibold text-dark-navy">Explored in</h2>
          {explored.competencies.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-cool-grey">Competencies</p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {explored.competencies.map((c) => (
                  <li key={c.code}>
                    <Link
                      href={`/competencies/${c.code.toLowerCase()}`}
                      className="text-sm text-navy hover:underline"
                    >
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {explored.materials.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cool-grey">Materials</p>
              <ul className="mt-1 space-y-1">
                {explored.materials.map((m) => (
                  <li key={m.slug} className="text-sm">
                    <Link href={`/materials/${m.slug}`} className="text-navy hover:underline">
                      {m.title}
                    </Link>
                    <span className="ml-2 text-xs text-cool-grey">{typeMeta(m.type).label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
