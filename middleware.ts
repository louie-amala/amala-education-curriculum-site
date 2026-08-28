import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, UNLOCK_PATH, gatePassword, isProtectedPath, verifyToken } from "@/lib/access";
import { authConfig, LOGIN_PATH } from "@/lib/auth.config";

// Two gates, in order.
//
// The outer one is sign-in: the whole site is shared with Amala colleagues and invited partners
// rather than published, so every request needs a session. Who may hold a session is decided at
// sign-in by lib/auth.ts against the Firestore allowlist; here we only check that one exists.
//
// The inner one is the original shared-password gate on the Learning Bridge+ (Cox's Bazar) / NRC
// programme. It stays deliberately: signing in proves you belong on the site, not that you belong
// in that programme's materials, and NRC colleagues already work with the password.
//
// The matcher covers ALL requests except Next's own static assets, rather than a list of route
// prefixes: the protected set is generated from content tags, so a hand-kept prefix list could
// silently stop covering a newly tagged page. This also catches the /downloads/*.docx files, which
// a conventional "skip anything with a file extension" matcher would let straight through.

const NOINDEX = "noindex, nofollow, noarchive";

// Reachable without a session: the sign-in page itself, Auth.js's endpoints, and the brand assets
// the sign-in page is built from - which would otherwise render as broken images to the one
// audience guaranteed not to be signed in yet.
const PUBLIC_PREFIXES = [LOGIN_PATH, "/api/auth", "/brand"];

// The Cloud Run service answers on its own *.run.app hostname as well as on whatever domain is
// pointed at it. That hostname serves a byte-identical copy of the site, so left alone it would
// compete with the canonical domain in search results.
function isNonCanonicalHost(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  return host.endsWith(".run.app");
}

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const { auth: withSession } = NextAuth(authConfig);

export default withSession(async function middleware(request) {
  const { pathname } = request.nextUrl;
  const session = request.auth;

  if (!isPublicPath(pathname)) {
    if (!session?.user) return toLogin(request);

    // /admin manages who else gets in, so it is held to a higher bar than the rest of the site.
    // The page re-checks server-side and is the authority; this only saves a round trip.
    const role = session.user.role;
    if (pathname.startsWith("/admin") && role !== "admin" && role !== "superadmin") {
      return NextResponse.redirect(new URL("/", request.nextUrl.origin));
    }
  }

  if (!isProtectedPath(pathname)) return pass(request);

  const password = gatePassword();

  // No password configured. In development that would block local work for no benefit, so pass
  // through with a warning; in production, fail closed - an unconfigured gate must not publish.
  if (!password) {
    if (process.env.NODE_ENV === "development") {
      const res = NextResponse.next();
      res.headers.set("X-Robots-Tag", NOINDEX);
      res.headers.set("X-LB-NRC-Gate", "unconfigured-dev-passthrough");
      return res;
    }
    return unlock(request, "unconfigured");
  }

  const valid = await verifyToken(request.cookies.get(COOKIE_NAME)?.value, password);
  if (!valid) return unlock(request, "locked");

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", NOINDEX);
  return res;
});

function pass(request: NextRequest) {
  if (!isNonCanonicalHost(request)) return NextResponse.next();
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", NOINDEX);
  return res;
}

function toLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  const wanted = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = LOGIN_PATH;
  url.search = "";
  if (wanted !== "/") url.searchParams.set("next", wanted);
  const res = NextResponse.redirect(url);
  res.headers.set("X-Robots-Tag", NOINDEX);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function unlock(request: NextRequest, state: "locked" | "unconfigured") {
  const url = request.nextUrl.clone();
  url.pathname = UNLOCK_PATH;
  url.search = "";
  url.searchParams.set("next", request.nextUrl.pathname);
  if (state === "unconfigured") url.searchParams.set("state", "unconfigured");
  const res = NextResponse.rewrite(url);
  res.headers.set("X-Robots-Tag", NOINDEX);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
