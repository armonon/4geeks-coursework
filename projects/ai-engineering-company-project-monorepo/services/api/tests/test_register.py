"""POST /users — registration.

Plan: TESTING.md § "POST /users — register".

These assert what registration *decides* — is this email already taken,
what gets stored, what happens under a race — not how FastAPI serialises
the response.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient

from tests.conftest import PASSWORD, can_log_in

NEW = {"email": "nuria@trackflow.com", "password": PASSWORD}


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


def test_registering_creates_an_account_that_can_immediately_log_in(
    api: TestClient,
) -> None:
    response = api.post("/users", json=NEW)

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["email"] == NEW["email"]
    assert body["is_active"] is True
    # The account is usable, which is the only thing registration promises.
    assert can_log_in(api, NEW["email"], PASSWORD)


def test_registration_creates_exactly_one_linked_profile(api: TestClient) -> None:
    """A user with no profile, or two, breaks the profile endpoints."""
    api.post("/users", json=NEW)
    token = api.post("/auth/login", json=NEW).json()["access_token"]

    me = api.get("/auth/me", headers={"Authorization": f"Bearer {token}"}).json()

    assert me["profile"] is not None
    assert me["profile"]["user_id"] == me["id"]


def test_the_password_is_never_stored_or_returned_in_plaintext(
    api: TestClient,
) -> None:
    """A database leak must not be a password leak."""
    api.post("/users", json=NEW)

    import database

    stored = database.users_table().all()[0]
    assert PASSWORD not in str(stored)
    assert stored["hashed_password"] != PASSWORD
    # bcrypt hashes carry a recognisable prefix and are not reversible.
    assert stored["hashed_password"].startswith("$2")


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "variant",
    ["Nuria@trackflow.com", "NURIA@TRACKFLOW.COM", "  nuria@trackflow.com  "],
)
def test_email_is_normalised_so_variants_are_the_same_account(
    api: TestClient, variant: str
) -> None:
    """Without normalisation, one person can hold several accounts."""
    api.post("/users", json=NEW)

    duplicate = api.post("/users", json={"email": variant, "password": PASSWORD})

    assert duplicate.status_code == 409, (
        f"{variant!r} was treated as a different account"
    )
    # And the variant still logs in to the original account.
    assert can_log_in(api, variant, PASSWORD)


@pytest.mark.parametrize("length", [71, 72])
def test_a_password_at_the_bcrypt_limit_is_accepted(
    api: TestClient, length: int
) -> None:
    """72 bytes is bcrypt's input limit; 72 must still work."""
    response = api.post(
        "/users", json={"email": f"len{length}@trackflow.com", "password": "A" * length}
    )
    assert response.status_code == 201, response.text


def test_a_password_over_the_bcrypt_limit_is_rejected_not_truncated(
    api: TestClient,
) -> None:
    """Truncating would make every 73+ byte password with the same first
    72 bytes equivalent. Rejecting is the honest behaviour."""
    response = api.post(
        "/users", json={"email": "toolong@trackflow.com", "password": "A" * 73}
    )

    assert response.status_code == 422
    assert "72" in response.json()["detail"]


@pytest.mark.parametrize("blank", ["", "   "])
def test_an_empty_password_is_refused(api: TestClient, blank: str) -> None:
    response = api.post("/users", json={"email": "blank@trackflow.com", "password": blank})

    assert response.status_code >= 400
    assert not can_log_in(api, "blank@trackflow.com", blank)


# ---------------------------------------------------------------------------
# Failure modes
# ---------------------------------------------------------------------------


def test_a_duplicate_registration_leaves_the_original_account_untouched(
    api: TestClient, registered: dict
) -> None:
    """The interesting part is not the 409 — it is that the first
    account's password still works afterwards."""
    clash = api.post(
        "/users", json={"email": registered["email"], "password": "a-different-password"}
    )

    assert clash.status_code == 409
    assert can_log_in(api, registered["email"], registered["password"])
    assert not can_log_in(api, registered["email"], "a-different-password")


def test_simultaneous_registrations_of_one_address_produce_one_account(
    api: TestClient,
) -> None:
    """The regression this suite exists to prevent.

    Before the uniqueness check and the insert were made atomic, twelve
    concurrent requests produced twelve 201s and eleven unusable duplicate
    accounts — only the first password could ever log in.
    """
    payloads = [
        {"email": "race@trackflow.com", "password": f"password-number-{i}"}
        for i in range(12)
    ]

    with ThreadPoolExecutor(max_workers=12) as pool:
        codes = list(pool.map(lambda p: api.post("/users", json=p).status_code, payloads))

    assert codes.count(201) == 1, f"expected one winner, got {codes.count(201)}"
    assert codes.count(409) == 11

    import database

    accounts = [
        u for u in database.users_table().all() if u["email"] == "race@trackflow.com"
    ]
    assert len(accounts) == 1, f"{len(accounts)} rows for one address"
