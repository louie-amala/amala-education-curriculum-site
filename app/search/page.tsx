import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchExplorer } from "@/components/SearchExplorer";
import { getSearchIndex } from "@/lib/content";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  const index = getSearchIndex();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-heading text-3xl font-bold text-navy">Search</h1>
      <p className="mt-2 text-cool-grey">
        Find anything in the curriculum — materials, courses, competencies, objectives, glossary
        terms, programmes, and foundations.
      </p>

      <div className="mt-8">
        <Suspense fallback={<div className="h-12 rounded-lg bg-cool-grey/5" />}>
          <SearchExplorer index={index} />
        </Suspense>
      </div>
    </main>
  );
}
