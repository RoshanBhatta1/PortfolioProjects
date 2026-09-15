import { getProductById, updateProduct, addActivity } from "./db";
import { searchForDocument, DocumentKind, DocumentSearch } from "./document-finder";
import { downloadFirstWorking } from "./download";

interface KindOutcome {
  kind: DocumentKind;
  search: DocumentSearch;
  url: string | null;
  title: string | null;
  filePath: string | null;
  notes: string[];
}

async function resolveKind(product: any, kind: DocumentKind): Promise<KindOutcome> {
  const notes: string[] = [];

  const search = await searchForDocument(
    { manufacturer: product.manufacturer, productLine: product.product_line, colourStyle: product.colour_style },
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

/**
 * Runs the warranty and care searches for one product (already concurrent with
 * each other) and writes the result to the product record. Shared by the
 * single-product route and the "find all" bulk route so both product-level
 * and project-level fan-out compose the same way.
 */
export async function searchAndUpdateProduct(productId: string) {
  const product = getProductById(productId);
  if (!product) throw new Error("Product not found");

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

    return updated;
  } catch (err: any) {
    updateProduct(productId, { searchStatus: "error", searchNotes: err.message || "Document search failed" });
    throw err;
  }
}
