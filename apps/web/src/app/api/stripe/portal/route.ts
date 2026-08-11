import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";

export async function POST() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription to manage." }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripeClient();

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/portal] failed:", err);
    return NextResponse.json({ error: "Could not open billing portal." }, { status: 500 });
  }
}
