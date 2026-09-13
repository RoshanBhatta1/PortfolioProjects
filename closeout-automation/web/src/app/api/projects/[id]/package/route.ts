import { NextResponse } from "next/server";
import { getProjectById, addActivity } from "@/lib/db";
import { buildClosePackage } from "@/lib/pdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { pdf, included, missing } = await buildClosePackage({
    clientName: project.client_name,
    projectAddress: project.project_address,
    completionDate: project.completion_date,
    warrantyYears: project.warranty_years,
    contractorName: project.contractor_name,
    contractorContact: project.contractor_contact,
    products: project.products,
  });

  addActivity(
    id,
    `Closeout package generated — ${included.length} document(s) included${
      missing.length ? `, ${missing.length} missing` : ""
    }.`
  );

  return new NextResponse(new Blob([new Uint8Array(pdf)]), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="closeout-${project.client_name.replace(/\s+/g, "-")}.pdf"`,
      "X-Package-Included": String(included.length),
      "X-Package-Missing": String(missing.length),
    },
  });
}
