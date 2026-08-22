"""System Settings & Configuration API routes — SourceLedger."""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from ..db.store import store
from ..config import settings
from ..agents.key_rotator import key_rotator, RATE_LIMIT_COOLDOWN_SECONDS

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
async def get_settings(x_user_id: Optional[str] = Header(None, alias="x-user-id")) -> Dict[str, Any]:
    """Get active system configuration, model thresholds, and key rotator telemetry."""
    user_products = await store.list_products(user_id=x_user_id)
    user_sources = await store.list_sources(user_id=x_user_id)
    
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
    x_user_id: Optional[str] = Header(None, alias="x-user-id")
) -> Dict[str, Any]:
    """Update live system configuration and model rules."""
    _current_settings.update(payload.model_dump())
    
    # Update active config thresholds
    if hasattr(settings, "confidence_threshold"):
        settings.confidence_threshold = payload.auto_commit_threshold

    return {
        "status": "success",
        "message": "System settings and model thresholds updated successfully.",
        "settings": _current_settings,
    }


@router.post("/settings/reset-keys")
async def reset_key_rotator() -> Dict[str, Any]:
    """Reset API Key Rotator, clearing all cooldown timers and restoring key pool."""
    key_rotator.reset()
    return {
        "status": "success",
        "message": f"API Key Rotator reset. All {key_rotator.total_keys} keys restored to active pool.",
        "active_keys": key_rotator.active_keys_count,
    }
