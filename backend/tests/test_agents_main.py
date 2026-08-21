"""Tests for backend/src/agents/main.py and APIKeyRotator."""

import pytest
from src.agents.main import APIKeyRotator, AgentPipeline
from src.models.product_record import SourceType


def test_api_key_rotator_round_robin():
    """Test round-robin key switching across test keys."""
    keys = ["KEY_A", "KEY_B", "KEY_C"]
    rotator = APIKeyRotator(keys=keys)

    assert rotator.total_keys == 3
    assert rotator.active_keys_count == 3

    # Should cycle through KEY_A, KEY_B, KEY_C, KEY_A, ...
    assert rotator.get_next_key() == "KEY_A"
    assert rotator.get_next_key() == "KEY_B"
    assert rotator.get_next_key() == "KEY_C"
    assert rotator.get_next_key() == "KEY_A"


def test_api_key_rotator_expiration():
    """Test marking a key as expired so it is skipped during rotation."""
    keys = ["KEY_A", "KEY_B", "KEY_C"]
    rotator = APIKeyRotator(keys=keys)

    # Mark KEY_B as expired
    rotator.mark_expired("KEY_B")
    assert rotator.active_keys_count == 2

    # Should cycle between KEY_A and KEY_C only
    selected = [rotator.get_next_key() for _ in range(4)]
    assert "KEY_B" not in selected
    assert set(selected) == {"KEY_A", "KEY_C"}


def test_api_key_rotator_reset():
    """Test resetting rotator restores expired keys."""
    keys = ["KEY_1", "KEY_2"]
    rotator = APIKeyRotator(keys=keys)

    rotator.mark_expired("KEY_1")
    assert rotator.active_keys_count == 1

    rotator.reset()
    assert rotator.active_keys_count == 2


@pytest.mark.asyncio
async def test_agent_pipeline_execution():
    """Test full pipeline execution via AgentPipeline."""
    pipeline = AgentPipeline()
    sample = "Grundfos CR 15-3 Centrifugal Pump\nFlow Rate: 15.0 m3/h\nHead Pressure: 45.0 m\n"

    product = await pipeline.run(
        source_type=SourceType.WEB,
        content=sample,
        category="industrial_pump",
    )

    assert product is not None
    assert product.category == "industrial_pump"
    assert len(product.fields) > 0
