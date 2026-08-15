"""Service layer for users and profiles.

Kept separate from the routers so the rules (unique email, hash before
store, profile created alongside the user, cascade delete) are testable
without HTTP and reusable from anywhere.
"""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status
from tinydb import Query
from tinydb.table import Document

from database import db_transaction, profiles_table, users_table
from models import (
    ProfileOut,
    ProfileUpdate,
    Role,
    UserCreate,
    UserInDB,
    UserOut,
    UserUpdate,
    utcnow,
)
from security import hash_password

# The read-then-write sequences below use `db_transaction()`, the same
# database-wide lock every other table operation takes.
#
# TinyDB has no unique constraint, so "is this email taken?" followed by
# "insert" is a check-then-act race: FastAPI runs sync handlers in a
# threadpool. Measured before this was guarded: 12 simultaneous
# registrations of one address produced 11 duplicate accounts, and only
# the first one's password could ever log in.

# ---------------------------------------------------------------------------
# Mapping helpers
# ---------------------------------------------------------------------------


def _user_in_db(document: Document) -> UserInDB:
    return UserInDB(**{**document, "id": document.doc_id})


def to_user_out(user: UserInDB) -> UserOut:
    """Strip the hash. Routes must return this, never UserInDB."""
    return UserOut(
        id=user.id,
        email=user.email,
        is_active=user.is_active,
        role=user.role,
        created_at=user.created_at,
    )


def _profile_out(document: Document) -> ProfileOut:
    return ProfileOut(**{**document, "id": document.doc_id})


# ---------------------------------------------------------------------------
# Reads
# ---------------------------------------------------------------------------


def get_user_by_id(user_id: int) -> UserInDB | None:
    document = users_table().get(doc_id=user_id)
    return _user_in_db(document) if document is not None else None


def get_user_by_email(email: str) -> UserInDB | None:
    query = Query()
    matches = users_table().search(query.email == email.strip().lower())
    if not matches:
        return None
    return _user_in_db(matches[0])


def list_users() -> list[UserOut]:
    return [to_user_out(_user_in_db(d)) for d in users_table().all()]


def get_profile_by_user_id(user_id: int) -> ProfileOut | None:
    query = Query()
    matches = profiles_table().search(query.user_id == user_id)
    return _profile_out(matches[0]) if matches else None


# ---------------------------------------------------------------------------
# Writes
# ---------------------------------------------------------------------------


def create_user(payload: UserCreate, role: Role = Role.USER) -> UserOut:
    """Create a user and its linked profile in one operation.

    The password is hashed here — plain text never reaches TinyDB.
    `role` defaults to `user`; the public POST /users route never
    passes anything else.
    """
    # Hash outside the transaction — bcrypt is deliberately slow and
    # holding the database lock through it would serialise every
    # registration.
    hashed = hash_password(payload.password)

    with db_transaction():
        if get_user_by_email(payload.email) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A user with email '{payload.email}' already exists.",
            )

        record: dict[str, Any] = {
            "email": payload.email,
            "hashed_password": hashed,
            "is_active": True,
            "role": role.value,
            "created_at": utcnow().isoformat(),
        }
        user_id = users_table().insert(record)

        # One-to-one profile, created even when no fields were supplied,
        # so GET /profiles/me always has something to return.
        profiles_table().insert(
            {
                "user_id": user_id,
                "name": payload.name,
                "phone": payload.phone,
                "address": payload.address,
            }
        )

    return to_user_out(_user_in_db(Document(record, doc_id=user_id)))


def update_user(user_id: int, payload: UserUpdate, *, allow_role: bool) -> UserOut:
    """Update credential fields.

    `allow_role` is decided by the route from the caller's role — a
    non-admin cannot promote themselves.
    """
    # Reject a forbidden role change before taking the lock or hashing.
    if payload.role is not None and not allow_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only an admin may change a user's role.",
        )

    # Hash outside the lock; bcrypt is intentionally slow.
    new_hash = (
        hash_password(payload.password) if payload.password is not None else None
    )

    # Same check-then-act hazard as create_user: the email uniqueness
    # check and the write must not be separable.
    with db_transaction():
        existing = get_user_by_id(user_id)
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No user with id {user_id}.",
            )

        changes: dict[str, Any] = {}

        if payload.email is not None and payload.email != existing.email:
            clash = get_user_by_email(payload.email)
            if clash is not None and clash.id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"A user with email '{payload.email}' already exists.",
                )
            changes["email"] = payload.email

        if new_hash is not None:
            changes["hashed_password"] = new_hash

        if payload.is_active is not None:
            changes["is_active"] = payload.is_active

        if payload.role is not None:
            changes["role"] = payload.role.value

        if changes:
            users_table().update(changes, doc_ids=[user_id])

        refreshed = get_user_by_id(user_id)

    assert refreshed is not None
    return to_user_out(refreshed)


def delete_user(user_id: int) -> dict[str, Any]:
    """Delete a user and cascade to the linked profile."""
    if get_user_by_id(user_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No user with id {user_id}.",
        )

    users_table().remove(doc_ids=[user_id])

    query = Query()
    removed_profiles = profiles_table().remove(query.user_id == user_id)

    return {
        "id": user_id,
        "deleted": True,
        "profile_removed": bool(removed_profiles),
        "message": f"User {user_id} and their profile were deleted.",
    }


def update_profile(user_id: int, payload: ProfileUpdate) -> ProfileOut:
    query = Query()
    matches = profiles_table().search(query.user_id == user_id)
    if not matches:
        # Self-heal: a user should always have a profile row.
        profile_id = profiles_table().insert(
            {
                "user_id": user_id,
                "name": payload.name,
                "phone": payload.phone,
                "address": payload.address,
            }
        )
        document = profiles_table().get(doc_id=profile_id)
        assert document is not None
        return _profile_out(document)

    profile_id = matches[0].doc_id
    # exclude_unset so omitting a field leaves it alone rather than nulling it.
    changes = payload.model_dump(exclude_unset=True)
    if changes:
        profiles_table().update(changes, doc_ids=[profile_id])

    document = profiles_table().get(doc_id=profile_id)
    assert document is not None
    return _profile_out(document)
