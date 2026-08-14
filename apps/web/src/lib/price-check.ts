import { db } from "@/lib/db";
import { visualSearch, SerpApiError } from "@/lib/serpapi";
import { sendPriceDropAlert, sendAlertExpiringEmail } from "@/lib/resend";
import { classifyCandidate } from "@/lib/product-match";
import { confirmSameProduct } from "@/lib/anthropic";
import type { WishlistItem, User } from "@prisma/client";
import type { Locale } from "@/i18n/routing";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Sends the J-14/J-24h expiry reminder for one alert if it's due and hasn't
 * already been sent — transactional, not a re-engagement nudge (see
 * WishlistItem.expiresAt). Called once per active alert from the daily cron,
 * separately from checkAndAlertWishlistItem so a reminder failure never
 * blocks the price check for the same item.
 */
export async function sendExpiryReminderIfDue(item: WishlistItem & { user: User }): Promise<void> {
  if (!item.expiresAt) return;
  const msUntilExpiry = item.expiresAt.getTime() - Date.now();
  if (msUntilExpiry <= 0) return; // already expired — handled by checkAndAlertWishlistItem

  if (msUntilExpiry <= ONE_DAY_MS && !item.expiryReminder24hSentAt) {
    const product = await db.matchedProduct.findUnique({ where: { id: item.matchedProductId } });
    if (!product) return;
    await sendAlertExpiringEmail({
      to: item.user.email,
      productTitle: product.title,
      expiresInDays: 1,
      locale: item.user.locale as Locale,
    });
    await db.wishlistItem.update({
      where: { id: item.id },
      data: { expiryReminder24hSentAt: new Date() },
    });
    return;
  }

  if (msUntilExpiry <= 14 * ONE_DAY_MS && !item.expiryReminder14dSentAt) {
    const product = await db.matchedProduct.findUnique({ where: { id: item.matchedProductId } });
    if (!product) return;
    await sendAlertExpiringEmail({
      to: item.user.email,
      productTitle: product.title,
      expiresInDays: 14,
      locale: item.user.locale as Locale,
    });
    await db.wishlistItem.update({
      where: { id: item.id },
      data: { expiryReminder14dSentAt: new Date() },
    });
  }
}

export type PriceCheckResult = "alerted" | "updated" | "skipped" | "expired";

/**
 * Re-checks one wishlist item's current price and sends an alert if it's
 * crossed the threshold. Shared by the daily cron (every item, every plan)
 * and the instant check triggered when a Pro user sets a target price.
 */
export async function checkAndAlertWishlistItem(
  item: WishlistItem & { user: User }
): Promise<PriceCheckResult> {
  // Alerts run for a user-chosen duration (max 6 months, see /api/wishlist/:id)
  // rather than forever — checked first, before any paid API call. Clearing
  // targetPrice (not deleting the item) drops it out of /dashboard/alertes
  // automatically; the user reactivates manually from Favoris.
  if (item.expiresAt && item.expiresAt <= new Date()) {
    await db.wishlistItem.update({
      where: { id: item.id },
      data: { targetPrice: null, expiresAt: null },
    });
    return "expired";
  }

  // Safety net for Pro's uncapped alert count: beyond the 30 oldest active
  // alerts, drop the check cadence to every 2 days instead of daily. A
  // typical Pro user never gets near this; it only bounds the worst case
  // (someone with hundreds of alerts) since ALERT_LIMIT.PRO is null.
  if (item.user.plan === "PRO") {
    const activeCount = await db.wishlistItem.count({
      where: { userId: item.userId, targetPrice: { not: null } },
    });
    if (activeCount > 30) {
      const olderCount = await db.wishlistItem.count({
        where: {
          userId: item.userId,
          targetPrice: { not: null },
          createdAt: { lt: item.createdAt },
        },
      });
      const checkedRecently =
        item.priceCheckedAt !== null &&
        Date.now() - item.priceCheckedAt.getTime() < 2 * 24 * 60 * 60 * 1000;
      if (olderCount >= 30 && checkedRecently) return "skipped";
    }
  }

  const product = await db.matchedProduct.findUnique({
    where: { id: item.matchedProductId },
  });
  if (!product) return "skipped";

  const scan = await db.scannedItem.findUnique({ where: { id: product.scannedItemId } });
  if (!scan) return "skipped";

  // Re-run the same visual search that originally found this listing —
  // it already returns up to 6 merchants per call (see visualSearch's
  // `limit`), so tracking the article across all of them costs no extra
  // SerpApi call over the old single-URL check.
  let fresh: Awaited<ReturnType<typeof visualSearch>> = [];
  try {
    fresh = await visualSearch(scan.imageUrl);
  } catch (err) {
    if (!(err instanceof SerpApiError)) throw err;
  }

  // Prior observations across all merchants (not just the original saved
  // link) feed the price-plausibility band and let an unknown domain earn
  // trust by reappearing — no user confirmation involved anywhere here.
  const priorObservations = await db.priceObservation.findMany({
    where: { wishlistItemId: item.id },
  });
  const priorForClassifier = priorObservations.map((o) => ({
    merchantName: o.merchantName,
    trusted: o.trusted,
    price: Number(o.price),
  }));
  const reference = { brand: scan.brand, category: scan.category, description: scan.description };

  const acceptedThisRound: {
    merchantName: string;
    title: string;
    price: number;
    currency: string;
    url: string;
    trusted: boolean;
  }[] = [];

  for (const candidate of fresh) {
    const verdict = classifyCandidate(candidate, reference, priorForClassifier);
    if (verdict === "reject") continue;

    let trusted = verdict === "trusted";
    if (verdict === "ambiguous") {
      // Can't ask Claude to compare against a candidate photo we don't have.
      if (!candidate.imageUrl) continue;
      const confirmed = await confirmSameProduct(scan.imageUrl, candidate.imageUrl);
      if (!confirmed) continue;
      trusted = true;
    }
    // "unverified" candidates fall through with trusted: false — persisted
    // below, promoted to trusted automatically if they reappear later.

    acceptedThisRound.push({
      merchantName: candidate.merchantName,
      title: candidate.title,
      price: candidate.price,
      currency: candidate.currency,
      url: candidate.url,
      trusted,
    });
  }

  if (acceptedThisRound.length > 0) {
    await db.priceObservation.createMany({
      data: acceptedThisRound.map((o) => ({ wishlistItemId: item.id, ...o })),
    });
  }

  const trustedThisRound = acceptedThisRound.filter((o) => o.trusted);
  if (trustedThisRound.length === 0) {
    // Nothing reliable found this round — don't guess, leave lastKnownPrice
    // as-is and try again next run.
    await db.wishlistItem.update({
      where: { id: item.id },
      data: { priceCheckedAt: new Date() },
    });
    return "skipped";
  }

  // Alert on the cheapest trusted match, whichever merchant it's from — the
  // whole point of tracking the article instead of one link.
  const cheapest = trustedThisRound.reduce((min, o) => (o.price < min.price ? o : min));
  const currentPrice = cheapest.price;
  const threshold = item.targetPrice ? Number(item.targetPrice) : Number(item.lastKnownPrice);

  if (currentPrice <= threshold) {
    if (!item.alertSentAt) {
      // The email always names the actual merchant/link that triggered it —
      // never an anonymous aggregated price — so a false positive that
      // slips through is at least immediately checkable by the user.
      await sendPriceDropAlert({
        to: item.user.email,
        productTitle: cheapest.title,
        merchantName: cheapest.merchantName,
        previousPrice: Number(item.lastKnownPrice),
        newPrice: currentPrice,
        currency: cheapest.currency,
        productUrl: cheapest.url,
        locale: item.user.locale as Locale,
      });
      await db.wishlistItem.update({
        where: { id: item.id },
        data: { lastKnownPrice: currentPrice, alertSentAt: new Date(), priceCheckedAt: new Date() },
      });
      return "alerted";
    }
    // Already alerted for this dip — keep the price fresh, don't spam.
    await db.wishlistItem.update({
      where: { id: item.id },
      data: { lastKnownPrice: currentPrice, priceCheckedAt: new Date() },
    });
    return "updated";
  }

  // Back above threshold — clear alertSentAt so a future dip can alert again.
  await db.wishlistItem.update({
    where: { id: item.id },
    data: { lastKnownPrice: currentPrice, alertSentAt: null, priceCheckedAt: new Date() },
  });
  return "updated";
}
