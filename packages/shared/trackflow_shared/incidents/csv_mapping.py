"""Analyzer CSV → incident-manager model.

CONTEXT is explicit that the analyzer's CSV schema is *not* this
manager's model: different field names, status values, and category
codes. Rows must be transformed before insert, never copied straight in.

Row-level validity ("is this CSV row usable at all?") is deliberately
NOT re-implemented here — it calls `validate_record` from
`incident_analyzer`, the package built for the analyzer milestone. That
keeps one definition of a valid row across the monorepo, which is the
whole point of this shared package.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

# The analyzer's rules, reused rather than duplicated.
from incident_analyzer.analyzer import RULE_LABELS, validate_record

from .model import (
    TITLE_MAX_LENGTH,
    Branch,
    Category,
    Origin,
    Status,
)

# CONTEXT § Status mapping
STATUS_MAP: dict[str, Status] = {
    "OPEN": Status.OPEN,
    "CLOSED": Status.RESOLVED,
    "DISCARDED": Status.DISCARDED,
}

# CONTEXT § Category mapping (TrackFlow).
# Note DELAYED_DELIVERY and DAMAGE both fold into carrier_issue — which
# is why the expected carrier_issue total (45) is larger than either
# source category alone (38 + 7).
CATEGORY_MAP: dict[str, Category] = {
    "LOST_PARCEL": Category.LOST_PARCEL,
    "DELAYED_DELIVERY": Category.CARRIER_ISSUE,
    "WRONG_ADDRESS": Category.DELIVERY_FAILURE,
    "RETURN_REQUEST": Category.RETURNS_ISSUE,
    "DAMAGE": Category.CARRIER_ISSUE,
}

# CONTEXT § Branch mapping (TrackFlow)
BRANCH_MAP: dict[str, Branch] = {
    "US": Branch.LA_OFFICE,
    "ES": Branch.ZARAGOZA_OFFICE,
}

# CONTEXT: every seed record is customer-reported.
SEED_ORIGIN = Origin.CUSTOMER


@dataclass
class MappedRow:
    """One CSV row, either transformed or rejected with a reason."""

    ok: bool
    incident: dict | None = None
    external_id: str | None = None
    reason: str = ""


def _clean(value: object) -> str:
    return "" if value is None else str(value).strip()


def map_row(row: dict) -> MappedRow:
    """Transform one analyzer CSV row into an incident.

    Rejects (rather than raises) so the caller can count and report
    every bad row instead of stopping at the first.
    """
    external_id = _clean(row.get("incident_id")) or None

    # 1. Row-level validity, using the analyzer's own rules.
    verdict = validate_record(row)
    if not verdict.valid:
        label = RULE_LABELS.get(verdict.failed_rule or "", verdict.failed_rule or "invalid")
        return MappedRow(False, external_id=external_id, reason=label)

    # 2. description -> title: first 120 chars, trimmed; drop if empty.
    description = _clean(row.get("description"))
    title = description[:TITLE_MAX_LENGTH].strip()
    if not title:
        return MappedRow(False, external_id=external_id, reason="empty description")

    # 3. Closed-set mappings.
    raw_status = _clean(row.get("status")).upper()
    status = STATUS_MAP.get(raw_status)
    if status is None:
        return MappedRow(
            False, external_id=external_id, reason=f"unmapped status '{raw_status}'"
        )

    raw_category = _clean(row.get("category")).upper()
    category = CATEGORY_MAP.get(raw_category)
    if category is None:
        return MappedRow(
            False, external_id=external_id, reason=f"unmapped category '{raw_category}'"
        )

    raw_country = _clean(row.get("country")).upper()
    branch = BRANCH_MAP.get(raw_country)
    if branch is None:
        return MappedRow(
            False, external_id=external_id, reason=f"unmapped country '{raw_country}'"
        )

    # 4. date -> created_at at midnight UTC; updated_at matches on insert.
    raw_date = _clean(row.get("date"))
    try:
        created = datetime.strptime(raw_date, "%Y-%m-%d").replace(tzinfo=UTC)
    except ValueError:
        return MappedRow(
            False, external_id=external_id, reason=f"unparseable date '{raw_date}'"
        )
    created_at = created.isoformat()

    return MappedRow(
        ok=True,
        external_id=external_id,
        incident={
            "title": title,
            "description": description,
            "category": category.value,
            "status": status.value,
            "origin": SEED_ORIGIN.value,
            "branch": branch.value,
            "created_at": created_at,
            "updated_at": created_at,
            # Duplicate control only — CONTEXT says incident_id is not
            # part of the model, but we need something to dedupe on.
            "source_incident_id": external_id,
        },
    )
