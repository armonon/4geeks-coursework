#!/usr/bin/env python3
"""Load the analyzer CSV into the incident manager as historical data.

Every row becomes an incident with `origin: "customer"` — CONTEXT is
explicit that the whole export came from TrackFlow's customer service
system.

The CSV schema is NOT the manager's model, so each row is transformed
first (description → title, status/category/branch remapped, date →
created_at). Both the row-validity rules and the transformation come
from `trackflow_shared`, the same package `services/api` imports, so the
seeded data and the API can never disagree about what is valid.

Run it:
    uv run seed-incidents                        # from services/api/
    python scripts/seed_incidents.py             # or directly

Idempotent: rows are matched on the CSV's `incident_id`, so running it
twice inserts nothing the second time.
"""

from __future__ import annotations

import argparse
import csv
import sys
from collections import Counter
from pathlib import Path

# Make the monorepo's local packages importable when this script is run
# directly (`python scripts/seed_incidents.py`) rather than through uv.
_REPO_ROOT = Path(__file__).resolve().parent.parent
for _pkg in ("packages/shared", "packages/incident_analyzer", "services/api"):
    _path = str(_REPO_ROOT / _pkg)
    if _path not in sys.path:
        sys.path.insert(0, _path)

from database import db_path, incidents_table  # noqa: E402
from tinydb import Query  # noqa: E402
from trackflow_shared.incidents import map_row  # noqa: E402

DEFAULT_CSV = _REPO_ROOT / "scripts" / "incidents-trackflow.csv"


def load_rows(csv_path: Path) -> list[dict]:
    with csv_path.open("r", encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def seed(csv_path: Path) -> tuple[int, int, int, Counter]:
    """Insert every mappable row that is not already present.

    Returns (inserted, skipped_existing, rejected, reasons).
    """
    table = incidents_table()
    query = Query()

    inserted = 0
    skipped = 0
    rejected = 0
    reasons: Counter = Counter()

    for row in load_rows(csv_path):
        mapped = map_row(row)

        if not mapped.ok or mapped.incident is None:
            rejected += 1
            reasons[mapped.reason or "unknown"] += 1
            continue

        external_id = mapped.external_id
        # Idempotency: CONTEXT says use incident_id; fall back to
        # title + created_at when the column is absent.
        if external_id:
            already = table.search(query.source_incident_id == external_id)
        else:
            already = table.search(
                (query.title == mapped.incident["title"])
                & (query.created_at == mapped.incident["created_at"])
            )
        if already:
            skipped += 1
            continue

        table.insert(mapped.incident)
        inserted += 1

    return inserted, skipped, rejected, reasons


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "csv",
        nargs="?",
        type=Path,
        default=DEFAULT_CSV,
        help=f"Path to the incidents CSV (default: {DEFAULT_CSV.name})",
    )
    args = parser.parse_args(argv)

    print("TrackFlow — historical incident seeder")
    print(f"  source:   {args.csv}")
    print(f"  database: {db_path()}")

    if not args.csv.exists():
        print(f"\n  FAILED: no such file: {args.csv}", file=sys.stderr)
        return 1

    try:
        inserted, skipped, rejected, reasons = seed(args.csv)
    except Exception as exc:
        print(f"\n  FAILED: {exc}", file=sys.stderr)
        return 1

    total = len(incidents_table())
    print()
    print(f"  inserted ............ {inserted}")
    print(f"  already present ..... {skipped}")
    print(f"  rejected ............ {rejected}")

    if reasons:
        # Invalid rows are never inserted silently — every one is
        # accounted for here.
        print("\n  rejected rows by reason:")
        for reason, count in reasons.most_common():
            print(f"    - {reason:38} {count}")

    print(f"\n  incidents in database  {total}")
    if inserted:
        print(f"\nSeeded {inserted} historical incident(s) as origin='customer'.")
    else:
        print("\nNothing to do — the history was already loaded.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
