"""Ingestion API routes — single-source and bulk CSV upload endpoints."""

import asyncio
import csv
import io
import json
from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse

from ..models.api import IngestRequest, IngestResponse
from ..models.product_record import SourceType, TrustTier
from ..models.unihack_schema import UNIHACK_DELIVERY_COLUMNS, map_product_fields_to_unihack_row
from ..orchestration.pipeline import run_pipeline
from ..db.store import store
from ..utils.logging import get_logger

logger = get_logger("routes_ingest")

router = APIRouter(prefix="/api", tags=["ingestion"])


@router.post("/ingest", response_model=IngestResponse)
async def ingest_source(request: IngestRequest) -> IngestResponse:
    """Ingest a single source and produce a structured product record.

    Accepts a URL (for web pages), base64-encoded content (for PDFs),
    or raw CSV row text (source_type=csv).
    Runs the full pipeline: ingest → extract → enrich → validate → annotate.
    """
    run_id = uuid4()

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
            message=(
                f"Successfully processed '{product.name}' — "
                f"{len(product.fields)} fields extracted, "
                f"overall confidence {product.confidence_overall}%"
            ),
        )

    except ValueError as e:
        return IngestResponse(run_id=run_id, status="failed", message=str(e))
    except Exception as e:
        return IngestResponse(run_id=run_id, status="failed", message=f"Pipeline error: {str(e)}")


# ─── Bulk CSV upload ──────────────────────────────────────────────────────────

# In-memory job tracker { job_id: { total, done, failed, product_ids[] } }
_bulk_jobs: dict[str, dict] = {}


@router.post("/ingest/bulk-csv")
async def bulk_ingest_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """Upload a CSV file and process each row through the full pipeline.

    The CSV must contain at least one of:
      - A column named 'Part_Desc', 'PART_NUMBER', or 'Mfg_Part_Num'
      - Any human-readable product description column

    Processing runs in the background. Poll /api/ingest/bulk-csv/{job_id}
    for progress, then GET /api/export/csv to download the enriched output.
    """
    raw_bytes = await file.read()
    try:
        text = raw_bytes.decode("utf-8-sig")  # strip BOM if present
    except UnicodeDecodeError:
        text = raw_bytes.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty or has no data rows.")

    job_id = str(uuid4())
    _bulk_jobs[job_id] = {
        "total": len(rows),
        "done": 0,
        "failed": 0,
        "product_ids": [],
        "status": "running",
    }

    background_tasks.add_task(_process_bulk_rows, job_id, rows)

    logger.info("bulk_ingest: started job %s — %d rows", job_id, len(rows))
    return {
        "job_id": job_id,
        "total_rows": len(rows),
        "status": "running",
        "message": f"Processing {len(rows)} rows in the background.",
        "poll_url": f"/api/ingest/bulk-csv/{job_id}",
        "download_url": "/api/export/csv",
    }


@router.get("/ingest/bulk-csv/{job_id}")
async def bulk_ingest_status(job_id: str):
    """Poll the status of a bulk CSV ingestion job."""
    job = _bulk_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")
    pct = round(job["done"] / job["total"] * 100) if job["total"] else 0
    return {
        "job_id": job_id,
        "status": job["status"],
        "total": job["total"],
        "done": job["done"],
        "failed": job["failed"],
        "progress_pct": pct,
        "product_ids": job["product_ids"][-10:],  # last 10 for preview
    }


@router.post("/ingest/bulk-csv/{job_id}/download")
async def bulk_ingest_download(job_id: str):
    """Download the enriched CSV for a completed bulk job."""
    job = _bulk_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")
    if job["status"] != "completed":
        raise HTTPException(status_code=202, detail=f"Job still running — {job['done']}/{job['total']} done.")

    product_ids: list[UUID] = [UUID(pid) for pid in job["product_ids"]]
    products = [store.get_product(pid) for pid in product_ids]
    products = [p for p in products if p]

    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=UNIHACK_DELIVERY_COLUMNS, extrasaction="ignore", lineterminator="\r\n")
    writer.writeheader()
    for product in products:
        sku = next(
            (str(f.value) for f in product.fields if f.name in ("model_number", "part_number", "mfg_part_num") and f.value),
            str(product.id)[:8],
        )
        row = map_product_fields_to_unihack_row(product.fields, title=product.name, sku=sku)
        writer.writerow(row)

    csv_bytes = "\ufeff".encode("utf-8") + out.getvalue().encode("utf-8")
    filename = f"Unihack_Delivery_Format_{len(products)}_items.csv"
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ─── Background worker ────────────────────────────────────────────────────────

async def _process_bulk_rows(job_id: str, rows: list[dict]) -> None:
    """Process each CSV row through the full pipeline (runs in background).

    Each row dict is JSON-serialized and passed as the content string.
    The ExtractionAgent detects JSON dicts and uses deterministic mapping
    instead of LLM parsing, preserving exact CSV values.
    """
    job = _bulk_jobs[job_id]

    for i, row_dict in enumerate(rows):
        # Pass the raw CSV row as a JSON-encoded dict so the ExtractionAgent
        # can deterministically map columns → ProductFields without LLM.
        row_json = json.dumps(row_dict, ensure_ascii=False)

        try:
            product = await run_pipeline(
                source_type=SourceType.CSV,
                content=row_json,
                category=None,
            )
            job["done"] += 1
            job["product_ids"].append(str(product.id))
            logger.info(
                "bulk_ingest[%s]: row %d/%d — '%s' (%d fields)",
                job_id, i + 1, job["total"], product.name, len(product.fields),
            )
        except Exception as e:
            job["failed"] += 1
            job["done"] += 1
            logger.error("bulk_ingest[%s]: row %d failed — %s", job_id, i + 1, e)

        # Small delay to respect API rate limits between rows
        if i < len(rows) - 1:
            await asyncio.sleep(0.5)

    job["status"] = "completed"
    logger.info(
        "bulk_ingest[%s]: completed — %d/%d succeeded, %d failed",
        job_id, job["total"] - job["failed"], job["total"], job["failed"],
    )
