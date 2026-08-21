"""Pipeline orchestration — wires agents into the full extraction flow.

Connects: Ingestion → Extraction → Enrichment → Validation → Explainability.

Uses a simple sequential pipeline for the MVP. The architecture doc
specifies LangGraph for branching/human-in-the-loop routing, but
the sequential flow covers the must-build demo path. LangGraph
state machine can be layered on top without changing agent interfaces.
"""

from uuid import uuid4

from ..agents.enrichment_agent import EnrichmentAgent
from ..agents.explainability_layer import ExplainabilityLayer
from ..agents.extraction_agent import ExtractionAgent
from ..agents.ingestion_agent import IngestionAgent
from ..agents.validation_agent import ValidationAgent
from ..db.store import store
from ..models.product_record import ProductRecord, SourceType, TrustTier
from ..services.dedup import check_duplicate
from ..utils.hashing import hash_content
from ..utils.logging import get_logger, log_agent_step

logger = get_logger("Pipeline")

# Agent instances — reused across requests
ingestion_agent = IngestionAgent()
extraction_agent = ExtractionAgent()
enrichment_agent = EnrichmentAgent()
validation_agent = ValidationAgent()
explainability_layer = ExplainabilityLayer()


async def run_pipeline(
    source_type: SourceType,
    content: str,
    category: str | None = None,
    filename: str | None = None,
    trust_tier: TrustTier = TrustTier.MARKETPLACE,
) -> ProductRecord:
    """Run the full extraction pipeline on a single source.

    Steps:
    1. Ingest: normalize input → raw text + Source entity
    2. Check idempotency: skip if same content already processed
    3. Extract: raw text → structured fields via LLM
    4. Enrich: fill missing fields from secondary sources/defaults
    5. Validate: score confidence, route to auto-commit or review
    6. Annotate: ensure all fields have complete provenance
    7. Persist: save product record and source to store

    Returns the completed ProductRecord.
    """
    with log_agent_step(logger, "Pipeline", "full extraction run") as ctx:

        # ── 1. Ingestion ─────────────────────────────────────────────
        ingestion_result = await ingestion_agent.ingest(
            source_type=source_type,
            content=content,
            filename=filename,
            trust_tier=trust_tier,
        )

        # ── 2. Idempotency check ─────────────────────────────────────
        existing = await store.find_source_by_hash(
            ingestion_result.source.content_hash
        )
        if existing:
            logger.info(
                "Source already ingested (hash=%s), checking for existing product",
                existing.content_hash[:12],
            )
            # Find the product that used this source
            products = await store.list_products()
            for p in products:
                if existing.id in p.source_ids:
                    ctx["output_summary"] = f"duplicate source — returning existing product '{p.name}'"
                    return p

        # Save source
        await store.save_source(ingestion_result.source)

        # ── 3. Auto-detect category if not provided ───────────────────
        if not category:
            category = _detect_category(ingestion_result.raw_text)

        # ── 4. Extraction ────────────────────────────────────────────
        extraction_result = await extraction_agent.extract(
            raw_text=ingestion_result.raw_text,
            category=category,
            source_id=ingestion_result.source.id,
        )

        # ── 5. Enrichment ────────────────────────────────────────────
        enrichment_result = await enrichment_agent.enrich(
            fields=extraction_result.fields,
            category=category,
            source_id=ingestion_result.source.id,
        )

        # ── 6. Validation ────────────────────────────────────────────
        validation_result = await validation_agent.validate(
            fields=enrichment_result.fields,
            category=category,
        )

        # ── 7. Explainability ────────────────────────────────────────
        annotated_fields = await explainability_layer.annotate(
            validation_result.fields
        )

        # ── 8. Dedup check (stub — Phase 5) ──────────────────────────
        dedup_id = await check_duplicate(
            extraction_result.product_name, category
        )

        # ── 9. Build and persist ProductRecord ────────────────────────
        product = ProductRecord(
            id=uuid4(),
            name=extraction_result.product_name,
            category=category,
            fields=annotated_fields,
            source_ids=[ingestion_result.source.id],
            confidence_overall=validation_result.confidence_overall,
            dedup_cluster_id=dedup_id,
        )

        await store.save_product(product)

        ctx["output_summary"] = (
            f"'{product.name}' — {len(product.fields)} fields, "
            f"confidence={product.confidence_overall}, "
            f"review={validation_result.needs_review_count}"
        )

        return product


def _detect_category(raw_text: str) -> str:
    """Simple keyword-based category detection.

    Scans the raw text for domain-specific keywords to guess the
    most likely product category. Falls back to "industrial_pump"
    if no clear match.
    """
    text_lower = raw_text.lower()

    category_keywords = {
        "industrial_pump": [
            "pump", "flow rate", "head pressure", "impeller",
            "centrifugal", "submersible", "suction", "discharge",
        ],
        "electrical_connector": [
            "connector", "contact", "pin", "socket", "plug",
            "voltage rating", "current rating", "ip67", "ip68",
        ],
        "safety_fastener": [
            "bolt", "nut", "screw", "fastener", "thread",
            "torque", "tensile", "washer", "grade 8.8", "grade 10.9",
        ],
    }

    scores: dict[str, int] = {}
    for category, keywords in category_keywords.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        scores[category] = score

    best = max(scores, key=scores.get)
    if scores[best] == 0:
        logger.warning("No category keywords found — defaulting to industrial_pump")
        return "industrial_pump"

    logger.info(
        "Auto-detected category: %s (score=%d)", best, scores[best]
    )
    return best
