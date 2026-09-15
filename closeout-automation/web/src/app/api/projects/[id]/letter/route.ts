import { NextResponse } from "next/server";
import { getProjectById, getCompanySettings } from "@/lib/db";
import { renderWarrantyLetter } from "@/lib/warranty-letter";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const letter = renderWarrantyLetter({
    clientName: project.client_name,
    clientCompany: project.client_company,
    clientAddress: project.client_address,
    projectName: project.project_name,
    projectAddress: project.project_address,
    completionDate: project.completion_date,
    warrantyYears: project.warranty_years,
    company: getCompanySettings(),
    products: project.products,
  });

  return NextResponse.json({ letter });
}
