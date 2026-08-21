"""Ingestion API routes — single-source endpoint.

Bulk ingestion is Phase 5 scope; this module handles single-source
ingestion only, as specified.
"""

from uuid import uuid4

from fastapi import APIRouter, HTTPException

from ..models.api import IngestRequest, IngestResponse
from ..models.product_record import TrustTier
from ..orchestration.pipeline import run_pipeline

router = APIRouter(prefix="/api", tags=["ingestion"])


@router.post("/ingest", response_model=IngestResponse)
async def ingest_source(request: IngestRequest) -> IngestResponse:
    """Ingest a single source and produce a structured product record.

    Accepts a URL (for web pages) or base64-encoded content (for PDFs).
    Runs the full pipeline: ingest → extract → enrich → validate → annotate.
    """
    run_id = uuid4()

    # Map trust tier from request or use default
    trust_tier = TrustTier.MARKETPLACE
    if request.trust_tier is not None:
        try:
            trust_tier = TrustTier(request.trust_tier)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid trust_tier: {request.trust_tier}. Use 1 (manufacturer), 2 (distributor), or 3 (marketplace).",
            )

    try:
        product = await run_pipeline(
            source_type=request.source_type,
            content=request.content,
            category=request.category,
            filename=request.filename,
            trust_tier=trust_tier,
        )

        return IngestResponse(
            run_id=run_id,
            status="completed",
            product_id=product.id,
            message=f"Successfully processed '{product.name}' — "
            f"{len(product.fields)} fields extracted, "
            f"overall confidence {product.confidence_overall}%",
        )

    except ValueError as e:
        return IngestResponse(
            run_id=run_id,
            status="failed",
            message=str(e),
        )
    except Exception as e:
        return IngestResponse(
            run_id=run_id,
            status="failed",
            message=f"Pipeline error: {str(e)}",
        )
