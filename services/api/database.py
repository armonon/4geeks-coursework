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
from collections.abc import Iterator
from contextlib import contextmanager
from functools import wraps
from pathlib import Path
from typing import Any

from tinydb import TinyDB
from tinydb.storages import JSONStorage
from tinydb.table import Table

# services/api/data/trackflow.json by default.
_DEFAULT_DB_PATH = Path(__file__).resolve().parent / "data" / "trackflow.json"

SUPPLIERS_TABLE = "suppliers"
USERS_TABLE = "users"
PROFILES_TABLE = "profiles"
PASSWORD_RESETS_TABLE = "password_resets"
INCIDENTS_TABLE = "incidents"

_db: TinyDB | None = None
_db_path_in_use: Path | None = None

# Every TinyDB access — opening the handle *and* each table operation —
# is serialised through this one lock.
#
# TinyDB has no concurrency control at all: a single `insert` reads the
# whole JSON file, mutates it in memory, and writes it back. FastAPI runs
# sync route handlers in a threadpool, so two simultaneous requests
# genuinely interleave those steps. Unserialised, two concurrent writes
# leave the file truncated and every subsequent read dies with
# `JSONDecodeError` — the whole database, not just the record in flight.
#
# Re-entrant so a handler can hold it across a read-modify-write via
# `db_transaction()` while the table operations inside re-acquire it.
_lock = threading.RLock()


class _LockedTable:
    """A `Table` whose every operation runs under `_lock`.

    Wrapping the table rather than the storage is deliberate: the
    read-mutate-write cycle lives inside `Table.insert`/`update`, so
    locking only `JSONStorage.read`/`write` would still let two inserts
    compute the same document id.
    """

    def __init__(self, table: Table) -> None:
        self._table = table

    def __getattr__(self, name: str) -> Any:
        attribute = getattr(self._table, name)
        if not callable(attribute):
            return attribute

        @wraps(attribute)
        def locked(*args: Any, **kwargs: Any) -> Any:
            with _lock:
                return attribute(*args, **kwargs)

        return locked

    def __len__(self) -> int:
        with _lock:
            return len(self._table)

    def __iter__(self) -> Iterator[Any]:
        with _lock:
            # Materialise inside the lock; a lazy iterator would read the
            # file after the lock was released.
            return iter(list(self._table))


@contextmanager
def db_transaction() -> Iterator[None]:
    """Hold the database lock across a read-modify-write.

    Individual table calls are already atomic. This is for handlers that
    must decide *and then* write — checking a status transition, or a
    uniqueness constraint — where another request must not slip between
    the read and the write.
    """
    with _lock:
        yield


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


def suppliers_table() -> _LockedTable:
    return _LockedTable(get_db().table(SUPPLIERS_TABLE))


def users_table() -> _LockedTable:
    return _LockedTable(get_db().table(USERS_TABLE))


def profiles_table() -> _LockedTable:
    """Profiles are one-to-one with users, keyed by `user_id`."""
    return _LockedTable(get_db().table(PROFILES_TABLE))


def incidents_table() -> _LockedTable:
    """Incidents registered through the manager, plus the historical
    rows loaded by scripts/seed_incidents.py."""
    return _LockedTable(get_db().table(INCIDENTS_TABLE))


def password_resets_table() -> _LockedTable:
    """One row per issued reset token: the token HASH, its expiry, and
    whether it has been used. Server-side state is what makes a token
    invalidatable after use — a bare JWT could not be."""
    return _LockedTable(get_db().table(PASSWORD_RESETS_TABLE))


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
