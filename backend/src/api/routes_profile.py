"""User Profile API routes — SourceLedger."""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from ..db.store import store

router = APIRouter(prefix="/api", tags=["profile"])


class UserProfilePayload(BaseModel):
    full_name: str = Field(default="")
    display_name: str = Field(default="")
    title: str = Field(default="")
    company: str = Field(default="")
    phone: str = Field(default="")
    address_line1: str = Field(default="")
    address_line2: str = Field(default="")
    city: str = Field(default="")
    state: str = Field(default="")
    zip_code: str = Field(default="")
    country: str = Field(default="United States")
    bio: str = Field(default="")
    preferred_language: str = Field(default="English")
    avatar_color: str = Field(default="#E8622C")


@router.get("/profile")
async def get_profile(x_user_id: Optional[str] = Header(None, alias="x-user-id")) -> Dict[str, Any]:
    """Retrieve profile information for the authenticated user."""
    active_user = x_user_id or "default_user"
    profile_data = store.get_user_profile(active_user)
    
    if not profile_data:
        # Default starter profile
        profile_data = {
            "full_name": "",
            "display_name": "",
            "title": "Supply Chain & Catalog Specialist",
            "company": "SourceLedger Enterprise",
            "phone": "",
            "address_line1": "",
            "address_line2": "",
            "city": "",
            "state": "",
            "zip_code": "",
            "country": "United States",
            "bio": "Managing product intelligence, datasheets, and canonical catalog standards.",
            "preferred_language": "English",
            "avatar_color": "#E8622C"
        }

    return {
        "status": "success",
        "user_id": active_user,
        "profile": profile_data
    }


@router.post("/profile")
async def update_profile(
    payload: UserProfilePayload,
    x_user_id: Optional[str] = Header(None, alias="x-user-id")
) -> Dict[str, Any]:
    """Update profile information for the authenticated user."""
    active_user = x_user_id or "default_user"
    profile_dict = payload.model_dump()
    store.save_user_profile(active_user, profile_dict)
    
    return {
        "status": "success",
        "message": "User profile updated successfully.",
        "user_id": active_user,
        "profile": profile_dict
    }
