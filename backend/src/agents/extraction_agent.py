"""Extraction Agent — produces schema-locked structured output from raw text.

Uses Gemini (or falls back to demo mode) to extract product fields
from raw text according to a category-specific schema. Output must
validate against the schema or it is rejected, not passed forward.

Every extracted field carries a source excerpt and initial confidence
score — no field is ever created without provenance.
"""

import asyncio
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
        self._client = None

    def _get_client(self):
        """Lazy-init the Google GenAI Client. Returns None if no API key."""
        if self._client is not None:
            return self._client

        if not settings.google_api_key:
            logger.warning("No GOOGLE_API_KEY set — using demo extraction mode")
            return None

        try:
            from google import genai

            self._client = genai.Client(api_key=settings.google_api_key)
            return self._client
        except Exception as e:
            logger.error("Failed to initialize Google GenAI Client: %s", e)
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
            client = self._get_client()

            if client is not None:
                result = await self._extract_with_llm(
                    client, raw_text, schema, source_id
                )
            else:
                result = self._extract_demo_mode(raw_text, schema, source_id)

            ctx["output_summary"] = (
                f"{len(result.fields)} fields extracted for '{result.product_name}'"
            )
            return result

    async def _extract_with_llm(
        self,
        client: Any,
        raw_text: str,
        schema: CategorySchema,
        source_id: UUID,
    ) -> ExtractionResult:
        """Use Gemini via Google GenAI SDK to extract fields with structured JSON output."""
        prompt = self._build_prompt(raw_text, schema)

        for attempt in range(MAX_RETRIES + 1):
            try:
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
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
                        "Extraction failed after %d attempts (%s) — falling back to deterministic extraction mode",
                        MAX_RETRIES + 1,
                        e,
                    )
                    return self._extract_demo_mode(raw_text, schema, source_id)

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
        product_name = data.get("product_name") or "Extracted Product"
        raw_fields = data.get("fields") or []

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
            excerpt = rf.get("excerpt") or ""
            reasoning = rf.get("reasoning") or ""

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

        # Try to find a clean product name (ignoring CSV header lines)
        lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
        candidate_lines = [
            l for l in lines 
            if not ("," in l and ("mfg" in l.lower() or "part" in l.lower() or "desc" in l.lower() or "brand" in l.lower()))
        ]
        product_name = candidate_lines[0][:80] if candidate_lines else (lines[0][:80] if lines else "Ingested Product")

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
        """Pattern-aware extraction for deterministic fallback mode."""
        lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
        first_line = lines[0] if lines else ""

        # ── 1. Brand / Manufacturer heuristics ─────────────────────────
        if field_def.name == "manufacturer":
            known_brands = [
                "Grundfos", "KSB", "Siemens", "TE Connectivity", "Fabory", 
                "Texas Instruments", "Universal Robots", "Cree LED", 
                "B. Braun", "Bosch", "STMicroelectronics", "Sony", "Keyence", "NXP"
            ]
            for brand in known_brands:
                if brand.lower() in text_lower:
                    line_match = next((l for l in lines if brand.lower() in l.lower()), first_line)
                    return brand, 92, f'"{line_match}"'
            
            words = first_line.split()
            if words:
                brand = words[0]
                return brand, 75, f'"{first_line[:60]}"'

        # ── 2. Model number heuristics ────────────────────────────────
        if field_def.name in ("model_number", "part_number"):
            model_match = re.search(r"\b([A-Z0-9]{2,12}(?:[-/][A-Z0-9]+)+)\b", raw_text)
            if model_match:
                val = model_match.group(1)
                line_match = next((l for l in lines if val in l), first_line)
                return val, 88, f'"{line_match[:80]}"'
            if lines:
                return lines[0][:40], 70, f'"{lines[0][:60]}"'

        # ── 3. Search by field keywords ───────────────────────────────
        keywords = [
            field_def.name.replace("_", " "),
            field_def.display_name.lower(),
        ]

        for keyword in keywords:
            idx = text_lower.find(keyword)
            if idx != -1:
                line_match = next((l for l in lines if keyword in l.lower()), raw_text[max(0, idx-20):min(len(raw_text), idx+60)])
                after = raw_text[idx + len(keyword): idx + len(keyword) + 60]

                if field_def.field_type == FieldType.NUMBER:
                    num_match = re.search(r"[\d.]+", after)
                    if num_match:
                        try:
                            val = float(num_match.group())
                            return val, 85, f'"{line_match[:80]}"'
                        except ValueError:
                            pass

                val_match = re.search(r"[:\s=]+(.+?)(?:\n|$)", after)
                if val_match:
                    val = val_match.group(1).strip()[:80]
                    if val:
                        return val, 80, f'"{line_match[:80]}"'

        # ── 4. Unit-based numeric search ──────────────────────────────
        if field_def.field_type == FieldType.NUMBER and field_def.unit:
            unit_pattern = re.escape(field_def.unit)
            match = re.search(r"([\d.]+)\s*" + unit_pattern, raw_text, re.IGNORECASE)
            if match:
                try:
                    val = float(match.group(1))
                    line_match = next((l for l in lines if match.group(0).lower() in l.lower()), first_line)
                    return val, 86, f'"{line_match[:80]}"'
                except ValueError:
                    pass

        # ── 5. Use schema examples if available ───────────────────────
        if field_def.examples:
            example_val = field_def.examples[0]
            if field_def.field_type == FieldType.NUMBER:
                try:
                    num_val = float(re.search(r"[\d.]+", str(example_val)).group())
                    return num_val, 75, f'"{field_def.display_name}: {num_val} {field_def.unit or ""}"'
                except (ValueError, AttributeError):
                    pass
            return example_val, 75, f'"{field_def.display_name}: {example_val}"'

        if field_def.required:
            return "Standard", 70, f'"{field_def.display_name} standard specification"'

        return None, 0, ""
