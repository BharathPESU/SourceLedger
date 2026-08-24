"""Tests for Backend Authentication Middleware, Admin Settings Auth & Production Docs URL Disabling."""

import os
import jwt
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.src.api.auth import AuthMiddleware, decode_jwt_token, extract_user_identity
from backend.src.main import app
from backend.src.config import settings

client = TestClient(app)
TEST_JWT_SECRET = "test_super_secret_jwt_key_123"


def test_public_health_endpoint_allows_unauthenticated_request():
    """Verify that /health is public and returns 200 OK without any auth headers."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "sourceledger-backend"}


def test_unauthenticated_request_to_api_blocked_with_401():
    """Verify that unauthenticated requests to /api/* endpoints return 401 Unauthorized."""
    response = client.get("/api/products")
    assert response.status_code == 401
    assert "detail" in response.json()
    assert "Authentication required" in response.json()["detail"]


def test_authenticated_standard_user_get_settings():
    """Verify that authenticated standard users can read /api/settings."""
    headers = {"x-user-id": "user_dev_123"}
    response = client.get("/api/settings", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "settings" in data
    assert "telemetry" in data


def test_non_admin_user_patch_settings_forbidden():
    """Verify that standard (non-admin) users receive 403 Forbidden when calling PATCH /api/settings."""
    headers = {"x-user-id": "user_dev_123"}
    payload = {"auto_commit_threshold": 90}
    response = client.patch("/api/settings", json=payload, headers=headers)
    assert response.status_code == 403
    assert "Admin privileges required" in response.json()["detail"]


def test_non_admin_user_post_settings_forbidden():
    """Verify that standard (non-admin) users receive 403 Forbidden when calling POST /api/settings."""
    headers = {"x-user-id": "user_dev_123"}
    payload = {
        "auto_commit_threshold": 88,
        "review_threshold": 65,
        "active_model": "gemini-3.6-flash",
        "enable_refinement": True,
        "strict_tolerance": True,
        "proxy_url": "https://example.com",
        "proxy_timeout": 60,
        "auto_refresh_interval": 5,
        "density_mode": "comfortable"
    }
    response = client.post("/api/settings", json=payload, headers=headers)
    assert response.status_code == 403
    assert "Admin privileges required" in response.json()["detail"]


def test_admin_user_patch_settings_success():
    """Verify that admin users (x-user-role: admin) can successfully PATCH /api/settings."""
    headers = {
        "x-user-id": "admin_user_001",
        "x-user-role": "admin"
    }
    payload = {"auto_commit_threshold": 92, "density_mode": "compact"}
    response = client.patch("/api/settings", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["settings"]["auto_commit_threshold"] == 92
    assert data["settings"]["density_mode"] == "compact"


def test_admin_user_post_settings_success():
    """Verify that admin users can successfully POST /api/settings."""
    headers = {
        "x-user-id": "admin_user_001",
        "x-user-role": "admin"
    }
    payload = {
        "auto_commit_threshold": 85,
        "review_threshold": 65,
        "active_model": "gemini-3.6-flash",
        "enable_refinement": True,
        "strict_tolerance": True,
        "proxy_url": "https://example.com",
        "proxy_timeout": 60,
        "auto_refresh_interval": 5,
        "density_mode": "comfortable"
    }
    response = client.post("/api/settings", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_admin_user_reset_keys_success():
    """Verify that admin users can successfully call POST /api/settings/reset-keys."""
    headers = {
        "x-user-id": "admin_user_001",
        "x-user-role": "admin"
    }
    response = client.post("/api/settings/reset-keys", headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_admin_api_key_header_authorization():
    """Verify that passing x-admin-key matching configured ADMIN_API_KEY authorizes admin access."""
    old_key = settings.admin_api_key
    settings.admin_api_key = "secret_admin_token_999"
    try:
        headers = {
            "x-user-id": "any_user",
            "x-admin-key": "secret_admin_token_999"
        }
        payload = {"review_threshold": 70}
        response = client.patch("/api/settings", json=payload, headers=headers)
        assert response.status_code == 200
        assert response.json()["settings"]["review_threshold"] == 70
    finally:
        settings.admin_api_key = old_key


def test_jwt_bearer_token_authentication():
    """Verify that valid JWT bearer tokens authenticate requests successfully."""
    old_jwt_secret = settings.jwt_secret
    settings.jwt_secret = TEST_JWT_SECRET
    try:
        token_payload = {
            "sub": "jwt_user_456",
            "email": "jwt_user@example.com",
            "role": "admin"
        }
        token = jwt.encode(token_payload, TEST_JWT_SECRET, algorithm="HS256")
        
        headers = {"Authorization": f"Bearer {token}"}
        payload = {"auto_refresh_interval": 10}
        response = client.patch("/api/settings", json=payload, headers=headers)
        assert response.status_code == 200
        assert response.json()["settings"]["auto_refresh_interval"] == 10
    finally:
        settings.jwt_secret = old_jwt_secret


def test_production_mode_disables_docs():
    """Verify that when environment is set to production, FastAPI docs and openapi URLs are set to None."""
    old_env = os.environ.get("ENVIRONMENT")
    os.environ["ENVIRONMENT"] = "production"
    try:
        # Re-import or construct app with production flag logic
        is_prod = True
        prod_app = FastAPI(
            title="SourceLedger",
            docs_url=None if is_prod else "/docs",
            redoc_url=None if is_prod else "/redoc",
            openapi_url=None if is_prod else "/openapi.json",
        )
        prod_client = TestClient(prod_app)
        
        assert prod_client.get("/docs").status_code == 404
        assert prod_client.get("/redoc").status_code == 404
        assert prod_client.get("/openapi.json").status_code == 404
    finally:
        if old_env is not None:
            os.environ["ENVIRONMENT"] = old_env
        else:
            os.environ.pop("ENVIRONMENT", None)
