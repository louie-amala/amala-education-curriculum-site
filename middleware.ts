import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, UNLOCK_PATH, gatePassword, isProtectedPath, verifyToken } from "@/lib/access";

// The gate. Everything under content-source/ tagged `access: partner` (the Learning Bridge+
// Cox's Bazar / NRC programme) is served only to a request carrying a valid unlock cookie;
// anything else is rewritten to the unlock form.
//
// The matcher deliberately covers ALL requests except Next's own static assets, rather than a
// list of route prefixes: the protected set is generated from content tags, so a hand-kept
// prefix list could silently stop covering a newly tagged page. This also catches the
// /downloads/*.docx files, which a conventional "skip anything with a file extension" matcher
// would let straight through to the CDN.

const NOINDEX = "noindex, nofollow, noarchive";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) return NextResponse.next();

  const password = gatePassword();

  // No password configured. In development that would block local work for no benefit, so pass
  // through with a warning; in production, fail closed — an unconfigured gate must not publish.
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
