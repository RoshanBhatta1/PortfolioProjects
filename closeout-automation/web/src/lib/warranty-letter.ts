/**
 * The standard workmanship warranty letter sent with every closeout package.
 * Edit the text here to match your company's wording — every {{placeholder}} is
 * filled from the project record at generation time.
 */
export const WARRANTY_LETTER_TEMPLATE = `{{contractorName}}
{{contractorContact}}

{{date}}

{{clientName}}
{{projectAddress}}

RE: Warranty — Flooring Installation at {{projectAddress}}

Dear {{clientName}},

Thank you for choosing {{contractorName}} for your recent flooring project.

We are pleased to confirm that the flooring products installed at the above address
are warranted for a period of {{warrantyYears}} year(s) from the date of completion,
{{completionDate}}.

Products installed:
{{productList}}

Enclosed with this letter you will find:
  - The manufacturer's warranty documentation for the products installed
  - The manufacturer's care and maintenance instructions

Please review the care and maintenance instructions carefully. Following the
manufacturer's recommended cleaning and maintenance procedures is required to keep
your product warranty valid.

If you have any questions about your flooring, your warranty coverage, or if you
notice an issue you believe is covered, please contact us at {{contractorContact}}
and we will be happy to assist.

Thank you again for your business.

Sincerely,

{{contractorName}}
`;

export interface LetterContext {
  clientName: string;
  projectAddress?: string | null;
  completionDate?: string | null;
  warrantyYears?: number | null;
  contractorName?: string | null;
  contractorContact?: string | null;
  products: { manufacturer: string; product_line?: string | null; colour_style?: string | null; room?: string | null }[];
}

function formatProductList(products: LetterContext["products"]): string {
  if (products.length === 0) return "  - [no products recorded on this project]";
  return products
    .map((p) => {
      const name = [p.manufacturer, p.product_line, p.colour_style].filter(Boolean).join(" ");
      return p.room ? `  - ${name} (${p.room})` : `  - ${name}`;
    })
    .join("\n");
}

export function renderWarrantyLetter(ctx: LetterContext): string {
  const values: Record<string, string> = {
    contractorName: ctx.contractorName || "[Your company name]",
    contractorContact: ctx.contractorContact || "[Your contact info]",
    date: new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }),
    clientName: ctx.clientName,
    projectAddress: ctx.projectAddress || "[Project address]",
    completionDate: ctx.completionDate || "[Completion date]",
    warrantyYears: String(ctx.warrantyYears || 1),
    productList: formatProductList(ctx.products),
  };

  return WARRANTY_LETTER_TEMPLATE.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    key in values ? values[key] : match
  );
}
