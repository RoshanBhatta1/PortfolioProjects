import { NextResponse } from "next/server";
import { getProductById, updateProduct, addActivity } from "@/lib/db";
import { searchForDocument, isAiConfigured, DocumentKind, DocumentSearch } from "@/lib/document-finder";
import { downloadFirstWorking } from "@/lib/download";

export const maxDuration = 300;

interface KindOutcome {
  kind: DocumentKind;
  search: DocumentSearch;
  url: string | null;
  title: string | null;
  filePath: string | null;
  notes: string[];
}

async function resolveKind(
  product: any,
  kind: DocumentKind
): Promise<KindOutcome> {
  const notes: string[] = [];

  const search = await searchForDocument(
    {
      manufacturer: product.manufacturer,
      productLine: product.product_line,
      colourStyle: product.colour_style,
    },
    kind
  );

  if (search.summary) notes.push(search.summary);

  if (search.candidates.length === 0) {
    notes.push("No candidate documents found — upload this one manually.");
    return { kind, search, url: null, title: null, filePath: null, notes };
  }

  const { result, attempts } = await downloadFirstWorking(
    search.candidates.map((c) => c.url),
    product.project_id,
    kind
  );

  if (attempts.length) {
    notes.push(`Links that did not work:\n${attempts.map((a) => `  - ${a}`).join("\n")}`);
  }

  if (!result.ok) {
    // Still record the best candidate so the admin has a link to check by hand.
    const best = search.candidates[0];
    notes.push("Could not download automatically — open the link manually and upload the PDF.");
    return { kind, search, url: best.url, title: best.title, filePath: null, notes };
  }

  const used = search.candidates.find((c) => c.url === result.url) ?? search.candidates[0];
  if (!used.isOfficialDomain) notes.push("NOTE: this is not on the manufacturer's own domain — check it.");
  if (!used.matchesProductLine) notes.push("NOTE: covers a broader category, not this exact product line.");
  if (used.note) notes.push(used.note);

  return { kind, search, url: result.url!, title: used.title, filePath: result.filePath!, notes };
}

export async function POST(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = getProductById(productId);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "Set ANTHROPIC_API_KEY in .env.local to enable automatic document lookup." },
      { status: 503 }
    );
  }

  updateProduct(productId, { searchStatus: "searching" });

  try {
    const [warranty, maintenance] = await Promise.all([
      resolveKind(product, "warranty"),
      resolveKind(product, "maintenance"),
    ]);

    const notes = [
      `WARRANTY: ${warranty.filePath ? "attached" : "not attached"}`,
      ...warranty.notes.map((n) => `  ${n}`),
      "",
      `CARE & MAINTENANCE: ${maintenance.filePath ? "attached" : "not attached"}`,
      ...maintenance.notes.map((n) => `  ${n}`),
    ].join("\n");

    const updated = updateProduct(productId, {
      warrantyUrl: warranty.url,
      warrantyTitle: warranty.title,
      ...(warranty.filePath ? { warrantyFilePath: warranty.filePath } : {}),
      maintenanceUrl: maintenance.url,
      maintenanceTitle: maintenance.title,
      ...(maintenance.filePath ? { maintenanceFilePath: maintenance.filePath } : {}),
      searchStatus: warranty.filePath && maintenance.filePath ? "found" : "needs_review",
      searchNotes: notes,
    });

    addActivity(
      product.project_id,
      `Document search: ${product.manufacturer} ${product.product_line || ""} — warranty ${
        warranty.filePath ? "found" : "missing"
      }, care ${maintenance.filePath ? "found" : "missing"}`.trim()
    );

    return NextResponse.json({ product: updated });
  } catch (err: any) {
    updateProduct(productId, {
      searchStatus: "error",
      searchNotes: err.message || "Document search failed",
    });
    return NextResponse.json({ error: err.message || "Document search failed" }, { status: 500 });
  }
}
