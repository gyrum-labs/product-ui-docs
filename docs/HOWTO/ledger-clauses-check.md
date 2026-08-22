# HOWTO: run and extend the clause-ledger lint

Audience: any agent or human amending a clause ledger in this repo.

## Run it

```bash
bash scripts/ledger-clauses-check.sh
```

Exit 0 = all ledgers well-formed. Exit 1 = violations printed to stderr, one per line, prefixed with `<product>/<clause-id>`.

## Common failures and fixes

| Message                                            | Fix                                                                                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `duplicate clause ID`                              | IDs are stable forever — renumber the NEW clause instead                                                                          |
| `missing Journey/Routes line`                      | add the `- **Journey:**` / `- **Routes:**` bullets to the clause body                                                             |
| `landed clause evidence must cite a merged PR URL` | a landed claim without a merged PR is unverified: either downgrade the state to `drafted` or cite the PR that actually shipped it |

## State semantics (enforced shape, honest content)

- `captured` — question recorded, no decision claimed.
- `drafted` — keep/kill proposed with rationale + observable acceptance.
- `landed` — acceptance verified against real routes; Evidence line cites the merged PR.

The linter checks shape only. Whether a `landed` claim is TRUE is checked by comparing the cited route against reality — do that in review.

## Extending

Add product-agnostic rules in `ledger-clauses-check.py` (stdlib only, no deps). Per-product policy goes in that product's clauses.md prose, never in the linter.
