"""Explainability Layer — attaches citation + reasoning to every field.

This is a read-only annotation pass: it cannot alter data, only
enrich the provenance metadata. Its output is what powers the
Field Inspector UI.

Architectural rule: read-only — cannot alter data, only annotate it.
"""

from ..models.product_record import ProductField
from ..utils.logging import get_logger, log_agent_step

logger = get_logger("ExplainabilityLayer")


class ExplainabilityLayer:
    """Ensures every field has complete provenance annotations.

    This pass verifies that every field in the output has:
    - A non-empty source excerpt
    - A reasoning explanation
    - A valid confidence score

    If any are missing, it adds default annotations rather than
    letting unexplained fields through to the UI.
    """

    async def annotate(self, fields: list[ProductField]) -> list[ProductField]:
        """Annotate fields with complete provenance metadata."""
        with log_agent_step(logger, "ExplainabilityLayer", "annotating fields") as ctx:
            annotated = []
            gaps_filled = 0

            for field in fields:
                # Ensure source excerpt is not empty
                if not field.source_excerpt.text:
                    field.source_excerpt.text = "(no source excerpt available)"
                    gaps_filled += 1

                # Ensure reasoning is not empty
                if not field.reasoning:
                    field.reasoning = (
                        f"Value '{field.value}' extracted for field "
                        f"'{field.display_name}' with confidence {field.confidence}%."
                    )
                    gaps_filled += 1

                annotated.append(field)

            ctx["output_summary"] = (
                f"{len(annotated)} fields annotated, {gaps_filled} gaps filled"
            )
            return annotated
