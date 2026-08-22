"""Tests for EnrichmentAgent using Google ADK."""

from uuid import uuid4
import pytest

from src.agents.enrichment_agent import EnrichmentAgent
from src.models.product_record import FieldStatus, ProductField, SourceExcerpt


@pytest.mark.asyncio
async def test_enrichment_agent_adk_agent_initialization():
    """Test that EnrichmentAgent initializes the Google ADK Agent correctly."""
    agent = EnrichmentAgent()
    assert agent.adk_agent is not None
    assert agent.adk_agent.name == "enrichment_agent"
    assert len(agent.adk_agent.tools) >= 2


@pytest.mark.asyncio
async def test_enrichment_agent_does_not_add_missing_required_fields_without_a_source():
    """Missing values stay absent when no separately cited source is supplied."""
    agent = EnrichmentAgent()
    source_id = uuid4()
    fields = []  # No fields provided

    result = await agent.enrich(
        fields=fields,
        category="industrial_pump",
        source_id=source_id,
    )

    assert result.fields == []
    assert result.fields_added == []


@pytest.mark.asyncio
async def test_enrichment_agent_preserves_empty_certifications_without_inventing_defaults():
    """An empty source field is retained, not filled from category defaults."""
    agent = EnrichmentAgent()
    source_id = uuid4()
    cert_field = ProductField(
        id=uuid4(),
        name="certifications",
        display_name="Certifications",
        value=[],
        confidence=80,
        source_excerpt=SourceExcerpt(source_id=source_id, text="None"),
        reasoning="Initial reasoning",
        status=FieldStatus.NEEDS_REVIEW,
    )

    result = await agent.enrich(
        fields=[cert_field],
        category="industrial_pump",
        source_id=source_id,
    )

    assert result.fields_updated == []
    updated_cert = next(f for f in result.fields if f.name == "certifications")
    assert updated_cert.value == []
    assert updated_cert.confidence == 80
    assert updated_cert.reasoning == "Initial reasoning"
