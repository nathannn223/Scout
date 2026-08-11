import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ALERT_LIMIT } from "@/lib/stripe";
import { checkAndAlertWishlistItem } from "@/lib/price-check";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const item = await db.wishlistItem.findUnique({ where: { id: params.id } });
  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Wishlist item not found." }, { status: 404 });
  }

  let body: { targetPrice?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (body.targetPrice !== null && typeof body.targetPrice !== "number") {
    return NextResponse.json(
      { error: "'targetPrice' must be a number or null." },
      { status: 400 }
    );
  }
  if (typeof body.targetPrice === "number" && body.targetPrice <= 0) {
    return NextResponse.json({ error: "'targetPrice' must be positive." }, { status: 400 });
  }

  // Setting a real alert is the paid action; clearing one back to null is
  // just cancelling a commitment and should always stay free.
  if (body.targetPrice !== null) {
    const limit = user.plan === "FREE" ? 0 : ALERT_LIMIT[user.plan];
    if (limit === 0) {
      return NextResponse.json(
        {
          error: "Les alertes de prix sont réservées aux abonnés Essentiel et Pro.",
          code: "UPGRADE_REQUIRED",
        },
        { status: 402 }
      );
    }
    // Only count against the cap when this is a genuinely new alert —
    // editing the target price of one you already have shouldn't.
    const isNewAlert = item.targetPrice === null;
    if (limit !== null && isNewAlert) {
      const activeAlerts = await db.wishlistItem.count({
        where: { userId: user.id, targetPrice: { not: null } },
      });
      if (activeAlerts >= limit) {
        return NextResponse.json(
          {
            error: `Tu as atteint ta limite de ${limit} alertes actives pour ce palier.`,
            code: "UPGRADE_REQUIRED",
          },
          { status: 402 }
        );
      }
    }
  }

  const updated = await db.wishlistItem.update({
    where: { id: params.id },
    data: {
      targetPrice: body.targetPrice,
      // A new target means the old alert no longer applies — allow a fresh
      // one to fire if the price already sits below the new threshold.
      alertSentAt: null,
    },
    include: { user: true },
  });

  // Pro gets its price checked the moment it's set instead of waiting for
  // the next daily cron run — the one piece of "temps réel" in "alertes en
  // temps réel" that's actually real. Fire-and-forget: the target price is
  // already saved either way, this is a best-effort head start.
  if (body.targetPrice !== null && user.plan === "PRO") {
    checkAndAlertWishlistItem(updated).catch((err) => {
      console.error("[wishlist] immediate price check failed for item", updated.id, err);
    });
  }

  return NextResponse.json({
    id: updated.id,
    targetPrice: updated.targetPrice ? Number(updated.targetPrice) : null,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const item = await db.wishlistItem.findUnique({ where: { id: params.id } });
  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Wishlist item not found." }, { status: 404 });
  }

  await db.wishlistItem.delete({ where: { id: params.id } });

  return new NextResponse(null, { status: 204 });
}
