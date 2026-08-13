"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { PaywallPrompt } from "@/components/paywall-prompt";
import { MatchList } from "@/components/match-list";
import { ScanResultHeader } from "@/components/scan-result-header";
import { EXCLUDE_PLANS_FOR } from "@/lib/stripe";
import type { ScanResponse } from "@scout/shared";
import type { Plan } from "@prisma/client";

type Status = "idle" | "uploading" | "ready" | "identifying" | "done" | "limit" | "error";

// Simulated but honest progress — /api/scan is a single request/response,
// there's no real incremental signal to report. Stalls on the last step and
// never claims 100% until the real result actually comes back.
const IDENTIFY_STEPS = [
  { label: "Analyse de l'image…", percent: 30 },
  { label: "Recherche des prix…", percent: 60 },
  { label: "Comparaison des marchands…", percent: 85 },
];

export function TryWidget({
  currentPlan,
  onResultChange,
}: { currentPlan?: Plan; onResultChange?: (hasResult: boolean) => void } = {}) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [linkValue, setLinkValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [progressStep, setProgressStep] = useState(0);

  useEffect(() => {
    if (status !== "identifying") {
      setProgressStep(0);
      return;
    }
    const interval = setInterval(() => {
      setProgressStep((step) => Math.min(step + 1, IDENTIFY_STEPS.length - 1));
    }, 1500);
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
      if (!res.ok || !body.url) throw new Error(body.error || "Upload impossible.");
      setImageUrl(body.url);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
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
        throw new Error(body.error || `Erreur ${res.status}.`);
      }
      setResult(body as ScanResponse);
      setStatus("done");
      // No-op on the landing page; on the dashboard this refreshes the
      // server-rendered "scans récents" list to include this new one.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
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
                  aria-label="Choisir une image"
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
                  {status === "uploading"
                    ? "Envoi de la photo…"
                    : "Dépose une image ou clique pour en choisir une"}
                </button>
                <p className="text-sm text-muted-foreground">JPG, PNG — 5 Mo max</p>

                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  ou
                </span>

                <div className="flex w-full gap-2">
                  <input
                    type="text"
                    value={linkValue}
                    onChange={(e) => setLinkValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleIdentifyLink()}
                    placeholder="Colle un lien vers l'image"
                    className="min-w-0 flex-1 rounded-full border border-border bg-background px-5 py-4 text-base placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={handleIdentifyLink}
                    disabled={!linkValue.trim() || !isLoaded}
                    className="shrink-0 rounded-full bg-foreground px-6 text-base font-bold text-background disabled:opacity-50"
                  >
                    Identifier
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
                  Identifier ce produit
                </button>
                <button
                  type="button"
                  onClick={handleDropzoneClick}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Changer de photo
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {status === "identifying" && (
        <div className="flex w-full max-w-sm flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">{IDENTIFY_STEPS[progressStep].label}</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${IDENTIFY_STEPS[progressStep].percent}%` }}
            />
          </div>
        </div>
      )}

      {status === "error" && error && <p className="text-sm text-destructive">{error}</p>}

      {status === "limit" && (
        <PaywallPrompt
          title="Scan gratuit déjà utilisé"
          description="Passe à un palier payant pour continuer à scanner."
          excludePlans={currentPlan ? EXCLUDE_PLANS_FOR[currentPlan] : []}
        />
      )}

      {status === "done" && result && (
        <div className="w-full text-left">
          {result.matches.length === 0 ? (
            <>
              <p className="text-sm font-semibold">
                {[result.scan.brand, result.scan.category].filter(Boolean).join(" ") ||
                  "Article identifié"}
              </p>
              {result.scan.description && (
                <p className="mt-1 text-sm text-muted-foreground">{result.scan.description}</p>
              )}
              <p className="mt-4 text-sm text-muted-foreground">
                Aucun produit trouvé pour cet article.
              </p>
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
