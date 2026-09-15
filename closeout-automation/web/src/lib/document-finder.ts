import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { getValidatedApiKey } from "./env";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";
const MAX_TURNS = 4;

let client: Anthropic | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  if (!client) {
    // Generous per-request timeout: a search turn with several results is slower
    // than a plain completion, but we never want a hung request to wedge the UI.
    client = new Anthropic({
      apiKey: getValidatedApiKey(),
      timeout: 180_000,
      maxRetries: 1,
    });
  }
  return client;
}

export type DocumentKind = "warranty" | "maintenance";

export interface ProductQuery {
  manufacturer: string;
  productLine?: string | null;
  colourStyle?: string | null;
}

export interface Candidate {
  url: string;
  title: string;
  isOfficialDomain: boolean;
  matchesProductLine: boolean;
  note: string;
}

export interface DocumentSearch {
  candidates: Candidate[];
  summary: string;
}

const SEARCH_SCHEMA = {
  type: "object",
  properties: {
    candidates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          url: { type: "string" },
          title: { type: "string" },
          isOfficialDomain: { type: "boolean" },
          matchesProductLine: { type: "boolean" },
          note: { type: "string" },
        },
        required: ["url", "title", "isOfficialDomain", "matchesProductLine", "note"],
        additionalProperties: false,
      },
    },
    summary: { type: "string" },
  },
  required: ["candidates", "summary"],
  additionalProperties: false,
} as const;

export function productLabel(product: ProductQuery): string {
  return [product.manufacturer, product.productLine, product.colourStyle].filter(Boolean).join(" ");
}

const KIND_PROMPTS: Record<DocumentKind, string> = {
  warranty: `the manufacturer's WARRANTY document (limited warranty / warranty guide / warranty
certificate) — the document a customer would need to make a warranty claim`,
  maintenance: `the manufacturer's CARE & MAINTENANCE document (cleaning instructions, care guide,
maintenance procedures) — the document telling the customer how to clean and look after the floor`,
};

/**
 * Search only — deliberately no web_fetch. Having the model open each PDF to
 * "verify" it tripled the runtime and burned the web-tool budget, and it proves
 * less than actually downloading the file does, which the caller then attempts.
 */
export async function searchForDocument(
  product: ProductQuery,
  kind: DocumentKind
): Promise<DocumentSearch> {
  if (!isAiConfigured()) {
    throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local to enable document lookup.");
  }

  const label = productLabel(product);
  const anthropic = getClient();

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Search the web for ${KIND_PROMPTS[kind]} for this flooring product:

**${label}**

Return up to 3 candidate URLs, best first. Rules:
- Strongly prefer a direct link to a PDF hosted on the manufacturer's own domain.
- Many manufacturers publish one document covering a whole product category rather
  than one per line. That is fine and usually correct — note which category it covers.
- Do not invent or pattern-guess a URL. Only return URLs that actually appeared in
  your search results. Returning fewer candidates is better than returning a guess.
- If you find nothing suitable, return an empty candidates list and explain why.

For each candidate note whether it is on the manufacturer's official domain and
whether it specifically covers this product line (vs a broader category).

Then give a one-paragraph summary for the admin who will review this, flagging
anything important — an outdated version, a commercial-vs-residential mismatch, or
a document that covers a whole category.`,
    },
  ];

  let finalText = "";

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 4 }],
      messages,
    });

    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }

    finalText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    break;
  }

  if (!finalText) {
    return { candidates: [], summary: "Search did not return a result." };
  }

  const parsed = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: "low", format: jsonSchemaOutputFormat(SEARCH_SCHEMA) },
    messages: [
      {
        role: "user",
        content: `Convert this document search for "${label}" into structured data. Only include URLs
the research actually states — never construct one. Keep the caveats in each note.

"""
${finalText}
"""`,
      },
    ],
  });

  return (parsed.parsed_output as DocumentSearch) ?? { candidates: [], summary: finalText.slice(0, 800) };
}
