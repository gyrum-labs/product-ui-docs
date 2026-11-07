# runner-fleet-console — journeys

The operator journeys a runner-fleet console would serve. Weights are stated priority from the
operator's own questions in the 2026-11-06 session; the evidence is recorded below, including the
gaps.

| #   | Journey | Weight | Trigger → Outcome | Screens |
| --- | ------- | ------ | ----------------- | ------- |
| J1  | Is the fleet working? | 1 | Alarm or quiet worry → know which runners are busy, and which are not | `/runners`, `/runners/movement` |
| J2  | What is stuck, and why? | 1 | A pull request is not moving → see the stage it is in and the stage it is waiting for | `/runners/delivery`, `/runners/rooms` |
| J3  | How big is each stage? | 2 | Backlog looks wrong → see the size of every stage at a glance, not a number | `/runners/cabinets`, `/runners/heap`, `/runners/pinball` |
| J4  | What should I look at first? | 2 | Something changed → see what moved since the last look | `/runners` (the liveness and movement panels) |
| J5  | What does the work look like? | 3 | Reporting or handover → a picture of the work that can be shown to someone else | `/runners/city`, `/runners/marble` |

## Evidence and gaps

- **Weights are stated priority.** The operator asked, in order: why the board looks stuck, why the
  runners page shows no jobs processing, how many shards are in use, and what the delivery phases
  mean. Those questions are J1 through J4. No analytics are queryable for this surface yet, so the
  weights are the operator's stated order and not measured usage.
- **The screens that exist today are the source.** `/runners` on the warp service already carries
  the fleet's observation feed: the pool, the hosts, throughput, percentiles, categories, and the
  coverage caveats. The console's first job is to make that feed legible, not to add a new one.
- **Gap — no route inventory.** The console has no routes yet; this file names the routes it would
  serve so the clause ledger has something to point at. A machine-readable route inventory endpoint
  is a guard to wire at birth, not yet wired.
- **Gap — stage size has no shared definition.** The mockups size a stage by the number of pull
  requests in it. That count comes from a locally derived bucketing, not from the board's own phase
  vocabulary. If the console is built, the sizing rule has to be stated once and reused by every
  screen, or two screens will tell the operator two different sizes for the same stage.

## What the mockups add to this file

Each proposed screen in the clause ledger has a mockup in `mockups/`. The mockups are not screens
yet; they are the visible form of the clause, so a reviewer can see what "the size of every stage
at a glance" would look like before anyone builds it.
