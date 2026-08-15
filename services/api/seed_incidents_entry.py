"""Console-script shim so `uv run seed-incidents` runs scripts/seed_incidents.py.

The script itself lives in scripts/ per the required monorepo layout;
this only makes it runnable through the API project's uv environment.
"""

from __future__ import annotations

import sys
from pathlib import Path

_SCRIPTS = Path(__file__).resolve().parent.parent.parent / "scripts"
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from seed_incidents import main  # noqa: E402

__all__ = ["main"]
