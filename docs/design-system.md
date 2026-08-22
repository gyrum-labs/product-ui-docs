---
kind: design-system
status: draft
date: 2026-08-22
owner: @jon
project: product-ui-docs
tags: []
---

<!-- FORCING FUNCTION (warp#7357): every H2 below is seeded ONLY with -->
<!-- single-line HTML-comment TODOs. HTML-comment lines do NOT count -->
<!-- toward the min_body_chars floor in design-system.sections.yaml, so -->
<!-- a freshly instantiated design-system doc deliberately FAILS -->
<!-- `gyrum-validate-doc-sections` until each section is genuinely filled. -->
<!-- The three H2 headings below are OPERATOR-PINNED and byte-exact — do -->
<!-- not rename, reorder, or delete them. Replace each comment with real -->
<!-- content (each TODO line is its own self-contained comment). -->

# Design system: product-ui-docs

## Atomic design breakdown

This repo owns no UI primitives of its own — it is a documentation product. Its 'atoms' are the document units: the **journey row** (trigger → outcome → screens), the **clause** (stable ID, lifecycle state, outcome, journey linkage, routes, acceptance, evidence), and the **disposition tally**. Molecules are the per-product ledgers (journeys.md + clauses.md); the organism is a complete product record; the template directory is the page tier. Where a future UI is needed (docs-viewer chrome), it consumes gyrum canon components rather than defining any.


## Hexagonal architecture

The domain core is the clause model: stable ID, single lifecycle state from {captured, drafted, landed}, journey linkage, route-level acceptance, and merged-PR evidence for landed clauses. The driving port is the markdown documents humans and agents edit; the driven port is `scripts/ledger-clauses-check.py`, which reads the ledgers and fails on shape violations. No runtime services sit behind these ports by design — enforcement stays a PR-time lint until clause governance earns automation.


## Developer specifics

Stack: plain markdown + one Python 3 stdlib script; no build step. Directories follow the scaffold: docs/products/<product>/ holds journeys.md + clauses.md per surface. Naming: clause IDs CL-<n> stable forever; states lowercase enum. Testing: `bash scripts/ledger-clauses-check.sh` is the gate (also wired as the golden-path check). Gates this repo declares in repo-type.yaml: standard profile with orientation-drift required; deployment contract is merge-only (deployable:false) because no image ships here.

