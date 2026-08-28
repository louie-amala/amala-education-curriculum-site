import type { Metadata } from "next";
import { signIn } from "@/lib/auth";
import { STAFF_DOMAIN } from "@/lib/authorised-users";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  "not-authorised":
    "That account is not on the list for this site. Amala colleagues should sign in with their amalaeducation.org account; everyone else needs to be added by an administrator first.",
  "no-email": "Google did not return an email address for that account, so it cannot be checked.",
  Configuration: "Sign-in is not configured correctly on the server. Nobody can sign in until it is.",
  AccessDenied: "That account is not allowed to sign in.",
};

/** Only same-site paths, so a crafted ?next= cannot bounce someone off to another origin. */
function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const redirectTo = safeNext(next);

  return (
    <main className="mx-auto flex max-w-lg flex-col px-6 py-20">
      <h1 className="font-heading text-2xl font-bold text-navy">Sign in to continue</h1>
      <p className="mt-3 text-cool-grey">
        This site is shared with Amala colleagues and invited partners rather than published. Sign
        in with your {STAFF_DOMAIN} account, or with the Google account your invitation was sent to.
      </p>

      {error && (
        <p className="mt-6 rounded-lg border border-terracotta/40 bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          {ERRORS[error] ?? "Sign-in did not complete. Try again."}
        </p>
      )}

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo });
        }}
        className="mt-8"
      >
        <button
          type="submit"
          className="rounded-lg bg-navy px-5 py-3 font-heading text-sm font-semibold text-white transition hover:bg-dark-navy"
        >
          Continue with Google
        </button>
      </form>

      <p className="mt-8 text-sm text-cool-grey">
        Need access? Ask an Amala administrator to add your email address - there is no password to
        set up, you sign in with the Google account you already have.
      </p>
    </main>
  );
}
