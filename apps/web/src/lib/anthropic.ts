import Anthropic from "@anthropic-ai/sdk";
import type { Identification } from "@scout/shared";

export interface IdentifyResult extends Identification {
  /** Concise, specific query for product search engines — not persisted, used only to search SerpApi. */
  searchQuery: string;
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

const IDENTIFY_TOOL: Anthropic.Tool = {
  name: "record_identification",
  description:
    "Record the identified clothing or sneaker item shown in the image.",
  input_schema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description:
          "The type of item, e.g. 'sneakers', 'jacket', 'jeans', 't-shirt'.",
      },
      brand: {
        type: "string",
        description:
          "The brand name if identifiable from logos, text, or style. Use 'unknown' if not identifiable.",
      },
      description: {
        type: "string",
        description:
          "A short, shopper-friendly description: colorway, style, and notable details. No insider jargon.",
      },
      searchQuery: {
        type: "string",
        description:
          "A concise, precise query for a shopping search engine (Google Shopping). Include the exact model/silhouette name if identifiable (e.g. 'Nike Air Max 95 grey mint') plus 1-2 distinguishing details like color. If the exact model can't be identified, fall back to brand + category + the most distinctive visual trait. Do not include marketing language.",
      },
    },
    required: ["category", "brand", "description", "searchQuery"],
    additionalProperties: false,
  },
  strict: true,
};

export async function identify(imageUrl: string): Promise<IdentifyResult> {
  const anthropic = getClient();

  let response: Anthropic.Message;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      tools: [IDENTIFY_TOOL],
      tool_choice: { type: "tool", name: "record_identification" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            {
              type: "text",
              text: "Identify this clothing or sneaker item for a shopping app. Use plain language a non-expert shopper would understand — no insider jargon. Be as specific as possible about the exact model/silhouette, since the search query will be used to find this exact product for sale.",
            },
          ],
        },
      ],
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      throw new IdentifyError("rate_limited", "Too many requests, try again shortly.", err);
    }
    if (err instanceof Anthropic.APIConnectionError) {
      throw new IdentifyError("connection_error", "Could not reach the identification service.", err);
    }
    if (err instanceof Anthropic.APIError) {
      throw new IdentifyError("api_error", "The identification service returned an error.", err);
    }
    throw err;
  }

  if (response.stop_reason === "refusal") {
    throw new IdentifyError("refusal", "Could not identify this image.");
  }

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    throw new IdentifyError("no_tool_use", "The identification service did not return a result.");
  }

  return toolUse.input as IdentifyResult;
}

const CONFIRM_MATCH_TOOL: Anthropic.Tool = {
  name: "record_match_confirmation",
  description: "Record whether two product photos show the same item for sale.",
  input_schema: {
    type: "object",
    properties: {
      sameProduct: {
        type: "boolean",
        description:
          "true only if both images show the exact same product — same model, same colorway. false if it's a different color, a different model, or an unrelated item.",
      },
    },
    required: ["sameProduct"],
    additionalProperties: false,
  },
  strict: true,
};

/**
 * Escalation step for candidates the cheap text/price filters in
 * lib/product-match.ts couldn't confidently accept or reject — used
 * sparingly (only "ambiguous" verdicts), not on every multi-merchant check.
 */
export async function confirmSameProduct(
  referenceImageUrl: string,
  candidateImageUrl: string
): Promise<boolean> {
  const anthropic = getClient();

  let response: Anthropic.Message;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 256,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      tools: [CONFIRM_MATCH_TOOL],
      tool_choice: { type: "tool", name: "record_match_confirmation" },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: referenceImageUrl } },
            { type: "image", source: { type: "url", url: candidateImageUrl } },
            {
              type: "text",
              text: "The first image is the reference product. The second image is a candidate match found on a shopping site. Is the second image showing the exact same product (same model, same colorway) as the first?",
            },
          ],
        },
      ],
    });
  } catch {
    // Conservative on any failure: don't trust an unconfirmed match rather
    // than risk a false positive from a broken confirmation call.
    return false;
  }

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) return false;

  return (toolUse.input as { sameProduct: boolean }).sameProduct === true;
}

export class IdentifyError extends Error {
  code: "rate_limited" | "connection_error" | "api_error" | "refusal" | "no_tool_use";
  cause?: unknown;

  constructor(code: IdentifyError["code"], message: string, cause?: unknown) {
    super(message);
    this.name = "IdentifyError";
    this.code = code;
    this.cause = cause;
  }
}
