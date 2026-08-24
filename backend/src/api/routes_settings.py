"""System Settings & Configuration API routes — SourceLedger."""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from ..db.store import store
from ..config import settings
from ..agents.key_rotator import key_rotator, RATE_LIMIT_COOLDOWN_SECONDS
from .auth import get_current_user, require_admin

router = APIRouter(prefix="/api", tags=["settings"])


class SystemSettingsPayload(BaseModel):
    auto_commit_threshold: int = Field(default=85, ge=50, le=100)
    review_threshold: int = Field(default=65, ge=30, le=90)
    active_model: str = Field(default="gemini-3.6-flash")
    enable_refinement: bool = Field(default=True)
    strict_tolerance: bool = Field(default=True)
    proxy_url: str = Field(default=settings.api_url)
    proxy_timeout: int = Field(default=60, ge=10, le=300)
    auto_refresh_interval: int = Field(default=5, ge=2, le=60)
    density_mode: str = Field(default="comfortable")


class SystemSettingsPartialPayload(BaseModel):
    auto_commit_threshold: Optional[int] = Field(default=None, ge=50, le=100)
    review_threshold: Optional[int] = Field(default=None, ge=30, le=90)
    active_model: Optional[str] = None
    enable_refinement: Optional[bool] = None
    strict_tolerance: Optional[bool] = None
    proxy_url: Optional[str] = None
    proxy_timeout: Optional[int] = Field(default=None, ge=10, le=300)
    auto_refresh_interval: Optional[int] = Field(default=None, ge=2, le=60)
    density_mode: Optional[str] = None


# In-memory settings cache initialized from environment
_current_settings: Dict[str, Any] = {
    "auto_commit_threshold": settings.confidence_threshold if hasattr(settings, "confidence_threshold") else 85,
    "review_threshold": 65,
    "active_model": "gemini-3.6-flash",
    "enable_refinement": True,
    "strict_tolerance": True,
    "proxy_url": settings.api_url or "https://free-api-erel.onrender.com/api/generate",
    "proxy_timeout": 60,
    "auto_refresh_interval": 5,
    "density_mode": "comfortable",
}


@router.get("/settings")
async def get_settings(
    user: Dict[str, Any] = Depends(get_current_user),
    x_user_id: Optional[str] = Header(None, alias="x-user-id")
) -> Dict[str, Any]:
    """Get active system configuration, model thresholds, and key rotator telemetry."""
    active_user_id = user.get("user_id") or x_user_id
    user_products = await store.list_products(user_id=active_user_id)
    user_sources = await store.list_sources(user_id=active_user_id)
    
    return {
        "settings": _current_settings,
        "telemetry": {
            "total_keys": key_rotator.total_keys,
            "active_keys": key_rotator.active_keys_count,
            "rate_limit_cooldown_seconds": RATE_LIMIT_COOLDOWN_SECONDS,
            "user_products_count": len(user_products),
            "user_sources_count": len(user_sources),
            "database_path": store.db_path,
            "app_env": settings.app_env,
        }
    }


@router.post("/settings")
async def update_settings(
    payload: SystemSettingsPayload,
    admin_user: Dict[str, Any] = Depends(require_admin),
) -> Dict[str, Any]:
    """Update live system configuration and model rules (Requires Admin)."""
    _current_settings.update(payload.model_dump())
    
    if hasattr(settings, "confidence_threshold"):
        settings.confidence_threshold = payload.auto_commit_threshold

    return {
        "status": "success",
        "message": "System settings updated successfully by admin.",
        "settings": _current_settings,
        "updated_by": admin_user.get("user_id"),
    }


@router.patch("/settings")
async def patch_settings(
    payload: SystemSettingsPartialPayload,
    admin_user: Dict[str, Any] = Depends(require_admin),
) -> Dict[str, Any]:
    """Partially update system configuration and model rules (Requires Admin)."""
    update_data = payload.model_dump(exclude_unset=True)
    _current_settings.update(update_data)
    
    if "auto_commit_threshold" in update_data and hasattr(settings, "confidence_threshold"):
        settings.confidence_threshold = update_data["auto_commit_threshold"]

    return {
        "status": "success",
        "message": "System settings patched successfully by admin.",
        "settings": _current_settings,
        "updated_by": admin_user.get("user_id"),
    }


@router.post("/settings/reset-keys")
async def reset_key_rotator(
    admin_user: Dict[str, Any] = Depends(require_admin)
) -> Dict[str, Any]:
    """Reset API Key Rotator, clearing all cooldown timers and restoring key pool (Requires Admin)."""
    key_rotator.reset()
    return {
        "status": "success",
        "message": f"API Key Rotator reset by admin. All {key_rotator.total_keys} keys restored to active pool.",
        "active_keys": key_rotator.active_keys_count,
        "reset_by": admin_user.get("user_id"),
    }

