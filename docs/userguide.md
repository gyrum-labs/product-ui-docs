---
title: product-ui-docs — user guide
status: living document
last-updated: 2026-08-22
---

<!-- gyrum-template-do-not-grade -->
<!--
This file was seeded by gyrum-setup from templates/userguide.md.tmpl.
Once you replace the prompt text below with real content, DELETE both
of these HTML comments — that re-enables the validator's
template-placeholder and ui-screenshot-missing checks. Keeping the
marker after edits would silence those gates indefinitely; the gate
team prefers an explicit operator action over a stealthy default.
-->

# product-ui-docs — user guide

> **This is a living document.** Screenshots, keyboard flows, and
> behaviour descriptions should match the current build — refresh
> the images and the surrounding prose whenever the user-facing
> surface of product-ui-docs changes.

_TEMPLATE — replace this prompt with the real content._ Write this
guide for a newcomer who has never run product-ui-docs before.
Screenshots live under `docs/images/`; see `docs/images/README.md`
for the naming convention and capture guidance. Reference images
inline with relative paths, e.g. `![Alt text](images/name.png)`.

## Concepts

_TEMPLATE — replace this prompt with the real content._ Name the
3-5 nouns a reader needs to hold in their head before any procedure
makes sense. One paragraph per noun: what it is, what it is **not**
(common confusions), and one example. If a reader has to flip back
to this section repeatedly while following Common workflows, expand
the entry — that's the symptom of a missing concept, not a slow
reader.

## Getting started

_TEMPLATE — replace this prompt with the real content._ Cover the
one-time setup: prerequisites, installation, first launch. A reader
who works through this section should end up with a running
product-ui-docs and know how to confirm it is healthy. Include a
screenshot of the initial state — for example `images/first-run.png`
— so the reader can compare what they see against the expected
shape.

## First use

_TEMPLATE — replace this prompt with the real content._ Walk through
the simplest end-to-end workflow the product supports. One scenario,
start to finish, with intermediate screenshots so the reader can
verify they are on the right path. This is the section that proves
to a newcomer that product-ui-docs works and that they know how to
drive it.

## Common workflows

_TEMPLATE — replace this prompt with the real content._ List the
recurring flows a regular user will perform. Keep each flow short:
two or three screenshots and the click path between them. Cross-link
to deeper reference documents rather than expanding every flow here.

## Troubleshooting

_TEMPLATE — replace this prompt with the real content._ Document
the failure modes a user is most likely to hit, one sub-heading per
symptom. For each, say what the user sees, what the root cause
usually is, and the minimum action that fixes it. Grow this section
as real support questions come in — it is the cheapest form of
support documentation the project will ever produce.
