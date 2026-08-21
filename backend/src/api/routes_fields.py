"""Field Inspector API routes — the hero explainability surface."""

from uuid import UUID

from fastapi import APIRouter, HTTPException

from ..db.store import store
from ..models.api import FieldInspectResponse
from ..models.product_record import FieldStatus

router = APIRouter(prefix="/api", tags=["fields"])


@router.get(
    "/products/{product_id}/fields/{field_id}/inspect",
    response_model=FieldInspectResponse,
)
async def inspect_field(product_id: UUID, field_id: UUID) -> FieldInspectResponse:
    """Inspect a single field — shows source excerpt, reasoning, confidence.

    This is the hero API endpoint powering the Field Inspector UI.
    Returns everything needed to verify a field: the value, where it
    came from, the LLM's reasoning, and the confidence score.
    """
    product = await store.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    field = next((f for f in product.fields if f.id == field_id), None)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    # Look up the source document
    source = await store.get_source(field.source_excerpt.source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    return FieldInspectResponse(
        field=field,
        source_document=source,
        source_excerpt_text=field.source_excerpt.text,
        source_excerpt_location=field.source_excerpt.location,
        reasoning=field.reasoning,
        confidence=field.confidence,
        status=field.status,
        alternatives=[],  # Populated when multi-source conflict resolution is added
    )
