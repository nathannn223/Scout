"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaywallPrompt } from "@/components/paywall-prompt";
import { TargetPriceInput } from "@/app/dashboard/target-price-input";
import { EXCLUDE_PLANS_FOR } from "@/lib/stripe";
import type { Plan } from "@prisma/client";

/**
 * Heart (favorite this specific merchant listing) + bell (create an alert
 * on it) for one MatchList row — combined into one component so both share
 * the same `itemId` state and never race to create two WishlistItem rows
 * for the same match. Standalone `wishlist-button.tsx` stays as-is for
 * contexts where the item is already known to be a favorite (Favoris
 * récents, /dashboard/favoris, /dashboard/alertes) and only needs the heart.
 */
export function MatchRowActions({
  matchedProductId,
  wishlistItemId,
  currency,
  currentPlan,
}: {
  matchedProductId: string;
  wishlistItemId: string | null;
  currency: string;
  currentPlan?: Plan;
}) {
  const router = useRouter();
  const [itemId, setItemId] = useState(wishlistItemId);
  const [isPending, setIsPending] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const saved = itemId !== null;

  async function ensureWishlistItem(): Promise<string | null> {
    if (itemId) return itemId;

    setIsPending(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchedProductId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.code === "UPGRADE_REQUIRED") {
          setPaywallMessage(body.error || "Les favoris sont réservés aux abonnés.");
        }
        return null;
      }
      const created: { id: string } = await res.json();
      setItemId(created.id);
      router.refresh();
      return created.id;
    } finally {
      setIsPending(false);
    }
  }

  async function toggleFavorite() {
    if (!saved) {
      await ensureWishlistItem();
      return;
    }
    const previous = itemId;
    setItemId(null);
    setShowAlertForm(false);
    try {
      const res = await fetch(`/api/wishlist/${previous}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
    } catch {
      setItemId(previous);
    } finally {
      router.refresh();
    }
  }

  async function handleCreateAlert() {
    const id = await ensureWishlistItem();
    if (id) setShowAlertForm(true);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFavorite}
          disabled={isPending}
          aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={saved}
        >
          <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCreateAlert}
          disabled={isPending || showAlertForm}
          aria-label="Créer une alerte"
        >
          <Bell className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {showAlertForm && itemId && (
        <TargetPriceInput
          wishlistItemId={itemId}
          targetPrice={null}
          expiresAt={null}
          currency={currency}
          defaultEditing
        />
      )}

      {paywallMessage && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setPaywallMessage(null)}
            aria-label="Fermer"
            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <PaywallPrompt
            title="Favoris et alertes"
            description={paywallMessage}
            excludePlans={currentPlan ? EXCLUDE_PLANS_FOR[currentPlan] : []}
          />
        </div>
      )}
    </div>
  );
}
