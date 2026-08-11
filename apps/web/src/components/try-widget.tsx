"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { PaywallPrompt } from "@/components/paywall-prompt";
import { WishlistButton } from "@/app/dashboard/wishlist-button";
import { EXCLUDE_PLANS_FOR } from "@/lib/stripe";
import type { ScanResponse } from "@scout/shared";
import type { Plan } from "@prisma/client";

type Status = "idle" | "uploading" | "ready" | "identifying" | "done" | "limit" | "error";

export function TryWidget({ currentPlan }: { currentPlan?: Plan } = {}) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [linkValue, setLinkValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);

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
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5">
      {showDropzone && (
        <div className="relative w-full">
          <div
            className="bg-glow left-1/2 top-1/2 h-[260px] w-[560px] -translate-x-1/2 -translate-y-1/2 animate-drift-b"
            aria-hidden
          />
          <div className="relative z-10 flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-border bg-card px-7 py-10">
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
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-border/40 text-foreground transition-opacity hover:opacity-80 disabled:opacity-50"
                  aria-label="Choisir une image"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
                    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleDropzoneClick}
                  disabled={status === "uploading" || !isLoaded}
                  className="font-medium disabled:opacity-60"
                >
                  {status === "uploading"
                    ? "Envoi de la photo…"
                    : "Dépose une image ou clique pour en choisir une"}
                </button>
                <p className="text-xs text-muted-foreground">JPG, PNG — 5 Mo max</p>

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
                    className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={handleIdentifyLink}
                    disabled={!linkValue.trim() || !isLoaded}
                    className="shrink-0 rounded-full bg-foreground px-5 text-sm font-bold text-background disabled:opacity-50"
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
                  width={140}
                  height={140}
                  unoptimized
                  className="h-32 w-32 rounded-xl border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={handleIdentifyUpload}
                  className="rounded-full bg-foreground px-7 py-3 text-sm font-bold text-background"
                >
                  Identifier ce produit
                </button>
                <button
                  type="button"
                  onClick={handleDropzoneClick}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Changer de photo
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {status === "identifying" && (
        <p className="text-sm text-muted-foreground">Identification en cours…</p>
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
          <p className="text-sm font-semibold">
            {[result.scan.brand, result.scan.category].filter(Boolean).join(" ") ||
              "Article identifié"}
          </p>
          {result.scan.description && (
            <p className="mt-1 text-sm text-muted-foreground">{result.scan.description}</p>
          )}
          {result.matches.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Aucun produit trouvé pour cet article.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {result.matches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  {match.imageUrl && (
                    <Image
                      src={match.imageUrl}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 shrink-0 rounded bg-background object-contain"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <a
                      href={match.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {match.title}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {match.merchantName} · {match.price.toFixed(2)} {match.currency}
                    </p>
                  </div>
                  <WishlistButton matchedProductId={match.id} wishlistItemId={null} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
