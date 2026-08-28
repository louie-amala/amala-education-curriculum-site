/**
 * Auth.js, assembled. Node-only: the sign-in callback reads the Firestore allowlist.
 *
 * Sign-in is refused rather than granted-then-restricted. A visitor who is neither Amala staff nor
 * on the allowlist never gets a session at all, so there is no half-authenticated state for the
 * rest of the site to reason about.
 */
import NextAuth from "next-auth";
import { authConfig, LOGIN_PATH } from "./auth.config";
import { resolveRole } from "./authorised-users";

/** Google's hosted-domain claim, present only on Workspace accounts. */
function hostedDomain(profile: unknown): string | null {
  const hd = (profile as { hd?: unknown } | null | undefined)?.hd;
  return typeof hd === "string" ? hd : null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ profile }) {
      const email = profile?.email;
      if (!email) return `${LOGIN_PATH}?error=no-email`;
      const role = await resolveRole(email, hostedDomain(profile));
      // A string return redirects instead of throwing Auth.js's own error page, so the person
      // sees an explanation in the site's own voice.
      return role ? true : `${LOGIN_PATH}?error=not-authorised`;
    },

    async jwt({ token, profile }) {
      // `profile` is present only on the request that completes a sign-in; on later requests the
      // role already in the token stands until the session expires.
      if (profile?.email) {
        token.role = (await resolveRole(profile.email, hostedDomain(profile))) ?? undefined;
      }
      return token;
    },
  },
});
