import { auth, currentUser, type User } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

/**
 * `currentUser()` returns the Backend API user shape, which — unlike the
 * frontend `useUser()` resource — has no `primaryEmailAddress` convenience
 * getter. The primary address has to be looked up in `emailAddresses` by
 * `primaryEmailAddressId`; fall back to the first address if that lookup
 * ever comes up empty (e.g. right after an OAuth sign-up).
 */
function getPrimaryEmail(user: User): string | null {
  const primary = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  );
  return primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
}

/**
 * Requires a real, signed-in Clerk user — every route that touches user data
 * needs this (scanning, scan history, wishlist, billing). Returns null if
 * there is no session; callers should respond 401.
 */
export async function requireUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user ? getPrimaryEmail(user) : null;
  if (!email) return null;

  return db.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });
}
