"use client";

import { useEffect, useState } from "react";
import { DeadlinePill } from "@/components/OpportunitiesBrowser";
import {
  MODE_LABEL,
  deadlineState,
  eligibleWhereLabel,
  freshness,
  placeLabel,
} from "@/lib/opportunities";
import type { Opportunity } from "@/lib/schema";

/**
 * The date-derived strip under an opportunity's title. A client component on purpose: the site is
 * statically built, so "closes in 4 days" baked into the HTML would be wrong by tomorrow.
 */
export function OpportunityMeta({ opportunity: o }: { opportunity: Opportunity }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const state = now ? deadlineState(o, now) : null;
  const fresh = now ? freshness(o, now) : null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line py-3 text-sm">
      {state ? <DeadlinePill state={state} /> : <span className="text-ink-soft">Checking dates…</span>}
      <span className="text-ink-soft">{MODE_LABEL[o.delivery.mode] ?? o.delivery.mode}</span>
      <span className="text-ink-soft">{placeLabel(o)}</span>
      <span className="text-ink-soft">For people living in: {eligibleWhereLabel(o)}</span>
      {o.outcome?.placesAvailable != null && (
        <span className="font-medium text-ink">
          {o.outcome.placesAvailable} {o.outcome.placesAvailable === 1 ? "place" : "places"}
        </span>
      )}
      {fresh && (
        <span className={fresh.stale ? "font-medium text-terracotta" : "text-ink-soft"}>
          {fresh.label}
        </span>
      )}
    </div>
  );
}
