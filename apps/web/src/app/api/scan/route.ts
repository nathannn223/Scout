import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { identify, IdentifyError } from "@/lib/anthropic";
import { searchProducts, visualSearch, SerpApiError } from "@/lib/serpapi";
import { uploadImage, mirrorImageUrl, MAX_IMAGE_BYTES, BlobUploadError } from "@/lib/blob";
import { requireUser } from "@/lib/auth";
import { SCAN_LIMIT } from "@/lib/stripe";
import type { MatchedProductDTO, ScanResponse } from "@scout/shared";

export async function POST(request: NextRequest) {
  // Require a real account before anything else — the free-scan cap only
  // means something if it's tied to one real person, and there's no point
  // spending on Blob/Claude/SerpApi for a request we're about to reject.
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { error: "Connecte-toi pour identifier un article.", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  if (user.plan === "FREE") {
    // The extension is a paid-only surface (any paid plan unlocks it) — the
    // one free scan only works through the web (dashboard or the landing
    // page's try-it widget), never through the extension, not even the
    // very first one.
    const isExtension = request.headers.get("x-scout-client") === "extension";
    if (isExtension) {
      return NextResponse.json(
        { error: "L'extension est réservée aux abonnés.", code: "EXTENSION_REQUIRES_PLAN" },
        { status: 402 }
      );
    }
  }

  const limit = SCAN_LIMIT[user.plan];
  if (limit !== null) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const scansThisMonth = await db.scannedItem.count({
      where: { userId: user.id, createdAt: { gte: startOfMonth } },
    });
    if (scansThisMonth >= limit) {
      const message =
        user.plan === "FREE"
          ? "Tu as utilisé ton scan gratuit de ce mois-ci."
          : `Tu as atteint ta limite de ${limit} scans ce mois-ci.`;
      return NextResponse.json(
        { error: message, code: "SCAN_LIMIT_REACHED" },
        { status: 402 }
      );
    }
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const image = formData.get("image");
  const imageUrlField = formData.get("imageUrl");
  const sourceUrl = formData.get("sourceUrl");

  const hasFile = image instanceof File;
  const hasUrl = typeof imageUrlField === "string" && imageUrlField.length > 0;

  if (!hasFile && !hasUrl) {
    return NextResponse.json(
      { error: "Provide either 'image' (file) or 'imageUrl' (string)." },
      { status: 400 }
    );
  }
  if (hasFile && hasUrl) {
    return NextResponse.json(
      { error: "Provide only one of 'image' or 'imageUrl', not both." },
      { status: 400 }
    );
  }

  // Both paths converge on a single public image URL: an uploaded file is
  // hosted on Blob first, a right-click capture already has one. This lets
  // both identification and product matching always use the real image
  // (Google Lens reverse-image search) instead of text-only matching.
  let imageUrl: string;

  if (hasUrl) {
    const rawUrl = imageUrlField as string;
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return NextResponse.json({ error: "'imageUrl' is not a valid URL." }, { status: 400 });
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json({ error: "'imageUrl' must be http or https." }, { status: 400 });
    }
    // Mirror to our own Blob store instead of using the source URL directly:
    // several CDNs (Pinterest, Google's image proxies, Wikimedia) disallow
    // Claude's fetcher via robots.txt even though a plain server-side fetch
    // works fine. Invisible to the end user — same right-click flow.
    try {
      imageUrl = await mirrorImageUrl(rawUrl);
    } catch (err) {
      if (err instanceof BlobUploadError) {
        console.error("[scan] image mirroring failed:", err.message, err.cause ?? "");
        return NextResponse.json({ error: "Could not fetch the source image." }, { status: 502 });
      }
      throw err;
    }
  } else {
    const file = image as File;
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "'image' must be an image file." }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image exceeds 5MB limit." }, { status: 400 });
    }
    try {
      imageUrl = await uploadImage(file);
    } catch (err) {
      if (err instanceof BlobUploadError) {
        console.error("[scan] blob upload failed:", err.message, err.cause ?? "");
        return NextResponse.json({ error: "Could not upload image." }, { status: 500 });
      }
      throw err;
    }
  }

  // Claude identification and the Google Lens visual search both only need
  // the image URL — run them concurrently instead of waiting on Claude
  // before starting the (usually slower) SerpApi call.
  // Fetch more than the 6 the UI shows by default — MatchList reveals the
  // rest via "Voir plus" client-side, no extra SerpApi call needed.
  const MATCH_FETCH_LIMIT = 12;

  const [identifyOutcome, visualOutcome] = await Promise.allSettled([
    identify(imageUrl),
    visualSearch(imageUrl, MATCH_FETCH_LIMIT),
  ]);

  if (identifyOutcome.status === "rejected") {
    const err = identifyOutcome.reason;
    if (err instanceof IdentifyError) {
      if (err.code === "refusal") {
        return NextResponse.json({ error: err.message }, { status: 422 });
      }
      if (err.code === "rate_limited") {
        return NextResponse.json({ error: err.message }, { status: 429 });
      }
      console.error("[scan] identify failed:", err.code, err.cause ?? err.message);
      return NextResponse.json({ error: "Identification failed." }, { status: 502 });
    }
    console.error("[scan] unexpected error during identify:", err);
    return NextResponse.json({ error: "Identification failed." }, { status: 500 });
  }
  const identification = identifyOutcome.value;

  try {
    const scan = await db.scannedItem.create({
      data: {
        userId: user.id,
        sourceUrl: typeof sourceUrl === "string" && sourceUrl.length > 0 ? sourceUrl : null,
        imageUrl,
        category: identification.category,
        brand: identification.brand,
        description: identification.description,
      },
    });

    let matches: MatchedProductDTO[] = [];
    try {
      // Visual search (Google Lens) already ran in parallel with
      // identification above. Some images have nothing indexed visually
      // (SerpApi throws rather than returning an empty list in that case),
      // so fall back to a text search from the description to still return
      // results.
      let rawMatches: Awaited<ReturnType<typeof visualSearch>> = [];
      if (visualOutcome.status === "fulfilled") {
        rawMatches = visualOutcome.value;
      } else if (!(visualOutcome.reason instanceof SerpApiError)) {
        throw visualOutcome.reason;
      } else {
        console.error(
          "[scan] visual search failed, falling back to text search:",
          visualOutcome.reason.code,
          visualOutcome.reason.message
        );
      }

      if (rawMatches.length === 0) {
        rawMatches = await searchProducts(identification.searchQuery, MATCH_FETCH_LIMIT);
      }

      if (rawMatches.length > 0) {
        const created = await db.matchedProduct.createManyAndReturn({
          data: rawMatches.map((m) => ({ ...m, scannedItemId: scan.id })),
        });
        matches = created.map((m) => ({
          id: m.id,
          merchantName: m.merchantName,
          title: m.title,
          price: Number(m.price),
          currency: m.currency,
          url: m.url,
          imageUrl: m.imageUrl,
          inStock: m.inStock,
          source: m.source,
        }));
      }
    } catch (err) {
      if (err instanceof SerpApiError) {
        console.error("[scan] serpapi failed:", err.code, err.message);
      } else {
        console.error("[scan] unexpected error during product search:", err);
      }
      // Product matching is best-effort: the scan itself already succeeded.
    }

    const body: ScanResponse = {
      scan: {
        id: scan.id,
        imageUrl: scan.imageUrl,
        sourceUrl: scan.sourceUrl,
        createdAt: scan.createdAt.toISOString(),
        category: scan.category,
        brand: scan.brand,
        description: scan.description,
      },
      matches,
      locked: user.plan === "FREE",
    };

    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    console.error("[scan] database error:", err);
    return NextResponse.json({ error: "Could not save scan." }, { status: 500 });
  }
}
