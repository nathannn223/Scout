"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaywallPrompt } from "@/components/paywall-prompt";

export function TargetPriceInput({
  wishlistItemId,
  targetPrice,
  expiresAt,
  currency,
  defaultEditing = false,
  large = false,
}: {
  wishlistItemId: string;
  targetPrice: number | null;
  /** Duration window chosen at creation (see /api/wishlist/:id) — used only
   * to show "expire dans N j"; required so every call site stays honest
   * about whether it actually has this data. */
  expiresAt: Date | null;
  currency: string;
  /** Skip the collapsed "Définir un prix cible" state and open the form
   * directly — used when the user just clicked a dedicated "créer une
   * alerte" action, not the small inline prompt. */
  defaultEditing?: boolean;
  /** Scales up the collapsed view's text/icons — for contexts with bigger
   * cards (dashboard home) where the default size reads too small next to
   * everything else. Other call sites keep the compact default. */
  large?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(defaultEditing);
  const [value, setValue] = useState(targetPrice?.toString() ?? "");
  const [durationMonths, setDurationMonths] = useState(3);
  const [isPending, setIsPending] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState(false);

  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000))
    : null;

  async function cancelAlert() {
    if (!window.confirm("Supprimer cette alerte de prix ?")) return;
    setIsPending(true);
    try {
      const res = await fetch(`/api/wishlist/${wishlistItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPrice: null }),
      });
      if (res.ok) router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function save() {
    const parsed = value.trim() === "" ? null : Number(value);
    if (parsed !== null && (Number.isNaN(parsed) || parsed <= 0)) return;

    // Captured before the request: targetPrice (the prop) only changes once
    // the parent re-fetches after router.refresh() below, so this closure
    // value still reflects the pre-save state — reliable even though this
    // component doesn't unmount between the two states.
    const wasNewAlert = targetPrice === null;

    setIsPending(true);
    try {
      const res = await fetch(`/api/wishlist/${wishlistItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPrice: parsed, durationMonths }),
      });
      if (res.ok) {
        router.refresh();
        if (parsed !== null && wasNewAlert) {
          setJustCreated(true);
        } else {
          setEditing(false);
        }
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

  if (justCreated) {
    return (
      <p className="text-xs text-muted-foreground">
        Alerte créée ! Suis-la depuis ton{" "}
        <Link href="/dashboard/alertes" className="font-medium text-foreground hover:underline">
          tableau de bord
        </Link>
        .{" "}
        <button
          type="button"
          onClick={() => {
            setJustCreated(false);
            setEditing(false);
          }}
          className="underline hover:text-foreground"
        >
          Fermer
        </button>
      </p>
    );
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5">
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
          <select
            value={durationMonths}
            onChange={(e) => setDurationMonths(Number(e.target.value))}
            disabled={isPending}
            aria-label="Durée de suivi"
            className="h-7 rounded border border-border bg-card px-1 text-xs text-muted-foreground"
          >
            <option value={1}>1 mois</option>
            <option value={3}>3 mois</option>
            <option value={6}>6 mois</option>
          </select>
          <Button size="sm" className="h-7 px-2 text-xs" onClick={save} disabled={isPending}>
            OK
          </Button>
        </div>
        <p className="max-w-xs text-[11px] leading-snug text-muted-foreground">
          C&rsquo;est la durée pendant laquelle Scout va chercher en continu les meilleurs prix
          pour cet article.
        </p>
      </div>
    );
  }

  const textSize = large ? "text-sm" : "text-xs";
  const iconSize = large ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`flex items-center gap-1.5 ${textSize} text-muted-foreground hover:text-foreground`}
      >
        {targetPrice !== null ? (
          <>
            <Bell className={iconSize} aria-hidden />
            Alerte sous {targetPrice.toFixed(2)} {currency}
            {daysLeft !== null && (
              <span className="text-muted-foreground/70">
                · expire dans {daysLeft} j{daysLeft > 1 ? "ours" : "our"}
              </span>
            )}
            <Pencil className={iconSize} aria-hidden />
          </>
        ) : (
          <>
            <Bell className={iconSize} aria-hidden />
            Définir un prix cible
          </>
        )}
      </button>
      {targetPrice !== null && (
        <button
          type="button"
          onClick={cancelAlert}
          disabled={isPending}
          aria-label="Supprimer l'alerte"
          className="text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className={iconSize} aria-hidden />
        </button>
      )}
    </div>
  );
}
