"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";

// An inline glossary term. Define once, reference everywhere (§4.4): the definition is passed in
// from the single Term entity. Focusable, activates on hover/focus/tap, dismissible with Escape,
// and degrades to a real link to the term page, so the meaning is never trapped in a popover.
export function Term({
  slug,
  definition,
  children,
}: {
  slug: string;
  definition: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    timer.current = setTimeout(() => setOpen(false), 100);
  };

  return (
    <span className="relative inline-block" onMouseEnter={show} onMouseLeave={hide}>
      <Link
        href={`/glossary/${slug}`}
        className="cursor-help font-medium text-navy underline decoration-dotted decoration-navy/40 underline-offset-2 hover:decoration-navy"
        aria-describedby={open ? id : undefined}
        onFocus={show}
        onBlur={hide}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            (e.currentTarget as HTMLElement).blur();
          }
        }}
      >
        {children}
      </Link>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute left-0 top-full z-30 mt-1 block w-72 rounded-lg border border-cool-grey/25 bg-white p-3 text-left text-sm font-normal not-italic leading-snug text-dark-navy shadow-lg"
        >
          <span className="block">{definition}</span>
          <span className="mt-2 block text-xs font-semibold text-navy">View term →</span>
        </span>
      )}
    </span>
  );
}
