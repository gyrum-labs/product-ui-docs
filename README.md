# product-ui-docs

**The living product-UI ledger for Gyrum surfaces.** Where [canon](https://canon.gyrum.ai) owns the design-system _vocabulary_ (atoms, templates, tokens), this repo owns the product-level _argument_: which journeys a product serves, which screens exist, and — clause by clause — why each was kept, consolidated, killed, or deferred.

## Why this exists

ops.gyrum.ai accreted to 82 screens nobody pruned because no home recorded the keep/kill argument. This ledger is that home. Every screen decision is a **clause** with an enforced lifecycle (`captured → drafted → landed`), so the docs can never silently describe a UI that doesn't exist — or ship a UI the ledger doesn't describe.

## Quick start

```bash
git clone git@github.com:gyrum-labs/product-ui-docs.git && cd product-ui-docs
```

- Browsing the current state: `docs/products/<product>/journeys.md` + `docs/products/<product>/clauses.md`
- Proposing a change to any product surface: add/amend a clause first (state `captured`), cite it in your ticket + PR, flip states as evidence lands.
- Starting documentation for a NEW product: copy `docs/template/new-product.md`.

## Layout

| Path                              | What lives there                                             |
| --------------------------------- | ------------------------------------------------------------ |
| `docs/products/ops.jyrum.ai/`     | First use case: journeys + reduction clauses                 |
| `docs/template/new-product.md`    | Copy-at-birth template for future products                   |
| `docs/method.md`                  | The validated journey-first method (how to run this process) |
| `scripts/ledger-clauses-check.sh` | Mechanical lint: every clause well-formed, landed ⇒ evidence |

## Clause lifecycle

1. **`captured`** — the product question is recorded; NO decision claimed.
2. **`drafted`** — keep-or-kill outcome proposed with rationale + observable acceptance conditions; awaiting review.
3. **`landed`** — acceptance verified against the real routes; evidence cited (merged PR URL).

Rules: a clause has exactly one state; `landed` requires merged-PR evidence; unlanded proposals must never read as product behaviour.

## Tests

```bash
bash scripts/ledger-clauses-check.sh
```

## Related

- EPIC warp#14685 — the ops.gyrum.ai journey-first reduction (the proving use case)
- canon.gyrum.ai — the design system this ledger complements
