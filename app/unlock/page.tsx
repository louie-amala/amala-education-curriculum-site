import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Password required",
  robots: { index: false, follow: false },
};

// Shown by middleware.ts (as a rewrite, so the original URL stays in the address bar) whenever a
// request hits protected content without a valid unlock cookie. The form posts to /api/unlock,
// which sets the cookie and redirects back to `next`.
export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; state?: string; error?: string }>;
}) {
  const { next = "/", state, error } = await searchParams;
  const unconfigured = state === "unconfigured";

  return (
    <main className="mx-auto flex max-w-lg flex-col px-6 py-20">
      <h1 className="font-heading text-2xl font-bold text-navy">
        {unconfigured ? "This section is not available" : "This section is password protected"}
      </h1>

      {unconfigured ? (
        <p className="mt-3 text-cool-grey">
          The Learning Bridge+ (Cox&apos;s Bazar) materials are restricted, and the site has not
          been given the password to check against. Nobody can open them until it is configured.
        </p>
      ) : (
        <>
          <p className="mt-3 text-cool-grey">
            The Learning Bridge+ (Cox&apos;s Bazar) programme, its units, and its materials are
            shared with NRC and Amala colleagues rather than published. Enter the password to
            continue.
          </p>

          <form action="/api/unlock" method="POST" className="mt-8">
            <input type="hidden" name="next" value={next} />
            <label htmlFor="password" className="font-heading text-sm font-semibold text-dark-navy">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              className="mt-2 w-full rounded-lg border border-cool-grey/40 bg-white px-4 py-3 text-dark-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
            {error === "1" && (
              <p className="mt-3 text-sm text-terracotta">
                That password was not right. Try again.
              </p>
            )}
            <button
              type="submit"
              className="mt-5 rounded-lg bg-navy px-5 py-3 font-heading text-sm font-semibold text-white transition hover:bg-dark-navy"
            >
              Unlock
            </button>
          </form>

          <p className="mt-8 text-sm text-cool-grey">
            Unlocking lasts 30 days on this browser. The rest of the curriculum site stays open -
            only this programme is protected.
          </p>
        </>
      )}
    </main>
  );
}
