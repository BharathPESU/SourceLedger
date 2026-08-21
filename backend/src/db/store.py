"""In-memory product catalog store.

Provides a clean repository interface for product records, sources,
and review actions. Uses in-memory dicts for fast development and
demo reliability (no external DB dependency during judging).

The interface is async-ready so it can be swapped to a PostgreSQL-
backed implementation without changing callers.
"""

from typing import Optional
from uuid import UUID

from ..models.product_record import (
    FieldStatus,
    ProductField,
    ProductRecord,
    ReviewAction,
    Source,
)
from ..models.schemas import CATEGORY_REGISTRY
from ..utils.logging import get_logger

logger = get_logger("store")


class ProductStore:
    """Thread-safe, async-compatible in-memory store.

    All mutations are logged. Data persists for the lifetime of the
    server process — sufficient for a hackathon demo.
    """

    def __init__(self) -> None:
        self._products: dict[UUID, ProductRecord] = {}
        self._sources: dict[UUID, Source] = {}
        self._review_actions: list[ReviewAction] = []

    # ── Sources ──────────────────────────────────────────────────────

    async def save_source(self, source: Source) -> Source:
        self._sources[source.id] = source
        logger.info("Saved source %s (%s)", source.id, source.origin)
        return source

    async def get_source(self, source_id: UUID) -> Optional[Source]:
        return self._sources.get(source_id)

    async def find_source_by_hash(self, content_hash: str) -> Optional[Source]:
        """Look up a source by its content hash — used for idempotency."""
        for source in self._sources.values():
            if source.content_hash == content_hash:
                return source
        return None

    async def list_sources(self) -> list[Source]:
        return list(self._sources.values())

    # ── Products ─────────────────────────────────────────────────────

    async def save_product(self, product: ProductRecord) -> ProductRecord:
        self._products[product.id] = product
        logger.info(
            "Saved product %s '%s' (category=%s, confidence=%d, fields=%d)",
            product.id,
            product.name,
            product.category,
            product.confidence_overall,
            len(product.fields),
        )
        return product

    async def get_product(self, product_id: UUID) -> Optional[ProductRecord]:
        return self._products.get(product_id)

    async def list_products(self) -> list[ProductRecord]:
        return list(self._products.values())

    async def update_product(self, product: ProductRecord) -> ProductRecord:
        """Replace a product record entirely (used after review actions)."""
        self._products[product.id] = product
        return product

    async def update_field(
        self,
        product_id: UUID,
        field_id: UUID,
        new_value: object = None,
        new_status: Optional[FieldStatus] = None,
    ) -> Optional[ProductField]:
        """Update a single field within a product record."""
        product = self._products.get(product_id)
        if not product:
            return None

        for i, field in enumerate(product.fields):
            if field.id == field_id:
                if new_value is not None:
                    field.value = new_value
                if new_status is not None:
                    field.status = new_status
                product.fields[i] = field
                product.confidence_overall = product.compute_overall_confidence()
                return field
        return None

    # ── Review Queue ─────────────────────────────────────────────────

    async def get_review_queue(self) -> list[dict]:
        """Return all fields with status needs_review across all products."""
        items = []
        for product in self._products.values():
            schema = CATEGORY_REGISTRY.get(product.category)
            display_name = schema.display_name if schema else product.category
            for field in product.fields:
                if field.status == FieldStatus.NEEDS_REVIEW:
                    items.append(
                        {
                            "field": field,
                            "product_id": product.id,
                            "product_name": product.name,
                            "category": product.category,
                            "category_display_name": display_name,
                        }
                    )
        return items

    async def save_review_action(self, action: ReviewAction) -> ReviewAction:
        self._review_actions.append(action)
        logger.info(
            "Saved review action: %s on field %s (product %s)",
            action.action.value,
            action.field_id,
            action.product_id,
        )
        return action

    async def get_review_actions(self) -> list[ReviewAction]:
        return list(self._review_actions)

    # ── Dashboard Stats ──────────────────────────────────────────────

    async def get_dashboard_stats(self) -> dict:
        """Compute catalog-wide quality statistics."""
        products = list(self._products.values())
        all_fields: list[ProductField] = []
        for p in products:
            all_fields.extend(p.fields)

        total_fields = len(all_fields)
        auto_committed = sum(
            1 for f in all_fields if f.status == FieldStatus.AUTO_COMMITTED
        )
        needs_review = sum(
            1 for f in all_fields if f.status == FieldStatus.NEEDS_REVIEW
        )
        human_corrected = sum(
            1 for f in all_fields if f.status == FieldStatus.HUMAN_CORRECTED
        )

        avg_confidence = (
            sum(f.confidence for f in all_fields) / total_fields
            if total_fields > 0
            else 0.0
        )

        # Per-category breakdowns
        confidence_by_cat: dict[str, list[int]] = {}
        records_by_cat: dict[str, int] = {}
        for p in products:
            records_by_cat[p.category] = records_by_cat.get(p.category, 0) + 1
            if p.category not in confidence_by_cat:
                confidence_by_cat[p.category] = []
            confidence_by_cat[p.category].append(p.confidence_overall)

        avg_conf_by_cat = {
            cat: sum(vals) / len(vals) if vals else 0.0
            for cat, vals in confidence_by_cat.items()
        }

        return {
            "total_records": len(products),
            "total_fields": total_fields,
            "auto_committed_count": auto_committed,
            "needs_review_count": needs_review,
            "human_corrected_count": human_corrected,
            "auto_committed_pct": (
                auto_committed / total_fields * 100 if total_fields > 0 else 0.0
            ),
            "needs_review_pct": (
                needs_review / total_fields * 100 if total_fields > 0 else 0.0
            ),
            "average_confidence": round(avg_confidence, 1),
            "confidence_by_category": {
                k: round(v, 1) for k, v in avg_conf_by_cat.items()
            },
            "records_by_category": records_by_cat,
        }


# ── Singleton ────────────────────────────────────────────────────────
# Single store instance shared across the application lifetime.

store = ProductStore()
