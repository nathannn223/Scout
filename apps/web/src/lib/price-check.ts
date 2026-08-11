import { db } from "@/lib/db";
import { visualSearch, SerpApiError } from "@/lib/serpapi";
import { sendPriceDropAlert } from "@/lib/resend";
import type { WishlistItem, User } from "@prisma/client";

export type PriceCheckResult = "alerted" | "updated" | "skipped";

/**
 * Re-checks one wishlist item's current price and sends an alert if it's
 * crossed the threshold. Shared by the daily cron (every item, every plan)
 * and the instant check triggered when a Pro user sets a target price.
 */
export async function checkAndAlertWishlistItem(
  item: WishlistItem & { user: User }
): Promise<PriceCheckResult> {
  const product = await db.matchedProduct.findUnique({
    where: { id: item.matchedProductId },
  });
  if (!product) return "skipped";

  const scan = await db.scannedItem.findUnique({ where: { id: product.scannedItemId } });
  if (!scan) return "skipped";

  // Re-run the same visual search that originally found this listing, then
  // look for the exact same merchant URL — the most reliable signal that
  // it's genuinely the same offer, not a different variant.
  let fresh: Awaited<ReturnType<typeof visualSearch>> = [];
  try {
    fresh = await visualSearch(scan.imageUrl);
  } catch (err) {
    if (!(err instanceof SerpApiError)) throw err;
  }

  const freshMatch = fresh.find((f) => f.url === product.url);
  if (!freshMatch) {
    // Listing no longer found in a fresh search — don't guess, leave
    // lastKnownPrice as-is and try again next run.
    return "skipped";
  }

  const currentPrice = freshMatch.price;
  const threshold = item.targetPrice ? Number(item.targetPrice) : Number(item.lastKnownPrice);

  if (currentPrice <= threshold) {
    if (!item.alertSentAt) {
      await sendPriceDropAlert({
        to: item.user.email,
        productTitle: product.title,
        merchantName: product.merchantName,
        previousPrice: Number(item.lastKnownPrice),
        newPrice: currentPrice,
        currency: product.currency,
        productUrl: product.url,
      });
      await db.wishlistItem.update({
        where: { id: item.id },
        data: { lastKnownPrice: currentPrice, alertSentAt: new Date() },
      });
      return "alerted";
    }
    // Already alerted for this dip — keep the price fresh, don't spam.
    await db.wishlistItem.update({
      where: { id: item.id },
      data: { lastKnownPrice: currentPrice },
    });
    return "updated";
  }

  // Back above threshold — clear alertSentAt so a future dip can alert again.
  await db.wishlistItem.update({
    where: { id: item.id },
    data: { lastKnownPrice: currentPrice, alertSentAt: null },
  });
  return "updated";
}
