# ops.gyrum.ai — reduction clause ledger

Baseline (2026-08-21 live probe): 145 routes total, **75 operator-facing**
(`/dev/**` excluded); rail exposed ~40 links across 7 sections with 2 duplicate
destinations; deployed build 30 days old with `unknown` version identity.
Result after the reduction: **6 rail sections / 22 seats**, zero duplicate
destinations, every route still URL-addressable.

Clause states: `captured` → `drafted` → `landed` (see repo README).
Evidence keys: PR links are merged-PR URLs on the cited repo.

---

## CL-001 — Home is the health anchor · `landed`

- **Outcome:** keep `/` as the J1 entry surface.
- **Journey:** J1. **Routes:** `/`.
- **Acceptance:** `/` reachable at 1 rail click; renders overview + freshness band.
- **Evidence:** ai-frontend PR #1200 (nav reduction merged 2026-08-22).

## CL-002 — /pm seated exactly once as "Board" · `landed`

- **Outcome:** kill the "Project mgmt" + "Epics" double seat; epics remain a view inside /pm.
- **Journey:** J6. **Routes:** `/pm`.
- **Acceptance:** rail contains exactly one `/pm` link, labelled Board; e2e asserts no duplicate hrefs.
- **Evidence:** ai-frontend PR #1200 (`tests/e2e/nav-reduction.spec.ts`).

## CL-003 — /incidents seated exactly once as "Alerts" · `landed`

- **Outcome:** kill the Operate "Alerts" / Infra "Findings" double seat.
- **Journey:** J1. **Routes:** `/incidents`.
- **Acceptance:** one `/incidents` link in the rail DOM.
- **Evidence:** ai-frontend PR #1200.

## CL-004 — Runs unified under /runs · `landed`

- **Outcome:** consolidate the two run boards (/operate/runs playbook fires + /runs pipeline runs) under a single Runs seat; /operate/runs stays URL-addressable.
- **Journey:** J3. **Routes:** `/runs`, `/operate/runs`.
- **Acceptance:** Operate seats `/runs`; `/operate/runs` unseated but reachable by URL.
- **Evidence:** ai-frontend PR #1200.

## CL-005 — Work section groups planning + triage · `landed`

- **Outcome:** new Work section = Build MVP (j7 entry) + Board (/pm) + Friction.
- **Journey:** J5, J6, J7-entry. **Routes:** `/build`, `/pm`, `/operate/friction`.
- **Acceptance:** journeys-reachability lock green for j5/j6/j7 entries.
- **Evidence:** ai-frontend PR #1200 (`journeys-reachability.test.ts` green in review).

## CL-006 — Truthful release identity, enforced · `landed`

- **Outcome:** footer band / meta / API report real sha + build time; release pipeline REJECTS images whose identity reports `unknown`.
- **Journey:** all (trust precondition). **Routes:** `/api/version`, footer band.
- **Acceptance:** `verify-release-identity.mjs` fails unknown-identity payloads (unit-tested); wired into release.yml post-push.
- **Evidence:** ai-frontend PR #1192.

## CL-007 — Machine-readable inventory endpoint · `landed`

- **Outcome:** `GET /api/v1/status/sitemap.xml` serves the ADR-155 bidirectionally-pinned serving-plane inventory as JSON; SITEMAP_PATH joins the fail-closed boot contract.
- **Journey:** cross-cutting (ledger verification). **Routes:** ops-api status surface.
- **Acceptance:** handler tests green (serve/refresh/503/500/exact-path-beats-dispatcher); route listed in sitemap.json so the ADR-180 drift loop stays green.
- **Evidence:** ai-research PR #1419 (tagged v10.7.2).

## CL-008 — Ship repos unseated · `drafted`

- **Outcome (proposed):** hide `/ship/repos` (GitHub owns repo browsing). Route alive.
- **Journey:** none mapped. **Acceptance to land:** one full nav cycle with no operator recall request; then file route removal.

## CL-009 — Admin tier unseated (Users/Billing/Settings) · `drafted`

- **Outcome (proposed):** delete candidates — no production billing exists; user admin lives at IdP/warp; settings screens accreted. Routes alive pending removal tickets.
- **Acceptance to land:** three removal tickets filed+merged; routes gone from tree.

## CL-010 — Experiment section retired from rail · `drafted`

- **Outcome (proposed):** component-lab scaffolding moves under `/dev/**` previews + canon catalogue; `/experiments/**` routes stay until canon coverage confirmed.
- **Acceptance to land:** canon catalogue confirmed to cover the lab surfaces; removal ticket merges.

## CL-011 — Freshness expectation per data-bearing view · `captured`

- **Question:** what staleness threshold should each view declare, and does the UI expose current/stale/unavailable distinctly? (EPIC AC 7/8.)
- **Open because:** requires per-endpoint data-age semantics; needs its own ticket after deploy cadence stabilises.

## CL-012 — Pentest surfaces need an owner decision · `captured`

- **Question:** keep `/platform/pentest` as an Infra concern or retire? Unseated meanwhile (deferred).

---

### Tally

75 → kept 44 · consolidated 9 · delete-candidates 16 · deferred 2 (full
per-route table: `ai-frontend/docs/journeys/ia-proposal.md` §4).
