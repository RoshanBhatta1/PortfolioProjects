import { NextResponse } from "next/server";
import { getProjectById, addActivity } from "@/lib/db";
import { generateClosePackagePdf } from "@/lib/pdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pdf = await generateClosePackagePdf({
    clientName: project.client_name,
    projectAddress: project.project_address,
    flooringTypes: project.flooring_types,
    completionDate: project.completion_date,
    warrantyYears: project.warranty_years,
    contractorName: project.contractor_name,
    contractorContact: project.contractor_contact,
    checklist: project.checklist,
    drafts: project.drafts,
  });

  addActivity(id, "Closeout package PDF generated.");

  return new NextResponse(new Blob([new Uint8Array(pdf)]), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="closeout-${project.client_name.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
