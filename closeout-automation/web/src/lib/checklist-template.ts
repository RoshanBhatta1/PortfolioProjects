export type ChecklistCategory =
  | "Compliance & Permits"
  | "Site Verification & Testing"
  | "Warranty & Product"
  | "Financial & Legal"
  | "Handover & Sign-off";

export type DraftType = "outstanding_email";

export interface ChecklistTemplateItem {
  key: string;
  label: string;
  category: ChecklistCategory;
  required: boolean;
  description: string;
  aiAssist: boolean;
  draftType?: DraftType;
}

/**
 * Default closeout checklist for flooring contractors operating in Canada.
 * Covers provincial construction-lien holdback docs, WSIB/WCB, and the
 * moisture-testing step that drives most flooring warranty callbacks.
 */
export const FLOORING_CLOSEOUT_TEMPLATE: ChecklistTemplateItem[] = [
  {
    key: "permit-closed",
    label: "Building/renovation permit closed (final inspection passed)",
    category: "Compliance & Permits",
    required: false,
    description: "Only required if the scope needed a municipal permit. Attach the final inspection notice.",
    aiAssist: false,
  },
  {
    key: "substantial-completion",
    label: "Certificate of Substantial Performance / Completion signed",
    category: "Compliance & Permits",
    required: true,
    description: "Triggers the statutory holdback release timeline under the provincial Construction Act.",
    aiAssist: false,
  },
  {
    key: "moisture-test",
    label: "Subfloor moisture test report on file (ASTM F2170 RH or calcium chloride)",
    category: "Site Verification & Testing",
    required: true,
    description: "Manufacturer warranties are void without a documented moisture test below the max threshold.",
    aiAssist: false,
  },
  {
    key: "subfloor-prep-signoff",
    label: "Subfloor prep / flatness sign-off",
    category: "Site Verification & Testing",
    required: true,
    description: "Confirms flatness/leveling tolerance was met before install.",
    aiAssist: false,
  },
  {
    key: "product-warranty",
    label: "Manufacturer warranty document attached for every product",
    category: "Warranty & Product",
    required: true,
    description: "Handled in the Products section — the AI finds and attaches the manufacturer's warranty PDF.",
    aiAssist: false,
  },
  {
    key: "care-guide",
    label: "Manufacturer care & maintenance document attached for every product",
    category: "Warranty & Product",
    required: true,
    description: "Handled in the Products section — the AI finds and attaches the manufacturer's care PDF.",
    aiAssist: false,
  },
  {
    key: "warranty-letter",
    label: "Workmanship warranty letter included in package",
    category: "Warranty & Product",
    required: true,
    description: "Generated automatically from your standard template at the front of the package.",
    aiAssist: false,
  },
  {
    key: "deficiency-list",
    label: "Final walkthrough deficiency list completed & resolved",
    category: "Handover & Sign-off",
    required: true,
    description: "List every punch-list item and confirm resolution/sign-off date for each.",
    aiAssist: false,
  },
  {
    key: "wsib-clearance",
    label: "WSIB/WCB clearance certificate on file",
    category: "Financial & Legal",
    required: true,
    description: "Required by most GCs and property managers before final payment.",
    aiAssist: false,
  },
  {
    key: "lien-waiver",
    label: "Statutory declaration / lien waiver (holdback release)",
    category: "Financial & Legal",
    required: true,
    description: "Confirms subtrades and suppliers are paid, releasing the client's holdback obligation.",
    aiAssist: false,
  },
  {
    key: "final-invoice",
    label: "Final invoice issued & payment confirmed",
    category: "Financial & Legal",
    required: true,
    description: "",
    aiAssist: false,
  },
  {
    key: "waste-disposal",
    label: "Leftover material / waste disposal confirmed",
    category: "Handover & Sign-off",
    required: false,
    description: "Note quantity of leftover material left with the client vs. disposed of.",
    aiAssist: false,
  },
  {
    key: "site-photos",
    label: "Before/after site photos on file",
    category: "Handover & Sign-off",
    required: true,
    description: "Protects against future liability disputes and doubles as marketing material.",
    aiAssist: false,
  },
  {
    key: "client-signoff",
    label: "Client acceptance & sign-off form signed",
    category: "Handover & Sign-off",
    required: true,
    description: "",
    aiAssist: false,
  },
  {
    key: "package-delivered",
    label: "Final closeout package delivered to client",
    category: "Handover & Sign-off",
    required: true,
    description: "Generate and send the assembled PDF once every item above is verified.",
    aiAssist: false,
  },
];
