"""Seed script for SourceLedger backend.

Pre-loads realistic product datasheets across industrial_pump, electrical_connector,
and safety_fastener categories into the in-memory store on server startup.
"""

import asyncio
from uuid import uuid4

from .models.product_record import SourceType, TrustTier
from .models.schemas import (
    ELECTRICAL_CONNECTOR_SCHEMA,
    INDUSTRIAL_PUMP_SCHEMA,
    SAFETY_FASTENER_SCHEMA,
)
from .orchestration.pipeline import run_pipeline
from .utils.logging import get_logger

logger = get_logger("seed")

SAMPLE_PUMP_1 = """GRUNDFOS CENTRIFUGAL PUMP CR 15-3 A-F-A-E-HQQE
Industrial Inline Multistage Centrifugal Pump Specification Sheet

1. Identification & Operating Parameters
Product Name: Grundfos CR 15-3 Vertical Multistage Pump
Flow Rate (Nominal): 15.0 m3/h
Rated Head: 45.2 m
Maximum Operating Pressure: 16 bar (1.6 MPa) at 120°C
Liquid Temperature Range: -20°C to +120°C
Pump Speed: 2900 rpm
Efficiency at Best Efficiency Point (BEP): 68.5%

2. Motor Specifications
Rated Motor Power (P2): 3.0 kW (4.0 HP)
Mains Frequency: 50 Hz
Rated Voltage: 3 x 380-415V Y / 220-240V D
Rated Current: 6.2 A / 10.7 A
Enclosure Class: IP55 (IEC 34-5)
Insulation Class: F (IEC 85)

3. Materials of Construction
Pump Housing: Cast Iron EN-GJL-200 (ASTM A48-30B)
Impeller: Stainless Steel AISI 304 (EN 1.4301)
Shaft: Stainless Steel AISI 304 (EN 1.4301)
Shaft Seal: HQQE (Silicon Carbide / Silicon Carbide / EPDM)
Base Plate: Cast Iron

4. Mechanical & Port Connections
Suction/Discharge Port Size: DN 50 (2 inch)
Flange Standard: DIN EN 1092-2 PN 16
Net Weight: 52.0 kg
"""

SAMPLE_PUMP_2 = """KSB ETANORM 050-032-160 CENTRIFUGAL PUMP
Single-stage Volute Casing Pump for Industrial Water Supply

TECHNICAL DATA:
Product Name: KSB Etanorm 050-032-160
Flow Rate: 28.0 m3/h
Head: 32.0 m
Maximum Operating Pressure: 10 bar
Liquid Temperature: -10°C to +90°C
Pump Speed: 1450 rpm
Motor Power: 4.0 kW
Enclosure Class: IP55
Suction Port Size: DN 50
Discharge Port Size: DN 32
Housing Material: Cast Iron JL 1040
Impeller Material: Grey Cast Iron
Shaft Seal: Mechanical Seal Burgmann MG1
Net Weight: 68 kg
"""

SAMPLE_CONNECTOR_1 = """TE CONNECTIVITY AMPSEAL 16 8-POSITION CONNECTOR
Heavy Duty Sealed Connector Housing Specification

OVERVIEW:
Product Name: TE Connectivity AMPSEAL 16 8-Pin Plug Assembly
Part Number: 776495-1
Number of Positions: 8 Positions (2 Rows x 4 Columns)
Current Rating (Max): 13.0 A per contact at 125°C
Operating Voltage: 250 V AC / V DC
Ingress Protection: IP67 and IP69K (with wire seal)
Operating Temperature: -40°C to +125°C
Wire Gauge Range: 20 AWG to 14 AWG (0.5 to 2.0 mm2)
Mating Pin Diameter: 1.50 mm (0.060 inch)
Contact Material: Copper Alloy, Selective Gold Plated
Housing Material: Thermoplastic PBT Glass Filled Black
Locking Mechanism: Integrated CPA (Connector Position Assurance) latch
Flammability Rating: UL 94 V-0
"""

SAMPLE_FASTENER_1 = """FABORY M12 x 50mm CLASS 10.9 HEXAGON HEAD BOLT
High Strength Metric Structural Fastener Technical Specification

TECHNICAL SPECIFICATIONS:
Product Name: Fabory M12x50 Hex Head Cap Screw Class 10.9
Thread Size: M12 x 1.75 mm Pitch (Coarse Thread)
Nominal Length: 50.0 mm
Property Class: Class 10.9 (ISO 898-1)
Proof Load Strength: 830 MPa
Tensile Strength (Min): 1040 MPa
Yield Strength (Min): 940 MPa
Material Grade: Alloy Steel, Quenched and Tempered
Surface Finish / Coating: Zinc Plated (Cr3+ Passivated, 8 µm thickness)
Drive Type: External Hexagon (AF 19 mm)
Head Height: 7.5 mm
Safety Feature: Serrated Under-Head Flange / Wedge-Lock compatible
Certifications: ISO 898-1, DIN 931, ISO 4014, CE Marked
"""


async def seed_data():
    """Run pipeline on sample datasheets to populate store."""
    logger.info("Seeding SourceLedger backend store with initial products...")

    sources = [
        (
            "https://www.grundfos.com/products/cr-15-3.pdf",
            SAMPLE_PUMP_1,
            "industrial_pump",
            "Grundfos_CR15_Datasheet.pdf",
            TrustTier.MANUFACTURER,
        ),
        (
            "https://www.ksb.com/etanorm-050-032.pdf",
            SAMPLE_PUMP_2,
            "industrial_pump",
            "KSB_Etanorm_Spec.pdf",
            TrustTier.MANUFACTURER,
        ),
        (
            "https://www.te.com/ampseal16-776495-1.html",
            SAMPLE_CONNECTOR_1,
            "electrical_connector",
            "TE_AMPSEAL16_776495_1.html",
            TrustTier.MANUFACTURER,
        ),
        (
            "https://www.fabory.com/m12-50-class109-hexbolt.pdf",
            SAMPLE_FASTENER_1,
            "safety_fastener",
            "Fabory_M12x50_Fastener.pdf",
            TrustTier.DISTRIBUTOR,
        ),
    ]

    for url, text, cat, filename, tier in sources:
        try:
            prod = await run_pipeline(
                source_type=SourceType.WEB if url.startswith("http") else SourceType.PDF,
                content=text,
                category=cat,
                filename=filename,
                trust_tier=tier,
            )
            logger.info("Seeded product: %s (%s)", prod.name, prod.id)
        except Exception as e:
            logger.error("Failed to seed %s: %s", filename, e)

    logger.info("Seeding complete.")


if __name__ == "__main__":
    asyncio.run(seed_data())
