"""POST /auth/login.

Plan: TESTING.md § "POST /auth/login".

The endpoint's job is a single decision — are these credentials good, and
if not, does the refusal leak anything. Both halves are tested here.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from tests.conftest import EMAIL, PASSWORD

# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


def test_correct_credentials_return_a_token_for_that_user(
    api: TestClient, registered: dict
) -> None:
    response = api.post("/auth/login", json={"email": EMAIL, "password": PASSWORD})

    assert response.status_code == 200, response.text
    token = response.json()["access_token"]

    # The token is only meaningful if it resolves back to the right person.
    me = api.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["email"] == EMAIL
    assert me.json()["id"] == registered["user"]["id"]


def test_the_oauth2_form_body_works_as_well_as_json(
    api: TestClient, registered: dict
) -> None:
    """Two body shapes are accepted, so both need testing — Swagger's
    Authorize dialog posts a form with `username`, the frontend posts
    JSON with `email`. A change to one parser must not break the other.
    """
    response = api.post(
        "/auth/login", data={"username": EMAIL, "password": PASSWORD}
    )

    assert response.status_code == 200, response.text
    assert response.json()["access_token"]


def test_the_expiry_reported_matches_the_configured_lifetime(
    api: TestClient, registered: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    """`expires_in` is what a client uses to schedule its refresh; if it
    disagrees with the token's real `exp`, clients log out early or late.
    """
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "45")

    body = api.post("/auth/login", json={"email": EMAIL, "password": PASSWORD}).json()

    assert body["expires_in"] == 45 * 60


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "variant", ["Ana@trackflow.com", "ANA@TRACKFLOW.COM", "  ana@trackflow.com  "]
)
def test_login_normalises_the_email_the_same_way_registration_does(
    api: TestClient, registered: dict, variant: str
) -> None:
    """If the two normalisations ever diverge, users who registered with
    one casing can no longer sign in."""
    response = api.post("/auth/login", json={"email": variant, "password": PASSWORD})

    assert response.status_code == 200, f"{variant!r} could not sign in"


def test_a_password_beyond_the_bcrypt_limit_does_not_authenticate(
    api: TestClient, registered: dict
) -> None:
    """bcrypt only reads the first 72 bytes of its input.

    If verification truncated, then any string sharing the account's first
    72 bytes would authenticate. Verified: it does not.
    """
    response = api.post(
        "/auth/login", json={"email": EMAIL, "password": PASSWORD + "X" * 200}
    )

    assert response.status_code == 401


def test_an_empty_password_never_authenticates(
    api: TestClient, registered: dict
) -> None:
    response = api.post("/auth/login", json={"email": EMAIL, "password": ""})

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Failure modes
# ---------------------------------------------------------------------------


def test_a_wrong_password_and_an_unknown_email_are_indistinguishable(
    api: TestClient, registered: dict
) -> None:
    """Different responses would let anyone test which addresses are
    registered — an account-enumeration oracle. Status *and* body must
    match."""
    wrong_password = api.post(
        "/auth/login", json={"email": EMAIL, "password": "not-the-password"}
    )
    unknown_email = api.post(
        "/auth/login", json={"email": "nobody@trackflow.com", "password": PASSWORD}
    )

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


def test_a_deactivated_account_cannot_log_in_with_the_right_password(
    api: TestClient, registered: dict
) -> None:
    """Deactivation has to be enforced at login, not only in the UI."""
    import database

    database.users_table().update({"is_active": False}, doc_ids=[registered["user"]["id"]])

    response = api.post("/auth/login", json={"email": EMAIL, "password": PASSWORD})

    assert response.status_code == 401
    assert "deactivated" in response.json()["detail"].lower()


def test_a_corrupted_stored_hash_is_a_failed_login_not_a_crash(
    api: TestClient, registered: dict
) -> None:
    """A hash damaged by a bad migration must lock the account, not take
    the endpoint down with a 500."""
    import database

    database.users_table().update(
        {"hashed_password": "not-a-bcrypt-hash"}, doc_ids=[registered["user"]["id"]]
    )

    response = api.post("/auth/login", json={"email": EMAIL, "password": PASSWORD})

    assert response.status_code == 401
    assert response.status_code != 500
