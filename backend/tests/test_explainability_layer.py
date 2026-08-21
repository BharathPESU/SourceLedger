"""Tests for ExplainabilityLayer using Google ADK."""

from uuid import uuid4
import pytest

from src.agents.explainability_layer import ExplainabilityLayer
from src.models.product_record import FieldStatus, ProductField, SourceExcerpt


@pytest.mark.asyncio
async def test_explainability_layer_adk_agent_initialization():
    """Test that ExplainabilityLayer initializes the Google ADK Agent correctly."""
    layer = ExplainabilityLayer()
    assert layer.adk_agent is not None
    assert layer.adk_agent.name == "explainability_agent"
    assert len(layer.adk_agent.tools) == 1


@pytest.mark.asyncio
async def test_explainability_layer_annotates_missing_provenance():
    """Test that missing source excerpt and reasoning get default annotations."""
    layer = ExplainabilityLayer()
    source_id = uuid4()

    incomplete_field = ProductField(
        id=uuid4(),
        name="flow_rate",
        display_name="Flow Rate",
        value=15.0,
        unit="m³/h",
        confidence=85,
        source_excerpt=SourceExcerpt(source_id=source_id, text=""),
        reasoning="",
        status=FieldStatus.NEEDS_REVIEW,
    )

    annotated = await layer.annotate([incomplete_field])

    assert len(annotated) == 1
    field = annotated[0]
    assert field.source_excerpt.text == "(no source excerpt available)"
    assert "extracted for field" in field.reasoning
