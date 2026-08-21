"""Unit of Measurement (UOM) Cleaner Tool for SourceLedger Agents.

Standardizes technical units of measurement for industrial specifications.
"""

from typing import Tuple
from ..utils.logging import get_logger

logger = get_logger("uom_cleaner_tool")

UOM_MAP = {
    "m3/h": "m³/h",
    "m3h": "m³/h",
    "meter": "m",
    "meters": "m",
    "kw": "kW",
    "bar": "bar",
    "bars": "bar",
    "volt": "V",
    "volts": "V",
    "v": "V",
    "amp": "A",
    "amps": "A",
    "ampere": "A",
    "a": "A",
    "c": "°C",
    "deg c": "°C",
    "celsius": "°C",
    "kg": "kg",
    "kilogram": "kg",
    "mm": "mm",
    "millimeter": "mm",
    "inch": "in",
    "inches": "in",
    "dba": "dBA",
}


def normalize_uom(value: str, unit: str) -> Tuple[str, str]:
    """Standardizes a spec value and unit of measurement pair.

    Args:
        value: Raw value string (e.g. "15.0")
        unit: Raw unit string (e.g. "m3/h", "kW")

    Returns:
        Tuple of (clean_value, clean_uom)
    """
    clean_val = value.strip() if value else ""
    clean_unit = unit.strip() if unit else ""
    
    unit_lower = clean_unit.lower()
    if unit_lower in UOM_MAP:
        clean_unit = UOM_MAP[unit_lower]

    return clean_val, clean_unit
