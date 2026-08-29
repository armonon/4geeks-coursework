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
import csv
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

    # Reading is three distinct failures wearing one coat — the path is
    # unusable, the bytes are not UTF-8, or the text is not CSV. Each
    # gets its own handler and its own advice, because "check the file"
    # is not advice. An unreadable input is exit 2; a file we could read
    # but not parse is exit 1.
    try:
        rows = read_csv(args.csv)
    except IsADirectoryError:
        print(f"error: {args.csv} is a directory, not a CSV file.", file=sys.stderr)
        return 2
    except PermissionError:
        print(
            f"error: no permission to read {args.csv}. Check the file's "
            "ownership and permissions.",
            file=sys.stderr,
        )
        return 2
    except OSError as exc:
        # Broken symlink, I/O error, name too long. errno is the useful
        # part; the full exception may carry an absolute path.
        print(f"error: could not read {args.csv} ({exc.strerror}).", file=sys.stderr)
        return 2
    except UnicodeDecodeError:
        print(
            f"error: {args.csv.name} is not UTF-8 text. Re-export it as "
            "CSV UTF-8 and try again.",
            file=sys.stderr,
        )
        return 1
    except csv.Error:
        print(
            f"error: {args.csv.name} could not be parsed as CSV — a row may be "
            "malformed, or a single field may exceed the parser's limit.",
            file=sys.stderr,
        )
        return 1

    try:
        result = analyse(rows)
    except (ValueError, TypeError, KeyError):
        print(
            f"error: {args.csv.name} parsed as CSV but its columns do not match "
            "the expected incident export.",
            file=sys.stderr,
        )
        return 1

    print(render_console(result, args.csv.name))

    if args.no_prompt:
        return 0

    try:
        answer = input("Export results to CSV? [y / n]: ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        print()
        return 0

    if answer == "y":
        rows_out = result_to_csv_rows(result)
        data = write_csv_bytes(rows_out)
        # Only the write is guarded — serialising the rows above cannot
        # fail on anything the user controls, and wrapping it too would
        # hide a genuine bug behind a filesystem message.
        try:
            args.out.write_bytes(data)
        except IsADirectoryError:
            print(
                f"error: {args.out} is a directory. Pass a file path to --out.",
                file=sys.stderr,
            )
            return 1
        except PermissionError:
            print(
                f"error: no permission to write {args.out}. Choose another "
                "path with --out.",
                file=sys.stderr,
            )
            return 1
        except OSError as exc:
            print(f"error: could not write {args.out} ({exc.strerror}).", file=sys.stderr)
            return 1
        print(f"Wrote {len(rows_out)} rows to {args.out}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
