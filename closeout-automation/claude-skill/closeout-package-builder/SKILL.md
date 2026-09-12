---
name: closeout-package-builder
description: >
  Assembles a complete project closeout package for a flooring contractor —
  checklist status, workmanship warranty letter, care & maintenance guide,
  cover letter, and an outstanding-items follow-up email — from a call
  transcript, JotForm intake, or raw project notes. Use when the user says
  things like "build a closeout package", "get this job closed out", "draft
  the closeout docs for [client]", pastes a flooring job's notes/transcript
  and asks for a warranty letter, care guide, or closeout summary, or wants
  to chase a client for outstanding closeout items.
---

# Closeout Package Builder

This skill turns raw project information (a call transcript, a filled-out
intake form, or the contractor's own notes) into a client-ready closeout
package for a flooring installation, plus a follow-up email for anything
still missing. It is the AI concierge deliverable for the "closeout
automation" à la carte build: something you run live with a client during
an AI Concierge working session, or hand off entirely as a done-for-you
service.

## Step 1 — Gather project details

Pull these fields out of whatever input you're given. If the input doesn't
mention one, ask the contractor directly rather than guessing — these facts
end up in a legal-ish warranty document, so accuracy matters:

- Client name
- Project address
- Flooring type(s) installed (be specific — hardwood species, LVP brand,
  tile size, carpet fiber, etc. — the care guide depends on this)
- Completion date
- Workmanship warranty period (default to 1 year if the contractor doesn't
  have a standard policy)
- Contractor / company name and contact info
- Contract value (optional, only needed if generating an ROI-style summary)

If a `client-intake-form.md` submission is provided, read fields directly
from it instead of re-asking.

## Step 2 — Walk the checklist

Open `templates/checklist-flooring-canada.md`. For each item, decide from
the input whether it's:
- **Done** — clearly confirmed in the transcript/notes
- **Outstanding** — not mentioned, or mentioned as not yet done
- **N/A** — genuinely doesn't apply (e.g. no permit was required for this
  scope)

Report this back to the user as a simple status list before drafting
anything, so they can correct you if you misread something.

Pay special attention to the **subfloor moisture test**. This is the
single biggest cause of flooring warranty claims and callbacks. If it
isn't mentioned, flag it explicitly and ask for the reading rather than
assuming it passed. Typical pass thresholds (use the manufacturer's stated
threshold instead if one is given):
- ASTM F2170 relative humidity: ≤ 75%
- ASTM F1869 calcium chloride: ≤ 3 lbs / 1,000 sq ft / 24 hrs

If the contractor pastes raw moisture-report text, extract: test method,
reading, and pass/fail against the threshold above, and say so plainly if
it's a fail or borderline — don't bury it.

## Step 3 — Draft the AI-assisted documents

For every checklist item marked outstanding that has an AI draft available,
use the matching template and fill in the gathered details. Never invent a
fact you weren't given — use a clearly marked placeholder like
`[insert detail]` instead.

- Workmanship warranty letter → `templates/workmanship-warranty-template.md`
- Care & maintenance guide → `templates/care-maintenance-guide-template.md`
  (pull only the section(s) matching the flooring type(s) actually
  installed — don't dump every flooring type's care instructions on a
  client who only got LVP)
- Cover letter → `templates/cover-letter-template.md`

Keep the tone professional, warm, and plain-spoken — this is a Canadian
small-business contractor talking to a homeowner or property manager, not
a law firm. Use Canadian spelling.

## Step 4 — Assemble the final package

Once the required items are addressed, output the full closeout package as
one clean Markdown document in this order, ready to paste into Claude
Design, Google Docs, or export to PDF:

1. Cover letter
2. Checklist summary (grouped by category, with status)
3. Workmanship warranty
4. Care & maintenance guide

## Step 5 — Draft the outstanding-items email (if anything is still open)

If any required item is still outstanding, draft a short, friendly email to
the client (under 150 words) listing exactly what's needed and why it
matters for their warranty coverage. Output this separately from the
package so the contractor can send it right away.

## Notes on positioning

This skill is one deliverable inside the AI Concierge retainer (the AOA
loop: Audit the current closeout process → Optimize it into this
checklist → Automate the drafting). It can also be sold as a standalone
à la carte build — a one-time setup for a contractor's closeout workflow —
typically priced $1,000–$3,000 depending on how much of their existing
process needs to be reverse-engineered into the checklist.
