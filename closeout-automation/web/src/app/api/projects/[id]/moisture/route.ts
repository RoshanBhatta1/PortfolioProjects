import { NextRequest, NextResponse } from "next/server";
import { getProjectById, updateChecklistItem } from "@/lib/db";
import { extractMoistureReport, isAiConfigured } from "@/lib/anthropic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "AI extraction isn't configured yet. Set ANTHROPIC_API_KEY to enable this feature." },
      { status: 503 }
    );
  }

  const body = await req.json();
  if (!body.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "Paste the moisture report text in `text`" }, { status: 400 });
  }

  const extraction = await extractMoistureReport(body.text);

  const moistureItem = project.checklist.find((i: any) => i.key === "moisture-test");
  if (moistureItem) {
    const note = `AI summary: ${extraction.summary} (method: ${extraction.testMethod || "unknown"}, reading: ${
      extraction.reading || "unknown"
    }, result: ${extraction.passFail})`;
    updateChecklistItem(moistureItem.id, { notes: note });
  }

  return NextResponse.json({ extraction });
}
