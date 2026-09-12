import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getUploadsDir, updateChecklistItem, getChecklistItemById } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { itemId } = await params;
  const body = await req.json();

  const allowedStatuses = ["pending", "uploaded", "verified", "waived"];
  if (body.status && !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = updateChecklistItem(itemId, {
    status: body.status,
    notes: body.notes,
  });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: updated });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: projectId, itemId } = await params;
  const item = getChecklistItemById(itemId);
  if (!item || item.project_id !== projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  const storedName = `${crypto.randomBytes(6).toString("hex")}-${safeName}`;
  const projectDir = path.join(getUploadsDir(), projectId);
  await fs.mkdir(projectDir, { recursive: true });
  const destPath = path.join(projectDir, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(destPath, buffer);

  const relativePath = path.join(projectId, storedName);
  const updated = updateChecklistItem(itemId, {
    filePath: relativePath,
    fileName: file.name,
    status: item.status === "verified" ? "verified" : "uploaded",
  });

  return NextResponse.json({ item: updated });
}
