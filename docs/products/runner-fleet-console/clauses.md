# runner-fleet-console — clause ledger

Clause states: `captured` → `drafted` → `landed` (see the repo README). Evidence keys: PR links are
merged-PR URLs on the cited repo.

Every clause below is `captured`: each one states what the screen would have to be true to be worth
building, and each has a mockup that shows the visible form of that claim. None of them is landed,
because no console code exists yet — the ledger's job here is to make the argument before the code
exists, which is the lesson this repo was created to enforce.

| ID | Screen | State | Outcome it claims | Journey |
| --- | --- | --- | --- | --- |
| CL-001 | Fleet (the running view) | `captured` | one screen that says what the fleet is doing now | J1, J4 |
| CL-002 | Movement (the slot and the pool) | `captured` | the single heavy slot and the pool, drawn as what moves through them | J1, J4 |
| CL-003 | Delivery (the stage buckets) | `captured` | every pull request bucketed by where it has got to | J2 |
| CL-004 | Rooms (the floorplan) | `captured` | a floorplan where a pull request walks when its state changes | J2 |
| CL-005 | Marble run | `captured` | the pipeline as a marble run, with the drum as the test stage | J5 |
| CL-006 | The heap (boxes on belts) | `captured` | the pipeline as a factory line ending in a heap of finished work | J5 |
| CL-007 | The city (top-down) | `captured` | the pipeline as a city, with one resident per pull request | J3, J5 |
| CL-008 | Pinball board | `captured` | the pipeline as a board whose bands are the stages' sizes | J3 |
| CL-009 | Production line | `captured` | the pipeline as a machine line whose machines are the stages' sizes | J3 |
| CL-010 | Arcade cabinets | `captured` | the pipeline as a select screen whose cabinets are the stages' sizes | J3 |

---

## CL-001 — Fleet is one screen that says what is running now · `captured`

- **Outcome:** the operator opens one screen and knows which runners are working, which are idle,
  and whether the fleet's own observation feed is complete enough to trust.
- **Journey:** J1, J4. **Routes:** `/runners`.
- **Acceptance:** the screen shows every registered runner with its busy state; a runner whose
  telemetry feed is missing is marked as such rather than counted as idle; the feed's own warnings
  are visible on the screen rather than only in a log.
- **Evidence:** the warp service's own `/runners` page, probed 2026-11-06. It already publishes the
  pool, the hosts, throughput, concurrency, percentiles and the coverage caveats; the clause is
  that this console keeps them and adds nothing.

## CL-002 — The single slot is drawn, not described · `captured`

- **Outcome:** the heavy lane is one slot, and the screen shows what is in it and what is queued
  behind it.
- **Journey:** J1, J4. **Routes:** `/runners/movement`.
- **Acceptance:** the screen names the run holding the slot and how long it has held it, and the
  runs waiting behind it, in service order.
- **Evidence:** measured 2026-11-06: the lane is one repo-wide FIFO slot; a run for an old head of a
  pull request held it from 20:09 to 21:40, and the lane ran no other work in that time.

## CL-003 — Every pull request is in exactly one bucket, and the bucket says why · `captured`

- **Outcome:** the delivery view buckets each pull request by the state it is in, and states the
  rule that put it there — including whether the heavy gate has ever run on its head.
- **Journey:** J2. **Routes:** `/runners/delivery`.
- **Acceptance:** every row carries the rule that classified it; a pull request whose head has never
  been through the heavy gate says so rather than reading as passed.
- **Evidence:** measured 2026-11-06: the check rollup reports `SUCCESS` for pull requests whose
  heavy gate has not run, because the heavy lane creates no check run until a runner takes it. 48 of
  the 49 pull requests in the passed bucket had no heavy run on their current head.

## CL-004 — A state change is a walk, not a teleport · `captured`

- **Outcome:** the floorplan shows a pull request standing in the room of its state, and walking to
  the next room when that state changes.
- **Journey:** J2. **Routes:** `/runners/rooms`.
- **Acceptance:** a transition is visible as movement between two places; the count in every room is
  the live count.
- **Evidence:** the implemented floorplan in the runner-fleet infographic, 2026-11-06.

## CL-005 — The marble run makes the pipeline physical · `captured`

- **Outcome:** the pipeline is a wall-mounted marble run: the bucket holds what is waiting, a gate
  opens, and the marbles run down to the next stage; the drum is the test stage.
- **Journey:** J5. **Routes:** `/runners/marble`.
- **Acceptance:** one marble per pull request; a marble's position follows its stage; the count on
  each stage's sign is the live count; a marble in flight is a transition in progress.
- **Evidence:** mockup `mockups/arcade-mockups.html?only=marble`.

## CL-006 — Boxes ride the belts, and the finished work piles up · `captured`

- **Outcome:** the pipeline is a factory line: each belt is as long as its stage is big, and the
  delivered work accumulates in a heap.
- **Journey:** J5. **Routes:** `/runners/heap`.
- **Acceptance:** belt length is drawn from the live count; a crate that changes stage hops to the
  next belt; finished crates settle into the heap.
- **Evidence:** mockup `mockups/arcade-mockups.html?only=heap`.

## CL-007 — The city gives every pull request a place to live · `captured`

- **Outcome:** the fleet is a city seen from above; each stage is a district sized by its count, and
  each pull request is a resident who walks when their situation changes.
- **Journey:** J3, J5. **Routes:** `/runners/city`.
- **Acceptance:** one resident per pull request; district size is drawn from the live count; the
  street lighting follows the real clock; the industrial plant is the single heavy slot and the car
  park is the runner pool.
- **Evidence:** mockup `mockups/arcade-mockups.html?only=city`.

## CL-008 — The board's band heights are the stages' sizes · `captured`

- **Outcome:** the pipeline is a pachinko board cut into seven bands, and a band's height is the
  number of pull requests in that stage.
- **Journey:** J3. **Routes:** `/runners/pinball`.
- **Acceptance:** band heights are drawn from the live counts; a ball is one pull request; a ball
  that changes stage drops into the band below.
- **Evidence:** mockup `mockups/arcade-mockups.html?only=pinball`.

## CL-009 — The machines are as tall as their stages · `captured`

- **Outcome:** the pipeline is a factory line of machines whose heights are the sizes of their
  stages, with the work riding the belt through them.
- **Journey:** J3. **Routes:** `/runners/line`.
- **Acceptance:** machine height is drawn from the live count; each machine's readout shows whether
  the heavy gate has run for that stage; a crate hops to the next machine when its stage changes.
- **Evidence:** mockup `mockups/arcade-mockups.html?only=line`.

## CL-010 — The cabinets are as tall as their stages · `captured`

- **Outcome:** the pipeline is a select screen; each stage is a cabinet whose height is its size,
  and the selected cabinet previews the pull requests inside it.
- **Journey:** J3. **Routes:** `/runners/cabinets`.
- **Acceptance:** cabinet height is drawn from the live count; the preview panel lists the actual
  pull requests in the selected stage; the high-score panel carries the fleet's live throughput.
- **Evidence:** mockup `mockups/arcade-mockups.html?only=cabinets`.

---

## Two clauses that belong to the fleet, not to this console

These are not screens. They are recorded here because the console cannot be honest without them,
and because they are the gap this mockup work exposed.

## CL-011 — The heavy slot must not be held by a run that cannot help anyone · `captured`

- **Outcome:** a run whose head has been superseded is cancelled automatically, so the single heavy
  slot is never occupied by work whose result cannot be used.
- **Journey:** J1, J4. **Routes:** n/a (fleet behaviour).
- **Acceptance:** the cancellation reaches the runs the merge train dispatches, not only the runs
  started by a pull request event; the protected cases (another pull request's run, an unattributed
  run, the current head) all survive.
- **Evidence:** measured 2026-11-06 and filed as warp#22443.

## CL-012 — An alarm that cannot file its own ticket is not an alarm · `captured`

- **Outcome:** when a fleet cron fails, a ticket is filed and the failure is visible to a person.
- **Journey:** J4. **Routes:** n/a (fleet behaviour).
- **Acceptance:** the failure-reporting path is exercised and the ticket lands; the path does not
  depend on a tool that is absent from the runner.
- **Evidence:** measured 2026-11-06: the drain job's reaper fails on an org-runners permission
  error and its own failure-reporting step cannot find `gyrum-warp` on the runner, so the failure is
  silent. Filed as warp#22431.
