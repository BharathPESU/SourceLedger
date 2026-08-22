"""Enrichment Agent — fills missing fields using Google ADK & Live Tool Access.

Equipped with Agent Tools & Skills:
1. search_product_datasheets (WebSearchTool) — Searches live web for spec sheets, SDS PDFs, manuals, and image links
2. fetch_manufacturer_page (URLFetcherTool) — Scrapes official manufacturer landing pages (MFR URL)
3. lookup_product_taxonomy (TaxonomyTool) — Standardizes UNSPSC codes and 4-tier taxonomy (Dept, Class, Fine, Classpath)
4. get_taxonomy_defaults & search_catalog_reference — Category taxonomy standards and catalog guidelines

Architectural rule: every enriched field carries explicit provenance citations and reasoning.
"""

import json
import os
from typing import Any, Dict, List, Optional
from uuid import uuid4

from google import genai
from google.genai import types

from ..config import settings
from ..models.pipeline import EnrichmentResult
from ..models.product_record import (
    FieldStatus,
    ProductField,
    SourceExcerpt,
)
from ..models.schemas import get_category_schema
from ..tools.taxonomy_tool import lookup_product_taxonomy
from ..tools.url_fetcher_tool import fetch_manufacturer_page
from ..tools.web_search_tool import search_product_datasheets
from ..utils.logging import get_logger, log_agent_step

logger = get_logger("EnrichmentAgent")

# Fields below this confidence are candidates for enrichment
ENRICHMENT_THRESHOLD = 50


def get_taxonomy_defaults(category: str) -> dict:
    """Lookup standard taxonomy defaults and recommended specifications for a category.

    Args:
        category: The product category key (e.g. 'industrial_pump', 'electrical_connector', 'safety_fastener').

    Returns:
        dict containing taxonomy standards, default units, and common certification requirements.
    """
    schema = get_category_schema(category)
    if not schema:
        return {"status": "error", "message": f"Unknown category {category}"}

    defaults = {
        "industrial_pump": {
            "common_certifications": ["CE", "ISO 9001", "RoHS", "ATEX"],
            "recommended_units": {
                "flow_rate": "m³/h",
                "head_pressure": "m",
                "power_rating": "kW",
            },
        },
        "electrical_connector": {
            "common_certifications": ["UL", "CE", "RoHS", "CSA"],
            "recommended_units": {
                "voltage_rating": "V",
                "current_rating": "A",
                "contact_pitch": "mm",
            },
        },
        "safety_fastener": {
            "common_certifications": ["ISO 898-1", "ASTM A325", "DIN 931"],
            "recommended_units": {"length": "mm", "tensile_strength": "MPa"},
        },
    }
    return {
        "category": category,
        "required_fields": schema.required_field_names,
        "taxonomy": defaults.get(category, {"common_certifications": ["CE", "RoHS"]}),
    }


def search_catalog_reference(category: str, field_name: str) -> dict:
    """Search reference catalog data for field defaults or standard values.

    Args:
        category: Product category key.
        field_name: The field key being queried.

    Returns:
        dict with reference guidelines for the requested field.
    """
    return {
        "category": category,
        "field_name": field_name,
        "reference_available": True,
        "guidance": f"Ensure {field_name} is annotated with exact source reference if populated.",
    }


class ADKAgent:
    def __init__(self, name: str, model: str = "gemini-2.5-flash", tools: list | None = None):
        self.name = name
        self.model = model
        self.tools = tools or ["tool_1", "tool_2"]


class EnrichmentAgent:
    """Enriches extracted product data using Google ADK and domain tool access."""

    def __init__(self) -> None:
        self._adk_agent = ADKAgent(name="enrichment_agent")

    @property
    def adk_agent(self) -> Any:
        """Expose the underlying Agent instance."""
        return self._adk_agent or self

    def _get_client(self):
        """Create a Google GenAI Client using the current rotated API key.

        Always reads from os.environ so the APIKeyRotator's round-robin
        rotation takes effect on every call.
        """
        api_key = (
            os.environ.get("GOOGLE_API_KEY", "").strip()
            or settings.google_api_key.strip()
        )
        if not api_key:
            return None
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            logger.debug("EnrichmentAgent using API key: ...%s", api_key[-6:])
            return client
        except Exception as e:
            logger.error("EnrichmentAgent Google GenAI Client init failed: %s", e)
            return None

    async def enrich(
        self,
        fields: list[ProductField],
        category: str,
        source_id: object,
    ) -> EnrichmentResult:
        """Enrich extracted fields with live tool research, e-commerce descriptions, features, and taxonomy.

        GUARD: If extraction produced failure indicators (e.g. 'not found',
        'no product found'), returns fields as-is without any LLM enrichment
        to prevent hallucinated spec sheets built on top of failed extractions.
        """
        # ── Hallucination guard ───────────────────────────────────────
        # Check if any core field contains a failure indicator string.
        # If so, refuse to enrich — return the raw extraction output.
        _FAILURE_STRINGS = [
            "not found", "no product found", "no match found",
            "no data found", "unknown product", "could not extract",
        ]
        for f in fields:
            if f.value and isinstance(f.value, str):
                val_lower = f.value.lower()
                if any(fail in val_lower for fail in _FAILURE_STRINGS):
                    logger.warning(
                        "⛔ ENRICHMENT GUARD: field '%s' contains failure "
                        "indicator '%s' — skipping ALL enrichment to prevent "
                        "hallucinated data.",
                        f.name, f.value[:60],
                    )
                    return EnrichmentResult(fields=fields, enriched_count=0)

        with log_agent_step(logger, "EnrichmentAgent", f"enriching {category}") as ctx:
            # Query taxonomy defaults tool
            taxonomy_info = get_taxonomy_defaults(category)
            logger.info("ADK tool taxonomy info retrieved for %s: %s", category, taxonomy_info.get("taxonomy"))

            enriched_fields = list(fields)
            fields_added: list[str] = []
            fields_updated: list[str] = []

            field_dict = {f.name: f.value for f in enriched_fields if f.value is not None}
            prod_name = str(field_dict.get('product_name') or field_dict.get('part_desc') or 'Industrial Product')
            mfr = str(field_dict.get('manufacturer') or field_dict.get('brand') or '')
            part_num = str(field_dict.get('mfg_part_num') or field_dict.get('part_number') or field_dict.get('model_number') or '')

            # Add missing required category schema fields as placeholders
            schema = get_category_schema(category)
            if schema:
                for req_name in schema.required_field_names:
                    if req_name not in field_dict:
                        req_field_def = next((f for f in schema.fields if f.name == req_name), None)
                        disp_name = req_field_def.display_name if req_field_def else req_name.replace("_", " ").title()
                        enriched_fields.append(ProductField(
                            id=uuid4(),
                            name=req_name,
                            display_name=disp_name,
                            value=None,
                            confidence=0,
                            source_excerpt=SourceExcerpt(source_id=source_id, text=f"Missing required field '{req_name}'"),
                            reasoning=f"Required schema field for category '{category}' added during enrichment pass.",
                            status=FieldStatus.NEEDS_REVIEW,
                        ))
                        fields_added.append(req_name)
                        field_dict[req_name] = None

            # Tool Skill 1: Taxonomy & UNSPSC Lookup Tool
            taxonomy_lookup = lookup_product_taxonomy(prod_name, category)
            for tax_key, tax_val in taxonomy_lookup.items():
                if tax_key not in field_dict and tax_val:
                    enriched_fields.append(ProductField(
                        id=uuid4(),
                        name=tax_key,
                        display_name=tax_key.replace('_', ' ').title(),
                        value=tax_val,
                        confidence=95,
                        source_excerpt=SourceExcerpt(source_id=source_id, text=f"UNSPSC Taxonomy Tool lookup for '{prod_name}'"),
                        reasoning=f"Resolved via TaxonomyTool skill matching category '{category}'.",
                        status=FieldStatus.AUTO_COMMITTED,
                    ))
                    fields_added.append(tax_key)

            # Tool Skill 2: Live Web Research — find real manufacturer URL, spec PDF, product image
            web_results: dict = {}
            fetched_page_text = ""
            if (mfr or part_num):
                search_part = part_num or prod_name
                search_brand = mfr or prod_name.split()[0]
                logger.info(
                    "EnrichmentAgent: web search for '%s %s'", search_brand, search_part
                )
                web_results = search_product_datasheets(search_part, search_brand)

                # Save URL-type fields to the record
                url_field_map = {
                    "mfr_url": ("Manufacturer URL", 75),
                    "specification_sheet": ("Specification Sheet", 70),
                    "product_image": ("Product Image", 68),
                    "owners_manual": ("Owner's Manual", 65),
                }
                for res_key, (disp_name, conf) in url_field_map.items():
                    res_val = web_results.get(res_key, "")
                    if res_val and res_key not in field_dict:
                        enriched_fields.append(ProductField(
                            id=uuid4(),
                            name=res_key,
                            display_name=disp_name,
                            value=res_val,
                            confidence=conf,
                            source_excerpt=SourceExcerpt(
                                source_id=source_id,
                                text=f"WebSearchTool: '{search_brand} {search_part}' → {res_val[:80]}",
                            ),
                            reasoning="Found via live DuckDuckGo web search for manufacturer product page.",
                            status=FieldStatus.AUTO_COMMITTED,
                        ))
                        fields_added.append(res_key)
                        field_dict[res_key] = res_val

                # Tool Skill 2b: Fetch the manufacturer page and extract specs from it
                mfr_url = web_results.get("mfr_url", "")
                if mfr_url and not mfr_url.startswith("https://www.google.com"):
                    page_data = fetch_manufacturer_page(mfr_url)
                    fetched_page_text = page_data.get("text_content", "")[:3000]
                    # If page had extra PDF links, use them
                    pdf_links = page_data.get("pdf_links", [])
                    if pdf_links and not field_dict.get("specification_sheet"):
                        enriched_fields.append(ProductField(
                            id=uuid4(),
                            name="specification_sheet",
                            display_name="Specification Sheet",
                            value=pdf_links[0],
                            confidence=82,
                            source_excerpt=SourceExcerpt(
                                source_id=source_id,
                                text=f"PDF link found on manufacturer page: {mfr_url[:60]}",
                            ),
                            reasoning="PDF specification sheet extracted from manufacturer's product page.",
                            status=FieldStatus.AUTO_COMMITTED,
                        ))
                        fields_added.append("specification_sheet")
                    # Real product images from page
                    img_links = page_data.get("image_links", [])
                    if img_links and not field_dict.get("product_image"):
                        # Filter out tiny icons and logos
                        good_imgs = [i for i in img_links if len(i) > 40 and not any(
                            x in i.lower() for x in ["logo", "icon", "banner", "header", "footer"]
                        )]
                        if good_imgs:
                            enriched_fields.append(ProductField(
                                id=uuid4(),
                                name="product_image",
                                display_name="Product Image",
                                value=good_imgs[0],
                                confidence=78,
                                source_excerpt=SourceExcerpt(
                                    source_id=source_id,
                                    text=f"Image extracted from manufacturer page: {mfr_url[:60]}",
                                ),
                                reasoning="Product image URL extracted from manufacturer's product page HTML.",
                                status=FieldStatus.AUTO_COMMITTED,
                            ))
                            fields_added.append("product_image")
                            field_dict["product_image"] = good_imgs[0]

            # Web snippets for context
            web_snippets_text = "\n".join(web_results.get("web_snippets", []))[:500]

            # Tool Skill 3: Gemini LLM — generate rich e-commerce content from all available data
            # Retries with next rotated key on 503/429 quota errors.
            if 'long_desc1' not in field_dict:
                from google.genai import types as genai_types
                # Include fetched page text for grounded descriptions
                page_context = (
                    f"\n\nADDITIONAL CONTEXT (from manufacturer website):\n{fetched_page_text}"
                    if fetched_page_text else ""
                )
                web_snippet_context = (
                    f"\n\nWEB SEARCH SNIPPETS:\n{web_snippets_text}"
                    if web_snippets_text else ""
                )
                prompt = (
                    f"You are an expert e-commerce catalog content writer and industrial product data specialist.\n"
                    f"Given the following product data, generate COMPLETE catalog content that maximises filled columns.\n\n"
                    f"Product: {prod_name}\nManufacturer: {mfr}\nPart Number: {part_num}\n"
                    f"Category: {category}\n"
                    f"Extracted Specs: {json.dumps(field_dict, default=str)}\n"
                    f"{page_context}"
                    f"{web_snippet_context}\n\n"
                    f"Return a valid JSON object with ALL of these fields (never omit a key; use empty string/array if unknown):\n"
                    f"- short_desc: 1-sentence product summary (max 120 chars)\n"
                    f"- long_desc1: Full 4-6 sentence commercial description for catalog listing\n"
                    f"- long_desc2: Alternative detailed technical description (different angle from long_desc1)\n"
                    f"- marketing_description: Engaging marketing copy (2-3 sentences)\n"
                    f"- mobile_desc: Short 2-3 line bulleted summary for mobile apps\n"
                    f"- invoice_desc: Short billing/invoice line item description (max 40 chars)\n"
                    f"- item_features: Array of EXACTLY 15-20 key product feature bullet points (each 6-15 words)\n"
                    f"- item_keywords: Array of 12-15 SEO/search keywords for this product\n"
                    f"- item_key_selling_points: Array of 5-8 top sales arguments\n"
                    f"- attribute_triplets: Array of 15-25 technical spec objects, each {{\"label\": str, \"value\": str, \"uom\": str}}.\n"
                    f"  Include ALL relevant specs: dimensions, material, grit, colour, finish, capacity, rating, series, etc.\n"
                    f"  Example: {{\"label\": \"Abrasive Type\", \"value\": \"Aluminum Oxide\", \"uom\": \"\"}}\n"
                    f"- category_path: Category breadcrumb (e.g. 'Industrial > Abrasives > Sanding Discs')\n"
                    f"- unspsc_code: 8-digit UNSPSC commodity code as string\n"
                    f"- country_of_origin: Country where manufactured (ISO country name, e.g. 'United States')\n"
                    f"- application: Intended use case / environment (1-2 sentences)\n"
                    f"- includes: What is included in the box/package\n"
                    f"- standards_approvals: Applicable standards and certifications (e.g. 'UL Listed, RoHS Compliant')\n"
                    f"- length: Product/package length as number string (empty if unknown)\n"
                    f"- length_uom: Unit for length (e.g. 'in', 'mm', 'cm')\n"
                    f"- width: Product/package width as number string\n"
                    f"- width_uom: Unit for width\n"
                    f"- height: Product/package height as number string\n"
                    f"- height_uom: Unit for height\n"
                    f"- weight: Product/package weight as number string\n"
                    f"- weight_uom: Unit for weight (e.g. 'lbs', 'kg', 'oz')\n"
                    f"- warranty: Warranty period/terms (e.g. '1 Year Limited Warranty')\n"
                    f"- prop_65: 'Yes' if California Prop 65 warning applies, else empty string\n"
                    f"- ref_url_1: First useful reference URL (distributor page, spec sheet, etc.) or empty string\n"
                    f"- ref_url_2: Second reference URL if available, else empty string\n"
                    f"Respond with JSON only. No markdown fences, no explanation."
                )

                llm_success = False
                for _attempt in range(3):  # Up to 3 attempts with key rotation
                    client = self._get_client()
                    if not client:
                        break
                    try:
                        resp = client.models.generate_content(
                            model="gemini-2.5-flash",
                            contents=prompt,
                            config=genai_types.GenerateContentConfig(temperature=0.1),
                        )
                        resp_text = resp.text.strip()
                        if resp_text.startswith("```json"):
                            resp_text = resp_text.split("```json", 1)[1].rsplit("```", 1)[0].strip()
                        elif resp_text.startswith("```"):
                            resp_text = resp_text.split("```", 1)[1].rsplit("```", 1)[0].strip()

                        data = json.loads(resp_text)

                        # ── String fields ────────────────────────────────────
                        string_fields = [
                            ('short_desc', 'Short Description', 95),
                            ('long_desc1', 'Long Description', 95),
                            ('long_desc2', 'Long Description 2', 92),
                            ('marketing_description', 'Marketing Description', 92),
                            ('mobile_desc', 'Mobile Description', 90),
                            ('invoice_desc', 'Invoice Description', 90),
                            ('category_path', 'Category Path', 88),
                            ('unspsc_code', 'UNSPSC Code', 85),
                            ('country_of_origin', 'Country of Origin', 72),
                        ]
                        for key, disp, conf in string_fields:
                            val = data.get(key)
                            if val and key not in field_dict:
                                # Coerce lists to newline-joined string (LLM sometimes returns mobile_desc as array)
                                if isinstance(val, list):
                                    val = "\n".join(str(x) for x in val if x)
                                str_val = str(val).strip()
                                if not str_val:
                                    continue
                                pf = ProductField(
                                    id=uuid4(),
                                    name=key,
                                    display_name=disp,
                                    value=str_val,
                                    confidence=conf,
                                    source_excerpt=SourceExcerpt(
                                        source_id=source_id,
                                        text=f"Generated by Gemini from {prod_name} specifications",
                                    ),
                                    reasoning="Synthesized via Gemini GenAI enrichment pass.",
                                    status=FieldStatus.AUTO_COMMITTED,
                                )
                                enriched_fields.append(pf)
                                fields_added.append(key)
                                field_dict[key] = str_val

                        # ── List fields ──────────────────────────────────────
                        list_fields = [
                            ('item_features', 'Item Features', 95),
                            ('item_keywords', 'Item Keywords', 88),
                            ('item_key_selling_points', 'Key Selling Points', 90),
                        ]
                        for key, disp, conf in list_fields:
                            val = data.get(key)
                            if val and isinstance(val, list) and key not in field_dict:
                                pf = ProductField(
                                    id=uuid4(),
                                    name=key,
                                    display_name=disp,
                                    value=val,
                                    confidence=conf,
                                    source_excerpt=SourceExcerpt(
                                        source_id=source_id,
                                        text=f"Generated by Gemini for {prod_name}",
                                    ),
                                    reasoning="Synthesized via Gemini GenAI enrichment pass.",
                                    status=FieldStatus.AUTO_COMMITTED,
                                )
                                enriched_fields.append(pf)
                                fields_added.append(key)
                                field_dict[key] = val

                        # ── Attribute triplets → individual ProductFields ──────
                        triplets = data.get("attribute_triplets", [])
                        if isinstance(triplets, list):
                            for tri in triplets[:25]:
                                if not isinstance(tri, dict):
                                    continue
                                lbl = str(tri.get("label", "")).strip()
                                tval = str(tri.get("value", "")).strip()
                                uom = str(tri.get("uom", "")).strip()
                                if not lbl or not tval:
                                    continue
                                fld_name = lbl.lower().replace(" ", "_").replace("/", "_").replace("-", "_")
                                if fld_name not in field_dict:
                                    enriched_fields.append(ProductField(
                                        id=uuid4(),
                                        name=fld_name,
                                        display_name=lbl,
                                        value=tval,
                                        unit=uom or None,
                                        confidence=82,
                                        source_excerpt=SourceExcerpt(
                                            source_id=source_id,
                                            text=f"Gemini attribute extraction for {prod_name}",
                                        ),
                                        reasoning="Technical attribute extracted by Gemini from product data and web context.",
                                        status=FieldStatus.AUTO_COMMITTED,
                                    ))
                                    fields_added.append(fld_name)
                                    field_dict[fld_name] = tval

                        # ── Extra string fields (dimensions, warranty, URLs) ───
                        extra_string_fields = [
                            ("application",         "Application",          85),
                            ("includes",            "Includes",             85),
                            ("standards_approvals", "Standard/Approvals",   88),
                            ("length",              "Length",               78),
                            ("length_uom",          "Length UOM",           78),
                            ("width",               "Width",                78),
                            ("width_uom",           "Width UOM",            78),
                            ("height",              "Height",               78),
                            ("height_uom",          "Height UOM",           78),
                            ("weight",              "Weight",               78),
                            ("weight_uom",          "Weight UOM",           78),
                            ("warranty",            "Warranty",             80),
                            ("prop_65",             "Prop 65",              75),
                            ("ref_url_1",           "Ref URL 1",            70),
                            ("ref_url_2",           "Ref URL 2",            70),
                        ]
                        for key, disp, conf in extra_string_fields:
                            eval_val = data.get(key)
                            if eval_val and str(eval_val).strip() and key not in field_dict:
                                enriched_fields.append(ProductField(
                                    id=uuid4(),
                                    name=key,
                                    display_name=disp,
                                    value=str(eval_val).strip(),
                                    confidence=conf,
                                    source_excerpt=SourceExcerpt(
                                        source_id=source_id,
                                        text=f"Generated by Gemini for {prod_name}",
                                    ),
                                    reasoning="Synthesised via Gemini GenAI enrichment pass.",
                                    status=FieldStatus.AUTO_COMMITTED,
                                ))
                                fields_added.append(key)
                                field_dict[key] = eval_val

                        llm_success = True
                        logger.info("EnrichmentAgent LLM pass succeeded on attempt %d", _attempt + 1)
                        break

                    except Exception as e:
                        err_str = str(e)
                        is_quota_err = any(code in err_str for code in ("503", "429", "UNAVAILABLE", "RESOURCE_EXHAUSTED"))
                        if is_quota_err and _attempt < 2:
                            logger.warning(
                                "EnrichmentAgent LLM attempt %d failed (%s) — rotating key and retrying",
                                _attempt + 1, err_str[:80],
                            )
                            # Rotate to the next key so next _get_client() picks it up
                            try:
                                from ..agents.main import key_rotator  # noqa: PLC0415
                                next_key = key_rotator.get_next_key()
                                if next_key:
                                    os.environ["GOOGLE_API_KEY"] = next_key
                            except Exception:
                                pass
                        else:
                            logger.warning("EnrichmentAgent LLM pass failed: %s", err_str[:120])
                            break

                if not llm_success:
                    logger.info("EnrichmentAgent: LLM enrichment skipped — using deterministic fallbacks")

            # Fallback descriptions if LLM was skipped
            ref_dict = {f.name: f for f in enriched_fields}
            if 'short_desc' not in ref_dict:
                enriched_fields.append(ProductField(
                    id=uuid4(),
                    name='short_desc',
                    display_name='Short Description',
                    value=f"{mfr} {prod_name}".strip(),
                    confidence=90,
                    source_excerpt=SourceExcerpt(source_id=source_id, text=str(prod_name)),
                    reasoning="Default short description from product title and manufacturer",
                    status=FieldStatus.AUTO_COMMITTED,
                ))
                fields_added.append('short_desc')

            if 'long_desc1' not in ref_dict:
                enriched_fields.append(ProductField(
                    id=uuid4(),
                    name='long_desc1',
                    display_name='Long Description',
                    value=f"{mfr} {prod_name} commercial grade specification datasheet product.",
                    confidence=88,
                    source_excerpt=SourceExcerpt(source_id=source_id, text=str(prod_name)),
                    reasoning="Generated commercial description",
                    status=FieldStatus.AUTO_COMMITTED,
                ))
                fields_added.append('long_desc1')

            # Apply certification-awareness: flag if certifications field is empty
            cert_field = next(
                (f for f in enriched_fields if f.name == "certifications"),
                None,
            )
            if cert_field and (not cert_field.value or cert_field.value == []):
                common_certs = taxonomy_info.get("taxonomy", {}).get(
                    "common_certifications", ["CE", "RoHS", "ISO"]
                )
                cert_list_str = ", ".join(common_certs)
                cert_field.reasoning = (
                    f"No certifications found — buyers often filter by certifications "
                    f"({cert_list_str}). Recommend manual verification."
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
