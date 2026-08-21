"""Enrichment Agent — fills missing fields using Google GenAI Agent Developer Kit with Live Tool Access.

Equipped with Agent Tools & Skills:
1. search_product_datasheets (WebSearchTool) — Searches live web for spec sheets, SDS PDFs, manuals, and image links
2. fetch_manufacturer_page (URLFetcherTool) — Scrapes official manufacturer landing pages (MFR URL)
3. lookup_product_taxonomy (TaxonomyTool) — Standardizes UNSPSC codes and 4-tier taxonomy (Dept, Class, Fine, Classpath)

Architectural rule: every enriched field carries explicit provenance citations and reasoning.
"""

import json
from uuid import uuid4
from typing import List, Dict, Any, Optional

from ..config import settings
from ..models.pipeline import EnrichmentResult
from ..models.product_record import (
    FieldStatus,
    ProductField,
    SourceExcerpt,
)
from ..models.schemas import get_category_schema
from ..tools.web_search_tool import search_product_datasheets
from ..tools.url_fetcher_tool import fetch_manufacturer_page
from ..tools.taxonomy_tool import lookup_product_taxonomy
from ..utils.logging import get_logger, log_agent_step

logger = get_logger("EnrichmentAgent")


class EnrichmentAgent:
    """Enriches extracted product data with Tool Access into full Unihack e-commerce delivery schema."""

    def __init__(self) -> None:
        self._client = None

    def _get_client(self):
        if self._client is not None:
            return self._client
        if not settings.google_api_key:
            return None
        try:
            from google import genai
            self._client = genai.Client(api_key=settings.google_api_key)
            return self._client
        except Exception as e:
            logger.error("EnrichmentAgent Google GenAI Client init failed: %s", e)
            return None

    async def enrich(
        self,
        fields: list[ProductField],
        category: str,
        source_id: object,
    ) -> EnrichmentResult:
        """Enrich extracted fields with live tool research, e-commerce descriptions, features, and taxonomy."""
        with log_agent_step(logger, "EnrichmentAgent", f"enriching {category}") as ctx:
            enriched_fields = list(fields)
            fields_added: list[str] = []
            fields_updated: list[str] = []

            field_dict = {f.name: f.value for f in enriched_fields if f.value is not None}
            prod_name = str(field_dict.get('product_name') or field_dict.get('part_desc') or 'Industrial Product')
            mfr = str(field_dict.get('manufacturer') or field_dict.get('brand') or '')
            part_num = str(field_dict.get('mfg_part_num') or field_dict.get('part_number') or field_dict.get('model_number') or '')

            # Tool Skill 1: Taxonomy & UNSPSC Lookup Tool
            taxonomy_info = lookup_product_taxonomy(prod_name, category)
            for tax_key, tax_val in taxonomy_info.items():
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

            # Tool Skill 2: Live Web Research Tool for missing MFR URL, spec sheet, or manuals
            if ('mfr_url' not in field_dict or 'specification_sheet' not in field_dict) and part_num:
                web_results = search_product_datasheets(part_num, mfr)
                for res_key, res_val in web_results.items():
                    if res_val and res_key != 'web_snippets' and res_key not in field_dict:
                        enriched_fields.append(ProductField(
                            id=uuid4(),
                            name=res_key,
                            display_name=res_key.replace('_', ' ').title(),
                            value=res_val,
                            confidence=92,
                            source_excerpt=SourceExcerpt(
                                source_id=source_id,
                                text=f"Live WebSearchTool query: '{mfr} {part_num}'",
                            ),
                            reasoning=f"Fetched via WebSearchTool skill from live manufacturer web index.",
                            status=FieldStatus.AUTO_COMMITTED,
                        ))
                        fields_added.append(res_key)

            # Tool Skill 3: Google GenAI Agent Reasoning for E-Commerce Descriptions & Features
            client = self._get_client()
            if client and 'long_desc1' not in field_dict:
                try:
                    from google.genai import types
                    prompt = (
                        f"You are an expert e-commerce catalog agent. Given the following product specs:\n"
                        f"Product: {prod_name}\nManufacturer: {mfr}\nPart Number: {part_num}\n"
                        f"Extracted Specs: {json.dumps(field_dict, default=str)}\n\n"
                        f"Return a valid JSON object with:\n"
                        f"- short_desc: A concise 1-sentence product summary\n"
                        f"- long_desc1: A detailed 3-4 sentence commercial product description\n"
                        f"- marketing_description: An engaging marketing description\n"
                        f"- mobile_desc: A short bulleted summary for mobile apps\n"
                        f"- invoice_desc: Short billing invoice line item\n"
                        f"- item_features: An array of 3-7 bullet points of key features\n"
                        f"Respond with JSON only."
                    )
                    resp = client.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=prompt,
                        config=types.GenerateContentConfig(temperature=0.1)
                    )
                    resp_text = resp.text.strip()
                    if resp_text.startswith("```json"):
                        resp_text = resp_text.split("```json", 1)[1].rsplit("```", 1)[0].strip()
                    elif resp_text.startswith("```"):
                        resp_text = resp_text.split("```", 1)[1].rsplit("```", 1)[0].strip()
                    
                    data = json.loads(resp_text)
                    
                    for key in ['short_desc', 'long_desc1', 'marketing_description', 'mobile_desc', 'invoice_desc']:
                        if key in data and key not in field_dict:
                            pf = ProductField(
                                id=uuid4(),
                                name=key,
                                display_name=key.replace('_', ' ').title(),
                                value=data[key],
                                confidence=95,
                                source_excerpt=SourceExcerpt(
                                    source_id=source_id,
                                    text=f"Synthesized from {prod_name} specifications",
                                ),
                                reasoning=f"Synthesized via Google GenAI Agent reasoning pass for Unihack delivery schema.",
                                status=FieldStatus.AUTO_COMMITTED,
                            )
                            enriched_fields.append(pf)
                            fields_added.append(key)
                    
                    if 'item_features' in data and isinstance(data['item_features'], list) and 'item_features' not in field_dict:
                        pf = ProductField(
                            id=uuid4(),
                            name='item_features',
                            display_name='Item Features',
                            value=data['item_features'],
                            confidence=95,
                            source_excerpt=SourceExcerpt(
                                source_id=source_id,
                                text=f"Extracted features for {prod_name}",
                            ),
                            reasoning="Synthesized bullet points via Google GenAI Agent pass",
                            status=FieldStatus.AUTO_COMMITTED,
                        )
                        enriched_fields.append(pf)
                        fields_added.append('item_features')

                except Exception as e:
                    logger.warning("Google GenAI Enrichment pass exception: %s", e)

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
