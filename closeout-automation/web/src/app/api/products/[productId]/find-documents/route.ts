import { NextResponse } from "next/server";
import { getProductById } from "@/lib/db";
import { isAiConfigured } from "@/lib/document-finder";
import { searchAndUpdateProduct } from "@/lib/product-search";

export const maxDuration = 300;

export async function POST(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  if (!getProductById(productId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "Set ANTHROPIC_API_KEY in .env.local to enable automatic document lookup." },
      { status: 503 }
    );
  }

  try {
    const product = await searchAndUpdateProduct(productId);
    return NextResponse.json({ product });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Document search failed" }, { status: 500 });
  }
}
