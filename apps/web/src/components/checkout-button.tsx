"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { PaidPlan } from "@/lib/stripe";

export function CheckoutButton({
  plan,
  children,
  ...buttonProps
}: { plan: PaidPlan; children: React.ReactNode } & Omit<ButtonProps, "onClick" | "disabled">) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setIsPending(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) {
        throw new Error(body.error || "Impossible de démarrer le paiement.");
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button {...buttonProps} onClick={startCheckout} disabled={isPending}>
        {isPending ? "Redirection…" : children}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
