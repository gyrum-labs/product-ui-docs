# Method — journey-first UI production

Validated against the real ops.gyrum.ai reduction (EPIC warp#14685, Aug 2026). This is the process future products run **from birth**, not after accretion.

## The loop

1. **Evidence before opinions.** Ground the surface list in observed usage + operator priorities. Record evidence sources, window, and gaps _in the ledger_ — a gap you write down is honest; a gap you skip is a lie later.
2. **Journeys first.** Define 5–8 operator journeys (trigger → outcome → screens). Every screen must map to ≥1 journey or become a delete candidate. Weight by stated operator priority; instrument usage later.
3. **IA = the menu is the contract.** One label per destination; zero duplicate seats; detail pages reached by drill-down. Section heads point at hub routes so consolidation keeps reachability.
4. **Reduction is reversible.** Unseat from nav; never delete routes in the same move. Removal of a route needs its own reviewed ticket per clause.
5. **Fix numbers on kept surfaces only** — and make freshness visible (deployed sha + age) so staleness can't ship silently again.
6. **Clause everything.** Every decision enters `docs/products/<product>/clauses.md` as a clause. PRs cite clauses; landing requires merged-PR evidence.

## Mechanical guards that made it work

- A **journey↔nav reachability test** (ai-frontend's `journeys-reachability.test.ts`, warp#7943) fails any menu change that strands a journey step. It also caught a keep/disposition inconsistency in the proposal doc itself — run it against proposals, not just code.
- A **release-identity gate** rejects builds whose version chain reports `unknown` — an unverifiable deploy must not ship.
- A **machine-readable inventory endpoint** (e.g. `/api/v1/status/sitemap.xml`) keeps the surface list checkable instead of folklore.

## Anti-patterns observed in the wild

| Anti-pattern                        | What it cost                                            |
| ----------------------------------- | ------------------------------------------------------- |
| Prototype screens accrete silently  | 82 screens, 16-link nav section, duplicate destinations |
| Version indicators report "unknown" | 30-day-stale deploy indistinguishable from fresh        |
| Alarms watch pipelines, not prod    | Releases flowed daily while prod froze for a month      |
| Fix-numbers-everywhere reflex       | Polishing screens destined for deletion                 |

## Applying to a new product

At product birth: copy `docs/template/new-product.md`, write the first journeys BEFORE the third screen exists, and give every screen a clause from day one. Second use case queued: warp.gyrum.ai.
