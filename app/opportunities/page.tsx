import type { Metadata } from "next";
import Link from "next/link";
import { OpportunitiesBrowser } from "@/components/OpportunitiesBrowser";
import { OpportunitySafetyNotice } from "@/components/OpportunitySafetyNotice";
import { boardOpportunities, isPublic } from "@/lib/content";

export const metadata: Metadata = {
  title: "Pathway Opportunities",
  description:
    "Scholarships, courses, jobs, funding and support that refugee learners can apply for.",
};

export default function OpportunitiesIndex() {
  const items = boardOpportunities.filter(isPublic);

  return (
    <main>
      <section className="bg-navy px-6 pb-24 pt-12 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="font-heading text-sm uppercase tracking-widest text-aqua">
            Amala — Education for Change
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold leading-tight">
            Pathway Opportunities
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">
            Real things you can apply for — further education, work, enterprise, funding,
            competitions and support, including grants to keep going a project you have already
            started. Filtered by what actually decides whether you can apply: where you live, which
            documents you have, what it costs, and what you need to take part.
          </p>
          <p className="mt-4 max-w-2xl text-sm text-white/70">
            This list is curated and incomplete. It is the companion to the{" "}
            <Link href="/courses/pathways" className="font-medium text-aqua underline hover:no-underline">
              Pathways course
            </Link>
            , which teaches how to find, judge and apply for opportunities like these.
          </p>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto -mt-16 max-w-5xl">
          {items.length === 0 ? (
            <p className="rounded-lg border border-line bg-white p-5 text-ink-soft shadow-sm">
              No opportunities published yet.
            </p>
          ) : (
            <OpportunitiesBrowser items={items} />
          )}

          <div className="mt-8">
            <OpportunitySafetyNotice />
          </div>

          <p className="mt-6 text-sm text-ink-soft">
            Every entry says when it was last checked. Deadlines move and opportunities close — always
            confirm with the provider before you rely on one.
          </p>
        </div>
      </section>
    </main>
  );
}
