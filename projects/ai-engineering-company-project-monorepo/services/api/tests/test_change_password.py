"""POST /auth/change-password.

Plan: TESTING.md § "POST /auth/change-password".

Unlike reset, this one runs while the user is signed in — so the tests
care about who the caller is as much as what they send.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from tests.conftest import EMAIL, PASSWORD, can_log_in

NEW_PASSWORD = "an-entirely-new-password"


def change(client: TestClient, current: str, new: str = NEW_PASSWORD):
    return client.post(
        "/auth/change-password",
        json={"current_password": current, "new_password": new},
    )


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


def test_the_new_password_works_and_the_old_one_stops(
    signed_in: TestClient,
) -> None:
    response = change(signed_in, PASSWORD)

    assert response.status_code == 200, response.text
    assert can_log_in(signed_in, EMAIL, NEW_PASSWORD)
    assert not can_log_in(signed_in, EMAIL, PASSWORD), "the old password still works"


def test_only_the_calling_account_is_affected(
    signed_in: TestClient, api: TestClient
) -> None:
    """The user id comes from the token, so a bug here would change
    somebody else's password."""
    other = {"email": "bystander@trackflow.com", "password": "bystander-password"}
    saved = api.headers.pop("Authorization")
    api.post("/users", json=other)
    api.headers["Authorization"] = saved

    change(signed_in, PASSWORD)

    assert can_log_in(signed_in, other["email"], other["password"])


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------


def test_changing_the_password_kills_any_reset_link_in_flight(
    signed_in: TestClient, registered: dict
) -> None:
    """Someone who requests a reset link, then remembers their password
    and changes it, must not leave a live key sitting in their inbox."""
    import database
    import password_reset

    raw, _ = password_reset.issue_token(registered["user"]["id"])

    change(signed_in, PASSWORD)

    assert database.password_resets_table().all() == []
    # And the link really is dead.
    dead = signed_in.post(
        "/auth/reset-password", json={"token": raw, "new_password": "via-dead-link"}
    )
    assert dead.status_code == 400
    assert not can_log_in(signed_in, EMAIL, "via-dead-link")


def test_the_bcrypt_length_limit_applies_here_too(signed_in: TestClient) -> None:
    """The guard lives in `hash_password`, so every entry point inherits
    it. This pins that — a future refactor could easily hash directly
    here and lose it."""
    response = change(signed_in, PASSWORD, "A" * 73)

    assert response.status_code == 422
    assert can_log_in(signed_in, EMAIL, PASSWORD), "the password changed anyway"


def test_setting_the_same_password_again_is_harmless(
    signed_in: TestClient,
) -> None:
    """Not forbidden, but it must not corrupt the stored hash — the
    account has to remain usable either way."""
    response = change(signed_in, PASSWORD, PASSWORD)

    assert response.status_code in (200, 400)
    assert can_log_in(signed_in, EMAIL, PASSWORD)


# ---------------------------------------------------------------------------
# Failure modes
# ---------------------------------------------------------------------------


def test_a_wrong_current_password_changes_nothing(signed_in: TestClient) -> None:
    """Holding a valid token is not enough — a stolen session must not be
    able to take the account over."""
    response = change(signed_in, "not-the-current-password")

    assert response.status_code == 400
    assert can_log_in(signed_in, EMAIL, PASSWORD)
    assert not can_log_in(signed_in, EMAIL, NEW_PASSWORD)


@pytest.mark.parametrize("blank", ["", "   "])
def test_a_blank_current_password_changes_nothing(
    signed_in: TestClient, blank: str
) -> None:
    response = change(signed_in, blank)

    assert response.status_code >= 400
    assert can_log_in(signed_in, EMAIL, PASSWORD)


def test_the_endpoint_cannot_be_called_without_a_token(
    api: TestClient, registered: dict
) -> None:
    """Anonymous password changes would be the whole game."""
    api.headers.pop("Authorization", None)

    response = change(api, PASSWORD)

    assert response.status_code == 401
    assert can_log_in(api, EMAIL, PASSWORD)


def test_an_expired_token_cannot_change_a_password(
    api: TestClient, registered: dict
) -> None:
    from datetime import timedelta

    import security
    from models import Role

    expired = security.create_access_token(
        user_id=registered["user"]["id"],
        role=Role.USER,
        expires_delta=timedelta(seconds=-1),
    )
    api.headers["Authorization"] = f"Bearer {expired}"

    response = change(api, PASSWORD)

    assert response.status_code == 401
    assert can_log_in(api, EMAIL, PASSWORD)
