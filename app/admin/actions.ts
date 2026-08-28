"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  addAuthorisedUser,
  getAuthorisedUser,
  normaliseEmail,
  removeAuthorisedUser,
  seededSuperadmins,
  type Role,
} from "@/lib/authorised-users";

const ROLES: Role[] = ["member", "admin", "superadmin"];

/**
 * Every action re-checks the session. Middleware already turned non-admins away from /admin, but a
 * server action is its own endpoint - it can be posted to directly, without ever loading the page.
 */
async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email;
  const role = session?.user?.role;
  if (!email || (role !== "admin" && role !== "superadmin")) redirect("/");
  return { email: normaliseEmail(email), role: role as Role };
}

function back(message: string, kind: "ok" | "error" = "ok"): never {
  redirect(`/admin?${kind}=${encodeURIComponent(message)}`);
}

export async function addUser(formData: FormData) {
  const actor = await requireAdmin();

  const email = normaliseEmail(String(formData.get("email") ?? ""));
  const role = String(formData.get("role") ?? "member") as Role;
  const note = String(formData.get("note") ?? "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back("That does not look like an email address.", "error");
  if (!ROLES.includes(role)) back("Unknown role.", "error");

  // Only a superadmin can create another administrator - otherwise an admin could quietly promote
  // themselves past the person who appointed them.
  if (role !== "member" && actor.role !== "superadmin") {
    back("Only a superadmin can grant administrator access.", "error");
  }

  await addAuthorisedUser({ email, role, addedBy: actor.email, note: note || undefined });
  revalidatePath("/admin");
  back(`${email} can now sign in.`);
}

export async function removeUser(formData: FormData) {
  const actor = await requireAdmin();
  const email = normaliseEmail(String(formData.get("email") ?? ""));

  if (email === actor.email) back("You cannot remove your own access.", "error");
  if (seededSuperadmins().includes(email)) {
    back("That superadmin is set in the server configuration, not here.", "error");
  }

  const existing = await getAuthorisedUser(email);
  if (!existing) back("That person is not on the list.", "error");
  if (existing.role !== "member" && actor.role !== "superadmin") {
    back("Only a superadmin can remove an administrator.", "error");
  }

  await removeAuthorisedUser(email);
  revalidatePath("/admin");
  // Their session cookie outlives this by up to SESSION_HOURS - see lib/auth.config.ts.
  back(`${email} has been removed. Any session they already hold ends within 8 hours.`);
}
