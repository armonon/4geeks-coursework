#!/usr/bin/env python3
"""TrackFlow — Incident Report Analyzer (Phase 1 CLI).

Usage:
    python scripts/analyze.py incidents-trackflow.csv

Prints a readable summary to stdout, then prompts to export a CSV
with one row per metric. Uses only the shared `incident_analyzer`
package for validation + aggregation — the API in services/api/
imports the exact same module so numbers cannot diverge.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add the shared analyzer package to sys.path so this script runs with
# zero install steps (`python scripts/analyze.py <csv>`). The API
# installs the same package as a proper editable dependency.
_REPO_ROOT = Path(__file__).resolve().parent.parent
_PACKAGE_ROOT = _REPO_ROOT / "packages" / "incident_analyzer"
if str(_PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(_PACKAGE_ROOT))

from incident_analyzer import (  # noqa: E402  (import after sys.path edit)
    analyse,
    read_csv,
    render_console,
    result_to_csv_rows,
)
from incident_analyzer.csv_io import write_csv_bytes  # noqa: E402


DEFAULT_EXPORT_PATH = Path("results.csv")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("csv", type=Path, help="Path to the incidents CSV")
    parser.add_argument(
        "--out",
        type=Path,
        default=DEFAULT_EXPORT_PATH,
        help=f"Where to write the exported CSV (default: {DEFAULT_EXPORT_PATH})",
    )
    parser.add_argument(
        "--no-prompt",
        action="store_true",
        help="Skip the y/n export prompt and exit after printing.",
    )
    args = parser.parse_args(argv)

    if not args.csv.exists():
        print(f"error: file not found: {args.csv}", file=sys.stderr)
        return 2

    rows = read_csv(args.csv)
    result = analyse(rows)
    print(render_console(result, args.csv.name))

    if args.no_prompt:
        return 0

    try:
        answer = input("Export results to CSV? [y / n]: ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        print()
        return 0

    if answer == "y":
        data = write_csv_bytes(result_to_csv_rows(result))
        args.out.write_bytes(data)
        print(f"Wrote {len(result_to_csv_rows(result))} rows to {args.out}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
