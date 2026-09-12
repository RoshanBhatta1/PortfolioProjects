# Closeout Automation — Web App

Next.js 15 + SQLite + Claude, for running flooring-contractor project
closeouts. See the top-level `../README.md` for the business context.

## Setup

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY to enable AI drafting
npm run dev
```

The app stores data in `data/closeout.db` (SQLite, created automatically
on first run) and uploaded files under `uploads/`. Both are gitignored —
back them up separately in production (or swap in a hosted Postgres +
object storage if you deploy this for real multi-tenant use).

## Data model

- **projects** — client/project details, a `public_token` used for the
  shareable client-facing status page at `/status/[token]`
- **checklist_items** — one row per checklist item per project, seeded
  from `src/lib/checklist-template.ts` when a project is created
- **ai_drafts** — every AI-generated document, keyed by type, most recent
  first
- **activity_log** — a simple audit trail shown on the project page

## Key routes

- `/` — dashboard, all projects with progress bars
- `/projects/new` — create a project (seeds the 16-item checklist)
- `/projects/[id]` — work the checklist: change status, upload evidence
  files, generate AI drafts, extract moisture-test readings, download the
  final PDF package
- `/status/[token]` — read-only client-facing progress page (no login)
- `/api/projects/[id]/package` — generates and streams the closeout PDF

## Notes

- File uploads are stored on local disk under `uploads/<projectId>/`.
  For a real multi-tenant deployment, swap this for S3/R2 and swap SQLite
  for Postgres — the `db.ts` module is the only place that would need to
  change.
- AI calls go through `src/lib/anthropic.ts`. If you want to reuse the
  prompts outside this app (e.g. in the Claude Skill), that file and
  `../claude-skill/closeout-package-builder/templates/` should stay in
  sync.
