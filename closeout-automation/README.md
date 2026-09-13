# Closeout Automation — AI-Assisted Closeout Packages for Flooring Contractors

Automates the part of a flooring closeout that actually eats admin time: hunting
manufacturer websites for the right warranty and care/maintenance PDFs for each
product installed, then assembling them into one client-ready package.

## The workflow this replaces

A flooring closeout package is three things:

1. The manufacturer's **warranty** document for each product installed
2. The manufacturer's **care & maintenance** instructions for each product
3. The contractor's standard **1-year workmanship warranty letter**

Items 1 and 2 are the time sink — an admin searching manufacturer sites,
finding the right PDF for the right product line, downloading it, and attaching
it. Item 3 is the same letter every time with the details swapped.

**What this system does:** you enter the products installed, it searches the web
for the official manufacturer documents, downloads them, generates the warranty
letter, and merges everything into a single PDF. The admin reviews what was
found and sends it.

## What's in here

```
closeout-automation/
├── web/                              Next.js app — the product
│   └── src/lib/
│       ├── document-finder.ts        Claude + web search → candidate document URLs
│       ├── download.ts               Downloads candidates, verifies they're real PDFs
│       ├── warranty-letter.ts        Your standard letter template (edit this)
│       ├── pdf.ts                    Merges letter + manufacturer PDFs into one package
│       └── checklist-template.ts     Secondary closeout checklist (permits, lien waiver, etc.)
├── claude-skill/
│   └── closeout-package-builder/     Same workflow as a Claude Skill (no hosting needed)
└── samples/                          Drop your real closeout examples here to tune the templates
```

## How the document search works

For each product, two searches run in parallel (warranty, care & maintenance).
Each returns up to 3 ranked candidate URLs. The app then **downloads** each
candidate in order and keeps the first one that is genuinely a PDF.

That division of labour is deliberate. An earlier version had the model fetch
and "verify" each PDF itself — it took **10 minutes per product** and burned the
web-tool budget. Downloading the file proves more than the model reading it
does, and it's far faster.

The model is instructed never to guess or pattern-match a URL. A wrong warranty
document reaching a customer is worse than a blank slot, because the admin
reviewing it assumes it was checked.

### When the search can't finish the job

Two things happen regularly and both are handled rather than hidden:

- **The document doesn't exist per-product.** Most manufacturers publish one
  warranty covering a whole category (e.g. all residential vinyl) rather than
  one per product line. The app flags this in the notes instead of pretending
  it's line-specific.
- **The site blocks automated downloads.** Some manufacturer sites (Torlys, in
  testing) return HTTP 403 to any non-browser request. The app records the URL
  it found, marks the product **needs review**, and the admin clicks the link
  and uploads the PDF manually — one click instead of a search.

Anything not downloaded is reported as missing, both in the product list and in
the package-generation response, so nothing silently ships empty.

## The letter and your company profile

The letter format matches a real S&R Flooring Concepts closeout letter:
letterhead block, TEL/FAX/Email, tagline, then either a company recipient with
an "Attention:" line (commercial — client is a GC) or a direct greeting
(residential — client is the homeowner), a RE: line naming the project, a
labour-warranty paragraph naming every manufacturer whose documents are
included, and a signature block.

**Company Settings** (`/settings`) holds your letterhead once — name, address,
phone/fax, email, tagline, signer name and title — so it's never re-typed per
project. Each project only needs the client, the project name/address, the
completion date, and the products installed; the manufacturer list in the
letter body is generated automatically from those products.

To change the wording itself, edit `web/src/lib/warranty-letter.ts` and its
mirror in `claude-skill/closeout-package-builder/templates/`.

## Running it

```bash
cd web
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000. Without an API key everything works except the
document search, which returns a clear "not configured" message.

**Cost note:** the document search uses Claude Opus 5 with web search. Keep an
eye on your Anthropic credit balance — a handful of product searches is cheap,
but the earlier fetch-everything design was not.

## Selling this (offer-ladder positioning)

- **Standalone à la carte build:** $1,000–$3,000 to set up a contractor's
  closeout workflow — checklist tuned to their trade, letter matched to their
  standard wording, first packages run with them.
- **Bundled into AI Concierge:** one of the recurring AOA builds inside a
  $1,000–$2,000/month retainer.
- **Assessment hook:** "how long does your admin spend chasing warranty PDFs per
  job?" is a concrete, quantifiable quick-win finding for the paid assessment,
  with this as the prescribed fix.
