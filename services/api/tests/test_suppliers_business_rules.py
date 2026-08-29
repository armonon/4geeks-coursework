"""Supplier directory — business rules (ticket API-042).

Plan: TESTING.md § "Backlog: API-042".

`test_suppliers_api.py` already covers the endpoints' request/response
behaviour. This module is about the *rules* CONTEXT.md lays down, which
are the part that costs money when they drift: a supplier priced in the
wrong currency is a wrong invoice, not a wrong pixel.

Three tiers as elsewhere — happy path, edge case, failure mode.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

VALID_SUPPLIER = {
    "name": "Nacex",
    "country": "Spain",
    "categories": ["carrier_last_mile"],
    "rate_per_shipment": 4.60,
    "currency": "EUR",
    "status": "active",
    "service_zone": "Aragón",
    "contact_email": "empresas@nacex.es",
}


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("TINYDB_PATH", str(tmp_path / "suppliers.json"))
    monkeypatch.setenv("SECRET_KEY", "test-secret-not-a-real-one-32-bytes-minimum")

    import database

    database.close_db()

    from main import app

    with TestClient(app) as c:
        c.post("/users", json={"email": "ops@trackflow.com", "password": "ops-password-1"})
        token = c.post(
            "/auth/login",
            json={"email": "ops@trackflow.com", "password": "ops-password-1"},
        ).json()["access_token"]
        c.headers.update({"Authorization": f"Bearer {token}"})
        yield c

    database.close_db()


def create(client: TestClient, **overrides):
    return client.post("/suppliers", json={**VALID_SUPPLIER, **overrides})


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


def test_a_valid_supplier_is_stored_with_its_rules_intact(client: TestClient) -> None:
    response = create(client)

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["name"] == "Nacex"
    assert body["currency"] == "EUR"
    assert body["rate_per_shipment"] == 4.60
    assert body["updated_at"], "updated_at was not stamped"


def test_a_supplier_can_hold_several_categories(client: TestClient) -> None:
    """DHL is both a last-mile and an international carrier — the model
    has to allow that rather than forcing one."""
    response = create(
        client,
        name="DHL Express España",
        categories=["carrier_last_mile", "carrier_international"],
    )

    assert response.status_code == 201
    assert len(response.json()["categories"]) == 2


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "country, currency", [("USA", "USD"), ("Spain", "EUR")]
)
def test_each_country_accepts_its_own_currency(
    client: TestClient, country: str, currency: str
) -> None:
    """CONTEXT § Business constraints. Both directions, so a table that
    happened to be right for one country cannot pass."""
    response = create(
        client, name=f"{country} carrier", country=country, currency=currency
    )

    assert response.status_code == 201, response.text


def test_duplicate_categories_do_not_produce_a_duplicated_entry(
    client: TestClient,
) -> None:
    """A repeated category would double-count the supplier in every
    category filter."""
    response = create(client, categories=["carrier_last_mile", "carrier_last_mile"])

    if response.status_code == 201:
        assert response.json()["categories"] == ["carrier_last_mile"]
    else:
        # Rejecting outright is equally acceptable; silently storing the
        # duplicate is not.
        assert response.status_code >= 400


def test_surrounding_whitespace_in_the_name_is_trimmed(client: TestClient) -> None:
    """Otherwise "Nacex" and "Nacex " are two suppliers in the directory."""
    response = create(client, name="  Nacex  ")

    if response.status_code == 201:
        assert response.json()["name"] == "Nacex"


def test_filters_combine_with_and_not_or(client: TestClient) -> None:
    """An OR would quietly widen every search and show suspended
    suppliers to someone filtering for active ones."""
    create(client, name="Spanish active", country="Spain", currency="EUR")
    create(
        client,
        name="US suspended",
        country="USA",
        currency="USD",
        status="suspended",
    )

    both = client.get("/suppliers?country=Spain&status=suspended").json()

    assert both == [], "the filters were combined with OR"


# ---------------------------------------------------------------------------
# Failure modes
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "country, wrong_currency", [("USA", "EUR"), ("Spain", "USD")]
)
def test_a_currency_that_contradicts_the_country_is_refused(
    client: TestClient, country: str, wrong_currency: str
) -> None:
    """The rule that costs real money if it slips."""
    response = create(
        client, name="Mismatched", country=country, currency=wrong_currency
    )

    assert response.status_code >= 400
    assert client.get("/suppliers").json() == [], "the bad row was stored"


@pytest.mark.parametrize("rate", [0, -1, -0.01])
def test_a_non_positive_rate_is_refused(client: TestClient, rate: float) -> None:
    """A zero or negative rate would make the freight quote nonsensical.

    Zero is included deliberately: it is falsy, so a truthiness check
    would let it through while a comparison would not.
    """
    response = create(client, rate_per_shipment=rate)

    assert response.status_code >= 400, f"rate {rate} was accepted"


def test_a_category_outside_the_closed_set_is_refused(client: TestClient) -> None:
    """The category list is a closed set from CONTEXT; a free-text value
    would never appear in any filter and the supplier would vanish."""
    response = create(client, categories=["consulting"])

    assert response.status_code >= 400


def test_an_unknown_country_is_refused(client: TestClient) -> None:
    """TrackFlow operates in two countries. A third has no currency rule,
    so it cannot be priced."""
    response = create(client, country="France", currency="EUR")

    assert response.status_code >= 400


def test_an_empty_name_is_refused(client: TestClient) -> None:
    for blank in ["", "   "]:
        assert create(client, name=blank).status_code >= 400


def test_reading_a_supplier_that_does_not_exist_is_a_404(client: TestClient) -> None:
    response = client.get("/suppliers/424242")

    assert response.status_code == 404
    assert "detail" in response.json()


def test_the_directory_requires_authentication(client: TestClient) -> None:
    """The supplier list carries commercial rates — it is not public."""
    client.headers.pop("Authorization")

    assert client.get("/suppliers").status_code == 401
    assert create(client).status_code == 401
