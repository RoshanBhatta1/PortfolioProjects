# Workmanship Warranty Letter — Template

Matches the letter the web app generates (`web/src/lib/warranty-letter.ts`) and
a real S&R Flooring Concepts closeout letter. Keep the two in sync if you
change the wording.

Two recipient styles:
- **Commercial** — the client is a GC or property manager. Address the
  company, add an `Attention:` line for the contact person, and greet them
  by name.
- **Residential** — the client is the homeowner. Address them directly, no
  `Attention:` line.

Fill every `{{placeholder}}`. If a detail is unknown, write `[insert detail]`
rather than guessing. `{{manufacturerList}}` is every distinct manufacturer
across the products installed, formatted as "A, B, C & D" (no comma before
the &).

---

{{companyName}}
{{companyAddress}}

TEL: {{companyPhone}}  FAX: {{companyFax}}
Email: {{companyEmail}}

{{companyTagline}}

{{date}}

{{clientCompanyOrName}}
{{clientAddressLines}}

Attention: {{contactName}}  ← commercial only, omit for residential
RE: {{projectName}} – {{projectAddress}}
Dear {{contactName}},

{{companyName}} hereby warrantees the labour on the above project for
{{warrantyYears}} year(s) from the date of substantial completion. Warranty
and Maintenance information from {{manufacturerList}} is included.

We look forward to future projects. If you require further information,
please do not hesitate to call.

Sincerely,

{{signerName}}
{{signerTitle}}
