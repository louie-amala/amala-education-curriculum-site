/**
 * The half of the Auth.js configuration that has to run on the edge.
 *
 * middleware.ts guards every route, and middleware runs on the edge runtime - which rules out the
 * Firestore client. So the shape of the session lives here, and the allowlist lookup that decides
 * who may sign in at all lives in lib/auth.ts, which only ever runs in the Node route handler.
 *
 * The role is written into the JWT once, at sign-in, so that middleware can authorise a request by
 * reading the cookie instead of querying the database on every hit. The cost of that trade is that
 * a change of role - or removal from the allowlist - takes effect when the session next expires
 * rather than instantly, which is why SESSION_HOURS is short.
 */
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import type { Role } from "./authorised-users";

export const LOGIN_PATH = "/login";

/** How long a signed-in session lasts before Google is asked again. */
export const SESSION_HOURS = 8;

declare module "next-auth" {
  interface Session {
    user: {
      role?: Role;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
  }
}

export const authConfig = {
  providers: [
    // No `hd` parameter on the authorisation request: that would hide non-Amala accounts from
    // Google's account chooser, and allowlisted guests from partner organisations need to reach
    // it. The domain check happens server-side in lib/auth.ts, where it cannot be skipped.
    Google({ authorization: { params: { prompt: "select_account" } } }),
  ],
  pages: { signIn: LOGIN_PATH },
  session: { strategy: "jwt", maxAge: SESSION_HOURS * 60 * 60 },
  // Cloud Run terminates TLS ahead of the container, so the host header is what tells Auth.js
  // which origin to build callback URLs from.
  trustHost: true,
  callbacks: {
    session({ session, token }) {
      if (session.user) session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
