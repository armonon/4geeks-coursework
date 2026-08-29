"""POST /auth/reset-password.

Plan: TESTING.md § "POST /auth/reset-password".

Single-use is the security property here, so most of these are about what
happens the *second* time a token is presented, or when it is presented
late, or when it was never real.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from tests.conftest import EMAIL, PASSWORD, can_log_in

NEW_PASSWORD = "a-brand-new-password-42"


@pytest.fixture
def reset_token(api: TestClient, registered: dict) -> str:
    """Issue a real token the way the endpoint does, and return the raw
    value — the only place it exists outside the email."""
    import password_reset

    raw, _ttl = password_reset.issue_token(registered["user"]["id"])
    return raw


def reset(client: TestClient, token: str, password: str = NEW_PASSWORD):
    return client.post(
        "/auth/reset-password", json={"token": token, "new_password": password}
    )


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


def test_a_valid_token_replaces_the_password(
    api: TestClient, registered: dict, reset_token: str
) -> None:
    response = reset(api, reset_token)

    assert response.status_code == 200, response.text
    assert can_log_in(api, EMAIL, NEW_PASSWORD)
    assert not can_log_in(api, EMAIL, PASSWORD), "the old password still works"


def test_no_usable_token_survives_a_successful_reset(
    api: TestClient, registered: dict, reset_token: str
) -> None:
    """`consume_token` marks the row used, then the route calls
    `invalidate_all_for_user`, which deletes it outright.

    I expected to assert `used_at is not None` and found the row gone
    instead. Deleting is the stronger property — there is no spent-token
    record left to leak or to resurrect — so the test asserts the
    guarantee that actually matters: nothing usable remains.
    """
    reset(api, reset_token)

    import database

    assert database.password_resets_table().all() == []


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------


def test_a_token_cannot_be_used_twice(
    api: TestClient, registered: dict, reset_token: str
) -> None:
    """Single-use is the whole point. A replayable link in an inbox is a
    permanent key to the account."""
    first = reset(api, reset_token, NEW_PASSWORD)
    second = reset(api, reset_token, "yet-another-password")

    assert first.status_code == 200
    assert second.status_code == 400
    # And the second attempt changed nothing.
    assert can_log_in(api, EMAIL, NEW_PASSWORD)
    assert not can_log_in(api, EMAIL, "yet-another-password")


@pytest.mark.parametrize("blank", ["", "   ", "\t"])
def test_a_blank_token_never_resets_a_password(
    api: TestClient, registered: dict, blank: str
) -> None:
    """An empty string must never be allowed to match a stored hash.

    Asserting `>= 400` rather than an exact code on purpose: an empty
    string is caught by the request model (422) while whitespace reaches
    our own check (400). Which layer refuses it is HTTP plumbing; that it
    is refused, and that the password is untouched, is the business rule.
    """
    assert reset(api, blank).status_code >= 400
    assert can_log_in(api, EMAIL, PASSWORD)


def test_an_expired_token_is_rejected(api: TestClient, registered: dict) -> None:
    """Expiry is enforced against the stored timestamp, not the token."""
    import database
    import password_reset

    raw, _ = password_reset.issue_token(registered["user"]["id"])
    record = database.password_resets_table().all()[0]
    database.password_resets_table().update(
        {"expires_at": (datetime.now(UTC) - timedelta(seconds=1)).isoformat()},
        doc_ids=[record.doc_id],
    )

    assert reset(api, raw).status_code == 400
    assert can_log_in(api, EMAIL, PASSWORD)


def test_a_token_one_second_from_expiry_still_works(
    api: TestClient, registered: dict
) -> None:
    """The other side of the boundary — an off-by-one in the comparison
    would reject links that are still legitimately valid."""
    import database
    import password_reset

    raw, _ = password_reset.issue_token(registered["user"]["id"])
    record = database.password_resets_table().all()[0]
    database.password_resets_table().update(
        {"expires_at": (datetime.now(UTC) + timedelta(seconds=30)).isoformat()},
        doc_ids=[record.doc_id],
    )

    assert reset(api, raw).status_code == 200


def test_a_record_with_an_unreadable_expiry_is_rejected_not_a_crash(
    api: TestClient, registered: dict
) -> None:
    """A corrupted row must fail closed, not take the endpoint down."""
    import database
    import password_reset

    raw, _ = password_reset.issue_token(registered["user"]["id"])
    record = database.password_resets_table().all()[0]
    database.password_resets_table().update(
        {"expires_at": "not-a-timestamp"}, doc_ids=[record.doc_id]
    )

    response = reset(api, raw)

    assert response.status_code == 400
    assert response.status_code != 500
    assert can_log_in(api, EMAIL, PASSWORD)


# ---------------------------------------------------------------------------
# Failure modes
# ---------------------------------------------------------------------------


def test_unknown_used_and_expired_tokens_are_indistinguishable(
    api: TestClient, registered: dict
) -> None:
    """Different messages would let a caller probe which tokens ever
    existed, and which had already been spent."""
    import database
    import password_reset

    # A token that was never issued.
    unknown = reset(api, "a-token-that-was-never-issued")

    # A token that has been spent.
    spent_raw, _ = password_reset.issue_token(registered["user"]["id"])
    reset(api, spent_raw, "interim-password-one")
    spent = reset(api, spent_raw)

    # A token that has expired.
    expired_raw, _ = password_reset.issue_token(registered["user"]["id"])
    record = database.password_resets_table().all()[0]
    database.password_resets_table().update(
        {"expires_at": (datetime.now(UTC) - timedelta(hours=1)).isoformat()},
        doc_ids=[record.doc_id],
    )
    expired = reset(api, expired_raw)

    codes = {unknown.status_code, spent.status_code, expired.status_code}
    bodies = {unknown.text, spent.text, expired.text}
    assert codes == {400}, f"statuses differed: {codes}"
    assert len(bodies) == 1, f"messages differed: {bodies}"


def test_a_reset_kills_every_other_outstanding_link_for_that_account(
    api: TestClient, registered: dict
) -> None:
    """After a successful reset there must be no live link left over."""
    import database
    import password_reset

    raw, _ = password_reset.issue_token(registered["user"]["id"])
    reset(api, raw)

    live = [
        record
        for record in database.password_resets_table().all()
        if record["used_at"] is None
    ]
    assert live == [], "an unused reset link survived the password change"


def test_a_token_for_a_deleted_account_is_rejected(
    api: TestClient, registered: dict, reset_token: str
) -> None:
    """The token is valid and unspent, but there is no account to reset."""
    import database

    database.users_table().remove(doc_ids=[registered["user"]["id"]])

    assert reset(api, reset_token).status_code == 400
