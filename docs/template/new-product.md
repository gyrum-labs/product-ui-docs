# New-product UI documentation template

Copy this directory at product birth. Fill every section BEFORE the third
screen exists — the whole lesson of the ops.gyrum.ai reduction is that
accretion is cheaper to prevent than to prune.

## 1. Journeys (fill first)

| #   | Journey | Weight | Trigger → Outcome | Screens |
| --- | ------- | ------ | ----------------- | ------- |
| J1  |         |        |                   |         |
| J2  |         |        |                   |         |

Rules: 5–8 journeys; each names trigger, outcome, screens; weights come from
stated operator priority with evidence sources recorded (and gaps admitted).

## 2. Screen inventory & dispositions

Every route gets exactly one row: keep / consolidate / delete-candidate /
defer, with rationale. A screen mapped to no journey starts as a delete
candidate by default.

## 3. Clause ledger

Copy the clause shape from `docs/products/ops.gyrum.ai/clauses.md`:
stable ID · state (`captured`/`drafted`/`landed`) · outcome · journey · routes
· observable acceptance · evidence (merged PR URL required for `landed`).

## 4. Mechanical guards to wire at birth

- Journey↔nav reachability test in the product's frontend repo.
- Release-identity gate (no deploys with `unknown` provenance).
- Machine-readable route inventory endpoint.

## 5. Sign-off

Recorded operator approval of the initial journey set (name + date).
