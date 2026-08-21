"""Vector-based deduplication — STUB ONLY.

This is stretch scope (PRD Phase 5). The interface is defined now so
that the rest of the codebase can reference it, but no implementation
until the must-build path is fully working end-to-end.

When implemented, this will:
- Embed product records using a text embedding model
- Compare new records against existing ones via cosine similarity
- Flag likely duplicates for review rather than silently creating them
"""

from uuid import UUID

from ..utils.logging import get_logger

logger = get_logger("dedup")


async def check_duplicate(product_name: str, category: str) -> UUID | None:
    """Check if a near-duplicate product already exists in the catalog.

    Returns the existing product's UUID if a likely duplicate is found,
    or None if the product appears to be new.

    STUB: always returns None (no duplicate detected) until Phase 5.
    """
    logger.info(
        "Dedup check (STUB): '%s' in category '%s' — no implementation yet",
        product_name,
        category,
    )
    return None
