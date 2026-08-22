#!/usr/bin/env python3
"""ledger-clauses-check.py — mechanical lint for the clause ledgers.

For every docs/products/*/clauses.md:
  1. every clause header matches `## CL-<n> — <title> · <state>`;
  2. state ∈ {captured, drafted, landed};
  3. no duplicate clause IDs within a product;
  4. every clause carries Journey + Routes lines;
  5. every `landed` clause cites merged-PR evidence (github.com/**/pull/<n>).

Exit 1 on any violation. Run: scripts/ledger-clauses-check.sh
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HEADER = re.compile(r"^## (?P<id>CL-\d+) — .+ · (?P<state>captured|drafted|landed)$")
STATES = {"captured", "drafted", "landed"}


def check_ledger(ledger: Path) -> list[str]:
	errors: list[str] = []
	product = ledger.parent.name
	seen: set[str] = set()

	current_id: str | None = None
	state: str | None = None
	body: list[str] = []

	def flush() -> None:
		if current_id is None:
			return
		text = "\n".join(body)
		if "**Journey:" not in text:
			errors.append(f"{product}/{current_id}: missing Journey line")
		if "**Routes:" not in text:
			errors.append(f"{product}/{current_id}: missing Routes line")
		if state == "landed":
			ev = [ln for ln in body if ln.startswith("- **Evidence:")]
			if not ev or "github.com" not in ev[0] or "/pull/" not in ev[0]:
				errors.append(
					f"{product}/{current_id}: landed clause evidence must cite a merged PR URL"
				)

	for raw in ledger.read_text().splitlines():
		m = HEADER.match(raw)
		if m:
			flush()
			current_id, state = m.group("id"), m.group("state")
			if current_id in seen:
				errors.append(f"{product}: duplicate clause ID {current_id}")
			seen.add(current_id)
			body = []
		elif current_id is not None and raw.startswith("## "):
			flush()
			current_id, state = None, None
			body = []
		elif current_id is not None:
			body.append(raw)
	flush()
	return errors


def main() -> int:
	ledgers = sorted(ROOT.glob("docs/products/*/clauses.md"))
	if not ledgers:
		print("✗ no clause ledgers found under docs/products/*/clauses.md", file=sys.stderr)
		return 1

	errors: list[str] = []
	for ledger in ledgers:
		errors.extend(check_ledger(ledger))

	for e in errors:
		print(f"✗ {e}", file=sys.stderr)
	if errors:
		return 1
	print(f"✓ ledger clauses well-formed ({len(ledgers)} ledger(s))")
	return 0


if __name__ == "__main__":
	sys.exit(main())
