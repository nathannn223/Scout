"use client";

import { useState } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";
import { MatchRowActions } from "@/components/match-row-actions";
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
  const [showAll, setShowAll] = useState(false);

  const VISIBLE_COUNT = 6;
  const visibleMatches = showAll ? matches : matches.slice(0, VISIBLE_COUNT);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visibleMatches.map((match) => (
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
            className={`flex items-center gap-4 rounded-xl border border-border bg-card p-4 ${
              locked ? "cursor-pointer" : ""
            }`}
          >
            {match.imageUrl && (
              <Image
                src={match.imageUrl}
                alt=""
                width={56}
                height={56}
                unoptimized
                className={`h-14 w-14 shrink-0 rounded bg-background object-contain ${
                  locked ? "blur-sm select-none" : ""
                }`}
              />
            )}
            <div className="min-w-0 flex-1">
              {locked ? (
                <p className="block truncate text-base font-medium blur-sm select-none" aria-hidden>
                  {match.title}
                </p>
              ) : (
                <a
                  href={match.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="block truncate text-base font-medium hover:underline"
                >
                  {match.title}
                </a>
              )}
              <p className="text-sm">
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
                <MatchRowActions
                  matchedProductId={match.id}
                  wishlistItemId={match.wishlistItemId}
                  currency={match.currency}
                  currentPlan={currentPlan}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {!showAll && matches.length > VISIBLE_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="self-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Voir plus ({matches.length - VISIBLE_COUNT} de plus)
        </button>
      )}

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
