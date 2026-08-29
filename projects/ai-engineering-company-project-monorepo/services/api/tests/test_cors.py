"""CORS coverage for local and containerized backoffice origins."""

import pytest
from fastapi.testclient import TestClient

from main import DEFAULT_ALLOWED_ORIGINS, allowed_origins


def test_container_backoffice_origin_is_allowed(api: TestClient) -> None:
    response = api.options(
        "/auth/login",
        headers={
            "Origin": "http://localhost:3001",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3001"


def test_unknown_origin_is_not_reflected(api: TestClient) -> None:
    response = api.options(
        "/auth/login",
        headers={
            "Origin": "https://attacker.example",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert "access-control-allow-origin" not in response.headers


def test_origins_can_be_configured_without_wildcards(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(
        "ALLOWED_ORIGINS",
        "https://website.trackflow.example/, https://ops.trackflow.example",
    )
    assert allowed_origins() == [
        "https://website.trackflow.example",
        "https://ops.trackflow.example",
    ]

    monkeypatch.setenv("ALLOWED_ORIGINS", "*")
    with pytest.raises(RuntimeError, match="explicit browser origins"):
        allowed_origins()


def test_defaults_cover_both_container_ui_ports(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
    assert allowed_origins() == list(DEFAULT_ALLOWED_ORIGINS)
    assert "http://localhost:3000" in DEFAULT_ALLOWED_ORIGINS
    assert "http://localhost:3001" in DEFAULT_ALLOWED_ORIGINS
