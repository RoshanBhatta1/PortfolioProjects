import PDFDocument from "pdfkit";

interface ChecklistItemRow {
  label: string;
  category: string;
  status: string;
  notes?: string | null;
}

interface DraftRow {
  draft_type: string;
  content: string;
}

export interface ClosePackageData {
  clientName: string;
  projectAddress?: string | null;
  flooringTypes?: string | null;
  completionDate?: string | null;
  warrantyYears?: number | null;
  contractorName?: string | null;
  contractorContact?: string | null;
  checklist: ChecklistItemRow[];
  drafts: DraftRow[];
}

const DRAFT_TITLES: Record<string, string> = {
  cover_letter: "Cover Letter",
  workmanship_warranty: "Workmanship Warranty",
  care_guide: "Care & Maintenance Guide",
  outstanding_email: "Outstanding Items Follow-up",
};

function latestDraftByType(drafts: DraftRow[]) {
  const map = new Map<string, DraftRow>();
  for (const d of drafts) {
    if (!map.has(d.draft_type)) map.set(d.draft_type, d);
  }
  return map;
}

export function generateClosePackagePdf(data: ClosePackageData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 54, size: "LETTER" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Cover page
    doc.fontSize(22).fillColor("#1c4633").text("Project Closeout Package", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#333333");
    doc.text(`Client: ${data.clientName}`);
    if (data.projectAddress) doc.text(`Project address: ${data.projectAddress}`);
    if (data.flooringTypes) doc.text(`Flooring installed: ${data.flooringTypes}`);
    if (data.completionDate) doc.text(`Completion date: ${data.completionDate}`);
    doc.text(`Workmanship warranty period: ${data.warrantyYears || 1} year(s)`);
    if (data.contractorName) doc.text(`Contractor: ${data.contractorName}`);
    if (data.contractorContact) doc.text(`Contact: ${data.contractorContact}`);
    doc.moveDown(1);
    doc
      .fontSize(9)
      .fillColor("#777777")
      .text(`Generated ${new Date().toLocaleDateString("en-CA")}`, { align: "left" });

    // Checklist summary
    doc.addPage();
    doc.fontSize(16).fillColor("#1c4633").text("Closeout Checklist Summary");
    doc.moveDown(0.5);

    const byCategory = new Map<string, ChecklistItemRow[]>();
    for (const item of data.checklist) {
      if (!byCategory.has(item.category)) byCategory.set(item.category, []);
      byCategory.get(item.category)!.push(item);
    }

    for (const [category, items] of byCategory) {
      doc.fontSize(12).fillColor("#245a41").text(category);
      doc.moveDown(0.2);
      for (const item of items) {
        const statusLabel = item.status.toUpperCase();
        doc
          .fontSize(10)
          .fillColor("#1a1a1a")
          .text(`[${statusLabel}]  ${item.label}`, { indent: 12 });
        if (item.notes) {
          doc.fontSize(9).fillColor("#666666").text(item.notes, { indent: 24 });
        }
      }
      doc.moveDown(0.6);
    }

    // AI-drafted content pages
    const drafts = latestDraftByType(data.drafts);
    for (const [type, draft] of drafts) {
      doc.addPage();
      doc
        .fontSize(16)
        .fillColor("#1c4633")
        .text(DRAFT_TITLES[type] || type);
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#1a1a1a").text(draft.content, { align: "left" });
    }

    doc.end();
  });
}
