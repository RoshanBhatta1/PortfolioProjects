import { NextRequest, NextResponse } from "next/server";
import { createProduct, getProjectById } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getProjectById(id)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json();
  if (!body.manufacturer) {
    return NextResponse.json({ error: "manufacturer is required" }, { status: 400 });
  }

  const product = createProduct({
    projectId: id,
    manufacturer: body.manufacturer,
    productLine: body.productLine,
    colourStyle: body.colourStyle,
    room: body.room,
  });

  return NextResponse.json({ product }, { status: 201 });
}
