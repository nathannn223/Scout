import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAndAlertWishlistItem, sendExpiryReminderIfDue } from "@/lib/price-check";

// Never statically evaluate this route — it sends real emails and writes to
// the database, so it must only ever run on an actual invocation (a real
// cron trigger or manual test), not once at build time.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Optional: only enforced once CRON_SECRET is set, so local/manual testing
  // (per CLAUDE.md's "un changement de prix simulé déclenche un email réel")
  // works without extra setup. Set CRON_SECRET before deploying for real.
  if (process.env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  // Only wishlist items with an active alert cost anything to keep fresh —
  // an item without a targetPrice never sends an email, so revalidating its
  // price daily was pure waste (this used to scale with wishlist size,
  // uncapped on Pro, instead of with actual alert count).
  const items = await db.wishlistItem.findMany({
    where: { targetPrice: { not: null } },
    include: { user: true },
  });

  let checked = 0;
  let alertsSent = 0;
  let skipped = 0;
  let expired = 0;
  let errored = 0;

  for (const item of items) {
    checked++;

    // Reminder is independent of the price check below — a Resend failure
    // here shouldn't skip the actual price check for the same item.
    try {
      await sendExpiryReminderIfDue(item);
    } catch (err) {
      console.error("[cron] expiry reminder failed for wishlist item", item.id, err);
    }

    try {
      const result = await checkAndAlertWishlistItem(item);
      if (result === "alerted") alertsSent++;
      else if (result === "skipped") skipped++;
      else if (result === "expired") expired++;
    } catch (err) {
      // Distinct from `skipped`: this item DID match and DID cross the
      // threshold, but something failed while recording/sending the alert
      // (e.g. Resend misconfigured) — worth surfacing separately so it
      // doesn't read as "no match found".
      console.error("[cron] price-check failed for wishlist item", item.id, err);
      errored++;
    }
  }

  return NextResponse.json({ checked, alertsSent, skipped, expired, errored });
}
