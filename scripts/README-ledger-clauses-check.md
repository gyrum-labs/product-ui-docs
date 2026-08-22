# ledger-clauses-check

Mechanical lint for this repo's clause ledgers (warp#14690).

## What it enforces

For every `docs/products/*/clauses.md`:

1. Clause headers match `## CL-<n> — <title> · <state>` with state ∈ {captured, drafted, landed}.
2. No duplicate clause IDs within a product.
3. Every clause carries `**Journey:**` and `**Routes:**` lines.
4. Every `landed` clause cites merged-PR evidence (`github.com/**/pull/<n>`) in its Evidence line.

## Usage

```bash
bash scripts/ledger-clauses-check.sh        # exit 0 clean / 1 violations listed on stderr
```

## When it runs

Run it before every commit touching a clauses file; the PR-time structural checks treat it as the repo's golden-path check.

## Extending

Logic lives in the Python sibling (`ledger-clauses-check.py`, stdlib only). Add product-agnostic rules there; never special-case a product inside the linter — per-product policy belongs in that product's clauses.md prose.
