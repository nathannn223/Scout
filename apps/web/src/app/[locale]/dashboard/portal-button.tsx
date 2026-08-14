"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function PortalButton() {
  const t = useTranslations("PortalButton");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setIsPending(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) {
        throw new Error(body.error || t("genericError"));
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unexpectedError"));
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="secondary" size="sm" onClick={openPortal} disabled={isPending}>
        {isPending ? t("redirecting") : t("manage")}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
