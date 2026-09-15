import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getProductById, getUploadsDir } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const kind = req.nextUrl.searchParams.get("kind");
  if (kind !== "warranty" && kind !== "maintenance") {
    return NextResponse.json({ error: "kind must be warranty or maintenance" }, { status: 400 });
  }

  const product = getProductById(productId);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const relativePath = kind === "warranty" ? product.warranty_file_path : product.maintenance_file_path;
  if (!relativePath) return NextResponse.json({ error: "No file attached" }, { status: 404 });

  const uploadsRoot = path.resolve(getUploadsDir());
  const filePath = path.resolve(uploadsRoot, relativePath);
  if (!filePath.startsWith(uploadsRoot)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const buffer = await fs.readFile(filePath);
    return new NextResponse(new Blob([new Uint8Array(buffer)]), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${kind}-${product.manufacturer.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }
}
