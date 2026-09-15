import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db";
import { isAiConfigured } from "@/lib/document-finder";
import { searchAndUpdateProduct } from "@/lib/product-search";

export const maxDuration = 300;

/**
 * Runs every product's document search at once instead of one product per
 * click. Each product already runs its warranty and care searches
 * concurrently (see product-search.ts) — this adds the project-level fan-out
 * on top, so N products cost roughly the same wall-clock time as one.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "Set ANTHROPIC_API_KEY in .env.local to enable automatic document lookup." },
      { status: 503 }
    );
  }

  if (project.products.length === 0) {
    return NextResponse.json({ error: "No products on this project yet." }, { status: 400 });
  }

  const settled = await Promise.allSettled(
    project.products.map((p: any) => searchAndUpdateProduct(p.id))
  );

  const results = settled.map((s, i) => ({
    productId: project.products[i].id,
    ok: s.status === "fulfilled",
    error: s.status === "rejected" ? (s.reason?.message ?? "Search failed") : undefined,
  }));

  return NextResponse.json({ results });
}
