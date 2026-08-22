# ops.gyrum.ai — journeys

The operator journeys served by the Gyrum Ops dashboard. Derived from operator
priorities (jon, 2026-08-21) + structural evidence; weights are stated priority.
Canonical contract: `ai-frontend/docs/journeys/ia-proposal.md` (merged PR #1197).

| #   | Journey                  | Weight | Trigger → Outcome                                                  | Screens                                                                         |
| --- | ------------------------ | ------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| J1  | What's broken right now? | 1      | Alarm/oddity → know factory health + break location                | `/`, `/incidents`, `/release-status`, `/ship/deploys`, `/infra/drift`           |
| J2  | Did today's work ship?   | 2      | Daily review → what merged/deployed; staleness visible             | `/ship`, `/ship/pulls`, `/ship/ci`, `/changelog`, `/release-status`             |
| J3  | Drive and watch a run    | 3      | Fire/inspect execution → run completes or failure explained        | `/playbooks`, `/playbooks/[id]`, `/runs`, `/operate/runs/[runId]`, `/pipelines` |
| J4  | Keep the agent fleet fed | 3      | Queue depth / runner health → tickets flowing to healthy executors | `/operate/queue`, `/operate/runners`, `/operate/executors`, `/operators`        |
| J5  | Kill recurring friction  | 4      | Same annoyance recurs → pattern found, fix filed/landed            | `/operate/friction`, `/operate/recurring`, `/retro/[buildID]`, `/tickets/new`   |
| J6  | Steer the work           | 5      | Planning → board-level view of epics/projects/campaigns            | `/pm`, `/projects`, `/build`, `/build/[buildID]`                                |
| J7  | Check infra posture      | 6      | Host/service/domain question → posture known                       | `/infra/*`                                                                      |

Evidence note: no access-log analytics were queryable at reduction time
(recorded limitation in the IA proposal §1); weights are stated-priority based,
delete candidates rest on structural evidence only. Instrumenting usage is the
obvious Phase-2 hardening.
