/**
 * Shared-password gate for non-public content (currently the Learning Bridge+ Cox's Bazar / NRC
 * programme, tagged `access: partner` in content-source).
 *
 * Edge-safe: no node:crypto, no fs - middleware.ts imports this, and middleware runs on the edge.
 * The paths it covers come from lib/protected-paths.generated.ts, which is derived from the
 * content tags by scripts/generate-protected-paths.js at build time.
 *
 * This is a shared password, not user accounts: it keeps the section out of search results and
 * casual browsing. It is not a control you should rely on for anything genuinely sensitive.
 */
import { PROTECTED_DOWNLOADS, PROTECTED_PAGES } from "./protected-paths.generated";

export const COOKIE_NAME = "lb_nrc_access";
export const UNLOCK_PATH = "/unlock";
/** How long an unlock lasts before the password is asked for again. */
export const SESSION_DAYS = 30;

const protectedSet = new Set<string>([...PROTECTED_PAGES, ...PROTECTED_DOWNLOADS]);

/** True if this URL is behind the gate. Trailing slashes and index forms are normalised. */
export function isProtectedPath(pathname: string): boolean {
  const p = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return protectedSet.has(p);
}

/** The configured password, or null when the gate has not been set up. */
export function gatePassword(): string | null {
  const pw = process.env.LB_NRC_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

const encoder = new TextEncoder();

async function hmacKey(password: string): Promise<CryptoKey> {
  // The signing key is derived from the password itself, so rotating the password invalidates
  // every cookie already issued - which is the behaviour you want from a rotation.
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(`amala-lb-nrc-gate:${password}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(value: string, password: string): Promise<string> {
  const mac = await crypto.subtle.sign("HMAC", await hmacKey(password), encoder.encode(value));
  return toBase64Url(mac);
}

/** Length-independent comparison, so a wrong guess leaks nothing through timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Cookie value granting access until `expiry`. */
export async function createToken(password: string, now = Date.now()): Promise<string> {
  const expires = Math.floor(now / 1000) + SESSION_DAYS * 24 * 60 * 60;
  return `${expires}.${await sign(String(expires), password)}`;
}

export async function verifyToken(
  token: string | undefined,
  password: string,
  now = Date.now(),
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const expires = token.slice(0, dot);
  if (!/^\d+$/.test(expires) || Number(expires) * 1000 < now) return false;
  return safeEqual(token.slice(dot + 1), await sign(expires, password));
}

export function checkPassword(submitted: string, expected: string): boolean {
  return safeEqual(submitted, expected);
}
