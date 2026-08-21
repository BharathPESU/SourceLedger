"""Unit tests for SourceLedger Agent Tools & Skills."""

import pytest
from src.tools.web_search_tool import search_product_datasheets
from src.tools.taxonomy_tool import lookup_product_taxonomy
from src.tools.uom_cleaner_tool import normalize_uom


def test_taxonomy_tool_lookup():
    result = lookup_product_taxonomy("CR 15-3 Multistage Centrifugal Pump", "industrial_pump")
    assert result["unspsc"] == "40151500"
    assert "Pumps" in result["category_class"]
    assert result["dept"] == "Industrial & Commercial"


def test_uom_cleaner_tool():
    val, unit = normalize_uom("15.0 ", " m3/h ")
    assert val == "15.0"
    assert unit == "m³/h"

    val2, unit2 = normalize_uom("250", "V")
    assert val2 == "250"
    assert unit2 == "V"


def test_web_search_tool():
    res = search_product_datasheets("776495-1", "TE Connectivity")
    assert "mfr_url" in res
    assert "specification_sheet" in res
    assert "product_image" in res
