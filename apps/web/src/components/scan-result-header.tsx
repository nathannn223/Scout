"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaywallPrompt } from "@/components/paywall-prompt";
import { TargetPriceInput } from "@/app/dashboard/target-price-input";
import { EXCLUDE_PLANS_FOR } from "@/lib/stripe";
import type { ScanResponse, MatchedProductDTO } from "@scout/shared";
import type { Plan } from "@prisma/client";

export function ScanResultHeader({
  scan,
  matches,
  currentPlan,
}: {
  scan: ScanResponse["scan"];
  matches: MatchedProductDTO[];
  currentPlan?: Plan;
}) {
  const router = useRouter();
  const [wishlistItemId, setWishlistItemId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null);
  const [showAlertForm, setShowAlertForm] = useState(false);

  const cheapest =
    matches.length > 0 ? matches.reduce((min, m) => (m.price < min.price ? m : min)) : null;

  // Shared by both buttons — favoriting the whole article and creating an
  // alert both need the same underlying WishlistItem; whichever is clicked
  // first creates it, the other reuses it instead of making a duplicate.
  async function ensureWishlistItem(): Promise<string | null> {
    if (wishlistItemId) return wishlistItemId;
    if (!cheapest) return null;

    setIsPending(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchedProductId: cheapest.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.code === "UPGRADE_REQUIRED") {
          setPaywallMessage(body.error || "Les favoris sont réservés aux abonnés.");
        }
        return null;
      }
      const created: { id: string } = await res.json();
      setWishlistItemId(created.id);
      router.refresh();
      return created.id;
    } finally {
      setIsPending(false);
    }
  }

  async function handleAddToFavorites() {
    await ensureWishlistItem();
  }

  async function handleCreateAlert() {
    const id = await ensureWishlistItem();
    if (id) setShowAlertForm(true);
  }

  if (!cheapest) return null;

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6">
      <div className="flex items-start gap-4">
        {scan.imageUrl && (
          <Image
            src={scan.imageUrl}
            alt=""
            width={80}
            height={80}
            unoptimized
            className="h-20 w-20 shrink-0 rounded-xl border border-border object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-semibold">
              {[scan.brand, scan.category].filter(Boolean).join(" ") || "Article identifié"}
            </p>
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={handleAddToFavorites}
              disabled={isPending}
            >
              <Heart className="h-4 w-4" fill={wishlistItemId ? "currentColor" : "none"} aria-hidden />
              {wishlistItemId ? "Ajouté aux favoris" : "Ajouter aux favoris"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleCreateAlert}
              disabled={isPending || showAlertForm}
            >
              <Bell className="h-4 w-4" aria-hidden />
              Créer une alerte
            </Button>
          </div>
          {scan.description && (
            <p className="mt-1 text-sm text-muted-foreground">{scan.description}</p>
          )}
          {showAlertForm && wishlistItemId && (
            <div className="mt-3">
              <TargetPriceInput
                wishlistItemId={wishlistItemId}
                targetPrice={null}
                currency={cheapest.currency}
                defaultEditing
              />
            </div>
          )}
        </div>
      </div>

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
