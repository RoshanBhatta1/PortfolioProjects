import { NextRequest, NextResponse } from "next/server";
import { getProjectById, saveAiDraft } from "@/lib/db";
import { draftOutstandingEmail, isAiConfigured } from "@/lib/anthropic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "Set ANTHROPIC_API_KEY in .env.local to enable AI drafting." },
      { status: 503 }
    );
  }

  const body = await req.json();
  if (body.draftType !== "outstanding_email") {
    return NextResponse.json({ error: "Invalid draftType" }, { status: 400 });
  }

  try {
    const outstanding = project.checklist.filter(
      (i: any) => i.required && i.status !== "verified" && i.status !== "waived"
    );
    const content = await draftOutstandingEmail(
      {
        clientName: project.client_name,
        projectAddress: project.project_address,
        completionDate: project.completion_date,
        warrantyYears: project.warranty_years,
        contractorName: project.contractor_name,
        contractorContact: project.contractor_contact,
      },
      outstanding.map((i: any) => ({ label: i.label }))
    );

    const draft = saveAiDraft(id, "outstanding_email", content);
    return NextResponse.json({ draft });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI drafting failed" }, { status: 500 });
  }
}
