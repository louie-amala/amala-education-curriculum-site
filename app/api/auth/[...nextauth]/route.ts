// Auth.js's own endpoints: /api/auth/signin, /callback/google, /signout, /session.
// middleware.ts lets these through unauthenticated - they are how a session is obtained.
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
