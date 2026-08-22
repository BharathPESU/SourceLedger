"""Tests for CSVProcessor delivery format generation."""

import csv
import json
from pathlib import Path
import pytest

from src.services.csv_processor import CSVProcessor, EXPECTED_DELIVERY_HEADERS


@pytest.mark.asyncio
async def test_csv_processor_delivery_format(tmp_path):
    """Test processing sample CSV and generating exact 252-column delivery output."""
    sample_csv = tmp_path / "test_input.csv"
    output_dir = tmp_path / "output"

    with open(sample_csv, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Mfg_Part_Num", "Part_Desc", "E1_Brand", "Unilog_Brand", "DIB_Brand", "Part_Manuf"])
        writer.writerow(["DCB518ASTS06G", "Diablo 1/2in x 18in Sanding Belt", "Unbranded", "No Unilog", "No DIB", "Freud Inc"])

    processor = CSVProcessor()
    summary = await processor.process_file(
        input_csv_path=sample_csv,
        output_dir=output_dir,
    )

    assert summary["total_processed"] == 1
    out_csv = Path(summary["output_csv"])
    assert out_csv.exists()

    with open(out_csv, mode="r", encoding="utf-8") as f:
        reader = csv.reader(f)
        headers = next(reader)
        row = next(reader)

        # Check total delivery headers count (252 headers)
        assert len(headers) == len(EXPECTED_DELIVERY_HEADERS)
        assert len(row) == len(EXPECTED_DELIVERY_HEADERS)

        row_dict = dict(zip(headers, row))
        assert row_dict["Mfg_Part_Num"] == "DCB518ASTS06G"
        assert row_dict["PART_NUMBER"] == "DCB518ASTS06G"
        assert row_dict["MANUFACTURER_PART_NUMBER"] == "DCB518ASTS06G"
        # A thin record is valid when live sources provide no verified specification.
        assert row_dict["Part_Manuf"] == "Freud Inc"
        assert "SourceLedger Catalog" not in row_dict.values()
