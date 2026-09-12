# Closeout Automation — AI-Assisted Project Closeout for Flooring Contractors

A closeout document automation system built for a flooring-contractor AI
automation agency operating in Canada. It's the "à la carte build" from
the AI offer ladder: a standalone deliverable you can sell on its own
($1,000–$3,000 one-time setup), or run live during AI Concierge retainer
sessions as the recurring AOA (Audit → Optimize → Automate) loop on a
client's closeout process.

Project closeout is a classic high-frequency, high-friction bottleneck for
flooring contractors: warranty letters, care guides, moisture test
records, lien waivers, WSIB clearance, deficiency sign-off — a dozen-plus
documents that determine whether the contractor gets paid on time and
whether a future warranty claim is even valid. This system turns that
into a tracked checklist with AI doing the actual drafting.

## What's in here

```
closeout-automation/
├── web/                          Next.js app — the product itself
│   └── src/
│       ├── lib/
│       │   ├── checklist-template.ts   The 16-item flooring closeout checklist (Canada)
│       │   ├── db.ts                   SQLite persistence (projects, checklist, AI drafts, activity)
│       │   ├── anthropic.ts            Claude prompts: warranty letter, care guide, cover letter,
│       │   │                            outstanding-items email, moisture-report extraction
│       │   └── pdf.ts                  Assembles the final closeout PDF package
│       └── app/                        Dashboard, new-project form, project detail, public client
│                                        status page
└── claude-skill/
    └── closeout-package-builder/       A portable Claude Skill version of the same workflow —
                                          run it inside Claude/Claude Cowork without hosting anything
```

## Two ways to sell/run this

1. **The web app** (`web/`) — a real multi-client tool. Each project gets
   its own checklist, file uploads, AI-drafted documents, a shareable
   client status link, and a one-click closeout PDF. Good for running
   this as your own internal ops tool or reselling as a hosted product.

2. **The Claude Skill** (`claude-skill/closeout-package-builder/`) —
   drop this into a Claude Cowork session with a client's call transcript,
   intake form, or notes, and it drafts the same documents without any
   infrastructure. Good for the live, done-with-you AI Concierge sessions
   described in the offer ladder, or for contractors who don't want a
   separate login to manage.

Both use the same checklist and the same document logic, so keep them in
sync if you edit one.

## The checklist (flooring, Canada)

Grouped into five categories — Compliance & Permits, Site Verification &
Testing, Warranty & Product, Financial & Legal, Handover & Sign-off. The
one most contractors skip and most often causes callbacks: the **subfloor
moisture test** — both the app and the skill flag it explicitly and check
the reading against standard thresholds (ASTM F2170 RH ≤ 75%, or ASTM
F1869 calcium chloride ≤ 3 lbs/1,000 sq ft/24 hrs) unless the
manufacturer states otherwise.

See `claude-skill/closeout-package-builder/templates/checklist-flooring-canada.md`
for the full list.

## AI-drafted documents

Given the project details and checklist status, the system drafts:
- **Workmanship warranty letter** — separate from the manufacturer's
  product warranty, states what's covered/excluded and the claim process
- **Care & maintenance guide** — tailored to the specific flooring
  type(s) installed, not a generic one-size-fits-all guide
- **Cover letter** — summarizes what's in the closeout package
- **Outstanding-items email** — chases the client for whatever's still
  missing, tied back to why it matters for their warranty

The app also extracts structured data (test method, reading, pass/fail)
from a pasted moisture-test report using AI, so nobody has to manually
parse a lab PDF.

## Running the web app

```bash
cd web
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000, create a project, and work the checklist.
Without `ANTHROPIC_API_KEY` set, everything works except the AI drafting
buttons, which return a clear "not configured" message instead of
failing silently.

See `web/README.md` for more detail on the data model and deployment.

## Pricing, positioned against the offer ladder

- **Standalone à la carte build:** $1,000–$3,000 one-time to set up a
  contractor's closeout workflow (checklist customized to their trade,
  templates tuned to their standard warranty terms, first package run
  live with them).
- **Bundled into AI Concierge:** included as one of the recurring AOA
  builds during $1,000–$2,000/month retainer sessions — every closeout
  becomes a two-call cycle (audit what's outstanding on the last few
  jobs, automate the drafting) instead of a one-off sale.
- **Free/paid assessment hook:** "your closeout process is probably
  costing you warranty disputes and slow final payments" is a strong
  quick-win finding to surface in the $999 paid assessment report, with
  this system as the prescribed fix.
