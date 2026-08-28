import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  listAuthorisedUsers,
  seededSuperadmins,
  STAFF_DOMAIN,
  type Role,
} from "@/lib/authorised-users";
import { addUser, removeUser } from "./actions";

export const metadata: Metadata = {
  title: "Access",
  robots: { index: false, follow: false },
};

// Nothing here can be prerendered - it is a live view of who can sign in.
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<Role, string> = {
  superadmin: "Superadmin",
  admin: "Administrator",
  member: "Member",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "admin" && role !== "superadmin") redirect("/");

  const { ok, error } = await searchParams;
  const [users, seeded] = [await listAuthorisedUsers(), seededSuperadmins()];
  const isSuperadmin = role === "superadmin";

  return (
    <main className="mx-auto flex max-w-3xl flex-col px-6 py-16">
      <h1 className="font-heading text-2xl font-bold text-navy">Who can sign in</h1>
      <p className="mt-3 text-cool-grey">
        Anyone with an {STAFF_DOMAIN} Google account can sign in without being listed here. This
        list is for everyone else - add the Google address someone already uses, and they can sign
        in with it. There is no password to issue.
      </p>

      {ok && (
        <p className="mt-6 rounded-lg border border-olive/40 bg-olive/10 px-4 py-3 text-sm text-olive">
          {ok}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-lg border border-terracotta/40 bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          {error}
        </p>
      )}

      <form action={addUser} className="mt-8 rounded-xl border border-cool-grey/30 p-5">
        <h2 className="font-heading text-lg font-semibold text-dark-navy">Give someone access</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="font-heading text-sm font-semibold text-dark-navy">
              Google account email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="name@partner.org"
              className="mt-2 w-full rounded-lg border border-cool-grey/40 bg-white px-4 py-3 text-dark-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </div>
          <div>
            <label htmlFor="role" className="font-heading text-sm font-semibold text-dark-navy">
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue="member"
              className="mt-2 w-full rounded-lg border border-cool-grey/40 bg-white px-4 py-3 text-dark-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
            >
              <option value="member">Member - can read the site</option>
              {isSuperadmin && <option value="admin">Administrator - can manage this list</option>}
              {isSuperadmin && <option value="superadmin">Superadmin - full control</option>}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="note" className="font-heading text-sm font-semibold text-dark-navy">
            Note <span className="font-body font-normal text-cool-grey">(optional)</span>
          </label>
          <input
            id="note"
            name="note"
            type="text"
            placeholder="NRC Cox's Bazar - education team"
            className="mt-2 w-full rounded-lg border border-cool-grey/40 bg-white px-4 py-3 text-dark-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>
        <button
          type="submit"
          className="mt-5 rounded-lg bg-navy px-5 py-3 font-heading text-sm font-semibold text-white transition hover:bg-dark-navy"
        >
          Add
        </button>
      </form>

      <h2 className="mt-12 font-heading text-lg font-semibold text-dark-navy">
        Invited people <span className="font-body font-normal text-cool-grey">({users.length})</span>
      </h2>

      {seeded.length > 0 && (
        <p className="mt-2 text-sm text-cool-grey">
          Set in the server configuration and not removable here:{" "}
          <span className="text-dark-navy">{seeded.join(", ")}</span>
        </p>
      )}

      {users.length === 0 ? (
        <p className="mt-4 text-cool-grey">
          Nobody has been invited yet. Amala staff can already sign in with their work account.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-cool-grey/20 border-y border-cool-grey/20">
          {users.map((user) => (
            <li key={user.email} className="flex flex-wrap items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-sm font-semibold text-dark-navy">
                  {user.email}
                </p>
                <p className="mt-1 text-sm text-cool-grey">
                  {ROLE_LABEL[user.role]}
                  {user.note ? ` - ${user.note}` : ""} - added by {user.addedBy} on{" "}
                  {new Date(user.addedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              {(isSuperadmin || user.role === "member") && (
                <form action={removeUser}>
                  <input type="hidden" name="email" value={user.email} />
                  <button
                    type="submit"
                    className="rounded-lg border border-terracotta/40 px-4 py-2 font-heading text-sm font-semibold text-terracotta transition hover:bg-terracotta/10"
                  >
                    Remove
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
