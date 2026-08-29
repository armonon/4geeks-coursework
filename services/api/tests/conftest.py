"""Shared fixtures for the AUTH-088 test suite.

Every test gets its own TinyDB file under pytest's `tmp_path`, so no test
can see another's users. `database.close_db()` runs on both sides of the
fixture because the handle is cached per process — a leftover handle from
a previous test would keep writing to a file that no longer exists.

Test modules written before AUTH-088 declare their own `client` fixture;
those shadow the one here, which is intentional and harmless.
"""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# A password that is long enough to be realistic and short enough to stay
# well inside bcrypt's 72-byte input limit.
PASSWORD = "correct-horse-battery-staple"
EMAIL = "ana@trackflow.com"


@pytest.fixture
def api(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    """An unauthenticated client on a throwaway database."""
    monkeypatch.setenv("TINYDB_PATH", str(tmp_path / "auth-088.json"))
    monkeypatch.setenv("SECRET_KEY", "test-secret-not-a-real-one-32-bytes-minimum")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")

    import database

    database.close_db()

    from main import app

    with TestClient(app) as client:
        yield client

    database.close_db()


@pytest.fixture
def registered(api: TestClient) -> dict:
    """One registered account, plus the credentials that created it."""
    response = api.post("/users", json={"email": EMAIL, "password": PASSWORD})
    assert response.status_code == 201, response.text
    return {"email": EMAIL, "password": PASSWORD, "user": response.json()}


@pytest.fixture
def signed_in(api: TestClient, registered: dict) -> TestClient:
    """A client carrying a valid bearer token for `registered`."""
    api.headers.update({"Authorization": f"Bearer {login_token(api, registered)}"})
    return api


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def login_token(client: TestClient, credentials: dict) -> str:
    """Log in and return the raw access token."""
    response = client.post(
        "/auth/login",
        json={"email": credentials["email"], "password": credentials["password"]},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def can_log_in(client: TestClient, email: str, password: str) -> bool:
    """Whether these credentials are currently accepted.

    Used instead of asserting on stored hashes: what matters is whether
    the account can still be used, not how the secret is encoded.
    """
    saved = client.headers.pop("Authorization", None)
    try:
        response = client.post(
            "/auth/login", json={"email": email, "password": password}
        )
    finally:
        if saved is not None:
            client.headers["Authorization"] = saved
    return response.status_code == 200
