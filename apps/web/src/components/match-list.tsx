"use client";

import { useState } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";
import { WishlistButton } from "@/app/dashboard/wishlist-button";
import { PaywallPrompt } from "@/components/paywall-prompt";
import { EXCLUDE_PLANS_FOR } from "@/lib/stripe";
import type { Plan } from "@prisma/client";

export interface MatchListItem {
  id: string;
  merchantName: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl: string | null;
  wishlistItemId: string | null;
}

export function MatchList({
  matches,
  locked,
  currentPlan,
}: {
  matches: MatchListItem[];
  /** FREE-plan gate: hides merchant/title/image behind a blur and swaps
   * the merchant link for a paywall prompt, so a free scan still proves
   * the product was found without letting the user reach it for free. */
  locked: boolean;
  currentPlan?: Plan;
}) {
  const [showPaywall, setShowPaywall] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {matches.map((match) => (
          <div
            key={match.id}
            role={locked ? "button" : undefined}
            tabIndex={locked ? 0 : undefined}
            onClick={locked ? () => setShowPaywall(true) : undefined}
            onKeyDown={
              locked
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") setShowPaywall(true);
                  }
                : undefined
            }
            className={`flex items-center gap-3 rounded-xl border border-border bg-card p-3 ${
              locked ? "cursor-pointer" : ""
            }`}
          >
            {match.imageUrl && (
              <Image
                src={match.imageUrl}
                alt=""
                width={40}
                height={40}
                unoptimized
                className={`h-10 w-10 shrink-0 rounded bg-background object-contain ${
                  locked ? "blur-sm select-none" : ""
                }`}
              />
            )}
            <div className="min-w-0 flex-1">
              {locked ? (
                <p className="block truncate text-sm font-medium blur-sm select-none" aria-hidden>
                  {match.title}
                </p>
              ) : (
                <a
                  href={match.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {match.title}
                </a>
              )}
              <p className="text-xs">
                {locked ? (
                  <span className="select-none blur-sm" aria-hidden>
                    {match.merchantName}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{match.merchantName}</span>
                )}
                {" · "}
                <span className="font-semibold text-foreground">
                  {match.price.toFixed(2)} {match.currency}
                </span>
              </p>
            </div>
            {locked ? (
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Résultat verrouillé" />
            ) : (
              <div onClick={(e) => e.stopPropagation()}>
                <WishlistButton matchedProductId={match.id} wishlistItemId={match.wishlistItemId} />
              </div>
            )}
          </div>
        ))}
      </div>

      {showPaywall && (
        <PaywallPrompt
          title="Débloque les liens marchands"
          description="Passe à un palier payant pour voir où acheter ce résultat et le sauvegarder."
          excludePlans={currentPlan ? EXCLUDE_PLANS_FOR[currentPlan] : []}
        />
      )}
    </div>
  );
}
