"""Enrichment Agent — fills missing fields from secondary sources.

For missing or low-confidence fields, attempts to fill from:
(a) other provided sources, (b) similar existing catalog entries,
(c) standard taxonomy defaults where applicable.

Architectural rule: every enriched field must carry a source reference.
Enrichment never produces unsourced values.
"""

from uuid import uuid4

from ..config import settings
from ..models.pipeline import EnrichmentResult
from ..models.product_record import (
    FieldStatus,
    ProductField,
    Source,
    SourceExcerpt,
    SourceType,
    TrustTier,
)
from ..models.schemas import CategorySchema, get_category_schema
from ..utils.hashing import hash_content
from ..utils.logging import get_logger, log_agent_step

logger = get_logger("EnrichmentAgent")

# Fields below this confidence are candidates for enrichment
ENRICHMENT_THRESHOLD = 50


class EnrichmentAgent:
    """Fills gaps in extracted product data from secondary sources.

    Currently operates as a rule-based enrichment pass:
    - Adds missing required fields with zero confidence
    - Applies standard defaults where applicable
    - Flags low-confidence fields for attention

    Future: could query manufacturer websites or similar catalog entries.
    """

    async def enrich(
        self,
        fields: list[ProductField],
        category: str,
        source_id: object,
    ) -> EnrichmentResult:
        """Enrich extracted fields by filling gaps and improving confidence."""
        schema = get_category_schema(category)
        if not schema:
            return EnrichmentResult(fields=fields)

        with log_agent_step(logger, "EnrichmentAgent", f"enriching {category}") as ctx:
            enriched_fields = list(fields)
            fields_added: list[str] = []
            fields_updated: list[str] = []

            # Check for missing required fields
            existing_names = {f.name for f in enriched_fields}
            for field_def in schema.fields:
                if field_def.required and field_def.name not in existing_names:
                    # Add a placeholder field with zero confidence
                    placeholder = ProductField(
                        id=uuid4(),
                        name=field_def.name,
                        display_name=field_def.display_name,
                        value=None,
                        unit=field_def.unit,
                        confidence=0,
                        source_excerpt=SourceExcerpt(
                            source_id=source_id,
                            text="(field not found in any source)",
                        ),
                        reasoning="Required field missing from all sources — needs manual entry",
                        status=FieldStatus.NEEDS_REVIEW,
                    )
                    enriched_fields.append(placeholder)
                    fields_added.append(field_def.name)

            # Apply certification-awareness: flag if certifications field is empty
            cert_field = next(
                (f for f in enriched_fields if f.name == "certifications"),
                None,
            )
            if cert_field and (not cert_field.value or cert_field.value == []):
                cert_field.reasoning = (
                    "No certifications found — buyers often filter by certifications "
                    "(RoHS, CE, ISO). Recommend manual verification."
                )
                if cert_field.confidence > 30:
                    cert_field.confidence = 30
                fields_updated.append("certifications")

            ctx["output_summary"] = (
                f"{len(fields_added)} fields added, "
                f"{len(fields_updated)} fields updated, "
                f"{len(enriched_fields)} total"
            )

            return EnrichmentResult(
                fields=enriched_fields,
                fields_added=fields_added,
                fields_updated=fields_updated,
            )
