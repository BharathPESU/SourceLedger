"""Supabase Client Connection & Data Store for SourceLedger (Organization: sourceLedge).

Connects the backend directly to Supabase Postgres database.
Handles automatic fallback to in-memory store if credentials are not configured yet.
"""

import os
from typing import Optional, List, Dict, Any
from ..config import settings
from ..utils.logging import get_logger

logger = get_logger("supabase_client")

_supabase_client = None


def get_supabase_client():
    """Initializes and returns the Supabase Client if SUPABASE_URL and SUPABASE_KEY are set."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    supabase_url = (
        settings.get_effective_supabase_url()
        or os.getenv("SUPABASE_URL")
        or os.getenv("VITE_SUPABASE_URL")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        or ""
    ).strip()

    supabase_key = (
        settings.get_effective_supabase_key()
        or os.getenv("SUPABASE_KEY")
        or os.getenv("VITE_SUPABASE_ANON_KEY")
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or ""
    ).strip()

    if not supabase_url or not supabase_key:
        logger.info("Supabase credentials not fully configured in environment (using local memory store fallback).")
        return None

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(supabase_url, supabase_key)
        logger.info("✓ Connected to Supabase Database (Org: sourceLedge, URL: %s)", supabase_url)
        return _supabase_client
    except Exception as e:
        logger.error("Failed to initialize Supabase client: %s", e)
        return None


async def sync_product_to_supabase(product_dict: Dict[str, Any]) -> bool:
    """Syncs a single product record to the Supabase `products` table."""
    client = get_supabase_client()
    if not client:
        return False

    try:
        data, count = client.table("products").upsert(product_dict).execute()
        logger.info("Synced product '%s' to Supabase (Org: sourceLedge)", product_dict.get("id"))
        return True
    except Exception as e:
        logger.warning("Supabase upsert product exception: %s", e)
        return False
