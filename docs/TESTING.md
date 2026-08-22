---
title: product-ui-docs — testing
status: living document
last-updated: 2026-08-22
---

<!-- gyrum-template-do-not-grade -->
<!--
This file was seeded by gyrum-setup from templates/TESTING.md.tmpl.
Once you replace the prompt text below with real content, DELETE both
of these HTML comments — that re-enables the validator's
template-placeholder check. Keeping the marker after edits would
silence the gate indefinitely; the gate team prefers an explicit
operator action over a stealthy default.
-->

# product-ui-docs — testing

> **This is a living document.** Keep it in sync with reality — if a
> test suite is added, moved, or retired, update the relevant section
> (and the commands summary at the bottom).

This document describes what this repository tests, where those tests
live, and how to run them. It is the per-repo companion to the
fleet-wide [check-stack](./shared/check-stack.md) document: the check
stack explains what each of the four layers catches in general; this
file says which layers apply to product-ui-docs specifically and where
the tests for each layer live in this repo.

## Layer 1 — Unit tests (pre-push)

_TEMPLATE — replace this prompt with the real content._ Describe where
this repo's unit tests live (e.g. `*_test.go` files alongside Go
sources, `src/**/*.test.ts` for TypeScript, `packages/<name>/tests/`
for monorepo packages), what they cover, and any project-specific
conventions (fixtures directory, mocking style, snapshot policy). If
the repo has a coverage floor above the fleet default, say so here and
link to the threshold override in `.gyrum/debt-thresholds.json`.

**Run:** `_TEMPLATE — the canonical local command, e.g._ `go test ./...` _or_ `npm test`.

## Layer 2 — 3-persona AI review

Every PR in this repo runs the three-persona AI review panel
(Priya / Marcus / Lin, plus Dana advisory). The panel is
project-agnostic — there is nothing to configure here. Open a PR via
`gyrum-start-work` and `gyrum-review-pr`; the gate enforces
two-of-three formal approvals plus Dana's advisory pass before merge.
See [`shared/gate-stack.md`](./shared/gate-stack.md#phase-2--ai-review-panel)
for the panel's detailed remit.

## Layer 3 — Contract tests

_TEMPLATE — replace this prompt with the real content, or delete this
section if this repo has no contract tests._ Does this repo publish an
HTTP API with an OpenAPI spec? If yes: point at the spec file (e.g.
`api/openapi.yaml`), the contract-test package (e.g. `contract/`),
the Makefile target that runs them (`make test-contract`), and the
reference implementation this repo's tests follow. If no: say
"this repo does not publish an HTTP API with an OpenAPI spec" and
delete the rest of this section — no need to pad.

**Run:** `_TEMPLATE — e.g._ `make test-contract` _or_ "N/A — this repo has no contract tests".

## Layer 4 — Fleet E2E

_TEMPLATE — replace this prompt with the real content._ Fleet E2E
scenarios live in `distill-gyrum-ai/e2e-integration/` (the fleet-wide
E2E harness). List the scenarios in that suite that touch
product-ui-docs — the persona dashboards for this service, the
version-badge check for its `/api/version` endpoint, any playbook
step that drives this repo's code, any cross-service flow where this
repo is one of the participants. If none of the fleet scenarios touch
this repo, say so and flag it as a gap worth closing.

**Run:** `_TEMPLATE — the local command to run the scenarios that touch this repo, e.g._ `cd ../distill-gyrum-ai/e2e-integration && make test -- --grep product-ui-docs`.

## Commands summary

| Layer | Command | Scope |
|-------|---------|-------|
| 1 | _TEMPLATE_ e.g. `go test ./...` | This repo's unit tests |
| 1 | _TEMPLATE_ e.g. `gyrum-review-pr` | Full structural-check suite (CI-equivalent) |
| 3 | _TEMPLATE_ e.g. `make test-contract` | OpenAPI contract tests |
| 4 | _TEMPLATE_ e.g. `cd ../distill-gyrum-ai/e2e-integration && make test` | Fleet browser E2E |

_TEMPLATE — replace or extend this table with the real commands for
this repo. Keep it short: the table is a cheat-sheet for "I just
cloned the repo, what do I run?", not a full guide._

## Known gaps

_TEMPLATE — replace this prompt with the real content, or delete this
section if there is nothing to flag._ List any layers that do not
apply to this repo, any coverage holes the team is aware of, and any
test types the fleet has that this repo has not adopted yet. Honesty
here is the point — the check stack only works if each repo knows
which bugs it cannot catch. See the "Known gaps" section of
[`shared/check-stack.md`](./shared/check-stack.md#known-gaps) for
fleet-wide categories (production load, UX quality, third-party API
drift) that no single repo's testing can cover.

## Related

- [`shared/check-stack.md`](./shared/check-stack.md) — fleet-wide description of the four layers.
- [`shared/gate-stack.md`](./shared/gate-stack.md) — deep dive on layers 1 and 2.
- [`shared/doc-standards.md`](./shared/doc-standards.md) — contract this file is written against.
