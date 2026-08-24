"""Source document storage.

Handles persisting original source documents (PDFs, HTML snapshots)
to the local filesystem. These are never discarded — they exist so
the Field Inspector can trace any field back to its exact origin.
"""

import os
from uuid import UUID

from ..config import settings
from ..utils.logging import get_logger

logger = get_logger("source_store")


def ensure_storage_dir() -> str:
    """Create the source storage directory if it doesn't exist, falling back to /tmp/sources if unwritable."""
    try:
        os.makedirs(settings.source_storage_path, exist_ok=True)
        return settings.source_storage_path
    except Exception as err:
        fallback_dir = "/tmp/sources"
        os.makedirs(fallback_dir, exist_ok=True)
        return fallback_dir


def save_source_content(source_id: UUID, content: str | bytes, extension: str = ".txt") -> str:
    """Save source content to disk and return the storage path.

    The path is what gets stored as Source.raw_content_ref so the
    original can be retrieved for citation later.
    """
    storage_dir = ensure_storage_dir()
    filename = f"{source_id}{extension}"
    filepath = os.path.join(storage_dir, filename)

    if isinstance(content, str):
        content = content.encode("utf-8")

    with open(filepath, "wb") as f:
        f.write(content)

    logger.info("Stored source %s → %s (%d bytes)", source_id, filepath, len(content))
    return filepath


def load_source_content(raw_content_ref: str) -> bytes:
    """Load original source content from disk by its storage path."""
    with open(raw_content_ref, "rb") as f:
        return f.read()
