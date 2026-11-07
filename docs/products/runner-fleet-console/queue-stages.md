# The queue, from waiting to deployed

How a pull request actually travels from "somebody opened it" to "it is delivered and settled" in
`gyrum-labs/devtools`, what each stage means, what moves a pull request out of it, and the ways it
gets stuck. Everything here was measured against the running fleet on 2026-11-06.

The stages the board shows are the board's own phase vocabulary. They are **derived**, because the
phase lives in the warp service and the board reads what it can see. Two of the derivations are
wrong in a way that matters, and both are called out below.

---

## Before the queue

A pull request exists: open, on a branch, usually a draft at first.

Nothing has happened to it yet. It carries no train labels, so it is not in the service order and
no lane is waiting on it. The light CI lane (`ci-light`) runs on every push — it is four jobs
(triage, shellcheck, smoke, changed-tests) and it is independent of the heavy lane, so it never
queues behind anything.

## 1. waiting

*Open, not green, nobody holding changes.*

The pull request is in the fleet but not yet in the train's service order. It usually arrives here
because it was opened, or because it was re-pushed and the previous checks went stale.

**What it needs to leave:**

- the light lane green (usually seconds), and
- a review quorum — the persona panel's two formal approvals on the **exact head**.

**What the fleet does here:** the train's feeder looks for a claimable pull request — one that is
reviewable, green, and not conflicted — and enqueues it. That is the `train:queued` label, and it
puts the pull request in the service order at the back.

**How it gets stuck here:** a pull request can sit in `waiting` for weeks without anything being
wrong with it. The pile's own report (106 pull requests, read on 2026-11-06) put 36 of them in a
"review evidence" family — the train refused their review evidence, so they need a re-review, not
a re-run. 27 of the 35 re-land candidates wanted exactly that.

## 2. waiting fixed

*Changes requested, or a conflict with the train.*

The review panel asked for changes, or the pull request conflicts with what the train is serving.

**What happens here:** the pull request leaves the service order (it is dequeued, with an audited
reason) and the author works on it. When the fix is pushed, the **head moves**, and that has two
consequences that are easy to miss:

- the approvals that were given for the old head are now stale — the evidence is bound to the head
  it was signed for, so the pull request needs a re-review;
- the heavy gate has never run on the new head, so it needs a heavy run as well.

**How it gets stuck here:** if the head moves *again* while the review is in flight, the reviewer
may be reading a commit that is no longer the head. That is not a hypothetical — on 2026-11-06 the
head of the queue had a changes-request written against `ae210cd1` while the head was already
`e71c0064`, and the pull request sat approved-but-refused until the review was redone.

## 3. in testing

*The heavy gate, on the exact head.*

This is the only stage where the heavy lane is involved, and it is where the queue's real
bottleneck lives.

**How the heavy gate starts.** The heavy workflow (`ci.yml`) fires on the pull request's
`ready_for_review` event. The train therefore flips its candidate to a draft and back to ready —
that transition is what emits the event. Until 2026-11-07 that transition was being refused by the
fleet's own `gh` policy wrapper, because the train's sanctioned marker was inherited from whatever
launched the worker rather than carried at the call. The result was `ready-transition-failed`: the
heavy gate was never asked to run for a train candidate at all. That is fixed in
[warp#22457](https://warp.gyrum.ai/items/22457).

**The shape of one heavy run:**

| Step | What it does |
|---|---|
| triage | reads the diff shape; picks the lane |
| plan | lists the test units and partitions them into shards |
| build-vet | builds and vets the toolchain |
| **shards** | the test units, partitioned (`shard 1 of N`) — one runner per shard, in parallel |
| frontend-evidence / capture | captures the frontend evidence; needs the network |
| aggregates | `structural-checks` and the rollup |

**The lane is one run at a time.** Every heavy run in the repository shares a single concurrency
group (`ci-devtools`), deliberately (warp#17523): the merge train is the admission authority, so a
candidate validates against current `main`, merges, and gives push-`main` its turn before another
candidate can consume the pool. The cost is that the fleet's fifteen runners are idle whenever
the lane is not running, and that one long-held lane starves every other pull request.

**How it gets stuck here:** three ways, all measured.

- A run for a **superseded head** sits in the lane and can never produce a usable result. On
  2026-11-06 one such run held the lane from 20:09 to 21:40 while the lane ran no other work.
  The canceller that should have removed it could not see it: it inventoried only
  `event=pull_request` runs, while the train's dispatched runs are `event=workflow_dispatch`
  (warp#22443).
- The **pin-advance bot's own pull request** takes the lane hourly and fails every time.
- A shard that **times out** is classified `INFRA-KILL` — rerun-eligible, not a real failure — but
  the run is still red until someone re-runs it.

## 4. passed

*Green and approved; the train may merge it.*

The heavy gate is green on the exact head, the panel's quorum is signed for that same head, and
the pull request is mergeable. It is now waiting for the train's turn, not for anything to be
built.

**What happens here:** the train merges it, subject to its own gates — clean merge, no conflict,
the merge is the train's, not an operator's.

**How it gets stuck here:** the head can move under the pull request at any point (a re-trigger
commit, an operator push), and a moved head invalidates both the review quorum and the heavy run.
The pull request goes back to `waiting fixed` or `in testing` and the cycle repeats.

## 5. waiting for deployment

*Merged; the delivery tail is not finished.*

The code is in `main`. What is left is the **delivery tail**: the owning warp ticket has to reach
`done`, because the ticket is where the work was tracked from the start.

This is where the pile looks alarming — 80 pull requests on the board — and where the board was
lying:

> The 80 were not "deploying". 67 of their tickets are **already closed**; the board read their
> status as unknown because the ticket lookup was scoped to one repository, and a ticket lives in
> the repository it was filed against — which for most of these is `dark-factory` or
> `ai-research`, not `devtools`. With the lookup fixed, those pull requests belong in `done`.

The real remainder is small: pull requests whose ticket still says `awaiting_merge` (the ticket
never moved on after the merge) or `ready`.

**How it gets stuck here:** a ticket that is closed but whose pull request is still open, or a
ticket that is waiting for the merge that already happened. Both are cheap to fix and both make the
queue look far worse than it is.

## 6. deployed

*Merged, ticket done, less than 24 hours ago.*

The delivery tail finished. The pull request is settled but still recent, so it stays visible as
`deployed` for a day.

## 7. done

*Merged, ticket done, more than 24 hours ago.*

Settled. Nothing is owed.

---

## How the stages are derived

| Stage | Rule |
|---|---|
| waiting | open · checks not green · review not `CHANGES_REQUESTED` |
| waiting fixed | `reviewDecision = CHANGES_REQUESTED`, or label `train:conflict` |
| in testing | the heavy gate has a run on the pull request's **current head** — queued or running — or the check rollup is `PENDING` |
| passed | open · rollup `SUCCESS` · review `APPROVED` |
| waiting for deployment | merged · owning ticket not done |
| deployed | merged · ticket done · merged less than 24h ago |
| done | merged · ticket done · merged more than 24h ago |

**Two corrections to the derivation, both made on 2026-11-06:**

1. **`in testing` must not be read from the check rollup.** A queued heavy run creates no check run
   at all, so the rollup reports `SUCCESS` from the light lane alone. Reading the heavy gate's own
   run list is the only honest signal. Before the fix, 48 of the 49 pull requests in `passed` had
   never been through the heavy gate on their current head.
2. **The ticket's status must be resolved by ticket number, across repositories.** A repo-scoped
   lookup cannot see a ticket filed against another repo, and every such pull request reads as
   un-delivered forever.

## What to look at when the queue is stuck

| Symptom | Where to look |
|---|---|
| Many pull requests, nothing running | Is the heavy lane occupied? `gyrum-merge-train status` names the head; the lane's holder is in the Actions list. |
| The head is approved but will not merge | Does the head have a heavy run? A `ready-transition-failed` in the train worker's log means the gate was never asked to run. |
| A pull request is stuck in `waiting` | Read the train's own drop reason on the pull request, not the phase: the pile tool (`gyrum-devtools merge-train-pile --repo gyrum-labs/devtools`) sorts every dropped pull request into re-land / rework / close / decide with the evidence. |
| `passed` looks full of untested work | Read the Heavy column. `not run` means the heavy gate never ran on that head — the pull request is not tested, whatever the rollup says. |
| A run is red but nothing is wrong with the code | Check the classification: `INFRA-KILL` (a timeout) and `INFRA-INCOMPLETE` (exit 75, a missing artifact) are rerun-eligible, not real failures. |
