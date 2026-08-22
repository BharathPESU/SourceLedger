"""Tests for the Extraction Agent — highest priority test suite.

Tests schema-locked output, confidence scoring, and field extraction
without requiring a live LLM (uses demo mode). These tests catch the
most dangerous bugs: schema drift and silent misextraction.
"""

import pytest

from src.agents.extraction_agent import ExtractionAgent
from src.models.product_record import SourceType
from src.models.schemas import (
    CATEGORY_REGISTRY,
    INDUSTRIAL_PUMP_SCHEMA,
    ELECTRICAL_CONNECTOR_SCHEMA,
    SAFETY_FASTENER_SCHEMA,
)
from uuid import uuid4


@pytest.fixture
def agent():
    return ExtractionAgent()


@pytest.fixture
def pump_source_text():
    return """
    Grundfos CR 15-3 Vertical Multistage Centrifugal Pump

    The CR 15-3 is a vertical, non-self-priming, multistage, in-line
    centrifugal pump. It is designed for use in water supply, water
    treatment, and industrial applications.

    Technical Specifications:
    - Flow rate: 15 m³/h
    - Head pressure: 32.5 m
    - Power rating: 3.0 kW
    - Pump type: Centrifugal, multistage
    - Body material: Stainless steel AISI 304
    - Impeller material: Stainless steel AISI 304
    - Inlet connection: DN50 (2 inch)
    - Outlet connection: DN50 (2 inch)
    - Motor voltage: 400V/3ph/50Hz
    - Weight: 45.5 kg
    - Operating temperature range: -20 to 120°C
    - Maximum working pressure: 25 bar
    - Certifications: CE, WRAS, ACS
    """


@pytest.fixture
def connector_source_text():
    return """
    Amphenol MS3106A-18-1S Circular Connector

    Military-spec circular connector for harsh environment applications.

    Part Number: MS3106A-18-1S
    Manufacturer: Amphenol
    Connector Type: Circular, MIL-DTL-5015
    Number of Contacts: 10
    Voltage Rating: 500V
    Current Rating: 13A per contact
    Gender: Female (receptacle)
    Mounting Type: Cable mount
    IP Rating: IP67 when mated
    Housing Material: Aluminium alloy, olive drab cadmium plated
    Contact Material: Copper alloy, silver plated
    Temperature Range: -55 to 125°C
    Wire Gauge: 16 AWG
    Certifications: MIL-DTL-5015, QPL
    """


@pytest.fixture
def fastener_source_text():
    return """
    Nord-Lock NL12 Wedge-Locking Washer System

    Part Number: NL12
    Manufacturer: Nord-Lock Group
    Type: Wedge-locking washer pair
    Thread Size: M12
    Material: Carbon steel
    Grade: Class 10.9 compatible
    Finish: Delta Protekt (zinc flake coating)
    Tensile Strength: Secures bolts up to 1220 MPa
    Locking Mechanism: Multi-directional wedge lock
    Length: 3.4 mm (washer thickness)
    Standards: DIN 25201, NF E 25-xxx
    """


class TestExtractionAgent:
    """Tests that the extraction agent produces schema-valid output."""

    @pytest.mark.asyncio
    async def test_pump_extraction_returns_required_fields(
        self, agent, pump_source_text
    ):
        """All required pump fields must be present in the output."""
        result = await agent.extract(
            raw_text=pump_source_text,
            category="industrial_pump",
            source_id=uuid4(),
        )

        field_names = {f.name for f in result.fields}

        # Required fields for industrial_pump
        for required in INDUSTRIAL_PUMP_SCHEMA.required_field_names:
            assert required in field_names, (
                f"Required field '{required}' missing from extraction result"
            )

    @pytest.mark.asyncio
    async def test_connector_extraction_returns_required_fields(
        self, agent, connector_source_text
    ):
        result = await agent.extract(
            raw_text=connector_source_text,
            category="electrical_connector",
            source_id=uuid4(),
        )

        field_names = {f.name for f in result.fields}
        for required in ELECTRICAL_CONNECTOR_SCHEMA.required_field_names:
            assert required in field_names, (
                f"Required field '{required}' missing from extraction result"
            )

    @pytest.mark.asyncio
    async def test_fastener_extraction_returns_required_fields(
        self, agent, fastener_source_text
    ):
        result = await agent.extract(
            raw_text=fastener_source_text,
            category="safety_fastener",
            source_id=uuid4(),
        )

        field_names = {f.name for f in result.fields}
        for required in SAFETY_FASTENER_SCHEMA.required_field_names:
            assert required in field_names, (
                f"Required field '{required}' missing from extraction result"
            )

    @pytest.mark.asyncio
    async def test_every_field_has_source_excerpt(
        self, agent, pump_source_text
    ):
        """No field should exist without a source citation — this is a hard rule."""
        result = await agent.extract(
            raw_text=pump_source_text,
            category="industrial_pump",
            source_id=uuid4(),
        )

        for field in result.fields:
            assert field.source_excerpt is not None, (
                f"Field '{field.name}' has no source_excerpt — every field "
                "must have a citation"
            )
            assert field.source_excerpt.source_id is not None, (
                f"Field '{field.name}' source_excerpt has no source_id"
            )

    @pytest.mark.asyncio
    async def test_every_field_has_confidence_in_range(
        self, agent, pump_source_text
    ):
        """Confidence must be 0-100 for every field."""
        result = await agent.extract(
            raw_text=pump_source_text,
            category="industrial_pump",
            source_id=uuid4(),
        )

        for field in result.fields:
            assert 0 <= field.confidence <= 100, (
                f"Field '{field.name}' confidence {field.confidence} out of range"
            )

    @pytest.mark.asyncio
    async def test_every_field_has_reasoning(
        self, agent, pump_source_text
    ):
        """Every field must have a reasoning explanation."""
        result = await agent.extract(
            raw_text=pump_source_text,
            category="industrial_pump",
            source_id=uuid4(),
        )

        for field in result.fields:
            assert field.reasoning, (
                f"Field '{field.name}' has empty reasoning"
            )

    @pytest.mark.asyncio
    async def test_product_name_extracted(self, agent, pump_source_text):
        """Extraction must identify the product name."""
        result = await agent.extract(
            raw_text=pump_source_text,
            category="industrial_pump",
            source_id=uuid4(),
        )

        assert result.product_name, "Product name should not be empty"

    @pytest.mark.asyncio
    async def test_unknown_category_raises_error(self, agent):
        """Requesting an unknown category should raise ValueError."""
        with pytest.raises(ValueError, match="Unknown category"):
            await agent.extract(
                raw_text="some text",
                category="nonexistent_category",
                source_id=uuid4(),
            )

    @pytest.mark.asyncio
    async def test_fields_only_from_schema(
        self, agent, pump_source_text
    ):
        """Extracted fields should only use names defined in the schema."""
        result = await agent.extract(
            raw_text=pump_source_text,
            category="industrial_pump",
            source_id=uuid4(),
        )

        valid_names = {f.name for f in INDUSTRIAL_PUMP_SCHEMA.fields}
        for field in result.fields:
            assert field.name in valid_names, (
                f"Field '{field.name}' is not in the industrial_pump schema"
            )


    @pytest.mark.asyncio
    async def test_failure_message_is_not_extracted_as_product_data(self, agent):
        result = await agent.extract(
            raw_text="No Power Tool Found in Source Text",
            category="industrial_pump",
            source_id=uuid4(),
        )

        assert result.status == "extraction_failed"
        assert result.reason == "Source text contains no identifiable product information"
        assert result.product_name == ""
        assert result.fields == []
