"""TinyDB initialisation for the TrackFlow supplier directory.

TinyDB is a deliberate choice for this milestone: a JSON-file database
with no server, no migrations, and no external dependency. It is the
right size for a directory of a few hundred suppliers, and it hands us
document ids for free.

The database file path is resolved at call time from `TINYDB_PATH` so
tests can point at a throwaway file without touching real data.
"""

from __future__ import annotations

import os
import threading
from pathlib import Path

from tinydb import TinyDB
from tinydb.storages import JSONStorage
from tinydb.table import Table

# services/api/data/trackflow.json by default.
_DEFAULT_DB_PATH = Path(__file__).resolve().parent / "data" / "trackflow.json"

SUPPLIERS_TABLE = "suppliers"
USERS_TABLE = "users"
PROFILES_TABLE = "profiles"
PASSWORD_RESETS_TABLE = "password_resets"

# TinyDB's JSON storage is not safe against concurrent writers; FastAPI
# runs sync handlers in a threadpool, so serialise access here.
_lock = threading.Lock()
_db: TinyDB | None = None
_db_path_in_use: Path | None = None


def db_path() -> Path:
    override = os.environ.get("TINYDB_PATH")
    return Path(override) if override else _DEFAULT_DB_PATH


def get_db() -> TinyDB:
    """Return the process-wide TinyDB handle, opening it on first use.

    Re-opens automatically if TINYDB_PATH changed since the last call,
    which is what makes the test fixtures work.
    """
    global _db, _db_path_in_use

    path = db_path()
    with _lock:
        if _db is None or _db_path_in_use != path:
            if _db is not None:
                _db.close()
            path.parent.mkdir(parents=True, exist_ok=True)
            _db = TinyDB(path, storage=JSONStorage, indent=2, ensure_ascii=False)
            _db_path_in_use = path
        return _db


def suppliers_table() -> Table:
    return get_db().table(SUPPLIERS_TABLE)


def users_table() -> Table:
    return get_db().table(USERS_TABLE)


def profiles_table() -> Table:
    """Profiles are one-to-one with users, keyed by `user_id`."""
    return get_db().table(PROFILES_TABLE)


def password_resets_table() -> Table:
    """One row per issued reset token: the token HASH, its expiry, and
    whether it has been used. Server-side state is what makes a token
    invalidatable after use — a bare JWT could not be."""
    return get_db().table(PASSWORD_RESETS_TABLE)


def close_db() -> None:
    """Close the handle. Used by tests between cases."""
    global _db, _db_path_in_use
    with _lock:
        if _db is not None:
            _db.close()
        _db = None
        _db_path_in_use = None


def reset_db() -> None:
    """Drop every record. Test-only — never exposed over HTTP."""
    with _lock:
        if _db is not None:
            _db.drop_tables()
