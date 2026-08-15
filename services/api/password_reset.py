"""Password-reset token issuing and validation.

Design note — why not a bare JWT:

    A JWT carrying only an `exp` claim cannot be invalidated after use.
    Anyone holding the token could replay it until it expired. So the
    server keeps state: one row per issued token, and the row is marked
    used the moment a reset succeeds.

What is stored is the SHA-256 **hash** of the token, never the token
itself. A leak of the database therefore does not hand an attacker a
working reset link — the same reasoning that applies to passwords.
"""

from __future__ import annotations

import hashlib
import os
import secrets
import threading
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from tinydb import Query

from database import password_resets_table

# Serialises the check-then-mark-used sequence. Without it two
# simultaneous submissions of the same link could both be accepted —
# the same class of bug as the registration race.
_lock = threading.Lock()


def token_ttl_minutes() -> int:
    """Reset-link lifetime. The brief asks for 15-60 minutes."""
    raw = os.environ.get("RESET_TOKEN_EXPIRE_MINUTES", "30").strip()
    try:
        value = int(raw)
    except ValueError:
        return 30
    # Clamp: a very long-lived reset link is a security problem, and a
    # zero-minute one is unusable.
    return max(5, min(value, 120))


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _now() -> datetime:
    return datetime.now(UTC)


@dataclass
class ResetOutcome:
    ok: bool
    user_id: int | None = None
    reason: str = ""


def issue_token(user_id: int) -> tuple[str, int]:
    """Create a single-use reset token for a user.

    Returns (raw_token, ttl_minutes). Only the hash is persisted, so
    this is the one and only moment the raw value exists server-side.

    Any outstanding tokens for the same user are invalidated first:
    requesting a new link should make the previous one dead, otherwise
    an old email remains a live key to the account.
    """
    ttl = token_ttl_minutes()
    raw = secrets.token_urlsafe(32)

    query = Query()
    with _lock:
        password_resets_table().remove(query.user_id == user_id)
        password_resets_table().insert(
            {
                "user_id": user_id,
                "token_hash": _hash(raw),
                "created_at": _now().isoformat(),
                "expires_at": (_now() + timedelta(minutes=ttl)).isoformat(),
                "used_at": None,
            }
        )
    return raw, ttl


def consume_token(raw_token: str) -> ResetOutcome:
    """Validate a reset token and mark it used in one atomic step.

    Fails — deliberately with the same generic outcome shape — when the
    token is unknown, already used, or expired.
    """
    if not raw_token or not raw_token.strip():
        return ResetOutcome(False, reason="missing token")

    query = Query()
    with _lock:
        matches = password_resets_table().search(
            query.token_hash == _hash(raw_token.strip())
        )
        if not matches:
            return ResetOutcome(False, reason="unknown token")

        record = matches[0]

        if record.get("used_at") is not None:
            return ResetOutcome(False, reason="token already used")

        try:
            expires_at = datetime.fromisoformat(record["expires_at"])
        except (KeyError, ValueError):
            return ResetOutcome(False, reason="malformed token record")

        if _now() > expires_at:
            return ResetOutcome(False, reason="token expired")

        # Mark used inside the lock so a second concurrent submission of
        # the same link cannot also pass the check above.
        password_resets_table().update(
            {"used_at": _now().isoformat()}, doc_ids=[record.doc_id]
        )
        return ResetOutcome(True, user_id=int(record["user_id"]))


def invalidate_all_for_user(user_id: int) -> None:
    """Drop every outstanding token for a user.

    Called after a password change so any reset link already sitting in
    an inbox stops working.
    """
    query = Query()
    with _lock:
        password_resets_table().remove(query.user_id == user_id)
