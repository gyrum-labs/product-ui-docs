<!-- gyrum-template-do-not-grade -->
<!--
This file was seeded by gyrum-setup from templates/README.md.tmpl.
Once you replace the prompt text below with real content, DELETE both
of these HTML comments — that re-enables the validator's
template-placeholder check. Keeping the marker after edits would
silence the gate indefinitely; the gate team prefers an explicit
operator action over a stealthy default.

The five canonical sections below match the fleet's README contract
(see dark-factory/docs/audits/readme-audit-2026-04-25.md). Keep all
five — Portal, the docs viewer, and incoming maintainers all rely on
the same shape across every gyrum repo.
-->

# product-ui-docs

_TEMPLATE — replace this prompt with the real content._ One sentence
that names the product and what it does, then one paragraph that
expands: the problem it solves, the shape of the solution, and the
shortest accurate statement of what the first working version covers.
A reader who skims only this paragraph should be able to decide
whether to keep reading.

> **Status — _stage_.** _TEMPLATE — replace with the project's actual
> stage (MVP / production / archived) and the one fact a newcomer
> needs before adopting it (e.g. "rebuilt on Weft Phase 3 — see
> MIGRATION.md", or "stable; pin to a released tag")._

## Who it's for

_TEMPLATE — replace this prompt with the real content._ Name the
audience in one short list: which operator role, which agent type,
which end-user persona. Then call out who this is **not** for, so a
mismatched reader can leave fast. The fleet has at least four
distinct audiences (fleet operator, AI agent, end user, external
contractor) — say which apply.

## Install

_TEMPLATE — replace this prompt with the real content._ The
copy-paste install steps that get a new machine to a working
product-ui-docs. Show the commands the reader should run, exactly,
in a fenced block. Prerequisites belong inline (one line per dep);
deeper environment notes belong in `docs/userguide.md`.

```bash
# TEMPLATE — replace with the real install commands.
git clone https://github.com/gyrum-labs/product-ui-docs.git
cd product-ui-docs
# ... build / setup / first-run command
```

## Quick start

_TEMPLATE — replace this prompt with the real content._ A
30-second walkthrough of the first task a new user does with
product-ui-docs — one scenario, start to finish, with the exact
commands and the expected output. The reader should be able to
verify "yes, it works on my machine" without leaving this section.

```bash
# TEMPLATE — replace with the canonical first task.
product-ui-docs --help
```

Expected output:

```
TEMPLATE — paste the actual expected output here so the reader
can confirm their install matches the canonical state.
```

## Where to find more

_TEMPLATE — replace this prompt with the real content._ Linked
list of the next-level docs the reader will want. Keep it short —
the README is a router, not a manual. Typical entries:

- [User guide](docs/userguide.md) — concepts, common workflows,
  troubleshooting.
- [Architecture / proposal](docs/proposal.md) — the design and the
  decisions log.
- [Architectural Decision Records](https://github.com/gyrum-labs/dark-factory/tree/main/docs/decisions)
  — fleet-wide ADRs that constrain product-ui-docs.
- [CHANGELOG](CHANGELOG.md) — what shipped when.
