"""Auth tests — users CRUD, profiles, login, token handling, route protection."""

from __future__ import annotations

from datetime import timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

REGISTER = {
    "email": "carlos@trackflow.com",
    "password": "correct-horse-battery",
    "name": "Carlos Vega",
    "phone": "+1 213 555 0100",
    "address": "Los Angeles, CA",
}


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("TINYDB_PATH", str(tmp_path / "auth.json"))
    monkeypatch.setenv("SECRET_KEY", "test-secret-not-a-real-one-32-bytes-minimum")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")

    import database

    database.close_db()

    from main import app

    with TestClient(app) as c:
        yield c

    database.close_db()


def register(client: TestClient, **overrides) -> dict:
    payload = {**REGISTER, **overrides}
    r = client.post("/users", json=payload)
    assert r.status_code == 201, r.text
    return r.json()


def login(client: TestClient, email: str, password: str) -> str:
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def make_admin(client: TestClient, user_id: int) -> None:
    """Promote directly in the store — there is no bootstrap admin route."""
    from database import users_table

    users_table().update({"role": "admin"}, doc_ids=[user_id])


# ---------------------------------------------------------------------------
# User model + CRUD
# ---------------------------------------------------------------------------


def test_register_returns_user_without_password_material(client: TestClient) -> None:
    body = register(client)
    assert body["email"] == "carlos@trackflow.com"
    assert body["role"] == "user"          # new registrations default to user
    assert body["is_active"] is True
    assert "created_at" in body
    # The hash must never leave the API.
    assert "password" not in body
    assert "hashed_password" not in body


def test_password_is_hashed_not_stored_plain(client: TestClient) -> None:
    register(client)
    from database import users_table

    stored = users_table().all()[0]
    assert stored["hashed_password"] != REGISTER["password"]
    assert stored["hashed_password"].startswith("$2")  # bcrypt marker
    assert REGISTER["password"] not in str(stored)


def test_user_record_holds_no_display_or_contact_fields(client: TestClient) -> None:
    """CONTEXT/ticket: name, phone, address live on Profile, not User."""
    register(client)
    from database import users_table

    stored = users_table().all()[0]
    assert set(stored) == {
        "email",
        "hashed_password",
        "is_active",
        "role",
        "created_at",
    }


def test_registration_creates_linked_profile(client: TestClient) -> None:
    user = register(client)
    from database import profiles_table

    profiles = profiles_table().all()
    assert len(profiles) == 1
    assert profiles[0]["user_id"] == user["id"]
    assert profiles[0]["name"] == "Carlos Vega"


def test_duplicate_email_is_409(client: TestClient) -> None:
    register(client)
    r = client.post("/users", json=REGISTER)
    assert r.status_code == 409


def test_email_is_case_insensitive_for_uniqueness(client: TestClient) -> None:
    register(client)
    r = client.post("/users", json={**REGISTER, "email": "CARLOS@TrackFlow.com"})
    assert r.status_code == 409


def test_short_password_is_422(client: TestClient) -> None:
    r = client.post("/users", json={**REGISTER, "password": "short"})
    assert r.status_code == 422


def test_invalid_email_is_422(client: TestClient) -> None:
    r = client.post("/users", json={**REGISTER, "email": "not-an-email"})
    assert r.status_code == 422


def test_caller_cannot_self_assign_admin_at_registration(client: TestClient) -> None:
    """`role` is not part of UserCreate, so sending it cannot elevate."""
    r = client.post("/users", json={**REGISTER, "role": "admin"})
    assert r.status_code == 201
    assert r.json()["role"] == "user"


def test_list_and_get_users_require_a_token(client: TestClient) -> None:
    user = register(client)
    assert client.get("/users").status_code == 401
    assert client.get(f"/users/{user['id']}").status_code == 401

    token = login(client, REGISTER["email"], REGISTER["password"])
    assert client.get("/users", headers=auth(token)).status_code == 200
    assert client.get(f"/users/{user['id']}", headers=auth(token)).status_code == 200


def test_update_own_email(client: TestClient) -> None:
    user = register(client)
    token = login(client, REGISTER["email"], REGISTER["password"])
    r = client.put(
        f"/users/{user['id']}",
        json={"email": "carlos.vega@trackflow.com"},
        headers=auth(token),
    )
    assert r.status_code == 200
    assert r.json()["email"] == "carlos.vega@trackflow.com"


def test_password_change_takes_effect(client: TestClient) -> None:
    user = register(client)
    token = login(client, REGISTER["email"], REGISTER["password"])
    r = client.put(
        f"/users/{user['id']}", json={"password": "a-brand-new-password"}, headers=auth(token)
    )
    assert r.status_code == 200

    # Old password no longer works; new one does.
    assert (
        client.post(
            "/auth/login",
            json={"email": REGISTER["email"], "password": REGISTER["password"]},
        ).status_code
        == 401
    )
    assert login(client, REGISTER["email"], "a-brand-new-password")


def test_non_admin_cannot_change_their_own_role(client: TestClient) -> None:
    user = register(client)
    token = login(client, REGISTER["email"], REGISTER["password"])
    r = client.put(
        f"/users/{user['id']}", json={"role": "admin"}, headers=auth(token)
    )
    assert r.status_code == 403


def test_admin_can_change_another_users_role(client: TestClient) -> None:
    victim = register(client)
    admin = register(client, email="admin@trackflow.com")
    make_admin(client, admin["id"])
    token = login(client, "admin@trackflow.com", REGISTER["password"])

    r = client.put(
        f"/users/{victim['id']}", json={"role": "manager"}, headers=auth(token)
    )
    assert r.status_code == 200
    assert r.json()["role"] == "manager"


def test_invalid_role_value_is_422(client: TestClient) -> None:
    user = register(client)
    token = login(client, REGISTER["email"], REGISTER["password"])
    r = client.put(
        f"/users/{user['id']}", json={"role": "superuser"}, headers=auth(token)
    )
    assert r.status_code == 422


def test_delete_user_removes_linked_profile(client: TestClient) -> None:
    user = register(client)
    token = login(client, REGISTER["email"], REGISTER["password"])

    r = client.delete(f"/users/{user['id']}", headers=auth(token))
    assert r.status_code == 200
    assert r.json()["profile_removed"] is True

    from database import profiles_table, users_table

    assert users_table().all() == []
    assert profiles_table().all() == []


# ---------------------------------------------------------------------------
# 403 — authenticated but not authorised
# ---------------------------------------------------------------------------


def test_user_cannot_read_another_users_account(client: TestClient) -> None:
    victim = register(client)
    register(client, email="mallory@trackflow.com")
    token = login(client, "mallory@trackflow.com", REGISTER["password"])

    r = client.get(f"/users/{victim['id']}", headers=auth(token))
    assert r.status_code == 403


def test_user_cannot_update_another_users_account(client: TestClient) -> None:
    victim = register(client)
    register(client, email="mallory@trackflow.com")
    token = login(client, "mallory@trackflow.com", REGISTER["password"])

    r = client.put(
        f"/users/{victim['id']}", json={"email": "hijacked@x.com"}, headers=auth(token)
    )
    assert r.status_code == 403


def test_user_cannot_delete_another_users_account(client: TestClient) -> None:
    victim = register(client)
    register(client, email="mallory@trackflow.com")
    token = login(client, "mallory@trackflow.com", REGISTER["password"])

    assert client.delete(f"/users/{victim['id']}", headers=auth(token)).status_code == 403


def test_admin_may_read_any_account(client: TestClient) -> None:
    victim = register(client)
    admin = register(client, email="admin@trackflow.com")
    make_admin(client, admin["id"])
    token = login(client, "admin@trackflow.com", REGISTER["password"])

    assert client.get(f"/users/{victim['id']}", headers=auth(token)).status_code == 200


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------


def test_get_my_profile(client: TestClient) -> None:
    user = register(client)
    token = login(client, REGISTER["email"], REGISTER["password"])
    r = client.get("/profiles/me", headers=auth(token))
    assert r.status_code == 200
    body = r.json()
    assert body["user_id"] == user["id"]
    assert body["name"] == "Carlos Vega"
    assert body["phone"] == "+1 213 555 0100"


def test_update_my_profile(client: TestClient) -> None:
    register(client)
    token = login(client, REGISTER["email"], REGISTER["password"])
    r = client.put(
        "/profiles/me",
        json={"name": "Carlos V.", "address": "Zaragoza, ES"},
        headers=auth(token),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "Carlos V."
    assert body["address"] == "Zaragoza, ES"
    # Omitted fields are left alone, not nulled.
    assert body["phone"] == "+1 213 555 0100"


def test_profile_routes_require_a_token(client: TestClient) -> None:
    register(client)
    assert client.get("/profiles/me").status_code == 401
    assert client.put("/profiles/me", json={"name": "x"}).status_code == 401


def test_profile_is_scoped_to_the_caller(client: TestClient) -> None:
    """There is no id to tamper with — /profiles/me resolves from the token."""
    register(client)
    register(client, email="mallory@trackflow.com", name="Mallory")
    token = login(client, "mallory@trackflow.com", REGISTER["password"])

    r = client.get("/profiles/me", headers=auth(token))
    assert r.json()["name"] == "Mallory"


# ---------------------------------------------------------------------------
# Login + token
# ---------------------------------------------------------------------------


def test_login_returns_a_signed_token(client: TestClient) -> None:
    register(client)
    r = client.post(
        "/auth/login",
        json={"email": REGISTER["email"], "password": REGISTER["password"]},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == 3600
    assert body["access_token"].count(".") == 2  # header.payload.signature


def test_login_accepts_the_oauth2_form_swagger_sends(client: TestClient) -> None:
    register(client)
    r = client.post(
        "/auth/login",
        data={"username": REGISTER["email"], "password": REGISTER["password"]},
    )
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_login_with_wrong_password_is_401(client: TestClient) -> None:
    register(client)
    r = client.post(
        "/auth/login", json={"email": REGISTER["email"], "password": "wrong"}
    )
    assert r.status_code == 401


def test_login_with_unknown_email_is_401_and_indistinguishable(
    client: TestClient,
) -> None:
    register(client)
    unknown = client.post(
        "/auth/login", json={"email": "nobody@trackflow.com", "password": "whatever"}
    )
    wrong_pw = client.post(
        "/auth/login", json={"email": REGISTER["email"], "password": "wrong"}
    )
    # Same status and same message — no account enumeration.
    assert unknown.status_code == wrong_pw.status_code == 401
    assert unknown.json()["detail"] == wrong_pw.json()["detail"]


def test_deactivated_account_cannot_log_in(client: TestClient) -> None:
    user = register(client)
    token = login(client, REGISTER["email"], REGISTER["password"])
    client.put(f"/users/{user['id']}", json={"is_active": False}, headers=auth(token))

    r = client.post(
        "/auth/login",
        json={"email": REGISTER["email"], "password": REGISTER["password"]},
    )
    assert r.status_code == 401


def test_auth_me_returns_credentials_plus_profile(client: TestClient) -> None:
    user = register(client)
    token = login(client, REGISTER["email"], REGISTER["password"])
    r = client.get("/auth/me", headers=auth(token))
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == user["id"]
    assert body["email"] == REGISTER["email"]
    assert body["role"] == "user"
    assert body["profile"]["name"] == "Carlos Vega"
    assert "hashed_password" not in body


# ---------------------------------------------------------------------------
# Token validation
# ---------------------------------------------------------------------------


def test_missing_token_is_401(client: TestClient) -> None:
    assert client.get("/auth/me").status_code == 401


def test_malformed_token_is_401(client: TestClient) -> None:
    r = client.get("/auth/me", headers=auth("this.is.not-a-jwt"))
    assert r.status_code == 401


def test_token_signed_with_the_wrong_secret_is_401(client: TestClient) -> None:
    import jwt

    forged = jwt.encode(
        {"sub": "1", "role": "admin"},
        "attacker-key-that-is-long-enough-for-hs256",
        algorithm="HS256",
    )
    r = client.get("/auth/me", headers=auth(forged))
    assert r.status_code == 401


def test_expired_token_is_401(client: TestClient) -> None:
    user = register(client)
    from models import Role
    from security import create_access_token

    expired = create_access_token(
        user_id=user["id"], role=Role.USER, expires_delta=timedelta(minutes=-5)
    )
    r = client.get("/auth/me", headers=auth(expired))
    assert r.status_code == 401


def test_token_for_a_deleted_user_is_401(client: TestClient) -> None:
    user = register(client)
    token = login(client, REGISTER["email"], REGISTER["password"])
    client.delete(f"/users/{user['id']}", headers=auth(token))

    # The token is still cryptographically valid, but the account is gone.
    assert client.get("/auth/me", headers=auth(token)).status_code == 401


# ---------------------------------------------------------------------------
# Protection of pre-existing monorepo routes
# ---------------------------------------------------------------------------

PROTECTED_EXISTING = [
    ("post", "/suppliers"),
    ("patch", "/suppliers/1/rate"),
    ("patch", "/suppliers/1/status"),
    ("delete", "/suppliers/1"),
    ("post", "/api/incidents/analyze"),
    ("get", "/api/incidents/results/export"),
]


@pytest.mark.parametrize(("method", "path"), PROTECTED_EXISTING)
def test_existing_routes_now_require_a_token(
    client: TestClient, method: str, path: str
) -> None:
    """At least five routes outside /users and /auth are protected."""
    call = getattr(client, method)
    # GET/DELETE take no body in httpx's TestClient signature.
    response = call(path) if method in {"get", "delete"} else call(path, json={})
    assert response.status_code == 401, f"{method.upper()} {path} was reachable"


def test_at_least_five_non_auth_routes_are_protected() -> None:
    assert len(PROTECTED_EXISTING) >= 5


def test_only_the_service_root_is_public(client: TestClient) -> None:
    """Supplier reads used to be open too.

    That was a deliberate, documented exemption from AUTH-01 — the
    backoffice did not yet send tokens, so closing the reads would have
    broken the list. The exemption was written to last "until the
    frontend starts sending tokens", and that has since happened: every
    supplier call in uis/backoffice/lib/suppliers.ts now goes through
    `authFetch`.

    So the condition expired, and the directory — negotiated carrier
    rates and supplier contact emails — is no longer readable by anyone
    who can reach the API. This test now pins the closed state, so the
    exemption cannot quietly come back.
    """
    assert client.get("/").status_code == 200

    assert client.get("/suppliers").status_code == 401
    assert client.get("/suppliers/1").status_code == 401


def test_protected_supplier_write_still_works_with_a_valid_token(
    client: TestClient,
) -> None:
    """No regression: the route behaves normally once authenticated."""
    register(client)
    token = login(client, REGISTER["email"], REGISTER["password"])

    created = client.post(
        "/suppliers",
        json={
            "name": "Auth Test Carrier",
            "country": "Spain",
            "categories": ["carrier_last_mile"],
            "rate_per_shipment": 4.5,
            "currency": "EUR",
            "status": "active",
        },
        headers=auth(token),
    )
    assert created.status_code == 201
    supplier_id = created.json()["id"]

    rate = client.patch(
        f"/suppliers/{supplier_id}/rate",
        json={"rate_per_shipment": 5.5},
        headers=auth(token),
    )
    assert rate.status_code == 200
    assert rate.json()["rate_per_shipment"] == 5.5

    status_change = client.patch(
        f"/suppliers/{supplier_id}/status",
        json={"status": "suspended"},
        headers=auth(token),
    )
    assert status_change.status_code == 200

    assert (
        client.delete(f"/suppliers/{supplier_id}", headers=auth(token)).status_code
        == 200
    )


def test_secret_key_is_read_from_the_environment(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Never hardcoded: an unset SECRET_KEY must fail loudly."""
    import security

    configured_secret = "from-the-environment-with-at-least-32-bytes"
    monkeypatch.setenv("SECRET_KEY", configured_secret)
    assert security.secret_key() == configured_secret

    monkeypatch.setenv("SECRET_KEY", "")
    with pytest.raises(RuntimeError, match="SECRET_KEY is not set"):
        security.secret_key()

    monkeypatch.setenv("SECRET_KEY", "too-short")
    with pytest.raises(RuntimeError, match="at least 32 bytes"):
        security.secret_key()


def test_token_expiry_is_read_from_the_environment(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import security

    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15")
    assert security.access_token_expire_minutes() == 15


# ---------------------------------------------------------------------------
# JWT attack surface
#
# These exist because an earlier manual probe of these cases silently
# generated EMPTY tokens (the shell used a Python environment without PyJWT),
# so every attack "passed" for the wrong reason. Encoded as real tests
# so that can never happen again.
# ---------------------------------------------------------------------------


def _unsigned_token(alg: str, claims: dict) -> str:
    """Hand-build a token with no valid signature."""
    import base64
    import json as _json

    def seg(data: dict) -> str:
        raw = _json.dumps(data).encode()
        return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()

    return f"{seg({'alg': alg, 'typ': 'JWT'})}.{seg(claims)}."


def test_alg_none_token_is_rejected(client: TestClient) -> None:
    """The classic JWT bypass: claim `alg: none` and send no signature."""
    register(client)
    token = _unsigned_token("none", {"sub": "1", "role": "admin"})
    assert client.get("/auth/me", headers=auth(token)).status_code == 401


def test_hs256_header_with_empty_signature_is_rejected(client: TestClient) -> None:
    register(client)
    token = _unsigned_token("HS256", {"sub": "1", "role": "admin"})
    assert client.get("/auth/me", headers=auth(token)).status_code == 401


def test_token_without_a_sub_claim_is_401(client: TestClient) -> None:
    import os

    import jwt

    register(client)
    forged = jwt.encode({"role": "admin"}, os.environ["SECRET_KEY"], algorithm="HS256")
    assert client.get("/auth/me", headers=auth(forged)).status_code == 401


def test_token_for_a_nonexistent_user_id_is_401(client: TestClient) -> None:
    import os

    import jwt

    register(client)
    forged = jwt.encode(
        {"sub": "9999", "role": "admin"}, os.environ["SECRET_KEY"], algorithm="HS256"
    )
    assert client.get("/auth/me", headers=auth(forged)).status_code == 401


def test_role_comes_from_the_database_not_the_token_claim(client: TestClient) -> None:
    """A token claiming `role: admin` must not grant admin.

    The role is re-read from the stored user on every request, so a
    tampered-with (or stale) claim cannot escalate privileges.
    """
    import os

    import jwt

    user = register(client)
    claims_admin = jwt.encode(
        {"sub": str(user["id"]), "role": "admin"},
        os.environ["SECRET_KEY"],
        algorithm="HS256",
    )

    me = client.get("/auth/me", headers=auth(claims_admin))
    assert me.status_code == 200
    assert me.json()["role"] == "user"  # from the DB, not the token

    # And it confers no admin power: still 403 on someone else's account.
    victim = register(client, email="victim@trackflow.com")
    blocked = client.get(f"/users/{victim['id']}", headers=auth(claims_admin))
    assert blocked.status_code == 403
