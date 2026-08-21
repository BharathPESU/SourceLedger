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
async def test_enrichment_agent_adds_missing_required_fields():
    """Test that missing required fields are added as placeholders."""
    agent = EnrichmentAgent()
    source_id = uuid4()
    fields = []  # No fields provided

    result = await agent.enrich(
        fields=fields,
        category="industrial_pump",
        source_id=source_id,
    )

    assert len(result.fields_added) > 0
    added_names = set(result.fields_added)
    assert "manufacturer" in added_names
    assert "flow_rate" in added_names


@pytest.mark.asyncio
async def test_enrichment_agent_flags_empty_certifications():
    """Test that empty certifications field gets flagged with reasoning."""
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

    assert "certifications" in result.fields_updated
    updated_cert = next(f for f in result.fields if f.name == "certifications")
    assert updated_cert.confidence <= 30
    assert "buyers often filter by certifications" in updated_cert.reasoning
