import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAndAlertWishlistItem } from "@/lib/price-check";

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

  const items = await db.wishlistItem.findMany({ include: { user: true } });

  let checked = 0;
  let alertsSent = 0;
  let skipped = 0;
  let errored = 0;

  for (const item of items) {
    checked++;
    try {
      const result = await checkAndAlertWishlistItem(item);
      if (result === "alerted") alertsSent++;
      else if (result === "skipped") skipped++;
    } catch (err) {
      // Distinct from `skipped`: this item DID match and DID cross the
      // threshold, but something failed while recording/sending the alert
      // (e.g. Resend misconfigured) — worth surfacing separately so it
      // doesn't read as "no match found".
      console.error("[cron] price-check failed for wishlist item", item.id, err);
      errored++;
    }
  }

  return NextResponse.json({ checked, alertsSent, skipped, errored });
}
