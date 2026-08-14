"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { PaywallPrompt } from "@/components/paywall-prompt";
import { MatchList } from "@/components/match-list";
import { ScanResultHeader } from "@/components/scan-result-header";
import { EXCLUDE_PLANS_FOR } from "@/lib/stripe";
import type { ScanResponse } from "@scout/shared";
import type { Plan } from "@prisma/client";

type Status = "idle" | "uploading" | "ready" | "identifying" | "done" | "limit" | "error";

export function TryWidget({
  currentPlan,
  onResultChange,
}: { currentPlan?: Plan; onResultChange?: (hasResult: boolean) => void } = {}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("TryWidget");
  const tCommon = useTranslations("Common");
  const { isSignedIn, isLoaded } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [linkValue, setLinkValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Simulated but honest progress — /api/scan is a single request/response,
  // there's no real incremental signal to report. A real scan takes ~20-25s,
  // so the label changes at time thresholds and the bar eases toward 92%
  // asymptotically (never reaches it) — always visibly moving, never stuck at
  // a fixed step waiting, and never claims 100% before the real result lands.
  const IDENTIFY_LABELS = [
    { at: 0, label: t("step0") },
    { at: 5, label: t("step1") },
    { at: 11, label: t("step2") },
    { at: 17, label: t("step3") },
  ];

  useEffect(() => {
    if (status !== "identifying") {
      setElapsedMs(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => setElapsedMs(Date.now() - start), 150);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    onResultChange?.(status === "done");
  }, [status, onResultChange]);

  // The account gate fires on the very first click, before anything is
  // picked or uploaded — not after waiting on an upload to finish. Nothing
  // to persist across the redirect: no photo has been chosen yet, so the
  // user just lands back on "/" ready to pick one.
  function requireAuthOrRedirect(): boolean {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent("/")}`);
      return false;
    }
    return true;
  }

  function handleDropzoneClick() {
    if (!requireAuthOrRedirect()) return;
    inputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error || t("uploadError"));
      setImageUrl(body.url);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
      setStatus("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function runScan(url: string) {
    setStatus("identifying");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("imageUrl", url);
      formData.append("locale", locale);
      const res = await fetch("/api/scan", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.code === "SCAN_LIMIT_REACHED") {
          setStatus("limit");
          return;
        }
        // Defensive fallback — shouldn't happen since the dropzone already
        // gates on sign-in, but a session could expire mid-flow.
        if (body.code === "AUTH_REQUIRED") {
          router.push(`/sign-in?redirect_url=${encodeURIComponent("/")}`);
          return;
        }
        throw new Error(body.error || `Error ${res.status}.`);
      }
      setResult(body as ScanResponse);
      setStatus("done");
      // No-op on the landing page; on the dashboard this refreshes the
      // server-rendered "scans récents" list to include this new one.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
      setStatus("error");
    }
  }

  function handleIdentifyUpload() {
    if (!imageUrl) return;
    runScan(imageUrl);
  }

  function handleIdentifyLink() {
    if (!requireAuthOrRedirect()) return;
    const url = linkValue.trim();
    if (!url) return;
    runScan(url);
  }

  const showDropzone = status === "idle" || status === "uploading" || status === "ready";

  const elapsedSec = elapsedMs / 1000;
  const identifyPercent = Math.round(92 * (1 - Math.exp(-elapsedSec / 8)));
  const identifyLabel =
    [...IDENTIFY_LABELS].reverse().find((step) => elapsedSec >= step.at)?.label ??
    IDENTIFY_LABELS[0].label;

  return (
    <div
      className={`mx-auto flex w-full flex-col items-center gap-5 ${
        status === "done" ? "max-w-4xl" : "max-w-2xl"
      }`}
    >
      {showDropzone && (
        <div className="relative w-full">
          <div
            className="bg-glow left-1/2 top-1/2 h-[320px] w-[680px] -translate-x-1/2 -translate-y-1/2 animate-drift-b"
            aria-hidden
          />
          <div className="relative z-10 flex flex-col items-center gap-4 rounded-[28px] border border-dashed border-border bg-card px-10 py-16">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={status === "uploading"}
            />

            {!imageUrl ? (
              <>
                <button
                  type="button"
                  onClick={handleDropzoneClick}
                  disabled={status === "uploading" || !isLoaded}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-border/40 text-foreground transition-opacity hover:opacity-80 disabled:opacity-50"
                  aria-label={t("chooseImage")}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-7 w-7"
                  >
                    <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
                    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleDropzoneClick}
                  disabled={status === "uploading" || !isLoaded}
                  className="text-lg font-semibold disabled:opacity-60"
                >
                  {status === "uploading" ? t("dropzoneUploading") : t("dropzoneIdle")}
                </button>
                <p className="text-sm text-muted-foreground">{t("fileHint")}</p>

                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("or")}
                </span>

                <div className="flex w-full flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={linkValue}
                    onChange={(e) => setLinkValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleIdentifyLink()}
                    placeholder={t("linkPlaceholder")}
                    className="min-w-0 flex-1 rounded-full border border-border bg-background px-5 py-4 text-base placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={handleIdentifyLink}
                    disabled={!linkValue.trim() || !isLoaded}
                    className="shrink-0 rounded-full bg-foreground px-6 py-3 text-base font-bold text-background disabled:opacity-50 sm:py-0"
                  >
                    {t("identifyLink")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <Image
                  src={imageUrl}
                  alt=""
                  width={180}
                  height={180}
                  unoptimized
                  className="h-40 w-40 rounded-xl border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={handleIdentifyUpload}
                  className="rounded-full bg-foreground px-9 py-4 text-base font-bold text-background"
                >
                  {t("identifyUpload")}
                </button>
                <button
                  type="button"
                  onClick={handleDropzoneClick}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("changePhoto")}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {status === "identifying" && (
        <div className="flex w-full max-w-sm flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">{identifyLabel}</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-150 ease-linear"
              style={{ width: `${identifyPercent}%` }}
            />
          </div>
        </div>
      )}

      {status === "error" && error && <p className="text-sm text-destructive">{error}</p>}

      {status === "limit" && (
        <PaywallPrompt
          title={t("limitTitle")}
          description={t("limitDescription")}
          excludePlans={currentPlan ? EXCLUDE_PLANS_FOR[currentPlan] : []}
        />
      )}

      {status === "done" && result && (
        <div className="w-full text-left">
          {result.matches.length === 0 ? (
            <>
              <p className="text-sm font-semibold">
                {[result.scan.brand, result.scan.category].filter(Boolean).join(" ") ||
                  tCommon("unknownArticle")}
              </p>
              {result.scan.description && (
                <p className="mt-1 text-sm text-muted-foreground">{result.scan.description}</p>
              )}
              <p className="mt-4 text-sm text-muted-foreground">{t("noMatches")}</p>
            </>
          ) : (
            <>
              <ScanResultHeader
                scan={result.scan}
                matches={result.matches}
                currentPlan={currentPlan}
              />
              <div className="mt-4">
                <MatchList
                  matches={result.matches.map((match) => ({ ...match, wishlistItemId: null }))}
                  locked={result.locked}
                  currentPlan={currentPlan}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
