import { NextRequest, NextResponse } from "next/server";
import { getProjectById, saveAiDraft } from "@/lib/db";
import {
  draftWorkmanshipWarranty,
  draftCareGuide,
  draftCoverLetter,
  draftOutstandingEmail,
  isAiConfigured,
  ProjectContext,
} from "@/lib/anthropic";

const VALID_TYPES = ["workmanship_warranty", "care_guide", "cover_letter", "outstanding_email"] as const;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isAiConfigured()) {
    return NextResponse.json(
      {
        error:
          "AI drafting isn't configured yet. Set ANTHROPIC_API_KEY in your environment to enable this feature.",
      },
      { status: 503 }
    );
  }

  const body = await req.json();
  const draftType = body.draftType;
  if (!VALID_TYPES.includes(draftType)) {
    return NextResponse.json({ error: "Invalid draftType" }, { status: 400 });
  }

  const ctx: ProjectContext = {
    clientName: project.client_name,
    projectAddress: project.project_address,
    flooringTypes: project.flooring_types,
    completionDate: project.completion_date,
    warrantyYears: project.warranty_years,
    contractorName: project.contractor_name,
    contractorContact: project.contractor_contact,
  };

  try {
    let content: string;
    switch (draftType) {
      case "workmanship_warranty":
        content = await draftWorkmanshipWarranty(ctx);
        break;
      case "care_guide":
        content = await draftCareGuide(ctx);
        break;
      case "cover_letter":
        content = await draftCoverLetter(
          ctx,
          project.checklist.map((i: any) => ({ label: i.label, status: i.status }))
        );
        break;
      case "outstanding_email": {
        const outstanding = project.checklist.filter(
          (i: any) => i.required && i.status !== "verified" && i.status !== "waived"
        );
        content = await draftOutstandingEmail(
          ctx,
          outstanding.map((i: any) => ({ label: i.label }))
        );
        break;
      }
      default:
        return NextResponse.json({ error: "Unsupported draftType" }, { status: 400 });
    }

    const draft = saveAiDraft(id, draftType, content);
    return NextResponse.json({ draft });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI drafting failed" }, { status: 500 });
  }
}
