"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

/**
 * Who you are signed in as, and the way out.
 *
 * Client-side on purpose. Reading the session on the server inside the shared header would make
 * every page in the site dynamic, and the curriculum pages are prerendered - so the session is
 * fetched from /api/auth/session in the browser instead, leaving the pages themselves static.
 */
export function AccountMenu() {
  const { data: session, status } = useSession();

  if (status !== "authenticated" || !session.user?.email) return null;
  const canAdmin = session.user.role === "admin" || session.user.role === "superadmin";

  return (
    <div className="flex items-center gap-3 text-sm">
      {canAdmin && (
        <Link href="/admin" className="font-medium text-dark-navy hover:text-navy hover:underline">
          Access
        </Link>
      )}
      <span className="hidden text-cool-grey sm:inline" title={session.user.email}>
        {session.user.email}
      </span>
      <button
        type="button"
        onClick={() => signOut({ redirectTo: "/login" })}
        className="rounded-lg border border-cool-grey/40 px-3 py-1.5 font-heading text-sm font-semibold text-dark-navy transition hover:border-navy hover:text-navy"
      >
        Sign out
      </button>
    </div>
  );
}
