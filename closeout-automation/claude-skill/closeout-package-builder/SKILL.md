---
name: closeout-package-builder
description: >
  Assembles a flooring project closeout package: finds the manufacturer's
  official warranty and care/maintenance documents for each product installed,
  and drafts the standard workmanship warranty letter that goes with them. Use
  when the user says things like "build a closeout package", "find the warranty
  and care docs for [product]", "get this job closed out", "draft the closeout
  letter for [client]", or names a flooring product and asks for its
  manufacturer documentation.
---

# Closeout Package Builder

The closeout package a flooring contractor sends a customer is three things:

1. The manufacturer's **warranty** document for each product installed
2. The manufacturer's **care & maintenance** instructions for each product
3. A standard **workmanship warranty letter** from the contractor

The time sink is #1 and #2 — hunting manufacturer websites for the right PDF
for the specific product line. That is what this skill automates. The admin
reviews what was found and sends it.

## Step 1 — Get the product list

You need, for each product installed:
- Manufacturer (e.g. Torlys, Shaw, Mohawk, Mercier, Karndean)
- Product line / collection (e.g. EverWood Premier, Floorté Plus)
- Colour or style (helps disambiguate, often not needed for the docs)
- Room / area (goes on the letter, not needed for the search)

Plus the project details for the letter: client name, project address,
completion date, warranty period (default 1 year), contractor name and contact.

If any of this is missing, ask — don't guess. These facts end up in a document
the customer keeps for warranty claims.

## Step 2 — Find the manufacturer documents

For each product, search the web for the two documents. Rules that matter:

- **Prefer the manufacturer's own site.** A retailer or distributor copy is a
  last resort — say so if you use one.
- **Match the product line.** Many manufacturers publish per-collection
  warranties. If they only publish one warranty covering a whole category
  (e.g. all residential vinyl), that's fine — say which it covers.
- **Verify the link actually resolves to the document** by fetching it. Do not
  report a URL you have not confirmed.
- **Never guess a URL.** A wrong link is worse than no link, because the admin
  reviewing this will assume it was checked. If you can't find it, say so and
  let them supply it.
- **Flag the caveats**: an older version (2019 warranty when 2024 exists), a
  document covering a broader category, or a third-party copy.

Report for each product: the warranty doc (URL + title + confidence), the care
doc (URL + title + confidence), and anything the admin should know.

## Step 3 — Draft the workmanship warranty letter

Use `templates/workmanship-warranty-letter.md`. It states that the flooring
products installed are warranted for the stated period from the completion
date, lists the products, and points the customer to the enclosed manufacturer
documents. Fill every `{{placeholder}}`; use `[insert detail]` for anything you
weren't given.

## Step 4 — Hand it to the admin for review

Output:
1. The drafted letter
2. A table of what was found per product, with links and confidence
3. An explicit list of anything **not** found, so the admin knows what to chase

Say plainly that the links should be spot-checked before sending — the admin is
the last line of defence against a wrong warranty document reaching a customer.

## Note on what NOT to do

Do **not** write your own care and maintenance instructions. The customer needs
the manufacturer's actual document — following it is what keeps their product
warranty valid, and a summary you wrote could contradict it. Same for the
product warranty: find the real one, never paraphrase it.
