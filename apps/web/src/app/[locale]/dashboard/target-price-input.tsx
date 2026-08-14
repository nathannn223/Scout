"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
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
  const locale = useLocale();
  const t = useTranslations("TargetPriceInput");
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
    if (!window.confirm(t("confirmDelete"))) return;
    setIsPending(true);
    try {
      const res = await fetch(`/api/wishlist/${wishlistItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPrice: null, locale }),
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
        body: JSON.stringify({ targetPrice: parsed, durationMonths, locale }),
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
        setPaywallMessage(body.error || t("upgradeRequired"));
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
          aria-label={t("close")}
          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <PaywallPrompt title={t("paywallTitle")} description={paywallMessage} />
      </div>
    );
  }

  if (justCreated) {
    return (
      <p className="text-xs text-muted-foreground">
        {t("createdTitle")}{" "}
        <Link href="/dashboard/alertes" className="font-medium text-foreground hover:underline">
          {t("createdLink")}
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
          {t("close")}
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
            placeholder={t("pricePlaceholder")}
            className="h-7 w-20 rounded border border-border bg-card px-2 text-xs"
            disabled={isPending}
            autoFocus
          />
          <span className="text-xs text-muted-foreground">{currency}</span>
          <select
            value={durationMonths}
            onChange={(e) => setDurationMonths(Number(e.target.value))}
            disabled={isPending}
            aria-label={t("durationLabel")}
            className="h-7 rounded border border-border bg-card px-1 text-xs text-muted-foreground"
          >
            <option value={1}>{t("duration1")}</option>
            <option value={3}>{t("duration3")}</option>
            <option value={6}>{t("duration6")}</option>
          </select>
          <Button size="sm" className="h-7 px-2 text-xs" onClick={save} disabled={isPending}>
            {t("ok")}
          </Button>
        </div>
        <p className="max-w-xs text-[11px] leading-snug text-muted-foreground">
          {t("durationHelp")}
        </p>
      </div>
    );
  }

  const textSize = large ? "text-sm" : "text-xs";
  const iconSize = large ? "h-3.5 w-3.5" : "h-3 w-3";

  if (targetPrice === null) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`flex items-center gap-1.5 ${textSize} text-muted-foreground hover:text-foreground`}
      >
        <Bell className={iconSize} aria-hidden />
        {t("setTarget")}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`flex min-w-0 items-center gap-1.5 whitespace-nowrap ${textSize} text-muted-foreground hover:text-foreground`}
        >
          <Bell className={`${iconSize} shrink-0`} aria-hidden />
          {t("alertUnder", { price: targetPrice.toFixed(2), currency })}
        </button>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={t("editAlert")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className={iconSize} aria-hidden />
          </button>
          <button
            type="button"
            onClick={cancelAlert}
            disabled={isPending}
            aria-label={t("deleteAlert")}
            className="text-muted-foreground hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className={iconSize} aria-hidden />
          </button>
        </div>
      </div>
      {daysLeft !== null && (
        <p className={`${large ? "text-xs" : "text-[11px]"} text-muted-foreground/70`}>
          {t("expiresIn", { days: daysLeft })}
        </p>
      )}
    </div>
  );
}
