# Workmanship Warranty Letter — Template

Mirrors the letter the web app generates (`web/src/lib/warranty-letter.ts`).
Keep the two in sync if you change the wording.

Fill every `{{placeholder}}`. If a detail is unknown, write `[insert detail]`
rather than guessing.

---

{{contractorName}}
{{contractorContact}}

{{date}}

{{clientName}}
{{projectAddress}}

RE: Warranty — Flooring Installation at {{projectAddress}}

Dear {{clientName}},

Thank you for choosing {{contractorName}} for your recent flooring project.

We are pleased to confirm that the flooring products installed at the above
address are warranted for a period of {{warrantyYears}} year(s) from the date
of completion, {{completionDate}}.

Products installed:
{{productList}}

Enclosed with this letter you will find:
  - The manufacturer's warranty documentation for the products installed
  - The manufacturer's care and maintenance instructions

Please review the care and maintenance instructions carefully. Following the
manufacturer's recommended cleaning and maintenance procedures is required to
keep your product warranty valid.

If you have any questions about your flooring, your warranty coverage, or if
you notice an issue you believe is covered, please contact us at
{{contractorContact}} and we will be happy to assist.

Thank you again for your business.

Sincerely,

{{contractorName}}
