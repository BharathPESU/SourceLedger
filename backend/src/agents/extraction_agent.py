"""Extraction Agent — produces schema-locked structured output from raw text.

Uses Gemini (or falls back to demo mode) to extract product fields
from raw text according to a category-specific schema. Output must
validate against the schema or it is rejected, not passed forward.

Every extracted field carries a source excerpt and initial confidence
score — no field is ever created without provenance.
"""

import json
import re
from typing import Any
from uuid import UUID, uuid4

from ..config import settings
from ..models.pipeline import ExtractionResult
from ..models.product_record import (
    FieldStatus,
    ProductField,
    SourceExcerpt,
)
from ..models.schemas import (
    CATEGORY_REGISTRY,
    CategoryFieldDef,
    CategorySchema,
    FieldType,
    get_category_schema,
)
from ..utils.logging import get_logger, log_agent_step

logger = get_logger("ExtractionAgent")

# Maximum retries for schema-invalid LLM output
MAX_RETRIES = 2


class ExtractionAgent:
    """Extracts structured product fields from raw text using an LLM.

    The agent is designed as a pure function over (raw_text, category, source_id)
    → ExtractionResult, making it testable without a live LLM when mocked.
    """

    def __init__(self) -> None:
        self._model = None

    def _get_model(self):
        """Lazy-init the Gemini model. Returns None if no API key."""
        if self._model is not None:
            return self._model

        if not settings.google_api_key:
            logger.warning("No GOOGLE_API_KEY set — using demo extraction mode")
            return None

        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.google_api_key)
            self._model = genai.GenerativeModel("gemini-2.0-flash")
            return self._model
        except Exception as e:
            logger.error("Failed to initialize Gemini: %s", e)
            return None

    async def extract(
        self,
        raw_text: str,
        category: str,
        source_id: UUID,
    ) -> ExtractionResult:
        """Extract structured fields from raw text for the given category.

        Falls back to demo mode if no LLM is available.
        """
        schema = get_category_schema(category)
        if not schema:
            raise ValueError(
                f"Unknown category '{category}'. "
                f"Available: {list(CATEGORY_REGISTRY.keys())}"
            )

        with log_agent_step(logger, "ExtractionAgent", f"extracting {category}") as ctx:
            model = self._get_model()

            if model is not None:
                result = await self._extract_with_llm(
                    model, raw_text, schema, source_id
                )
            else:
                result = self._extract_demo_mode(raw_text, schema, source_id)

            ctx["output_summary"] = (
                f"{len(result.fields)} fields extracted for '{result.product_name}'"
            )
            return result

    async def _extract_with_llm(
        self,
        model: Any,
        raw_text: str,
        schema: CategorySchema,
        source_id: UUID,
    ) -> ExtractionResult:
        """Use Gemini to extract fields with structured JSON output."""
        prompt = self._build_prompt(raw_text, schema)

        for attempt in range(MAX_RETRIES + 1):
            try:
                response = model.generate_content(prompt)
                response_text = response.text

                parsed = self._parse_llm_response(
                    response_text, schema, source_id
                )
                return parsed

            except Exception as e:
                if attempt < MAX_RETRIES:
                    logger.warning(
                        "Extraction attempt %d failed, retrying: %s",
                        attempt + 1,
                        e,
                    )
                else:
                    logger.error(
                        "Extraction failed after %d attempts: %s",
                        MAX_RETRIES + 1,
                        e,
                    )
                    raise

        # Should not reach here, but satisfy type checker
        raise RuntimeError("Extraction failed unexpectedly")

    def _build_prompt(self, raw_text: str, schema: CategorySchema) -> str:
        """Build the extraction prompt including category field definitions."""
        field_defs = []
        for f in schema.fields:
            unit_str = f" (unit: {f.unit})" if f.unit else ""
            req_str = "REQUIRED" if f.required else "optional"
            examples_str = f" Examples: {', '.join(f.examples)}" if f.examples else ""
            field_defs.append(
                f'  - "{f.name}" ({f.display_name}): {f.description}{unit_str} [{req_str}]{examples_str}'
            )

        fields_block = "\n".join(field_defs)

        # Truncate very long source text to stay within context limits
        max_chars = 12000
        if len(raw_text) > max_chars:
            raw_text = raw_text[:max_chars] + "\n\n[... truncated ...]"

        return f"""You are a product data extraction specialist for industrial commerce.

TASK: Extract structured product data from the source text below.
CATEGORY: {schema.display_name}

FIELDS TO EXTRACT:
{fields_block}

RULES:
1. Extract ONLY from what the source text explicitly states.
2. For each field, quote the EXACT excerpt from the source that supports the value.
3. Rate your confidence 0-100 for each field (100 = explicitly stated, 50-70 = inferred, below 50 = guessed).
4. If a required field is not found in the text, still include it with confidence 0 and value null.
5. Do NOT hallucinate or fabricate values not supported by the source.
6. For numeric fields, extract the number only (without the unit).

SOURCE TEXT:
---
{raw_text}
---

Respond with ONLY a valid JSON object in this exact format:
{{
  "product_name": "<extracted product name or title>",
  "fields": [
    {{
      "name": "<field key from the list above>",
      "value": <extracted value — string, number, boolean, or array>,
      "confidence": <0-100>,
      "excerpt": "<exact quote from source text supporting this value>",
      "reasoning": "<brief explanation of why you chose this value>"
    }}
  ]
}}

Return ONLY the JSON. No markdown fences, no commentary."""

    def _parse_llm_response(
        self,
        response_text: str,
        schema: CategorySchema,
        source_id: UUID,
    ) -> ExtractionResult:
        """Parse LLM JSON response into an ExtractionResult."""
        # Strip markdown fences if present
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```\w*\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)
            cleaned = cleaned.strip()

        data = json.loads(cleaned)
        product_name = data.get("product_name", "Unknown Product")
        raw_fields = data.get("fields", [])

        fields = []
        for rf in raw_fields:
            name = rf.get("name", "")
            # Skip fields not in the schema
            schema_field = next(
                (f for f in schema.fields if f.name == name), None
            )
            if not schema_field:
                continue

            value = rf.get("value")
            confidence = min(100, max(0, int(rf.get("confidence", 0))))
            excerpt = rf.get("excerpt", "")
            reasoning = rf.get("reasoning", "")

            field = ProductField(
                id=uuid4(),
                name=name,
                display_name=schema_field.display_name,
                value=value,
                unit=schema_field.unit,
                confidence=confidence,
                source_excerpt=SourceExcerpt(
                    source_id=source_id,
                    text=excerpt,
                ),
                reasoning=reasoning,
                status=FieldStatus.NEEDS_REVIEW,  # Validation agent sets final status
            )
            fields.append(field)

        return ExtractionResult(
            product_name=product_name,
            category=schema.category_key,
            fields=fields,
            source_id=source_id,
        )

    def _extract_demo_mode(
        self,
        raw_text: str,
        schema: CategorySchema,
        source_id: UUID,
    ) -> ExtractionResult:
        """Produce reasonable demo data when no LLM is available.

        Scans the raw text for field-relevant keywords and produces
        plausible values with varied confidence scores for a realistic
        demo experience.
        """
        logger.info("Running in demo extraction mode (no LLM API key)")

        # Try to find a product name in the first few lines
        lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
        product_name = lines[0][:80] if lines else "Demo Product"

        fields = []
        text_lower = raw_text.lower()

        for field_def in schema.fields:
            value, confidence, excerpt = self._demo_extract_field(
                field_def, raw_text, text_lower
            )
            if value is not None or field_def.required:
                field = ProductField(
                    id=uuid4(),
                    name=field_def.name,
                    display_name=field_def.display_name,
                    value=value,
                    unit=field_def.unit,
                    confidence=confidence,
                    source_excerpt=SourceExcerpt(
                        source_id=source_id,
                        text=excerpt or "(demo mode — no LLM available)",
                    ),
                    reasoning=(
                        f"Demo mode: {'found keyword match' if value else 'no match found in source text'}"
                    ),
                    status=FieldStatus.NEEDS_REVIEW,
                )
                fields.append(field)

        return ExtractionResult(
            product_name=product_name,
            category=schema.category_key,
            fields=fields,
            source_id=source_id,
        )

    def _demo_extract_field(
        self,
        field_def: CategoryFieldDef,
        raw_text: str,
        text_lower: str,
    ) -> tuple[Any, int, str]:
        """Simple keyword-based extraction for demo mode."""
        # Search for the field name or display name in the text
        keywords = [
            field_def.name.replace("_", " "),
            field_def.display_name.lower(),
        ]

        for keyword in keywords:
            idx = text_lower.find(keyword)
            if idx != -1:
                # Found a match — extract surrounding context
                start = max(0, idx - 20)
                end = min(len(raw_text), idx + len(keyword) + 60)
                excerpt = raw_text[start:end].strip()

                # Try to extract a value after the keyword
                after = raw_text[idx + len(keyword) : idx + len(keyword) + 50]
                # Look for numbers
                num_match = re.search(r"[\d,.]+", after)
                if (
                    num_match
                    and field_def.field_type == FieldType.NUMBER
                ):
                    try:
                        value = float(
                            num_match.group().replace(",", "")
                        )
                        return value, 65, excerpt
                    except ValueError:
                        pass

                # Return the text after colon/equals if present
                val_match = re.search(r"[:\s=]+(.+?)(?:\n|$)", after)
                if val_match:
                    value = val_match.group(1).strip()[:100]
                    return value, 55, excerpt

                return field_def.examples[0] if field_def.examples else None, 30, excerpt

        # Field not found in text
        if field_def.required:
            return None, 0, "(not found in source text)"
        return None, 0, ""
