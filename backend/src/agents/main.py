"""Main Agents Execution Pipeline — SourceLedger.

Orchestrates the full multi-agent pipeline:
1. Ingestion Agent (Normalizes raw text / PDF / Web content)
2. Extraction Agent (Schema-locked structured field extraction)
3. Enrichment Agent (Fills gaps & taxonomy defaults via ADK tools)
4. Validation Agent (Scores confidence & routes uncertain fields)
5. Explainability Layer (Attaches citation & reasoning provenance)

Includes a Round-Robin Gemini API Key Rotator to switch across multiple API keys
(GOOGLE_API_KEY1..8) and handle expired/exhausted keys gracefully.
"""

import asyncio
import os
from typing import Any, Optional
from uuid import UUID, uuid4

from google.adk.agents import Agent

from ..config import settings
from ..models.product_record import ProductRecord, SourceType, TrustTier
from ..utils.logging import get_logger, log_agent_step

from .enrichment_agent import EnrichmentAgent
from .explainability_layer import ExplainabilityLayer
from .extraction_agent import ExtractionAgent
from .ingestion_agent import IngestionAgent
from .validation_agent import ValidationAgent

logger = get_logger("AgentsMainPipeline")


class APIKeyRotator:
    """Round-robin Gemini API key manager with expiration tracking.

    Cycles through all configured API keys (GOOGLE_API_KEY1..8, GOOGLE_API_KEY)
    in a round-robin sequence. If an API key expires, hits quota limits (429),
    or becomes invalid, it can be marked as expired to skip it in future calls.
    """

    def __init__(self, keys: list[str] | None = None) -> None:
        if keys:
            self._keys = [k.strip() for k in keys if k and k.strip()]
        else:
            self._keys = settings.get_google_api_keys()

        self._index = 0
        self._expired_keys: set[str] = set()

    @property
    def total_keys(self) -> int:
        """Total number of configured keys."""
        return len(self._keys)

    @property
    def active_keys_count(self) -> int:
        """Number of currently active (non-expired) keys."""
        return len([k for k in self._keys if k not in self._expired_keys])

    def get_next_key(self) -> Optional[str]:
        """Get the next active API key using Round-Robin rotation."""
        active = [k for k in self._keys if k not in self._expired_keys]
        if not active:
            logger.warning("All Gemini API keys are marked as expired/exhausted!")
            return None

        key = active[self._index % len(active)]
        self._index = (self._index + 1) % len(active)
        logger.info(
            "Round-Robin API Key selected (Key %d/%d active)",
            (self._index % len(active)) + 1,
            len(active),
        )
        return key

    def mark_expired(self, key: str) -> None:
        """Mark an API key as expired or exhausted."""
        if key:
            self._expired_keys.add(key)
            logger.warning(
                "Marked API key ending in '...%s' as EXPIRED/EXHAUSTED. Remaining active keys: %d",
                key[-6:],
                self.active_keys_count,
            )

    def reset(self) -> None:
        """Reset all expired keys back to active state."""
        self._expired_keys.clear()
        self._index = 0
        logger.info("API Key Rotator reset. All keys restored to active pool.")


# Global singleton rotator instance
key_rotator = APIKeyRotator()


class AgentPipeline:
    """Full execution pipeline combining all Google ADK backend agents."""

    def __init__(self) -> None:
        self.ingestion_agent = IngestionAgent()
        self.extraction_agent = ExtractionAgent()
        self.enrichment_agent = EnrichmentAgent()
        self.validation_agent = ValidationAgent()
        self.explainability_layer = ExplainabilityLayer()
        self.key_rotator = key_rotator

    def get_rotated_api_key(self) -> Optional[str]:
        """Fetch the next rotated API key and configure runtime environment."""
        api_key = self.key_rotator.get_next_key()
        if api_key:
            os.environ["GOOGLE_API_KEY"] = api_key
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
            except Exception as e:
                logger.debug("Failed to configure genai key: %s", e)
        return api_key

    async def run(
        self,
        source_type: SourceType,
        content: str,
        category: str = "industrial_pump",
        filename: str | None = None,
        trust_tier: TrustTier = TrustTier.MARKETPLACE,
    ) -> ProductRecord:
        """Run the complete 5-stage agent pipeline with round-robin key switching.

        Execution stages:
        1. Ingestion Agent
        2. Extraction Agent
        3. Enrichment Agent
        4. Validation Agent
        5. Explainability Layer
        """
        with log_agent_step(logger, "AgentPipeline", "executing full pipeline") as ctx:
            # Step 1: Ingestion
            current_key = self.get_rotated_api_key()
            logger.info("Stage 1: IngestionAgent starting (Key: %s...)", current_key[:8] if current_key else "demo")
            ingestion_res = await self.ingestion_agent.ingest(
                source_type=source_type,
                content=content,
                filename=filename,
                trust_tier=trust_tier,
            )

            # Step 2: Extraction
            current_key = self.get_rotated_api_key()
            logger.info("Stage 2: ExtractionAgent starting (Key: %s...)", current_key[:8] if current_key else "demo")
            extraction_res = await self.extraction_agent.extract(
                raw_text=ingestion_res.raw_text,
                category=category,
                source_id=ingestion_res.source.id,
            )

            # Step 3: Enrichment
            current_key = self.get_rotated_api_key()
            logger.info("Stage 3: EnrichmentAgent starting (Key: %s...)", current_key[:8] if current_key else "demo")
            enrichment_res = await self.enrichment_agent.enrich(
                fields=extraction_res.fields,
                category=category,
                source_id=ingestion_res.source.id,
            )

            # Step 4: Validation
            current_key = self.get_rotated_api_key()
            logger.info("Stage 4: ValidationAgent starting (Key: %s...)", current_key[:8] if current_key else "demo")
            validation_res = await self.validation_agent.validate(
                fields=enrichment_res.fields,
                category=category,
            )

            # Step 5: Explainability
            current_key = self.get_rotated_api_key()
            logger.info("Stage 5: ExplainabilityLayer starting (Key: %s...)", current_key[:8] if current_key else "demo")
            annotated_fields = await self.explainability_layer.annotate(
                validation_res.fields
            )

            product = ProductRecord(
                id=uuid4(),
                name=extraction_res.product_name,
                category=category,
                fields=annotated_fields,
                source_ids=[ingestion_res.source.id],
                confidence_overall=validation_res.confidence_overall,
            )

            ctx["output_summary"] = (
                f"'{product.name}' — {len(product.fields)} fields, "
                f"confidence={product.confidence_overall}"
            )
            return product


# Module-level default pipeline instance
main_pipeline = AgentPipeline()


async def main() -> None:
    """Sample CLI entrypoint to test main pipeline execution."""
    sample_text = (
        "Grundfos CR 15-3 Centrifugal Pump\n"
        "Flow Rate: 15.0 m3/h\n"
        "Head Pressure: 45.0 m\n"
        "Power Rating: 5.5 kW\n"
        "Material: Stainless Steel 316\n"
    )

    print("--- Starting SourceLedger Agents Main Pipeline ---")
    pipeline = AgentPipeline()
    product = await pipeline.run(
        source_type=SourceType.WEB,
        content=sample_text,
        category="industrial_pump",
    )

    print("\n--- Pipeline Execution Result ---")
    print(f"Product ID: {product.id}")
    print(f"Product Name: {product.name}")
    print(f"Category: {product.category}")
    print(f"Overall Confidence: {product.confidence_overall}%")
    print(f"Total Fields Extracted: {len(product.fields)}")
    for f in product.fields:
        print(f"  - {f.display_name} ({f.name}): {f.value} {f.unit or ''} [Conf: {f.confidence}%]")


if __name__ == "__main__":
    asyncio.run(main())
