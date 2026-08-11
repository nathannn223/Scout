import Stripe from "stripe";
import type { Plan } from "@prisma/client";

let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });
  }
  return client;
}

export type PaidPlan = Extract<Plan, "DECOUVERTE" | "ESSENTIEL" | "PRO">;

const PAID_PLANS: PaidPlan[] = ["DECOUVERTE", "ESSENTIEL", "PRO"];

/** Monthly scan cap per plan. `null` means unlimited (Pro only). */
export const SCAN_LIMIT: Record<Plan, number | null> = {
  FREE: 1,
  DECOUVERTE: 9,
  ESSENTIEL: 25,
  PRO: null,
};

/**
 * Wishlist size cap per paid plan — Découverte is deliberately capped low
 * (and has no price alerts at all, see ALERT_LIMIT below) so the jump to
 * Essentiel has an obvious, real reason behind it, not just a marketing
 * claim. `null` means unlimited.
 */
export const WISHLIST_LIMIT: Record<PaidPlan, number | null> = {
  DECOUVERTE: 5,
  ESSENTIEL: 15,
  PRO: null,
};

/**
 * Active price alerts (wishlist items with a non-null targetPrice) allowed
 * per paid plan. 0 = alerts aren't available on this plan at all. `null`
 * means unlimited.
 */
export const ALERT_LIMIT: Record<PaidPlan, number | null> = {
  DECOUVERTE: 0,
  ESSENTIEL: 5,
  PRO: null,
};

/** Tiers to hide from a paywall/upgrade prompt shown to this plan's user —
 * never re-offer a tier they're already on or have already passed. */
export const EXCLUDE_PLANS_FOR: Record<Plan, PaidPlan[]> = {
  FREE: [],
  DECOUVERTE: ["DECOUVERTE"],
  ESSENTIEL: ["DECOUVERTE", "ESSENTIEL"],
  PRO: ["DECOUVERTE", "ESSENTIEL", "PRO"],
};

function priceEnvVar(plan: PaidPlan): string | undefined {
  if (plan === "DECOUVERTE") return process.env.STRIPE_PRICE_DECOUVERTE;
  if (plan === "ESSENTIEL") return process.env.STRIPE_PRICE_ESSENTIEL;
  return process.env.STRIPE_PRICE_PRO;
}

export function priceIdForPlan(plan: PaidPlan): string {
  const priceId = priceEnvVar(plan);
  if (!priceId) throw new Error(`STRIPE_PRICE_${plan} is not set`);
  return priceId;
}

export function planForPriceId(priceId: string): PaidPlan | null {
  return PAID_PLANS.find((plan) => priceEnvVar(plan) === priceId) ?? null;
}
