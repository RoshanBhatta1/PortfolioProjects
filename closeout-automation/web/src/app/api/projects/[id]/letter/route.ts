import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db";
import { renderWarrantyLetter } from "@/lib/warranty-letter";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const letter = renderWarrantyLetter({
    clientName: project.client_name,
    projectAddress: project.project_address,
    completionDate: project.completion_date,
    warrantyYears: project.warranty_years,
    contractorName: project.contractor_name,
    contractorContact: project.contractor_contact,
    products: project.products,
  });

  return NextResponse.json({ letter });
}
