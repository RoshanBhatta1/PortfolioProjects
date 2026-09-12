import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

let client: Anthropic | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

async function complete(system: string, user: string, maxTokens = 1200): Promise<string> {
  if (!isAiConfigured()) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your environment (.env.local) to enable AI drafting."
    );
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
  flooringTypes?: string | null;
  completionDate?: string | null;
  warrantyYears?: number | null;
  contractorName?: string | null;
  contractorContact?: string | null;
}

const CONTRACTOR_VOICE = `You write on behalf of a Canadian flooring contractor closing out a residential/commercial
installation project. Tone: professional, warm, plain-spoken (avoid legalese and marketing fluff). Use Canadian
spelling. Never invent facts that weren't provided — if a detail is missing, use a clearly marked placeholder like
[insert detail] instead of guessing.`;

export async function draftWorkmanshipWarranty(ctx: ProjectContext): Promise<string> {
  const system = `${CONTRACTOR_VOICE} You are drafting a workmanship warranty letter (separate from the
manufacturer's product warranty) for a flooring installation.`;
  const user = `Draft a workmanship warranty letter with these details:
- Client: ${ctx.clientName}
- Project address: ${ctx.projectAddress || "[insert project address]"}
- Flooring installed: ${ctx.flooringTypes || "[insert flooring type(s)]"}
- Completion date: ${ctx.completionDate || "[insert completion date]"}
- Warranty period: ${ctx.warrantyYears || 1} year(s) from completion date
- Contractor: ${ctx.contractorName || "[insert contractor/company name]"}
- Contractor contact: ${ctx.contractorContact || "[insert contact info]"}

Cover: what the workmanship warranty includes (installation defects: gaps, seams, transitions, squeaks caused by
installation error), what it explicitly excludes (normal wear, moisture damage from client-side plumbing/humidity
issues after handover, manufacturer product defects which are covered separately), how to file a claim, and the
warranty period. Keep it under 350 words. Format as a letter with a subject line, not a legal contract.`;
  return complete(system, user);
}

export async function draftCareGuide(ctx: ProjectContext): Promise<string> {
  const system = `${CONTRACTOR_VOICE} You are drafting a care & maintenance guide handed to the client at
project closeout.`;
  const user = `Draft a care & maintenance guide for this flooring installation:
- Flooring type(s): ${ctx.flooringTypes || "[insert flooring type(s) - ask the contractor if unspecified]"}
- Client: ${ctx.clientName}

Tailor the advice specifically to the flooring type(s) listed (e.g. hardwood needs humidity control and no wet
mopping; LVP needs felt pads and no direct sun exposure long-term; tile/grout needs periodic sealing; carpet needs
regular vacuuming and spot-cleaning method). Structure as:
1. Daily/weekly care
2. What to avoid
3. Cleaning products that are safe vs. ones that will void the warranty
4. When to call us vs. when it's normal wear
Keep it under 400 words, use short bullet points, no fluff.`;
  return complete(system, user);
}

export async function draftCoverLetter(
  ctx: ProjectContext,
  checklistSummary: { label: string; status: string }[]
): Promise<string> {
  const system = `${CONTRACTOR_VOICE} You are drafting the cover letter that accompanies the final closeout
package PDF sent to the client.`;
  const completedCount = checklistSummary.filter(
    (i) => i.status === "verified" || i.status === "waived"
  ).length;
  const user = `Draft a short cover letter for the closeout package being delivered to ${ctx.clientName} for the
project at ${ctx.projectAddress || "[insert project address]"}.

The package includes ${completedCount} of ${checklistSummary.length} closeout items, listed below:
${checklistSummary.map((i) => `- ${i.label}: ${i.status}`).join("\n")}

Thank them, briefly summarize what's enclosed (warranty documents, care guide, inspection/test records, final
sign-off), remind them of the workmanship warranty period (${ctx.warrantyYears || 1} year(s)), and invite them to
reach out with questions. Keep it under 200 words, warm but professional.`;
  return complete(system, user);
}

export async function draftOutstandingEmail(
  ctx: ProjectContext,
  outstandingItems: { label: string; description?: string }[]
): Promise<string> {
  const system = `${CONTRACTOR_VOICE} You are drafting a follow-up email to the client asking them to help
close out a few remaining items before the project file can be closed.`;
  const user = `Draft a short, friendly email to ${ctx.clientName} about the project at
${ctx.projectAddress || "their project"}. We still need the following before we can send the final closeout
package:
${outstandingItems.map((i) => `- ${i.label}${i.description ? `: ${i.description}` : ""}`).join("\n")}

Explain briefly why closing these out matters (protects their warranty coverage), and ask them to reply or call
to sort it out. Keep it under 150 words.`;
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
  const user = `Extract the test method (e.g. ASTM F2170 relative humidity, ASTM F1869 calcium chloride), the
reading(s) recorded, any stated manufacturer threshold, whether the result passes typical flooring manufacturer
thresholds (RH <= 75% is a common threshold, CaCl <= 3 lbs/1000 sq ft/24 hrs is common; if the report states its own
threshold, use that instead), and a one-sentence summary. Text below:

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
