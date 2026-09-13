/**
 * Renders the standard closeout warranty letter. Matches the real template:
 * letterhead block, TEL/FAX/Email line, tagline, then either a company recipient
 * with an "Attention:" line (commercial — client is a GC) or a direct greeting
 * (residential — client is the homeowner), a RE: line naming the project, the
 * labour-warranty paragraph naming the manufacturers included, and a signature
 * block. Company/letterhead fields come from company_settings (set once, not
 * re-typed per project); everything else comes from the project record.
 */

export interface CompanyInfo {
  company_name?: string | null;
  address_line1?: string | null;
  city_province_postal?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  tagline?: string | null;
  signer_name?: string | null;
  signer_title?: string | null;
}

export interface LetterContext {
  clientName: string;
  clientCompany?: string | null;
  clientAddress?: string | null;
  projectName?: string | null;
  projectAddress?: string | null;
  completionDate?: string | null;
  warrantyYears?: number | null;
  products: { manufacturer: string }[];
  company: CompanyInfo;
}

export function formatManufacturerList(manufacturers: string[]): string {
  const unique = Array.from(new Set(manufacturers.map((m) => m.trim()).filter(Boolean)));
  if (unique.length === 0) return "";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} & ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")} & ${unique[unique.length - 1]}`;
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export function renderWarrantyLetter(ctx: LetterContext): string {
  const company = ctx.company || {};
  const companyName = company.company_name || "[Your company name]";
  const lines: string[] = [];

  // Letterhead
  lines.push(companyName);
  const companyAddress = [company.address_line1, company.city_province_postal].filter(Boolean).join(", ");
  if (companyAddress) lines.push(companyAddress);
  lines.push("");

  const contactLine = [company.phone ? `TEL: ${company.phone}` : null, company.fax ? `FAX: ${company.fax}` : null]
    .filter(Boolean)
    .join("  ");
  if (contactLine) lines.push(contactLine);
  if (company.email) lines.push(`Email: ${company.email}`);
  if (contactLine || company.email) lines.push("");

  if (company.tagline) {
    lines.push(company.tagline);
    lines.push("");
  }

  lines.push(formatDate());
  lines.push("");

  // Recipient
  const isCommercial = Boolean(ctx.clientCompany);
  lines.push(isCommercial ? ctx.clientCompany! : ctx.clientName);
  if (ctx.clientAddress) {
    for (const line of ctx.clientAddress.split("\n")) {
      if (line.trim()) lines.push(line.trim());
    }
  }
  lines.push("");

  if (isCommercial) {
    lines.push(`Attention: ${ctx.clientName}`);
  }

  const projectLabel = ctx.projectName || "[Project name]";
  const reLine = ctx.projectAddress ? `${projectLabel} – ${ctx.projectAddress}` : projectLabel;
  lines.push(`RE: ${reLine}`);
  lines.push(`Dear ${ctx.clientName},`);

  const manufacturerList = formatManufacturerList(ctx.products.map((p) => p.manufacturer));
  const warrantyYears = ctx.warrantyYears || 1;
  const yearWord = warrantyYears === 1 ? "year" : "years";

  const bodyParagraph = manufacturerList
    ? `${companyName} hereby warrantees the labour on the above project for ${warrantyYears} ${yearWord} from ` +
      `the date of substantial completion. Warranty and Maintenance information from\n${manufacturerList} is included.`
    : `${companyName} hereby warrantees the labour on the above project for ${warrantyYears} ${yearWord} from ` +
      `the date of substantial completion.`;

  lines.push(bodyParagraph);
  lines.push("");
  lines.push("We look forward to future projects. If you require further information, please do not hesitate to\ncall.");
  lines.push("");
  lines.push("Sincerely,");
  lines.push("");
  lines.push(company.signer_name || "[Signer name]");
  if (company.signer_title) lines.push(company.signer_title);

  return lines.join("\n");
}
