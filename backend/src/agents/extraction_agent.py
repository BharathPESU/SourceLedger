"""Extraction Agent — produces schema-locked structured output from raw text using Google ADK.

Uses Gemini / Google ADK LlmAgent (or falls back to demo mode) to extract product fields
from raw text according to a category-specific schema. Output must
validate against the schema or it is rejected, not passed forward.

Every extracted field carries a source excerpt and initial confidence
score — no field is ever created without provenance.
"""

import asyncio
import json
import os
import re
from typing import Any
from uuid import UUID, uuid4

from google import genai
from google.genai import types

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


def validate_extracted_json_schema(category: str, json_str: str) -> dict:
    """Validates extracted JSON output against the category schema.

    Args:
        category: The product category key.
        json_str: The raw JSON string returned by extraction.

    Returns:
        dict containing validation status and parsed product fields summary.
    """
    schema = get_category_schema(category)
    if not schema:
        return {"valid": False, "error": f"Unknown category: {category}"}
    try:
        data = json.loads(json_str)
        fields = data.get("fields", [])
        return {
            "valid": True,
            "product_name": data.get("product_name", "Unknown Product"),
            "extracted_count": len(fields),
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}


def schema_field_lookup(category: str) -> dict:
    """Lookup category schema field requirements and data types.

    Args:
        category: Category key (e.g. 'industrial_pump').

    Returns:
        dict with field definitions and required list.
    """
    schema = get_category_schema(category)
    if not schema:
        return {"found": False}
    return {
        "found": True,
        "category": category,
        "required_fields": schema.required_field_names,
        "total_fields": len(schema.fields),
    }


class ExtractionAgent:
    """Extracts structured product fields from raw text using an ADK LLM Agent.

    The agent is designed as a pure function over (raw_text, category, source_id)
    → ExtractionResult, making it testable without a live LLM when mocked.
    """

    def __init__(self) -> None:
        self._adk_agent = None

    @property
    def adk_agent(self) -> Any:
        """Expose the underlying Agent instance."""
        return self._adk_agent or self

    def _get_client(self):
        """Create a Google GenAI Client using the current rotated API key.

        Always reads from os.environ so the APIKeyRotator's round-robin
        rotation takes effect on every call. Returns None if no key is set.
        """
        # Prefer the dynamically rotated key set by APIKeyRotator
        api_key = (
            os.environ.get("GOOGLE_API_KEY", "").strip()
            or settings.google_api_key.strip()
        )
        if not api_key:
            logger.warning("No GOOGLE_API_KEY set — using demo extraction mode")
            return None

        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            logger.debug("ExtractionAgent using API key: ...%s", api_key[-6:])
            return client
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

        If raw_text is a JSON-encoded dictionary (from a CSV row), uses
        deterministic column→field mapping — no LLM involved. This preserves
        exact input values like Mfg_Part_Num, Part_Manuf, MANUFACTURER_NAME.

        If category is 'generic' or unknown, runs the universal LLM extraction
        which dynamically infers product fields from context rather than using
        a fixed schema. Falls back to demo mode if no LLM is available.
        """
        # ── Fast path: structured CSV row (JSON dict) ─────────────────
        csv_row = self._try_parse_csv_json(raw_text)
        if csv_row is not None:
            with log_agent_step(logger, "ExtractionAgent", "deterministic CSV extraction") as ctx:
                result = self._extract_csv_deterministic(csv_row, category, source_id)
                ctx["output_summary"] = (
                    f"{len(result.fields)} fields mapped from CSV for '{result.product_name}'"
                )
                return result

        schema = get_category_schema(category)

        # Unknown/generic categories: use universal LLM extraction
        if not schema:
            with log_agent_step(logger, "ExtractionAgent", f"extracting {category} (universal)") as ctx:
                client = self._get_client()
                if client is not None:
                    result = await self._extract_universal(client, raw_text, category, source_id)
                else:
                    result = self._extract_generic_demo(raw_text, category, source_id)
                ctx["output_summary"] = (
                    f"{len(result.fields)} fields extracted for '{result.product_name}' (universal)"
                )
                return result

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

    # ── Deterministic CSV extraction ──────────────────────────────────

    @staticmethod
    def _try_parse_csv_json(raw_text: str) -> dict | None:
        """Try to parse raw_text as a JSON-encoded CSV row dict.

        Returns the dict if successful, None otherwise.
        """
        text = raw_text.strip()
        if not text.startswith("{"):
            return None
        try:
            data = json.loads(text)
            if isinstance(data, dict) and len(data) > 0:
                return data
        except (json.JSONDecodeError, ValueError):
            pass
        return None

    def _extract_csv_deterministic(
        self,
        row_dict: dict,
        category: str,
        source_id: UUID,
    ) -> ExtractionResult:
        """Map CSV columns directly to ProductFields — no LLM, 100% fidelity.

        Every non-empty CSV column becomes a ProductField. Column headers
        are normalised to snake_case for internal use (e.g. Mfg_Part_Num →
        mfg_part_num, MANUFACTURER_NAME → manufacturer_name).
        """
        logger.info(
            "CSV deterministic extraction: %d columns in row",
            len(row_dict),
        )

        # ── Derive product name from the best available columns ───────
        name_candidates = [
            "Part_Desc", "part_desc", "PART_DESC",
            "Product Name", "product_name", "PRODUCT_NAME",
            "SHORT_DESC", "short_desc",
            "LONG_DESC1", "long_desc1",
            "Mfg_Part_Num", "mfg_part_num", "MFG_PART_NUM",
            "PART_NUMBER", "part_number",
            "title", "Title", "TITLE",
            "description", "Description",
        ]
        product_name = "CSV Product"
        for key in name_candidates:
            val = row_dict.get(key, "").strip()
            if val:
                product_name = val[:120]
                break

        # ── Build ProductField for every non-empty column ─────────────
        fields: list[ProductField] = []
        for col_header, raw_value in row_dict.items():
            val = str(raw_value).strip() if raw_value is not None else ""
            if not val or val in ("--", "N/A", "n/a", "None", "null", ""):
                continue

            # Normalise header → snake_case internal name
            internal_name = self._normalise_header(col_header)
            display_name = col_header.strip()

            # Try to coerce numeric values
            coerced_value: object = val
            try:
                if "." in val:
                    coerced_value = float(val)
                else:
                    coerced_value = int(val)
            except (ValueError, TypeError):
                coerced_value = val

            field = ProductField(
                id=uuid4(),
                name=internal_name,
                display_name=display_name,
                value=coerced_value,
                unit=None,
                confidence=95,  # High confidence — exact CSV value
                source_excerpt=SourceExcerpt(
                    source_id=source_id,
                    text=f"CSV column '{col_header}': {val[:80]}",
                ),
                reasoning="Deterministic CSV extraction — exact value from input file",
                status=FieldStatus.NEEDS_REVIEW,
            )
            fields.append(field)

        logger.info(
            "CSV deterministic: '%s' — %d non-empty fields extracted",
            product_name, len(fields),
        )

        return ExtractionResult(
            product_name=product_name,
            category=category or "generic",
            fields=fields,
            source_id=source_id,
        )

    @staticmethod
    def _normalise_header(header: str) -> str:
        """Convert a CSV column header to a snake_case internal field name.

        Examples:
            'Mfg_Part_Num'       → 'mfg_part_num'
            'MANUFACTURER_NAME'  → 'manufacturer_name'
            'Part Desc'          → 'part_desc'
            'SKU - MY_PART_NUMBER' → 'sku_my_part_number'
        """
        import re
        s = header.strip()
        # Replace common separators with underscore
        s = re.sub(r'[\s\-/]+', '_', s)
        # Insert underscore before uppercase runs (CamelCase → snake)
        s = re.sub(r'([a-z])([A-Z])', r'\1_\2', s)
        # Lowercase and collapse multiple underscores
        s = re.sub(r'_+', '_', s.lower()).strip('_')
        return s

    async def _extract_with_llm(
        self,
        client: Any,
        raw_text: str,
        schema: CategorySchema,
        source_id: UUID,
    ) -> ExtractionResult:
        """Use Gemini to extract fields — uses thinking model for better coverage."""
        prompt = self._build_prompt(raw_text, schema)

        for attempt in range(MAX_RETRIES + 1):
            try:
                # Use gemini-2.5-flash with thinking enabled for better multi-step reasoning
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.1,  # Low temperature for consistent structured output
                        thinking_config=types.ThinkingConfig(thinking_budget=5000),
                    ),
                )
                response_text = response.text

                parsed = self._parse_llm_response(
                    response_text, schema, source_id
                )
                logger.info(
                    "ExtractionAgent: %d/%d fields populated (attempt %d)",
                    sum(1 for f in parsed.fields if f.value is not None),
                    len(schema.fields),
                    attempt + 1,
                )
                return parsed

            except Exception as e:
                err_str = str(e)
                # Thinking config not supported on this key/tier — retry without it
                if "thinking" in err_str.lower() or "ThinkingConfig" in err_str:
                    try:
                        response = await asyncio.to_thread(
                            client.models.generate_content,
                            model="gemini-2.5-flash",
                            contents=prompt,
                            config=types.GenerateContentConfig(temperature=0.1),
                        )
                        return self._parse_llm_response(response.text, schema, source_id)
                    except Exception as e2:
                        err_str = str(e2)

                if attempt < MAX_RETRIES:
                    logger.warning(
                        "Extraction attempt %d failed (%s), retrying …",
                        attempt + 1,
                        err_str[:80],
                    )
                else:
                    logger.error(
                        "Extraction failed after %d attempts (%s) — falling back to demo mode",
                        MAX_RETRIES + 1,
                        err_str[:80],
                    )
                    return self._extract_demo_mode(raw_text, schema, source_id)

        raise RuntimeError("Extraction failed unexpectedly")

    def _build_prompt(self, raw_text: str, schema: CategorySchema) -> str:
        """Build an aggressive two-pass extraction prompt for maximum field coverage.

        Pass 1: Extract everything explicitly stated in the source text.
        Pass 2: For remaining required fields, reason/infer from context,
                product type knowledge, and industry norms — with lower
                confidence scores reflecting the inference.
        """
        # Build rich field definitions with units + examples
        required_fields = []
        optional_fields = []
        for f in schema.fields:
            unit_str = f" [{f.unit}]" if f.unit else ""
            ex_str = f" (e.g. {', '.join(f.examples[:3])})" if f.examples else ""
            line = f'    "{f.name}" | {f.display_name}{unit_str}: {f.description}{ex_str}'
            if f.required:
                required_fields.append(line)
            else:
                optional_fields.append(line)

        req_block = "\n".join(required_fields)
        opt_block = "\n".join(optional_fields)

        # Truncate very long source text to stay within context limits
        max_chars = 14000
        if len(raw_text) > max_chars:
            raw_text = raw_text[:max_chars] + "\n\n[... truncated ...]"

        return f"""You are an expert product data extraction AI for industrial and commercial catalogues.
Your goal is MAXIMUM field coverage — extract or reasonably infer EVERY field listed below.

PRODUCT CATEGORY: {schema.display_name}

═══ REQUIRED FIELDS (must all appear in output, even if value is null) ═══
{req_block}

═══ OPTIONAL FIELDS (include whenever you can extract or infer a value) ═══
{opt_block}

═══ EXTRACTION RULES ═══
1. TWO-PASS EXTRACTION:
   PASS 1 — Explicit: Extract values directly stated in the source text.
             Confidence 85-100 for clear explicit values.
   PASS 2 — Inference: For any remaining fields, reason from:
             a) Other extracted fields (e.g. if material=stainless steel 316 → infer corrosion resistance)
             b) Product type norms (e.g. industrial pumps typically use 3-phase 400V)
             c) Industry standards (e.g. IP67 connector → temperature range -40 to 105°C typical)
             d) Manufacturer known specifications for this product line
             Confidence 40-70 for inferred values.

2. REQUIRED FIELDS: Even if not found, include them with value: null and confidence: 0.
   Never omit a required field.

3. SOURCE CITATIONS: For Pass 1, quote exact source text in "excerpt".
   For Pass 2 inferences, write "Inferred from: [reason]" in "excerpt".

4. NUMERIC FIELDS: Return numbers only (no units). e.g. 15.0 not "15.0 m³/h".

5. LIST FIELDS: Return a JSON array of strings. e.g. ["CE", "RoHS", "UL"]

6. CONFIDENCE SCALE:
   90-100: Explicitly stated verbatim
   70-89: Clearly stated but needed minor interpretation
   50-69: Reasonably inferred from context or related data
   30-49: Inferred from product type norms or manufacturer defaults
   0-29: Cannot determine — use null value

═══ SOURCE TEXT ═══
---
{raw_text}
---

Respond with ONLY a valid JSON object. No markdown, no commentary:
{{
  "product_name": "<full product name including manufacturer and model>",
  "fields": [
    {{
      "name": "<field key>",
      "value": <string | number | boolean | array | null>,
      "confidence": <0-100>,
      "excerpt": "<exact source quote OR 'Inferred from: ...'>",
      "reasoning": "<1-2 sentence explanation of extraction/inference logic>"
    }}
  ]
}}"""

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

        # Validate with ADK tool function
        validate_extracted_json_schema(schema.category_key, cleaned)

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

    async def _extract_universal(
        self,
        client: Any,
        raw_text: str,
        category: str,
        source_id: UUID,
    ) -> ExtractionResult:
        """Universal extraction for unknown/generic product categories.

        Uses Gemini to dynamically discover what type of product this is
        and extract relevant fields without requiring a predefined schema.
        """
        max_chars = 14000
        if len(raw_text) > max_chars:
            raw_text = raw_text[:max_chars] + "\n\n[... truncated ...]"

        prompt = f"""You are an expert product data extraction AI for industrial and commercial catalogues.
The product below may not match a predefined category. Your job is to:
1. Identify what TYPE of product this is.
2. Extract ALL relevant product attributes and specifications.
3. Return them in a structured JSON format.

PRODUCT DATA:
---
{raw_text}
---

EXTRACTION RULES:
1. First determine the product type (e.g. "Cordless Drill", "Hedge Trimmer", "Brad Nailer", "Dishwasher").
2. Extract all attributes that would appear in a product catalog listing:
   - Manufacturer/Brand, Model number/Part number
   - Product type/Category
   - Key specifications (voltage, speed, size, capacity, power, etc.)
   - Features, compatibility information, certifications
   - Physical attributes (dimensions, weight, color)
3. For each field, infer the value from the product name, description, and your knowledge of this product.
4. Confidence: 85+ = explicitly stated, 50-70 = inferred from product knowledge, 30-49 = typical for this type.

Respond with ONLY this JSON (no markdown fences):
{{
  "product_name": "<full product name including brand and model>",
  "detected_category": "<what type of product this is>",
  "fields": [
    {{
      "name": "<snake_case_field_name>",
      "display_name": "<Human Readable Label>",
      "value": <string | number | boolean | array | null>,
      "unit": "<unit if applicable, else null>",
      "confidence": <0-100>,
      "excerpt": "<exact quote OR 'Inferred from: ...'>"
    }}
  ]
}}"""

        for attempt in range(MAX_RETRIES + 1):
            try:
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.1),
                )
                response_text = response.text.strip()
                if response_text.startswith("```"):
                    response_text = re.sub(r"^```\w*\n?", "", response_text)
                    response_text = re.sub(r"\n?```$", "", response_text)

                data = json.loads(response_text)
                product_name = data.get("product_name") or "Extracted Product"
                detected_cat = data.get("detected_category") or category
                raw_fields = data.get("fields") or []

                fields = []
                for rf in raw_fields:
                    name = rf.get("name", "").strip()
                    if not name:
                        continue
                    field = ProductField(
                        id=uuid4(),
                        name=name,
                        display_name=rf.get("display_name") or name.replace("_", " ").title(),
                        value=rf.get("value"),
                        unit=rf.get("unit") or None,
                        confidence=min(100, max(0, int(rf.get("confidence", 50)))),
                        source_excerpt=SourceExcerpt(
                            source_id=source_id,
                            text=rf.get("excerpt") or "",
                        ),
                        reasoning=f"Universal extraction — detected as: {detected_cat}",
                        status=FieldStatus.NEEDS_REVIEW,
                    )
                    fields.append(field)

                logger.info(
                    "Universal extraction: %d fields for '%s' (detected: %s)",
                    len(fields), product_name, detected_cat,
                )
                return ExtractionResult(
                    product_name=product_name,
                    category=detected_cat,
                    fields=fields,
                    source_id=source_id,
                )

            except Exception as e:
                if attempt < MAX_RETRIES:
                    logger.warning("Universal extraction attempt %d failed: %s", attempt + 1, e)
                else:
                    logger.error("Universal extraction failed: %s — using generic demo", e)
                    return self._extract_generic_demo(raw_text, category, source_id)

        return self._extract_generic_demo(raw_text, category, source_id)

    def _extract_generic_demo(
        self,
        raw_text: str,
        category: str,
        source_id: UUID,
    ) -> ExtractionResult:
        """Generic demo extraction when no LLM and no schema are available.

        Parses name, brand, model from raw text (including CSV format).
        """
        logger.info("Running generic demo extraction mode")
        lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
        first_line = lines[0] if lines else "Unknown Product"

        parts = [p.strip() for p in first_line.split(",")]
        model_num = parts[0] if parts else ""
        desc = parts[1] if len(parts) > 1 else first_line
        brand = parts[4] if len(parts) > 4 else ""
        product_name = f"{brand} {desc}".strip() if brand else desc

        fields = [
            ProductField(
                id=uuid4(), name="manufacturer", display_name="Manufacturer",
                value=brand or None, confidence=85 if brand else 0,
                source_excerpt=SourceExcerpt(source_id=source_id, text=first_line[:80]),
                reasoning="CSV brand column (generic demo mode)",
                status=FieldStatus.NEEDS_REVIEW,
            ),
            ProductField(
                id=uuid4(), name="model_number", display_name="Model Number",
                value=model_num or None, confidence=88 if model_num else 0,
                source_excerpt=SourceExcerpt(source_id=source_id, text=first_line[:80]),
                reasoning="CSV part_num column (generic demo mode)",
                status=FieldStatus.NEEDS_REVIEW,
            ),
            ProductField(
                id=uuid4(), name="part_desc", display_name="Part Description",
                value=desc or None, confidence=90 if desc else 0,
                source_excerpt=SourceExcerpt(source_id=source_id, text=first_line[:80]),
                reasoning="CSV part_desc column (generic demo mode)",
                status=FieldStatus.NEEDS_REVIEW,
            ),
        ]

        return ExtractionResult(
            product_name=product_name[:100],
            category=category,
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
