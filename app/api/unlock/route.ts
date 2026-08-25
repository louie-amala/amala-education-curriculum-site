import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, SESSION_DAYS, UNLOCK_PATH, checkPassword, createToken, gatePassword } from "@/lib/access";

// Verifies the password from the unlock form and, if it is right, sets the signed cookie that
// middleware.ts checks. Redirects back to the page the visitor was trying to reach.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const submitted = String(form.get("password") ?? "");
  const next = safeNext(String(form.get("next") ?? "/"));

  const password = gatePassword();
  if (!password || !checkPassword(submitted, password)) {
    const url = new URL(UNLOCK_PATH, request.url);
    url.searchParams.set("next", next);
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, { status: 303 });
  }

  const res = NextResponse.redirect(new URL(next, request.url), { status: 303 });
  res.cookies.set({
    name: COOKIE_NAME,
    value: await createToken(password),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}

/** Only ever redirect to a path on this site - never to whatever the form field happened to say. */
function safeNext(value: string): string {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
