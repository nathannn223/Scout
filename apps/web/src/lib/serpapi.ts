const SERPAPI_ENDPOINT = "https://serpapi.com/search.json";

export interface RawProductMatch {
  merchantName: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl: string;
  inStock: boolean;
}

interface SerpApiShoppingResult {
  title?: string;
  source?: string;
  price?: string;
  extracted_price?: number;
  product_link?: string;
  link?: string;
  thumbnail?: string;
}

interface SerpApiShoppingResponse {
  shopping_results?: SerpApiShoppingResult[];
  error?: string;
}

interface SerpApiLensPrice {
  extracted_value?: number;
  currency?: string;
}

interface SerpApiLensVisualMatch {
  title?: string;
  source?: string;
  link?: string;
  image?: string;
  thumbnail?: string;
  price?: SerpApiLensPrice;
  in_stock?: boolean;
}

interface SerpApiLensResponse {
  visual_matches?: SerpApiLensVisualMatch[];
  error?: string;
}

export class SerpApiError extends Error {
  code: "missing_key" | "http_error" | "invalid_response" | "serpapi_error";

  constructor(code: SerpApiError["code"], message: string) {
    super(message);
    this.name = "SerpApiError";
    this.code = code;
  }
}

function requireApiKey(): string {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new SerpApiError("missing_key", "SERPAPI_KEY is not set");
  }
  return apiKey;
}

async function fetchSerpApi<T extends { error?: string }>(
  params: Record<string, string>
): Promise<T> {
  const url = new URL(SERPAPI_ENDPOINT);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch {
    throw new SerpApiError("http_error", "Could not reach SerpApi.");
  }

  if (!response.ok) {
    throw new SerpApiError("http_error", `SerpApi returned status ${response.status}.`);
  }

  let data: T;
  try {
    data = await response.json();
  } catch {
    throw new SerpApiError("invalid_response", "SerpApi returned an unparseable response.");
  }

  if (data.error) {
    // SerpApi can return HTTP 200 with an `error` field instead of a non-2xx
    // status (e.g. "Google hasn't returned any results for this query.").
    throw new SerpApiError("serpapi_error", data.error);
  }

  return data;
}

function normalizeCurrency(raw?: string): string {
  if (!raw) return "EUR";
  if (raw.includes("€")) return "EUR";
  if (raw.includes("$")) return "USD";
  if (raw.includes("£")) return "GBP";
  return raw.trim() || "EUR";
}

/**
 * Text-based Google Shopping search from a search query string.
 * Used for the manual file-upload flow, where we have no public image URL.
 */
export async function searchProducts(
  query: string,
  limit = 6
): Promise<RawProductMatch[]> {
  const apiKey = requireApiKey();

  const data = await fetchSerpApi<SerpApiShoppingResponse>({
    engine: "google_shopping",
    q: query,
    gl: "fr",
    hl: "fr",
    // Google Shopping returns "Fully empty" for gl=fr without an explicit
    // location — a French locale alone isn't enough to geo-scope results.
    location: "Paris,France",
    api_key: apiKey,
  });

  const results = Array.isArray(data.shopping_results) ? data.shopping_results : [];

  return results
    .filter((r) => r.title && (r.product_link || r.link))
    .slice(0, limit)
    .map((r) => ({
      merchantName: r.source ?? "Marchand inconnu",
      title: r.title as string,
      price: typeof r.extracted_price === "number" ? r.extracted_price : 0,
      currency: "EUR",
      url: (r.product_link ?? r.link) as string,
      imageUrl: r.thumbnail ?? "",
      inStock: true,
    }));
}

/**
 * Reverse-image (visual) search via Google Lens, from a publicly reachable
 * image URL. Used for the browser-extension right-click flow, where the
 * captured image already has a public URL (no hosting needed on our side).
 * Far more precise than text search: matches the exact product photo, not
 * just keywords.
 */
export async function visualSearch(
  imageUrl: string,
  limit = 6
): Promise<RawProductMatch[]> {
  const apiKey = requireApiKey();

  const data = await fetchSerpApi<SerpApiLensResponse>({
    engine: "google_lens",
    url: imageUrl,
    hl: "fr",
    gl: "fr",
    api_key: apiKey,
  });

  const results = Array.isArray(data.visual_matches) ? data.visual_matches : [];

  return results
    .filter((r) => r.title && r.link && r.price?.extracted_value !== undefined)
    .slice(0, limit)
    .map((r) => ({
      merchantName: r.source ?? "Marchand inconnu",
      title: r.title as string,
      price: r.price?.extracted_value as number,
      currency: normalizeCurrency(r.price?.currency),
      url: r.link as string,
      imageUrl: r.image ?? r.thumbnail ?? "",
      inStock: r.in_stock ?? true,
    }));
}
