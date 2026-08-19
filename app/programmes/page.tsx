import type { Metadata } from "next";
import Link from "next/link";
import { publicProgrammes } from "@/lib/content";

export const metadata: Metadata = { title: "Programmes" };

export default function ProgrammesIndex() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-heading text-3xl font-bold text-navy">Programmes</h1>
      <p className="mt-2 max-w-2xl text-cool-grey">
        Amala&apos;s programmes, from preparatory to full secondary qualification. Each one lists its
        structure, components, and what it takes to deliver.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {publicProgrammes.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/programmes/${p.slug}`}
              className="block h-full rounded-lg border-l-4 border-navy border-y border-r border-cool-grey/20 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              {p.shortName && p.shortName !== p.title && (
                <p className="font-heading text-xs uppercase tracking-widest text-teal">
                  {p.shortName}
                </p>
              )}
              <h2 className="mt-1 font-heading text-xl font-semibold text-dark-navy">{p.title}</h2>
              {p.tagline && <p className="mt-2 text-sm text-cool-grey">{p.tagline}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
