"""Content hashing for idempotency.

Re-ingesting the same source must not create duplicate records.
Content is hashed at ingestion time and checked before creating
a new Source entity.
"""

import hashlib


def hash_content(content: str | bytes) -> str:
    """Produce a SHA-256 hex digest of the given content.

    Used to enforce idempotency: if a source with the same hash
    already exists, re-ingestion is a no-op rather than creating
    a duplicate.
    """
    if isinstance(content, str):
        content = content.encode("utf-8")
    return hashlib.sha256(content).hexdigest()
