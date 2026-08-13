import type { RawProductMatch } from "@/lib/serpapi";

/**
 * Merchants trusted enough that a single sighting (with a passing text score
 * and plausible price) is enough to trigger an alert — no need to wait for
 * a second appearance. Deliberately short and French/EU-fashion-focused;
 * expand as real usage surfaces more legitimate merchants.
 */
export const TRUSTED_DOMAINS = [
  "zalando",
  "asos",
  "nike.com",
  "jdsports",
  "zara.com",
  "decathlon",
  "adidas.com",
  "footlocker",
  "spartoo",
  "sarenza",
  "veepee",
  "galerieslafayette",
  "printemps.com",
  "uniqlo",
];

export function isTrustedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return TRUSTED_DOMAINS.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 1)
  );
}

export interface MatchReference {
  brand: string | null;
  category: string | null;
  description: string | null;
}

/**
 * Fraction of the reference's tokens (brand/category/description from the
 * original ScannedItem) found in the candidate's title/merchant — cheap,
 * deterministic, no external call. 0 means no overlap at all, 1 means every
 * reference token appears in the candidate.
 */
export function scoreTextSimilarity(candidate: RawProductMatch, reference: MatchReference): number {
  const referenceTokens = tokenize(
    [reference.brand, reference.category, reference.description].filter(Boolean).join(" ")
  );
  if (referenceTokens.size === 0) return 0;

  const candidateTokens = tokenize(`${candidate.title} ${candidate.merchantName}`);
  let matched = 0;
  referenceTokens.forEach((token) => {
    if (candidateTokens.has(token)) matched++;
  });
  return matched / referenceTokens.size;
}

/**
 * Rejects a candidate whose price is implausibly low compared to previously
 * trusted observations for this same article — a scraping glitch, a wrong
 * variant, or a counterfeit are far more likely explanations than a genuine
 * 60%+ discount nobody else has. No history yet (first-ever check) always
 * passes — nothing to compare against.
 */
export function isPricePlausible(candidatePrice: number, priorTrustedPrices: number[]): boolean {
  if (priorTrustedPrices.length === 0) return true;
  const sorted = [...priorTrustedPrices].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return candidatePrice >= median * 0.4;
}

export interface PriorObservation {
  merchantName: string;
  trusted: boolean;
  price: number;
}

export type MatchVerdict = "reject" | "ambiguous" | "trusted" | "unverified";

/**
 * Decides, per candidate merchant match, what to do with it — fully
 * automatic, no user confirmation in the loop (deliberately dropped: it only
 * protects users who revisit the dashboard promptly, penalizing exactly the
 * ones a price alert is meant to serve).
 *
 * - "reject": bad text match or implausible price — dropped silently.
 * - "ambiguous": decent-but-unclear text match — escalate to Claude vision
 *   (product-match's only expensive step, used sparingly).
 * - "trusted": persist immediately as a valid alert source — either a known
 *   domain with a strong text match, or an unknown domain that already
 *   appeared once before (corroboration substitutes for domain trust).
 * - "unverified": plausible new candidate from an unknown domain, first
 *   sighting — persisted but not yet allowed to trigger an alert; promoted
 *   to "trusted" automatically if it reappears on a later check.
 */
export function classifyCandidate(
  candidate: RawProductMatch,
  reference: MatchReference,
  priorObservations: PriorObservation[]
): MatchVerdict {
  const textScore = scoreTextSimilarity(candidate, reference);
  if (textScore < 0.2) return "reject";

  const priorTrustedPrices = priorObservations.filter((o) => o.trusted).map((o) => o.price);
  if (!isPricePlausible(candidate.price, priorTrustedPrices)) return "reject";

  if (textScore < 0.45) return "ambiguous";

  if (isTrustedDomain(candidate.url)) return "trusted";

  const alreadySeenUntrusted = priorObservations.some(
    (o) => o.merchantName === candidate.merchantName && !o.trusted
  );
  return alreadySeenUntrusted ? "trusted" : "unverified";
}
