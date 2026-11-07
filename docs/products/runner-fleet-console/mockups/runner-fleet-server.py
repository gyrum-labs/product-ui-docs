#!/usr/bin/env python3
"""Serve the runner-fleet infographic and aggregate the live state.

The browser never sees a credential: this process holds the warp token and
the GitHub token, calls the APIs, and returns a single JSON snapshot at
/api/state. The page polls it; every view is driven by that one payload.

Usage:  runner-fleet-server.py <port> <html-file>
"""
import json
import os
import re
import subprocess
import sys
import threading
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
CONTROL_PLANE = os.path.expanduser("~/.config/gyrum/control-plane.env")
APP_TOKEN = "/tmp/app-token.txt"
LOCK = threading.Lock()
SNAPSHOT = {"generated_at": None, "fleet": {}, "runs": [], "jobs": [], "train": {}}
ERRORS = []


def load_env():
    env = dict(os.environ)
    try:
        with open(CONTROL_PLANE, encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                if key.startswith("export "):
                    key = key[len("export "):].strip()
                env.setdefault(key, value.strip().strip("'\""))
    except OSError:
        pass
    return env


ENV = load_env()
WARP_URL = ENV.get("WARP_URL", "").rstrip("/")
WARP_TOKEN = ENV.get("WARP_TOKEN", "")


def fetch_json(url, headers=None, timeout=25):
    request = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8", "replace"))


def warp(path):
    if not WARP_URL or not WARP_TOKEN:
        return None
    try:
        return fetch_json(f"{WARP_URL}{path}", {"Authorization": f"Bearer {WARP_TOKEN}"})
    except (urllib.error.URLError, OSError, ValueError) as exc:
        ERRORS.append(f"warp {path}: {exc}")
        return None


def gh_graphql(query, variables):
    """One GraphQL call through the App token, with the operator as a fallback."""
    app = ""
    try:
        with open(APP_TOKEN, encoding="utf-8") as handle:
            app = handle.read().strip()
    except OSError:
        pass
    payload = json.dumps({"query": query, "variables": variables}).encode("utf-8")
    for token in ([app] if app else []) + ([ENV.get("GH_TOKEN", "")] if ENV.get("GH_TOKEN") else []):
        request = urllib.request.Request(
            "https://api.github.com/graphql",
            data=payload,
            headers={"Authorization": f"Bearer {token}",
                     "Content-Type": "application/json",
                     "Accept": "application/vnd.github+json",
                     "User-Agent": "runner-fleet-infographic"},
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                body = json.loads(response.read().decode("utf-8", "replace"))
            if body.get("errors"):
                ERRORS.append(f"graphql: {str(body['errors'])[:120]}")
                continue
            return body
        except (urllib.error.URLError, OSError, ValueError) as exc:
            ERRORS.append(f"graphql: {exc}")
    return None


def gh(path):
    """Read through the App's installation token, falling back to the operator."""
    app = ""
    try:
        with open(APP_TOKEN, encoding="utf-8") as handle:
            app = handle.read().strip()
    except OSError:
        pass
    base = "https://api.github.com"
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "runner-fleet-infographic"}
    if app:
        try:
            return fetch_json(f"{base}{path}", {**headers, "Authorization": f"Bearer {app}"})
        except (urllib.error.URLError, OSError, ValueError) as exc:
            ERRORS.append(f"gh app {path}: {exc}")
    operator = ENV.get("GH_TOKEN", "")
    if operator:
        try:
            return fetch_json(f"{base}{path}", {**headers, "Authorization": f"Bearer {operator}"})
        except (urllib.error.URLError, OSError, ValueError) as exc:
            ERRORS.append(f"gh operator {path}: {exc}")
    return None


def refresh():
    global SNAPSHOT
    errors = []
    snapshot = {"generated_at": None, "fleet": {}, "runs": [], "jobs": [], "train": {}, "errors": []}

    pool = warp("/api/v1/runners/pool") or {}
    hosts = warp("/api/v1/runners/hosts") or {}
    snapshot["fleet"] = {"pool": pool.get("runners", []), "hosts": hosts.get("hosts", []),
                         "source": "warp runner registry"}

    trains = warp("/api/v1/merge-trains") or {}
    for train in trains.get("trains", []):
        if train.get("repo") == "gyrum-labs/devtools":
            snapshot["train"] = {
                "repo": train.get("repo"),
                "read_at": (train.get("queue") or {}).get("read_at"),
                "state": (train.get("queue") or {}).get("state"),
                "order_complete": (train.get("queue") or {}).get("order_complete"),
                "entries": (train.get("queue") or {}).get("entries", []),
                "token": train.get("token", {}),
            }

    def run_list(query):
        raw = gh(query) or {}
        if isinstance(raw, dict):
            raw = raw.get("workflow_runs", [])
        return raw if isinstance(raw, list) else []

    # The pull-request runs first: they are the ones with shards, and the
    # main-branch crons would otherwise crowd them out of the job window.
    runs_raw = run_list("/repos/gyrum-labs/devtools/actions/runs?event=pull_request&per_page=20")
    for r in runs_raw:
        if isinstance(r, dict) and r.get("pull_requests"):
            r["number"] = (r["pull_requests"][0] or {}).get("number")
    seen = {r.get("id") for r in runs_raw if isinstance(r, dict)}
    for other in run_list("/repos/gyrum-labs/devtools/actions/runs?per_page=12"):
        if isinstance(other, dict) and other.get("id") not in seen:
            seen.add(other.get("id"))
            runs_raw.append(other)
    snapshot["runs"] = [
        {
            "number": r.get("number"),
            "id": r.get("database_id") or r.get("id"),
            "name": r.get("name"),
            "status": r.get("status"),
            "conclusion": r.get("conclusion"),
            "branch": (r.get("head_branch") or ""),
            "sha": (r.get("head_sha") or "")[:8],
            "created_at": r.get("created_at"),
            "attempt": r.get("run_attempt"),
            "url": r.get("html_url"),
        }
        for r in runs_raw
        if isinstance(r, dict)
    ]

    jobs = []
    # Fetch the jobs of the runs that have LIVE work first, then the rest:
    # the shard-heavy run is often older than a failing cron.
    def rank(r):
        live = 0 if r["status"] == "in_progress" else (1 if r["status"] == "queued" else 2)
        branch = 0 if r.get("branch") not in ("main", "") else 1
        return (live, branch)
    ordered = sorted(snapshot["runs"], key=rank)
    live_ids = set()
    for st in ("in_progress", "queued"):
        for r in run_list(f"/repos/gyrum-labs/devtools/actions/runs?status={st}&per_page=20"):
            if isinstance(r, dict) and r.get("id") not in live_ids:
                live_ids.add(r.get("id"))
                ordered.append(r)
    # the live runs were appended after the sort: re-sort so they lead the
    # job window, or the feed lags the registry's busy count.
    ordered.sort(key=rank)
    pr_runs = [r for r in ordered if r.get("branch") not in ("main", "")]
    live_runs = [r for r in ordered if r.get("branch") in ("main", "")]
    for run in (pr_runs[:6] + live_runs[:4]):
        detail = gh(f"/repos/gyrum-labs/devtools/actions/runs/{run['id']}/jobs?per_page=40") or {}
        if not isinstance(detail, dict):
            continue
        for job in detail.get("jobs", []):
            if not isinstance(job, dict):
                continue
            jobs.append({
                "run": run["id"],
                "branch": run.get("branch") or run.get("head_branch") or "",
                "name": job.get("name"),
                "status": job.get("status"),
                "conclusion": job.get("conclusion"),
                "runner": job.get("runner_name"),
                "labels": job.get("labels") or [],
                "started_at": job.get("started_at"),
                "completed_at": job.get("completed_at"),
                "url": job.get("html_url"),
            })
    snapshot["jobs"] = jobs

    # ── the heavy lane ───────────────────────────────────────────────────
    # The heavy gate is a single-slot, ready_for_review-only workflow: a
    # pull request's head that never got that transition has NO heavy run on
    # it at all, and a queued heavy run creates no check run until a runner
    # picks it up. So the check rollup cannot say "pending" for the heavy
    # lane -- it says SUCCESS from the light lane alone. The heavy lane's own
    # run list is the only honest signal, and it is read here.
    heavy_raw = (gh("/repos/gyrum-labs/devtools/actions/workflows/ci.yml/runs?per_page=100") or {})
    heavy_runs = heavy_raw.get("workflow_runs") if isinstance(heavy_raw, dict) else []
    heavy_runs = [r for r in (heavy_runs or []) if isinstance(r, dict)]
    heavy_by_sha = {}
    for r in heavy_runs:
        sha = r.get("head_sha")
        if not sha:
            continue
        heavy_by_sha[sha] = {
            "status": r.get("status"),
            "conclusion": r.get("conclusion"),
            "id": r.get("id"),
            "at": r.get("created_at"),
            "pr": ((r.get("pull_requests") or [{}])[0] or {}).get("number"),
        }
    snapshot["heavy"] = [
        {
            "id": r.get("id"),
            "status": r.get("status"),
            "conclusion": r.get("conclusion"),
            "pr": ((r.get("pull_requests") or [{}])[0] or {}).get("number"),
            "sha": (r.get("head_sha") or "")[:8],
            "at": r.get("created_at"),
            "url": r.get("html_url"),
        }
        for r in heavy_runs[:25]
    ]

    # ── the delivery phases ──────────────────────────────────────────────
    # The board's phase vocabulary lives in the warp service, so the buckets
    # are derived here from the signals that are measurable: the pull
    # request's own state, its check rollup, its review decision, the train
    # labels, and the owning ticket's status.
    phases = {
        "waiting": [], "waiting fixed": [], "in testing": [], "passed": [],
        "waiting for deployment": [], "deployed": [], "done": [],
    }
    tickets = {}
    items = warp("/api/v1/items?repo=gyrum-labs%2Fdevtools&limit=500") or {}
    for item in (items.get("items") if isinstance(items, dict) else items) or []:
        if isinstance(item, dict) and item.get("number"):
            tickets[item["number"]] = item

    query = """query($owner:String!,$name:String!,$states:[PullRequestState!]!){
      repository(owner:$owner,name:$name){
        pullRequests(first:80,states:$states,orderBy:{field:UPDATED_AT,direction:DESC}){
          nodes{
            number title state isDraft createdAt updatedAt mergedAt headRefOid
            reviewDecision
            labels(first:20){nodes{name}}
            commits(last:1){nodes{commit{statusCheckRollup{state}}}}
          }
        }
      }
    }"""
    train_entries = (snapshot.get("train") or {}).get("entries") or []
    branch_by_pr = {}
    for r in snapshot.get("runs", []):
        if r.get("number"):
            branch_by_pr[r["number"]] = r.get("branch", "")
    for states, bucket_open in ((["OPEN"], True), (["MERGED"], False)):
        raw = gh_graphql(query, {"owner": "gyrum-labs", "name": "devtools", "states": states}) or {}
        nodes = (((raw.get("data") or {}).get("repository") or {}).get("pullRequests") or {}).get("nodes") or []
        for pr in nodes:
            if not isinstance(pr, dict):
                continue
            labels = [x.get("name") for x in ((pr.get("labels") or {}).get("nodes") or [])]
            rollup = (((pr.get("commits") or {}).get("nodes") or [{}])[0]
                      .get("commit", {}).get("statusCheckRollup") or {}).get("state")
            decision = pr.get("reviewDecision")
            ticket = None
            match = re.search(r"\[ID:warp#(\d+)\]", pr.get("title") or "")
            if match:
                ticket = int(match.group(1))
            item = tickets.get(ticket) if ticket else None
            # when the fleet first saw this pull request: the enqueue record
            seen_at = None
            for entry in train_entries:
                if entry.get("number") == pr.get("number"):
                    seen_at = entry.get("current_queued_at") or entry.get("enqueued_at")
                    break
            ticket_status = (item or {}).get("status")
            # the heavy gate's own state on this pull request's CURRENT head
            heavy = heavy_by_sha.get(pr.get("headRefOid"))
            heavy_state = None
            if heavy:
                if heavy.get("status") != "completed":
                    heavy_state = heavy.get("status")
                else:
                    heavy_state = heavy.get("conclusion") or "completed"
            row = {
                "pr": pr.get("number"),
                "branch": branch_by_pr.get(pr.get("number"), ""),
                "title": (pr.get("title") or "")[:120],
                "ticket": ticket,
                "ticket_status": ticket_status,
                "checks": rollup,
                "review": decision,
                "heavy": heavy_state,
                "heavy_at": (heavy or {}).get("at"),
                "labels": labels,
                "created_at": pr.get("createdAt"),
                "updated_at": pr.get("updatedAt"),
                "merged_at": pr.get("mergedAt"),
                "draft": pr.get("isDraft"),
                "seen_at": seen_at,
            }
            if bucket_open:
                if decision == "CHANGES_REQUESTED" or "train:conflict" in labels:
                    phases["waiting fixed"].append(row)
                elif heavy_state in ("queued", "pending", "in_progress", "waiting", "requested"):
                    # the heavy gate has a run on this pull request's CURRENT
                    # head -- that is "in testing" whether or not the rollup
                    # has caught up. A queued heavy run creates no check run,
                    # so the rollup alone would call it green.
                    phases["in testing"].append(row)
                elif rollup == "PENDING":
                    phases["in testing"].append(row)
                elif rollup == "SUCCESS" and decision == "APPROVED":
                    phases["passed"].append(row)
                else:
                    phases["waiting"].append(row)
            else:
                if ticket_status in ("done", "complete", "closed"):
                    age = 0
                    try:
                        merged = pr.get("mergedAt")
                        if merged:
                            age = (datetime.now(timezone.utc) - datetime.fromisoformat(merged.replace("Z", "+00:00"))).total_seconds()
                    except Exception:
                        age = 0
                    (phases["done"] if age > 86400 else phases["deployed"]).append(row)
                else:
                    phases["waiting for deployment"].append(row)
    for key in phases:
        phases[key].sort(key=lambda r: r.get("updated_at") or "", reverse=True)
    snapshot["phases"] = phases

    # ── throughput: the fleet's own rates, plus a per-day history ────────
    stats = warp("/api/v1/runners/stats") or {}
    snapshot["stats"] = {
        "categories": stats.get("categories", []),
        "warnings": stats.get("warnings", []),
        "throughput": stats.get("throughput", {}),
        "concurrency": stats.get("concurrency", {}),
        "lead_seconds": stats.get("lead_seconds", {}),
        "wait_seconds": stats.get("wait_seconds", {}),
        "run_seconds": stats.get("run_seconds", {}),
        "queue": stats.get("queue", {}),
        "window": stats.get("window"),
    }
    # Per-day run counts: one cheap call per day (the API's total_count).
    now = datetime.now(timezone.utc)
    days = []
    for back in range(7, -1, -1):
        day = (now - timedelta(days=back)).date()
        start = day.isoformat() + "T00:00:00Z"
        end = day.isoformat() + "T23:59:59Z"
        raw = gh(f"/repos/gyrum-labs/devtools/actions/runs?created={start}..{end}&per_page=1") or {}
        count = raw.get("total_count") if isinstance(raw, dict) else None
        days.append({"day": day.isoformat(), "runs": count if isinstance(count, int) else None})
    snapshot["days"] = days

    # the board's own footer: which build this is, and how fresh the read is
    version = warp("/api/v1/version") or {}
    snapshot["version"] = {
        "tag": version.get("version_tag") or version.get("branch"),
        "sha": (version.get("sha") or "")[:12],
        "built_at": version.get("built_at"),
    }

    snapshot["generated_at"] = subprocess.run(
        ["date", "-u", "+%Y-%m-%dT%H:%M:%SZ"], capture_output=True, text=True
    ).stdout.strip()
    snapshot["errors"] = errors[:6]

    with LOCK:
        SNAPSHOT = snapshot


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def _send(self, code, body, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/state":
            with LOCK:
                payload = json.dumps(SNAPSHOT).encode("utf-8")
            self._send(200, payload, "application/json")
            return
        if path in ("/", "/index.html"):
            with open(HTML_FILE, "rb") as handle:
                body = handle.read()
            self._send(200, body, "text/html; charset=utf-8")
            return
        if path in ("/mockups", "/mockups.html"):
            with open(MOCKUP_FILE, "rb") as handle:
                body = handle.read()
            self._send(200, body, "text/html; charset=utf-8")
            return
        if path == "/mockups.js":
            with open(MOCKUP_JS, "rb") as handle:
                body = handle.read()
            self._send(200, body, "application/javascript; charset=utf-8")
            return
        self._send(404, b"not found", "text/plain")


def refresher():
    while True:
        try:
            refresh()
        except Exception as exc:  # keep serving the last good snapshot
            with LOCK:
                SNAPSHOT["errors"] = (SNAPSHOT.get("errors") or [])[:5] + [f"refresh: {exc}"]
        threading.Event().wait(25)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8137
    HTML_FILE = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "runner-fleet-infographic.html")
    MOCKUP_FILE = os.path.join(HERE, "arcade-mockups.html")
    MOCKUP_JS = os.path.join(HERE, "arcade-mockups.js")
    threading.Thread(target=refresher, daemon=True).start()
    print(f"runner-fleet infographic on http://127.0.0.1:{port}/  (snapshot file: {HTML_FILE})", flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
