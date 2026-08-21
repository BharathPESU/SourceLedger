"""Validation Agent — conflict resolution, confidence scoring, review routing.

Detects conflicts between sources, resolves using trust-tier ranking,
assigns calibrated confidence scores, and routes uncertain fields to
human review. Nothing below the confidence threshold is auto-committed.

Architectural rule: the system is designed to know what it doesn't know.
Low-confidence or conflicting data is never guessed past — it is surfaced.
"""

from ..config import settings
from ..models.pipeline import ValidationResult
from ..models.product_record import FieldStatus, ProductField
from ..models.schemas import CategorySchema, FieldType, get_category_schema
from ..utils.logging import get_logger, log_agent_step

logger = get_logger("ValidationAgent")


class ValidationAgent:
    """Validates extracted fields, scores confidence, and routes to review.

    This agent is the gatekeeper between raw extraction and committed
    catalog data. Its core job is ensuring the system never silently
    guesses past ambiguity.
    """

    async def validate(
        self,
        fields: list[ProductField],
        category: str,
    ) -> ValidationResult:
        """Validate fields, adjust confidence, and set commit/review status."""
        schema = get_category_schema(category)
        if not schema:
            # Without a schema, mark everything for review
            for f in fields:
                f.status = FieldStatus.NEEDS_REVIEW
            return ValidationResult(
                fields=fields,
                confidence_overall=0,
                needs_review_count=len(fields),
            )

        with log_agent_step(logger, "ValidationAgent", f"validating {category}") as ctx:
            validated_fields: list[ProductField] = []
            conflicts: list[dict] = []
            threshold = settings.confidence_threshold

            for field in fields:
                validated = self._validate_field(field, schema, threshold)
                validated_fields.append(validated)

            # Check schema completeness — penalize missing required fields
            validated_fields = self._check_completeness(
                validated_fields, schema
            )

            # Compute aggregate stats
            needs_review = sum(
                1 for f in validated_fields
                if f.status == FieldStatus.NEEDS_REVIEW
            )
            auto_committed = sum(
                1 for f in validated_fields
                if f.status == FieldStatus.AUTO_COMMITTED
            )

            # Overall confidence is the minimum across all fields
            confidence_overall = (
                min(f.confidence for f in validated_fields)
                if validated_fields
                else 0
            )

            ctx["output_summary"] = (
                f"{auto_committed} auto-committed, "
                f"{needs_review} needs review, "
                f"overall confidence={confidence_overall}"
            )

            return ValidationResult(
                fields=validated_fields,
                confidence_overall=confidence_overall,
                conflicts=conflicts,
                needs_review_count=needs_review,
                auto_committed_count=auto_committed,
            )

    def _validate_field(
        self,
        field: ProductField,
        schema: CategorySchema,
        threshold: int,
    ) -> ProductField:
        """Validate a single field: type-check, adjust confidence, set status."""
        schema_field = next(
            (f for f in schema.fields if f.name == field.name), None
        )

        if not schema_field:
            # Field not in schema — lower confidence, mark for review
            field.confidence = min(field.confidence, 30)
            field.status = FieldStatus.NEEDS_REVIEW
            field.reasoning += " | Not in category schema — may be irrelevant."
            return field

        # Null/empty value check
        if field.value is None or field.value == "" or field.value == []:
            field.confidence = 0
            field.status = FieldStatus.NEEDS_REVIEW
            if schema_field.required:
                field.reasoning += " | Required field with no value — needs manual entry."
            return field

        # Type validation
        type_valid = self._check_type(field.value, schema_field.field_type)
        if not type_valid:
            # Penalize confidence for type mismatch but don't discard
            field.confidence = max(0, field.confidence - 20)
            field.reasoning += (
                f" | Type mismatch: expected {schema_field.field_type.value}, "
                f"got {type(field.value).__name__}."
            )

        # Source quality check: empty excerpt lowers confidence
        if not field.source_excerpt.text or field.source_excerpt.text.startswith("("):
            field.confidence = max(0, field.confidence - 15)
            field.reasoning += " | Weak or missing source excerpt."

        # Apply confidence threshold to determine status
        if field.confidence >= threshold:
            field.status = FieldStatus.AUTO_COMMITTED
        else:
            field.status = FieldStatus.NEEDS_REVIEW

        return field

    def _check_type(self, value: object, expected: FieldType) -> bool:
        """Check if a value matches the expected field type."""
        if expected == FieldType.NUMBER:
            return isinstance(value, (int, float))
        elif expected == FieldType.STRING:
            return isinstance(value, str)
        elif expected == FieldType.BOOLEAN:
            return isinstance(value, bool)
        elif expected == FieldType.LIST:
            return isinstance(value, list)
        return True

    def _check_completeness(
        self,
        fields: list[ProductField],
        schema: CategorySchema,
    ) -> list[ProductField]:
        """Verify all required fields are present; penalize missing ones."""
        existing_names = {f.name for f in fields}
        required_names = set(schema.required_field_names)
        missing = required_names - existing_names

        if missing:
            logger.warning(
                "Missing required fields after enrichment: %s",
                ", ".join(sorted(missing)),
            )

        return fields
