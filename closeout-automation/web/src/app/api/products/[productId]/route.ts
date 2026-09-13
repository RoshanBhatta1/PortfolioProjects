import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getProductById, updateProduct, deleteProduct, getUploadsDir } from "@/lib/db";

interface RouteParams {
  params: Promise<{ productId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { productId } = await params;
  const body = await req.json();

  const updated = updateProduct(productId, {
    manufacturer: body.manufacturer,
    productLine: body.productLine,
    colourStyle: body.colourStyle,
    room: body.room,
    warrantyUrl: body.warrantyUrl,
    warrantyTitle: body.warrantyTitle,
    maintenanceUrl: body.maintenanceUrl,
    maintenanceTitle: body.maintenanceTitle,
  });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: updated });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { productId } = await params;
  const ok = deleteProduct(productId);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

/** Manual upload fallback for when the AI can't find a document (or finds the wrong one). */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { productId } = await params;
  const product = getProductById(productId);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (kind !== "warranty" && kind !== "maintenance") {
    return NextResponse.json({ error: "kind must be warranty or maintenance" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    return NextResponse.json({ error: "Only PDF files can be added to the package" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const storedName = `${crypto.randomBytes(4).toString("hex")}-${safeName}`;
  const projectDir = path.join(getUploadsDir(), product.project_id);
  await fs.mkdir(projectDir, { recursive: true });
  await fs.writeFile(path.join(projectDir, storedName), buffer);

  const relativePath = path.join(product.project_id, storedName);
  const updated = updateProduct(productId,
    kind === "warranty"
      ? { warrantyFilePath: relativePath, warrantyTitle: file.name, warrantyUrl: null }
      : { maintenanceFilePath: relativePath, maintenanceTitle: file.name, maintenanceUrl: null }
  );

  return NextResponse.json({ product: updated });
}
