"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaywallPrompt } from "@/components/paywall-prompt";
import { cn } from "@/lib/utils";

const PENDING_ID = "__pending__";

export function WishlistButton({
  matchedProductId,
  wishlistItemId,
}: {
  matchedProductId: string;
  wishlistItemId: string | null;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [itemId, setItemId] = useState(wishlistItemId);
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null);
  const saved = itemId !== null;

  async function toggle() {
    const previousItemId = itemId;
    setIsPending(true);

    if (saved) {
      // Optimistic: hide immediately, don't wait on the network round-trip.
      setItemId(null);
      try {
        const res = await fetch(`/api/wishlist/${previousItemId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("delete failed");
      } catch {
        setItemId(previousItemId);
      } finally {
        setIsPending(false);
        router.refresh(); // syncs the "Wishlist" list below, non-blocking
      }
      return;
    }

    // Optimistic: show as saved immediately with a placeholder id, swap it
    // for the real one once the server responds.
    setItemId(PENDING_ID);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchedProductId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.code === "UPGRADE_REQUIRED") {
          setPaywallMessage(body.error || "La wishlist est réservée aux abonnés.");
        }
        throw new Error("save failed");
      }
      const created: { id: string } = await res.json();
      setItemId(created.id);
    } catch {
      setItemId(null);
    } finally {
      setIsPending(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        disabled={isPending}
        aria-label={saved ? "Retirer de la wishlist" : "Sauvegarder dans la wishlist"}
        aria-pressed={saved}
      >
        <Heart className={cn("h-4 w-4", saved && "fill-primary text-primary")} aria-hidden />
      </Button>
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
          <PaywallPrompt title="Wishlist" description={paywallMessage} />
        </div>
      )}
    </div>
  );
}
