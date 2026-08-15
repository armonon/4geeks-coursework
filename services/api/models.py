"""Pydantic models for the TrackFlow supplier directory.

Every field name, category, and status here is transcribed directly
from CONTEXT.md § "Supplier model". Do not rename or extend without
changing the CONTEXT first — the API contract and the seeder both
depend on these exact strings.
"""

from __future__ import annotations

from datetime import UTC, datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator, model_validator

# ---------------------------------------------------------------------------
# Enumerations — the closed value sets from CONTEXT.md
# ---------------------------------------------------------------------------


class Country(str, Enum):
    """Contract country. TrackFlow operates in exactly two markets."""

    USA = "USA"
    SPAIN = "Spain"


class Currency(str, Enum):
    USD = "USD"
    EUR = "EUR"


class Status(str, Enum):
    """CONTEXT: VALID_STATUSES = ["active", "suspended"].

    Suppliers are suspended, never deleted, when incident rates spike —
    the suspension history is operationally relevant.
    """

    ACTIVE = "active"
    SUSPENDED = "suspended"


class Category(str, Enum):
    """CONTEXT: VALID_CATEGORIES — all eight, verbatim."""

    CARRIER_LAST_MILE = "carrier_last_mile"
    CARRIER_INTERNATIONAL = "carrier_international"
    WAREHOUSE_SUPPLIES = "warehouse_supplies"
    PACKAGING_MATERIALS = "packaging_materials"
    REVERSE_LOGISTICS = "reverse_logistics"
    FLEET_MAINTENANCE = "fleet_maintenance"
    IT_AND_WMS_SOFTWARE = "it_and_wms_software"
    CLEANING_AND_FACILITIES = "cleaning_and_facilities"


# CONTEXT § Business constraints: "A supplier from 'USA' must have
# currency = 'USD'. A supplier from 'Spain' must have currency = 'EUR'."
CURRENCY_FOR_COUNTRY: dict[Country, Currency] = {
    Country.USA: Currency.USD,
    Country.SPAIN: Currency.EUR,
}


def utcnow() -> datetime:
    return datetime.now(UTC)


# ---------------------------------------------------------------------------
# Input models
# ---------------------------------------------------------------------------


class SupplierBase(BaseModel):
    """Fields a client is allowed to send.

    `updated_at` is deliberately absent — it is system-generated
    (CONTEXT: "datetime, system-generated").
    """

    name: str = Field(..., min_length=1, description="Supplier trade name")
    country: Country = Field(..., description="Contract country: USA or Spain")
    categories: list[Category] = Field(
        ...,
        min_length=1,
        description="Type of service or product supplied. At least one.",
    )
    rate_per_shipment: float = Field(
        ...,
        gt=0,
        description=(
            "Current rate per shipment or service unit in the contract "
            "currency. Must be greater than zero."
        ),
    )
    currency: Currency = Field(..., description="USD for USA, EUR for Spain")
    status: Status = Field(
        default=Status.ACTIVE, description="active or suspended"
    )
    service_zone: str | None = Field(
        default=None, description="Supplier coverage zone, e.g. 'West Coast'"
    )
    contact_email: str | None = Field(
        default=None, description="Supplier contact email"
    )
    notes: str | None = Field(default=None, description="Operations team notes")

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("name cannot be blank")
        return stripped

    @field_validator("categories")
    @classmethod
    def _no_duplicate_categories(cls, value: list[Category]) -> list[Category]:
        # Preserve order, drop repeats — "carrier_last_mile" twice is a
        # client bug, not a meaningful distinction.
        seen: list[Category] = []
        for category in value:
            if category not in seen:
                seen.append(category)
        return seen

    @model_validator(mode="after")
    def _currency_matches_country(self) -> SupplierBase:
        expected = CURRENCY_FOR_COUNTRY[self.country]
        if self.currency != expected:
            raise ValueError(
                f"currency must be '{expected.value}' for country "
                f"'{self.country.value}', got '{self.currency.value}'"
            )
        return self


class SupplierCreate(SupplierBase):
    """POST /suppliers body."""


class RateUpdate(BaseModel):
    """PATCH /suppliers/{id}/rate body.

    CONTEXT: "Do not accept rates equal to or less than zero."
    """

    rate_per_shipment: float = Field(
        ..., gt=0, description="New rate. Must be greater than zero."
    )


class StatusUpdate(BaseModel):
    """PATCH /suppliers/{id}/status body.

    Typed as the Status enum, so any value outside
    {"active", "suspended"} is rejected with 422 before it can reach
    TinyDB.
    """

    status: Status = Field(..., description="active or suspended")


# ---------------------------------------------------------------------------
# Response model
# ---------------------------------------------------------------------------


class SupplierOut(SupplierBase):
    """What the API returns: the stored record plus its TinyDB id and
    the system-generated `updated_at`."""

    id: int = Field(..., description="TinyDB-assigned document id")
    updated_at: datetime = Field(
        ..., description="Timestamp of the last rate update (system-generated)"
    )


class DeleteResponse(BaseModel):
    id: int
    deleted: bool
    message: str
