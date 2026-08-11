import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripeClient, planForPriceId } from "@/lib/stripe";

// Webhooks are one-off side-effecting invocations from Stripe, not a page —
// never statically evaluate this route at build time.
export const dynamic = "force-dynamic";

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } });
  if (!user) {
    console.error("[stripe/webhook] no user for customer", customerId);
    return;
  }

  if (subscription.status === "canceled" || subscription.status === "unpaid") {
    await db.user.update({ where: { id: user.id }, data: { plan: "FREE" } });
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId ? planForPriceId(priceId) : null;
  if (!plan) {
    console.error("[stripe/webhook] subscription price does not map to a known plan", priceId);
    return;
  }

  await db.user.update({ where: { id: user.id }, data: { plan } });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await syncSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] handler failed for", event.type, err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
