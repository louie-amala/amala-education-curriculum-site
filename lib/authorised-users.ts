/**
 * Who is allowed to sign in.
 *
 * Two ways in, checked in this order:
 *
 *  1. A seeded superadmin - listed in SUPERADMIN_EMAILS. Seeding from the environment rather than
 *     from the database is deliberate: an empty, mis-written or unreachable collection would
 *     otherwise lock the last admin out of the very screen used to fix it.
 *  2. An Amala staff account - a Google Workspace account whose `hd` claim is the Amala domain.
 *     The claim is checked, not the email suffix: `hd` is the part Google actually vouches for,
 *     where an address ending in the right characters proves nothing on its own.
 *  3. Anyone with a record in the `authorised_users` collection - guests added through /admin.
 *
 * Anyone else is refused at sign-in. This module talks to Firestore, so it is Node-only and must
 * never be imported from middleware.ts (which runs on the edge) - see auth.config.ts for the
 * edge-safe half.
 */
import { Firestore } from "@google-cloud/firestore";

export type Role = "superadmin" | "admin" | "member";

/** The Google Workspace domain whose accounts get in without being listed individually. */
export const STAFF_DOMAIN = "amalaeducation.org";

export const COLLECTION = "authorised_users";

export interface AuthorisedUser {
  email: string;
  role: Role;
  addedBy: string;
  addedAt: string;
  note?: string;
}

let db: Firestore | null = null;

/** Lazily built so importing this module never opens a connection at build time. */
function firestore(): Firestore {
  if (!db) db = new Firestore({ ignoreUndefinedProperties: true });
  return db;
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** The superadmins named in the environment. Comma-separated, blanks tolerated. */
export function seededSuperadmins(): string[] {
  return (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map(normaliseEmail)
    .filter(Boolean);
}

export function isStaffDomain(hd: string | undefined | null): boolean {
  return typeof hd === "string" && hd.toLowerCase() === STAFF_DOMAIN;
}

export async function getAuthorisedUser(email: string): Promise<AuthorisedUser | null> {
  const snap = await firestore().collection(COLLECTION).doc(normaliseEmail(email)).get();
  return snap.exists ? (snap.data() as AuthorisedUser) : null;
}

/**
 * The role this person signs in as, or null if they may not sign in at all.
 *
 * `hd` is the hosted-domain claim from the Google profile, absent for personal accounts.
 */
export async function resolveRole(email: string, hd?: string | null): Promise<Role | null> {
  const address = normaliseEmail(email);
  if (seededSuperadmins().includes(address)) return "superadmin";

  const record = await getAuthorisedUser(address);
  if (record) return record.role;

  return isStaffDomain(hd) ? "member" : null;
}

export async function listAuthorisedUsers(): Promise<AuthorisedUser[]> {
  const snap = await firestore().collection(COLLECTION).orderBy("addedAt", "desc").get();
  return snap.docs.map((d) => d.data() as AuthorisedUser);
}

export async function addAuthorisedUser(input: {
  email: string;
  role: Role;
  addedBy: string;
  note?: string;
}): Promise<void> {
  const email = normaliseEmail(input.email);
  await firestore()
    .collection(COLLECTION)
    .doc(email)
    .set(
      {
        email,
        role: input.role,
        addedBy: normaliseEmail(input.addedBy),
        addedAt: new Date().toISOString(),
        note: input.note?.trim() || undefined,
      },
      { merge: true },
    );
}

export async function removeAuthorisedUser(email: string): Promise<void> {
  await firestore().collection(COLLECTION).doc(normaliseEmail(email)).delete();
}
