import type { ReactNode } from "react";
import Link from "next/link";
import {
  EducatorMovesExplorer,
  type ExplorerBucket,
} from "@/components/EducatorMovesExplorer";
import { educatorMoves } from "@/lib/content";
import { PURPOSE_TAGS, functionAreas, tagMeta, type EducatorFunctionKey } from "@/lib/ui";

// Shared layout for an educator-function page (mentor / course facilitator / assessor): a hero with a
// breadcrumb back to the hub, an optional notice, then the moves grouped into their area buckets with a
// purpose filter. Buckets come from the function's area tags; a move appears under each area it carries,
// showing that area's per-move `how` note.
export function EducatorFunctionLayout({
  functionKey,
  functionLabel,
  title,
  intro,
  notice,
}: {
  functionKey: EducatorFunctionKey;
  functionLabel: string;
  title: string;
  intro: ReactNode;
  notice?: ReactNode;
}) {
  const buckets: ExplorerBucket[] = functionAreas(functionKey).map(({ id, meta }) => ({
    id,
    label: meta.label,
    blurb: meta.blurb,
    moves: educatorMoves
      .filter((m) => m.tags.some((t) => t.id === id))
      .map((m) => ({
        slug: m.slug,
        title: m.title,
        summary: m.summary ?? null,
        how: m.tags.find((t) => t.id === id)?.how ?? null,
        purposes: m.tags
          .filter((t) => tagMeta(t.id).kind === "purpose")
          .map((t) => ({ id: t.id, label: tagMeta(t.id).label })),
      })),
  }));

  // Only offer purpose filters that actually appear among this function's moves.
  const present = new Set(buckets.flatMap((b) => b.moves.flatMap((m) => m.purposes.map((p) => p.id))));
  const purposeOptions = PURPOSE_TAGS.filter(({ id }) => present.has(id)).map(({ id, meta }) => ({
    id,
    label: meta.label,
  }));

  return (
    <main>
      <section className="bg-navy px-6 py-14 text-white">
        <div className="mx-auto max-w-4xl">
          <nav className="text-sm text-white/70">
            <Link href="/educators" className="hover:text-white hover:underline">
              Educators
            </Link>
            <span className="px-2">/</span>
            <span className="text-white/90">{functionLabel}</span>
          </nav>
          <h1 className="mt-3 font-heading text-4xl font-bold">{title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/85">{intro}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {notice}
        <EducatorMovesExplorer buckets={buckets} purposeOptions={purposeOptions} />
      </div>
    </main>
  );
}
