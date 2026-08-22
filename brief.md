---
kind: brief
status: draft
date: 2026-08-22
owner: @jon
project: product-ui-docs
tags: []
---

<!-- FORCING FUNCTION (warp#7357): every H2 below is seeded ONLY with -->
<!-- single-line HTML-comment TODOs. HTML-comment lines do NOT count -->
<!-- toward the min_body_chars floor in brief.sections.yaml, so a freshly -->
<!-- instantiated brief deliberately FAILS `gyrum-validate-doc-sections` -->
<!-- until each section is genuinely filled with prose. Replace each -->
<!-- comment with real content; do not delete the H2 headings (they are -->
<!-- pinned in the manifest). -->

# Brief: product-ui-docs

## Problem

Gyrum product surfaces accrete screens with no recorded argument for what belongs. ops.gyrum.ai grew to 82 operator-facing screens across a seven-section rail with duplicate destinations, and nobody could prune it because no home recorded which screens served which journeys or why each was kept. Every future product would repeat the same failure without a durable home for the product-level keep/kill argument.


## Users

Primary: fleet agents and reviewers, who must check any surface change against the agreed journey set and clause record before merging (PRs cite clauses). Secondary: jon the operator, who needs the product argument browsable without tribal context; and future product owners, who copy the template at birth so their surfaces are documented from day one.


## Success metrics

- Every in-scope ops.gyrum.ai route carries exactly one current disposition clause with journey linkage (75/75 at seed).
- ledger-clauses-check passes: well-formed IDs, states, journey/routes lines, landed-evidence-is-a-merged-PR.
- A newcomer can find journeys, clauses, method, and template unaided (docs-guide gate green).
- First external adoption: warp.gyrum.ai onboarded as use case two.


## Scope

In: docs/products/* per-surface journeys + clause ledgers; docs/method.md (the validated process); docs/template/new-product.md; scripts/ledger-clauses-check.py lint; docs-viewer publication. Out of scope lives in the Out-of-scope section; canon vocabulary stays in canon.


## Out of scope

Design-system components and tokens (canon owns them). Automating clause governance or lifecycle enforcement beyond the lint script. Onboarding existing products other than ops.gyrum.ai within this effort. Changing production routes to make documentation look complete.
