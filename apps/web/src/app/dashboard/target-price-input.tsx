"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaywallPrompt } from "@/components/paywall-prompt";

export function TargetPriceInput({
  wishlistItemId,
  targetPrice,
  currency,
}: {
  wishlistItemId: string;
  targetPrice: number | null;
  currency: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(targetPrice?.toString() ?? "");
  const [isPending, setIsPending] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null);

  async function save() {
    const parsed = value.trim() === "" ? null : Number(value);
    if (parsed !== null && (Number.isNaN(parsed) || parsed <= 0)) return;

    setIsPending(true);
    try {
      const res = await fetch(`/api/wishlist/${wishlistItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPrice: parsed }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (body.code === "UPGRADE_REQUIRED") {
        setPaywallMessage(body.error || "Les alertes de prix sont réservées aux abonnés.");
      }
    } finally {
      setIsPending(false);
    }
  }

  if (paywallMessage) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setPaywallMessage(null)}
          aria-label="Fermer"
          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <PaywallPrompt title="Alertes de prix" description={paywallMessage} />
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Prix cible"
          className="h-7 w-20 rounded border border-border bg-card px-2 text-xs"
          disabled={isPending}
          autoFocus
        />
        <span className="text-xs text-muted-foreground">{currency}</span>
        <Button size="sm" className="h-7 px-2 text-xs" onClick={save} disabled={isPending}>
          OK
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
    >
      {targetPrice !== null ? (
        <>
          <Bell className="h-3 w-3" aria-hidden />
          Alerte sous {targetPrice.toFixed(2)} {currency}
          <Pencil className="h-3 w-3" aria-hidden />
        </>
      ) : (
        <>
          <Bell className="h-3 w-3" aria-hidden />
          Définir un prix cible
        </>
      )}
    </button>
  );
}
