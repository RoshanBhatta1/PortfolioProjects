import Anthropic from "@anthropic-ai/sdk";
import { getValidatedApiKey } from "./env";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

let client: Anthropic | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: getValidatedApiKey() });
  return client;
}

async function complete(system: string, user: string, maxTokens = 1200): Promise<string> {
  if (!isAiConfigured()) {
    throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local to enable AI features.");
  }
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = res.content.find((c) => c.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}

export interface ProjectContext {
  clientName: string;
  projectAddress?: string | null;
  completionDate?: string | null;
  warrantyYears?: number | null;
  contractorName?: string | null;
  contractorContact?: string | null;
}

const CONTRACTOR_VOICE = `You write on behalf of a Canadian flooring contractor closing out an installation
project. Tone: professional, warm, plain-spoken. Use Canadian spelling. Never invent facts that weren't
provided — use a clearly marked placeholder like [insert detail] instead of guessing.`;

export async function draftOutstandingEmail(
  ctx: ProjectContext,
  outstandingItems: { label: string }[]
): Promise<string> {
  const system = `${CONTRACTOR_VOICE} You are drafting a follow-up email asking the client to help
close out a few remaining items before the project file can be closed.`;
  const user = `Draft a short, friendly email to ${ctx.clientName} about the project at
${ctx.projectAddress || "their project"}. We still need the following before we can send the final
closeout package:
${outstandingItems.map((i) => `- ${i.label}`).join("\n")}

Explain briefly why closing these out matters (protects their warranty coverage), and ask them to
reply or call. Keep it under 150 words.`;
  return complete(system, user);
}

export interface MoistureExtraction {
  testMethod: string | null;
  reading: string | null;
  thresholdNote: string | null;
  passFail: "pass" | "fail" | "unclear";
  summary: string;
}

export async function extractMoistureReport(rawText: string): Promise<MoistureExtraction> {
  const system = `You extract structured data from subfloor moisture test reports for flooring installers.
Respond with ONLY a JSON object, no prose, no markdown fences, matching this shape exactly:
{"testMethod": string|null, "reading": string|null, "thresholdNote": string|null, "passFail": "pass"|"fail"|"unclear", "summary": string}`;
  const user = `Extract the test method (e.g. ASTM F2170 relative humidity, ASTM F1869 calcium chloride),
the reading(s) recorded, any stated manufacturer threshold, whether the result passes typical flooring
manufacturer thresholds (RH <= 75% is common, CaCl <= 3 lbs/1000 sq ft/24 hrs is common; if the report
states its own threshold, use that instead), and a one-sentence summary. Text below:

"""
${rawText.slice(0, 6000)}
"""`;
  const raw = await complete(system, user, 500);
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      testMethod: null,
      reading: null,
      thresholdNote: null,
      passFail: "unclear",
      summary: raw || "Could not parse the report automatically. Please review manually.",
    };
  }
}
