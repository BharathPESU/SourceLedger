"""API request/response models for SourceLedger endpoints.

These models define the external contract between the frontend and
backend. They are separate from the internal domain models in
product_record.py so that API shape can evolve independently of
domain logic.
"""

from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from .product_record import (
    FieldStatus,
    ProductField,
    ProductRecord,
    ReviewAction,
    ReviewActionType,
    Source,
    SourceType,
)
from .schemas import CategorySchema


# ═════════════════════════════════════════════════════════════════════
# Ingestion
# ═════════════════════════════════════════════════════════════════════


class IngestRequest(BaseModel):
    """Request to ingest a single source and produce a product record.

    The user provides either a URL (for web sources) or uploaded file
    content (for PDFs/images). category is optional — if omitted, the
    system will attempt to auto-detect the product category.
    """

    source_type: SourceType
    content: str  # URL for web, base64-encoded bytes for files
    category: Optional[str] = None  # Category key; auto-detected if omitted
    filename: Optional[str] = None  # Original filename for file uploads
    trust_tier: Optional[int] = None  # Override trust tier (1-3); defaults to auto-detect


class IngestResponse(BaseModel):
    """Response from the single-source ingestion endpoint."""

    run_id: UUID
    status: str  # "processing" | "completed" | "failed"
    product_id: Optional[UUID] = None  # Set when status is "completed"
    message: str = ""


# ═════════════════════════════════════════════════════════════════════
# Products
# ═════════════════════════════════════════════════════════════════════


class ProductSummary(BaseModel):
    """Lightweight product record for list views."""

    id: UUID
    name: str
    category: str
    category_display_name: str
    confidence_overall: int
    field_count: int
    needs_review_count: int
    auto_committed_count: int
    created_at: str


class ProductListResponse(BaseModel):
    """Paginated list of product records."""

    products: list[ProductSummary]
    total_count: int


class ProductDetailResponse(BaseModel):
    """Full product record with all fields and their provenance."""

    product: ProductRecord
    sources: list[Source]
    category_schema: CategorySchema  # So the UI knows field definitions


# ═════════════════════════════════════════════════════════════════════
# Field Inspector (hero surface #1)
# ═════════════════════════════════════════════════════════════════════


class FieldInspectResponse(BaseModel):
    """Detailed field inspection — the hero explainability surface.

    Shows everything needed to verify a single field: the value, where
    it came from (exact source excerpt), the LLM's reasoning, the
    confidence score, and any alternative values from other sources
    that were considered and rejected.
    """

    field: ProductField
    source_document: Source
    source_excerpt_text: str
    source_excerpt_location: Optional[str] = None
    reasoning: str
    confidence: int
    status: FieldStatus
    # Alternative values considered from other sources (if multiple sources exist)
    alternatives: list["FieldAlternative"] = Field(default_factory=list)


class FieldAlternative(BaseModel):
    """An alternative value for a field, from a different source.

    Shown in the Field Inspector when multiple sources provided
    different values for the same field. Lets the reviewer see what
    was considered and why the winning value was chosen.
    """

    value: Any
    source_id: UUID
    source_origin: str  # URL or filename
    trust_tier: int
    confidence: int
    excerpt: str


# ═════════════════════════════════════════════════════════════════════
# Review Queue (hero surface #2)
# ═════════════════════════════════════════════════════════════════════


class ReviewQueueItem(BaseModel):
    """A single field awaiting human review."""

    field: ProductField
    product_id: UUID
    product_name: str
    category: str
    category_display_name: str


class ReviewQueueResponse(BaseModel):
    """All fields currently needing human review, across all records."""

    items: list[ReviewQueueItem]
    total_count: int


class ReviewActionRequest(BaseModel):
    """Human reviewer action on a flagged field."""

    action: ReviewActionType  # accept, edit, reject
    corrected_value: Optional[Any] = None  # Required when action is "edit"
    reviewer: str = "anonymous"


class ReviewActionResponse(BaseModel):
    """Confirmation of a review action, with the updated field."""

    review_action: ReviewAction
    updated_field: ProductField


# ═════════════════════════════════════════════════════════════════════
# Dashboard / Quality Stats
# ═════════════════════════════════════════════════════════════════════


class DashboardStats(BaseModel):
    """Catalog-wide quality statistics for the dashboard view.

    Designed to answer the judge's question: "does this work at scale?"
    by showing aggregate metrics across all records.
    """

    total_records: int
    total_fields: int
    auto_committed_count: int
    needs_review_count: int
    human_corrected_count: int
    auto_committed_pct: float
    needs_review_pct: float
    average_confidence: float
    confidence_by_category: dict[str, float]
    records_by_category: dict[str, int]


# ═════════════════════════════════════════════════════════════════════
# Categories
# ═════════════════════════════════════════════════════════════════════


class CategoryListResponse(BaseModel):
    """Available product categories and their schemas."""

    categories: list[CategorySchema]


# ═════════════════════════════════════════════════════════════════════
# Health / Meta
# ═════════════════════════════════════════════════════════════════════


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "ok"
    version: str = "0.1.0"
    environment: str = "development"
