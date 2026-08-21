"""Tests for IngestionAgent using Google ADK."""

import pytest
from src.agents.ingestion_agent import IngestionAgent
from src.models.product_record import SourceType, TrustTier


@pytest.mark.asyncio
async def test_ingestion_agent_adk_agent_initialization():
    """Test that IngestionAgent initializes the Google ADK Agent correctly."""
    agent = IngestionAgent()
    assert agent.adk_agent is not None
    assert agent.adk_agent.name == "ingestion_agent"
    assert len(agent.adk_agent.tools) == 2


@pytest.mark.asyncio
async def test_ingestion_agent_raw_text():
    """Test ingesting raw text content."""
    agent = IngestionAgent()
    text = "Industrial pump model CR 15-3 flow rate 15 m3/h"

    result = await agent.ingest(
        source_type=SourceType.WEB,
        content=text,
        filename="test_raw.txt",
        trust_tier=TrustTier.MANUFACTURER,
    )

    assert result.raw_text == text
    assert result.source.source_type == SourceType.WEB
    assert result.source.trust_tier == TrustTier.MANUFACTURER
