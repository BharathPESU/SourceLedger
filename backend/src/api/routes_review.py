"""Review Queue API routes — the hero review surface."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException

from ..db.store import store
from ..models.api import (
    ReviewActionRequest,
    ReviewActionResponse,
    ReviewQueueItem,
    ReviewQueueResponse,
)
from ..models.product_record import FieldStatus, ReviewAction, ReviewActionType

router = APIRouter(prefix="/api", tags=["review"])


@router.get("/review", response_model=ReviewQueueResponse)
async def get_review_queue() -> ReviewQueueResponse:
    """List all fields needing human review across all products."""
    items_raw = await store.get_review_queue()
    items = [
        ReviewQueueItem(
            field=item["field"],
            product_id=item["product_id"],
            product_name=item["product_name"],
            category=item["category"],
            category_display_name=item["category_display_name"],
        )
        for item in items_raw
    ]
    return ReviewQueueResponse(items=items, total_count=len(items))


@router.post(
    "/products/{product_id}/fields/{field_id}/review",
    response_model=ReviewActionResponse,
)
async def review_field(
    product_id: UUID,
    field_id: UUID,
    request: ReviewActionRequest,
) -> ReviewActionResponse:
    """Accept, edit, or reject a field value in the review queue.

    - accept: mark field as auto_committed with its current value
    - edit: update value to corrected_value, mark as human_corrected
    - reject: set value to None, mark as needs_review (stays in queue)
    """
    product = await store.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    field = next((f for f in product.fields if f.id == field_id), None)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    original_value = field.value

    if request.action == ReviewActionType.ACCEPT:
        field.status = FieldStatus.AUTO_COMMITTED
    elif request.action == ReviewActionType.EDIT:
        if request.corrected_value is None:
            raise HTTPException(
                status_code=400,
                detail="corrected_value is required for edit action",
            )
        field.value = request.corrected_value
        field.status = FieldStatus.HUMAN_CORRECTED
        field.confidence = 100  # Human-verified = full confidence
        field.reasoning += f" | Human corrected: '{original_value}' → '{request.corrected_value}'"
    elif request.action == ReviewActionType.REJECT:
        field.value = None
        field.confidence = 0
        field.status = FieldStatus.NEEDS_REVIEW
        field.reasoning += " | Value rejected by reviewer."
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action: {request.action}. Use 'accept', 'edit', or 'reject'.",
        )

    field.updated_at = datetime.now(timezone.utc)

    # Update the field in the product and recompute overall confidence
    await store.update_field(
        product_id, field_id, new_value=field.value, new_status=field.status
    )

    # Record the review action for audit trail and active learning
    review_action = ReviewAction(
        field_id=field_id,
        product_id=product_id,
        action=request.action,
        original_value=original_value,
        corrected_value=request.corrected_value,
        reviewer=request.reviewer,
    )
    await store.save_review_action(review_action)

    return ReviewActionResponse(
        review_action=review_action,
        updated_field=field,
    )
