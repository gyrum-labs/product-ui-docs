# The runner-fleet mockups

Six screens, one live dataset. Each screen shows the same thing in a different arcade language:
how big every stage is, and how the work moves through it.

The mockups are a direction, not a decision. The clause ledger one directory up records what each
screen would have to be true to be worth building.

## What is here

| File | What it is |
| --- | --- |
| `arcade-mockups.html` | the mockup pack: six screens, each with the description and design notes a designer needs |
| `arcade-mockups.js` | the drawing code and the live-data binding |
| `runner-fleet-infographic.html` | the live dashboard the pack grew out of: 14 views over the same payload |
| `runner-fleet-server.py` | the server that holds the credentials and serves the pages |

## Running it

The server holds the warp token and the GitHub token; the browser never sees either. It aggregates
one payload and serves it to both pages.

```bash
python3 runner-fleet-server.py 8137 runner-fleet-infographic.html
# the mockup pack:   http://127.0.0.1:8137/mockups
# the dashboard:     http://127.0.0.1:8137/
```

The server reads `WARP_URL` and `WARP_TOKEN` from `~/.config/gyrum/control-plane.env`, and the
fleet's App token from `/tmp/app-token.txt`. It falls back from the App token to the operator token
for reads that the App cannot serve. It writes nothing outside its own snapshot and never mutates
the fleet.

## The six screens

| # | Screen | The idea |
| --- | --- | --- |
| 01 | The marble run | the pipeline as a wall-mounted marble run; the bucket at the top, a gate opens, the marbles run down; the drum is the test stage |
| 02 | The heap | boxes ride belts whose length is the size of their stage, and the finished work piles up in a heap |
| 03 | The city | a top-down city; each stage is a district sized by its count, each pull request a resident who walks when their situation changes |
| 04 | Pinball board | the pipeline as a pachinko board whose band heights are the stages' sizes |
| 05 | Production line | machines down a factory floor, each as tall as its stage, with the work riding the belt |
| 06 | Arcade cabinets | a select screen whose cabinets are as tall as their stages, with a preview of the pull requests inside the selected one |

## Two query parameters

Both pages read the same live payload and refresh every 25 seconds.

- `?only=<id>` — show one screen on its own: `mockups?only=city`, `mockups?only=marble`. The other
  screens are hidden, so the page is slide-sized.
- `?still=1` — paint a bounded number of frames and stop. The animation is continuous by design,
  which keeps a headless capture waiting forever; the still mode is how a screen gets screenshotted
  or measured.

## Where the numbers come from

One payload, served from `/api/state`:

- the **phases** — every pull request bucketed by the state it is in, and the heavy gate's own state
  on its current head;
- the **fleet** — the runner registry: who is registered, who is busy, and which hosts are online;
- the **runs** and **jobs** — what the CI lanes are doing;
- the **train** — the merge train's own projection of the service order;
- the **stats** — throughput, concurrency and the percentiles the fleet publishes.

The buckets are derived locally, because the board's phase vocabulary lives in the warp service.
The derivation is stated on the dashboard's own delivery page, and the heavy gate's state is read
from the heavy workflow's run list rather than from the check rollup — a queued heavy run creates no
check run, so the rollup alone would call a pull request green that the heavy gate never ran.
