import { NextRequest, NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ projects: listProjects() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.clientName) {
    return NextResponse.json({ error: "clientName is required" }, { status: 400 });
  }

  const project = createProject({
    clientName: body.clientName,
    clientEmail: body.clientEmail,
    projectAddress: body.projectAddress,
    flooringTypes: body.flooringTypes,
    contractValue: body.contractValue ? Number(body.contractValue) : undefined,
    startDate: body.startDate,
    completionDate: body.completionDate,
    warrantyYears: body.warrantyYears ? Number(body.warrantyYears) : undefined,
    contractorName: body.contractorName,
    contractorContact: body.contractorContact,
  });

  return NextResponse.json({ project }, { status: 201 });
}
