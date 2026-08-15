"""The incident domain model.

Every value set here is transcribed from CONTEXT.md. This module is the
single definition used by both `scripts/seed_incidents.py` and
`services/api` — if the two disagreed, seeded data and the API would
drift apart.

Deliberately dependency-free (no FastAPI, no Pydantic) so a plain
script can import it without pulling in a web framework.
"""

from __future__ import annotations

from enum import Enum

# ---------------------------------------------------------------------------
# Closed value sets — CONTEXT.md
# ---------------------------------------------------------------------------


class Status(str, Enum):
    """CONTEXT § Status and Lifecycle."""

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    DISCARDED = "discarded"


class Origin(str, Enum):
    """CONTEXT § Origins."""

    CUSTOMER = "customer"
    BRANCH = "branch"
    INTERNAL = "internal"


class Branch(str, Enum):
    """CONTEXT § TrackFlow Warehouses and Offices."""

    CENTRAL = "central"
    LA_WAREHOUSE = "la_warehouse"
    LA_OFFICE = "la_office"
    ZARAGOZA_WAREHOUSE = "zaragoza_warehouse"
    ZARAGOZA_OFFICE = "zaragoza_office"


class Category(str, Enum):
    """CONTEXT § Incident Categories — all nine."""

    LOST_PARCEL = "lost_parcel"
    DELIVERY_FAILURE = "delivery_failure"
    INVENTORY_DISCREPANCY = "inventory_discrepancy"
    CARRIER_ISSUE = "carrier_issue"
    RETURNS_ISSUE = "returns_issue"
    WAREHOUSE_INCIDENT = "warehouse_incident"
    SYSTEM_FAILURE = "system_failure"
    CLIENT_COMPLAINT = "client_complaint"
    OTHER = "other"


# Display labels exactly as CONTEXT specifies. The UI must not invent
# its own wording for these.
BRANCH_LABELS: dict[Branch, str] = {
    Branch.CENTRAL: "Central",
    Branch.LA_WAREHOUSE: "Los Angeles — Warehouse",
    Branch.LA_OFFICE: "Los Angeles — Office",
    Branch.ZARAGOZA_WAREHOUSE: "Zaragoza — Warehouse",
    Branch.ZARAGOZA_OFFICE: "Zaragoza — Office",
}

# CONTEXT § "When the origin is internal or customer and does not
# correspond to a specific facility, use central."
DEFAULT_BRANCH = Branch.CENTRAL

TITLE_MAX_LENGTH = 120


# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------

# CONTEXT: open → in_progress, open → discarded,
#          in_progress → resolved, in_progress → discarded.
#          resolved and discarded are final.
ALLOWED_TRANSITIONS: dict[Status, frozenset[Status]] = {
    Status.OPEN: frozenset({Status.IN_PROGRESS, Status.DISCARDED}),
    Status.IN_PROGRESS: frozenset({Status.RESOLVED, Status.DISCARDED}),
    Status.RESOLVED: frozenset(),
    Status.DISCARDED: frozenset(),
}

FINAL_STATUSES: frozenset[Status] = frozenset({Status.RESOLVED, Status.DISCARDED})


def is_final(status: Status) -> bool:
    return status in FINAL_STATUSES


def can_transition(current: Status, target: Status) -> bool:
    return target in ALLOWED_TRANSITIONS.get(current, frozenset())


def transition_error(current: Status, target: Status) -> str:
    """A message a support agent can act on, not a bare rejection."""
    if current == target:
        return f"This incident is already '{current.value}'."
    if is_final(current):
        return (
            f"'{current.value}' is a final state — it cannot change to "
            f"'{target.value}'."
        )
    allowed = sorted(s.value for s in ALLOWED_TRANSITIONS[current])
    return (
        f"Cannot move an incident from '{current.value}' to "
        f"'{target.value}'. Allowed from '{current.value}': {', '.join(allowed)}."
    )


# ---------------------------------------------------------------------------
# Field validation
# ---------------------------------------------------------------------------


class FieldError(ValueError):
    """Carries the offending field name so the API can point the user at it.

    The rubric requires validation errors to identify the problematic
    field rather than returning a generic failure.
    """

    def __init__(self, field: str, message: str) -> None:
        super().__init__(message)
        self.field = field
        self.message = message


def _clean(value: object) -> str:
    return "" if value is None else str(value).strip()


def _reject_containers(value: object, field: str) -> None:
    """Refuse a list or object before `str()` flattens it into a repr.

    Without this, `{"title": {"a": 1}}` was accepted and stored as the
    literal `"{'a': 1}"` — a 201 for a record nobody can use. Verified
    against the running API before the guard existed.
    """
    if isinstance(value, dict | list | tuple | set):
        raise FieldError(
            field,
            f"{field.capitalize()} must be a single text value, "
            "not a list or an object.",
        )


def validate_title(value: object) -> str:
    _reject_containers(value, "title")
    title = _clean(value)
    if not title:
        raise FieldError("title", "Title is required.")
    if len(title) > TITLE_MAX_LENGTH:
        raise FieldError(
            "title", f"Title must be {TITLE_MAX_LENGTH} characters or fewer."
        )
    return title


def validate_description(value: object) -> str:
    _reject_containers(value, "description")
    description = _clean(value)
    if not description:
        raise FieldError("description", "Description is required.")
    return description


def _validate_enum(raw: object, enum_cls, field: str):
    _reject_containers(raw, field)
    value = _clean(raw)
    if not value:
        raise FieldError(field, f"{field.capitalize()} is required.")
    try:
        return enum_cls(value)
    except ValueError:
        allowed = ", ".join(m.value for m in enum_cls)
        raise FieldError(
            field, f"'{value}' is not a valid {field}. Allowed: {allowed}."
        ) from None


def validate_status(value: object) -> Status:
    return _validate_enum(value, Status, "status")


def validate_origin(value: object) -> Origin:
    return _validate_enum(value, Origin, "origin")


def validate_branch(value: object) -> Branch:
    return _validate_enum(value, Branch, "branch")


def validate_category(value: object) -> Category:
    return _validate_enum(value, Category, "category")


def validate_new_status(value: object) -> Status:
    """Status for a *newly registered* incident.

    CONTEXT is explicit that the lifecycle starts at `open`, so this is
    not a free field. Left to the caller, a client could POST
    `status: "resolved"` and mint an incident straight into a final
    state — one that no transition can ever leave, and that lands in the
    CEO's summary as work that was never actually done.

    Omitting it is the normal case. Sending `open` explicitly is fine;
    anything else is rejected rather than silently rewritten, so a
    caller doing it wrong finds out.
    """
    if value is None or _clean(value) == "":
        return Status.OPEN
    status = validate_status(value)
    if status is not Status.OPEN:
        raise FieldError(
            "status",
            f"New incidents always start as '{Status.OPEN.value}'. "
            f"Register it first, then move it to '{status.value}'.",
        )
    return status


def validate_incident(payload: dict) -> dict:
    """Validate a whole incident. Raises FieldError on the first problem.

    Returns a dict of cleaned, enum-typed values ready to persist.
    `branch` is required for every origin — CONTEXT says to use
    `central` when the report is not tied to a facility, rather than
    leaving it blank.

    This is the *registration* validator, so `status` is pinned to
    `open`; changing status afterwards goes through the lifecycle rules
    above. The seeder does not use this function — historical rows carry
    their own already-final statuses from the CSV.
    """
    return {
        "title": validate_title(payload.get("title")),
        "description": validate_description(payload.get("description")),
        "category": validate_category(payload.get("category")),
        "status": validate_new_status(payload.get("status")),
        "origin": validate_origin(payload.get("origin")),
        "branch": validate_branch(payload.get("branch")),
    }
