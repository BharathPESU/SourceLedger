"""Inter-agent pipeline contracts.

Each pipeline stage has a defined input/output contract so that
stages can be built, tested, and swapped independently. An agent
step is testable as (input, context) → output without a live LLM.

Flow: IngestionResult → ExtractionResult → EnrichmentResult → ValidationResult
"""

from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from .product_record import ProductField, Source


class IngestionResult(BaseModel):
    """Output of the Ingestion Agent.

    Contains the raw text extracted from the source document, along
    with metadata and a reference to the stored original. The original
    document is always preserved — it is never discarded, because it's
    needed for citation in the Field Inspector.
    """

    source: Source
    raw_text: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    # Metadata examples:
    #   PDF: {"pages": 3, "title": "CR 15-3 Data Sheet"}
    #   Web: {"url": "https://...", "title": "...", "fetched_at": "..."}


class ExtractionResult(BaseModel):
    """Output of the Extraction Agent.

    A draft structured product record with initial field extractions.
    Confidence scores at this stage reflect extraction certainty only
    (how clearly the source text states this value), not cross-source
    validation which happens in the Validation Agent.
    """

    product_name: str
    category: str
    fields: list[ProductField]
    source_id: UUID  # Which source these fields were extracted from


class EnrichmentResult(BaseModel):
    """Output of the Enrichment Agent.

    Fields that were missing or had low confidence may now be
    supplemented from secondary sources (other documents, similar
    catalog entries, taxonomy defaults). Every enriched field must
    carry its own source reference — enrichment never produces
    unsourced values.
    """

    fields: list[ProductField]
    enrichment_sources: list[Source] = Field(default_factory=list)
    fields_added: list[str] = Field(default_factory=list)  # Names of newly added fields
    fields_updated: list[str] = Field(default_factory=list)  # Names of fields with improved confidence


class ValidationResult(BaseModel):
    """Output of the Validation Agent.

    Final fields with resolved conflicts and calibrated confidence
    scores. Fields below the confidence threshold are automatically
    marked needs_review. The validation agent never silently guesses
    past ambiguity — it surfaces it.
    """

    fields: list[ProductField]
    confidence_overall: int
    conflicts: list[dict[str, Any]] = Field(default_factory=list)
    # Each conflict: {
    #   "field_name": str,
    #   "values": [{"value": ..., "source_id": ..., "trust_tier": int}],
    #   "resolution": "trust_tier" | "human_review",
    #   "chosen_value": ...,
    # }
    needs_review_count: int = 0
    auto_committed_count: int = 0
