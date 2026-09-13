import PDFDocument from "pdfkit";
import { PDFDocument as PDFLibDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { getUploadsDir } from "./db";
import { renderWarrantyLetter, LetterContext } from "./warranty-letter";

export interface PackageProduct {
  manufacturer: string;
  product_line?: string | null;
  colour_style?: string | null;
  room?: string | null;
  warranty_file_path?: string | null;
  warranty_title?: string | null;
  maintenance_file_path?: string | null;
  maintenance_title?: string | null;
}

export interface PackageData extends Omit<LetterContext, "products"> {
  products: PackageProduct[];
}

export interface PackageResult {
  pdf: Buffer;
  included: string[];
  missing: string[];
}

function renderLetterPdf(letterText: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 64, size: "LETTER" });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica").fontSize(11).fillColor("#111111");
    doc.text(letterText, { align: "left", lineGap: 2 });
    doc.end();
  });
}

async function makeSeparatorPage(title: string, subtitle: string): Promise<Uint8Array> {
  const pdf = await PDFLibDocument.create();
  const page = pdf.addPage([612, 792]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawText(title, {
    x: 64,
    y: 520,
    size: 20,
    font: bold,
    color: rgb(0.11, 0.27, 0.2),
    maxWidth: 484,
    lineHeight: 26,
  });
  page.drawText(subtitle, {
    x: 64,
    y: 480,
    size: 12,
    font: regular,
    color: rgb(0.3, 0.3, 0.3),
    maxWidth: 484,
    lineHeight: 16,
  });

  return pdf.save();
}

function productName(p: PackageProduct): string {
  return [p.manufacturer, p.product_line, p.colour_style].filter(Boolean).join(" ");
}

/**
 * Assembles the deliverable: warranty letter, then each product's manufacturer
 * warranty and care documents, each behind a labelled separator page.
 */
export async function buildClosePackage(data: PackageData): Promise<PackageResult> {
  const merged = await PDFLibDocument.create();
  const included: string[] = [];
  const missing: string[] = [];

  const letterText = renderWarrantyLetter({ ...data, products: data.products });
  const letterPdf = await renderLetterPdf(letterText);
  const letterDoc = await PDFLibDocument.load(letterPdf);
  const letterPages = await merged.copyPages(letterDoc, letterDoc.getPageIndices());
  letterPages.forEach((p) => merged.addPage(p));
  included.push("Warranty letter");

  for (const product of data.products) {
    const name = productName(product);

    const sections: { kind: string; filePath?: string | null; title?: string | null }[] = [
      { kind: "Manufacturer Warranty", filePath: product.warranty_file_path, title: product.warranty_title },
      {
        kind: "Care & Maintenance Instructions",
        filePath: product.maintenance_file_path,
        title: product.maintenance_title,
      },
    ];

    for (const section of sections) {
      if (!section.filePath) {
        missing.push(`${name} — ${section.kind}`);
        continue;
      }

      const absolute = path.join(getUploadsDir(), section.filePath);
      let bytes: Buffer;
      try {
        bytes = await fs.readFile(absolute);
      } catch {
        missing.push(`${name} — ${section.kind} (file missing on disk)`);
        continue;
      }

      const separator = await makeSeparatorPage(
        `${section.kind}`,
        `${name}${product.room ? ` — ${product.room}` : ""}${section.title ? `\n${section.title}` : ""}`
      );
      const sepDoc = await PDFLibDocument.load(separator);
      const sepPages = await merged.copyPages(sepDoc, sepDoc.getPageIndices());
      sepPages.forEach((p) => merged.addPage(p));

      try {
        const docPdf = await PDFLibDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(docPdf, docPdf.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
        included.push(`${name} — ${section.kind}`);
      } catch {
        missing.push(`${name} — ${section.kind} (PDF could not be read)`);
      }
    }
  }

  const bytes = await merged.save();
  return { pdf: Buffer.from(bytes), included, missing };
}
