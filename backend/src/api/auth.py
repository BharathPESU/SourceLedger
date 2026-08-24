"""JWT & OAuth2 Authentication & Authorization Middleware for SourceLedger."""

import logging
import os
from typing import Any, Dict, Optional
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from ..config import settings

logger = logging.getLogger("sourceledger.auth")

security_scheme = HTTPBearer(auto_error=False)

# Excluded public endpoints that do not require authentication
PUBLIC_PATHS = {
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/favicon.ico",
}


def decode_jwt_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT bearer token using PyJWT."""
    secret = settings.get_effective_jwt_secret() or os.getenv("JWT_SECRET") or os.getenv("SUPABASE_JWT_SECRET")
    
    # If a secret is provided, verify signature
    if secret:
        try:
            payload = jwt.decode(token, secret, algorithms=["HS256", "RS256"])
            return payload
        except jwt.PyJWTError as e:
            logger.warning("JWT verification failed with secret: %s", e)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {str(e)}"
            )
    else:
        # If no secret is configured in env, decode payload without signature verification
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload
        except Exception as e:
            logger.warning("Unverified JWT decode failed: %s", e)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed authentication token"
            )


def extract_user_identity(request: Request) -> Dict[str, Any]:
    """Extract user identity, role, and admin status from headers or JWT bearer token."""
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    x_user_id = request.headers.get("x-user-id")
    x_admin_key = request.headers.get("x-admin-key")
    x_user_role = request.headers.get("x-user-role")
    
    user_id = None
    email = None
    role = "user"
    is_admin = False

    # Check Admin Key header
    configured_admin_key = settings.admin_api_key or os.getenv("ADMIN_API_KEY")
    if x_admin_key and configured_admin_key and x_admin_key.strip() == configured_admin_key.strip():
        is_admin = True
        role = "admin"

    # Process Authorization Bearer token
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        if token:
            payload = decode_jwt_token(token)
            
            user_id = payload.get("sub") or payload.get("user_id") or payload.get("email")
            email = payload.get("email")
            
            # Determine role from JWT payload
            jwt_role = (
                payload.get("role")
                or payload.get("app_metadata", {}).get("role")
                or payload.get("user_metadata", {}).get("role")
            )
            if jwt_role == "admin" or payload.get("is_admin") is True:
                is_admin = True
                role = "admin"
            elif jwt_role:
                role = jwt_role

    # Fallback to x-user-id / x-user-role if provided
    if not user_id and x_user_id:
        user_id = x_user_id.strip()

    if x_user_role and x_user_role.lower() == "admin":
        is_admin = True
        role = "admin"

    if not user_id:
        return {}

    return {
        "user_id": user_id,
        "email": email or f"{user_id}@sourceledger.internal",
        "role": role,
        "is_admin": is_admin,
    }


class AuthMiddleware(BaseHTTPMiddleware):
    """FastAPI Middleware to enforce authentication on all non-public endpoints."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Allow OPTIONS preflight requests for CORS
        if request.method == "OPTIONS":
            return await call_next(request)

        # Allow public endpoints
        if path in PUBLIC_PATHS or path.startswith("/docs") or path.startswith("/redoc"):
            return await call_next(request)

        # Extract identity
        try:
            identity = extract_user_identity(request)
        except HTTPException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail}
            )

        if not identity or not identity.get("user_id"):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Authentication required. Provide a valid Bearer token or x-user-id header."}
            )

        # Attach identity to request.state for route handlers
        request.state.user = identity
        request.state.user_id = identity["user_id"]
        request.state.user_role = identity["role"]
        request.state.is_admin = identity["is_admin"]

        return await call_next(request)


def get_current_user(request: Request) -> Dict[str, Any]:
    """Dependency to retrieve authenticated user context."""
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided."
        )
    return user


def require_admin(request: Request, user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency to enforce admin-level authorization."""
    if not user.get("is_admin") and user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to perform this action."
        )
    return user
