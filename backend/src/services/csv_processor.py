"""CSV Processing Service — maps input datasets into exact delivery format specifications.

Reads product catalog records from input CSV files, executes the 5-stage Google ADK agent pipeline,
and outputs enriched structured data matching the exact 252-column delivery schema seen in
'Unihack_ Expected Output - Delivery Format.csv'.
"""

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from ..agents.main import AgentPipeline, key_rotator
from ..models.product_record import SourceType, TrustTier
from ..utils.logging import get_logger

logger = get_logger("CSVProcessor")


# Standard 252 delivery headers from Unihack_ Expected Output - Delivery Format.csv
EXPECTED_DELIVERY_HEADERS = [
    "MFR URL", "Ref URL 1", "Ref URL 2", "Ref URL 3", "Ref URL 4", "Ref URL 5",
    "PART_NUMBER", "Dept", "Class", "Fine", "SKU - MY_PART_NUMBER", "Mfg_Part_Num",
    "Part_Desc", "E1_Brand", "Unilog_Brand", "DIB_Brand", "Part_Manuf",
    "MANUFACTURER_NAME", "BRAND_NAME", "TRADE_NAME", "MANUFACTURER_PART_NUMBER",
    "ALTERNATE_PART_NUMBER", "Classpath", "MOBILE_DESC", "INVOICE_DESC",
    "SHORT_DESC", "LONG_DESC1", "RETAIL_DESC", "MARKETING_DESCRIPTION",
    "ITEM_FEATURES_1", "ITEM_FEATURES_2", "ITEM_FEATURES_3", "ITEM_FEATURES_4",
    "ITEM_FEATURES_5", "ITEM_FEATURES_6", "ITEM_FEATURES_7", "ITEM_FEATURES_8",
    "ITEM_FEATURES_9", "ITEM_FEATURES_10", "ITEM_FEATURES_11", "ITEM_FEATURES_12",
    "ITEM_FEATURES_13", "ITEM_FEATURES_14", "ITEM_FEATURES_15", "ITEM_FEATURES_16",
    "ITEM_FEATURES_17", "ITEM_FEATURES_18", "ITEM_FEATURES_19", "ITEM_FEATURES_20",
    "With", "Standard/Approvals", "Prop 65", "Application", "Includes", "Product Name"
]

# Add ATTRIBUTE_LABEL 1..50, ATTRIBUTE_VALUE 1..50, ATTRIBUTE_UOM 1..50
for i in range(1, 51):
    EXPECTED_DELIVERY_HEADERS.extend([
        f"ATTRIBUTE_LABEL {i}",
        f"ATTRIBUTE_VALUE {i}",
        f"ATTRIBUTE_UOM {i}"
    ])

EXPECTED_DELIVERY_HEADERS.extend([
    "UPC", "EAN", "GTIN", "UNSPSC", "Warranty", "List Price", "Selling Qty",
    "Selling UOM", "Standard Packaging Information", "LENGTH", "LENGTH_UOM",
    "HEIGHT", "HEIGHT_UOM", "WIDTH", "WIDTH_UOM", "WEIGHT", "WEIGHT_UOM",
    "VOLUME", "VOLUME_UOM", "Product Image", "Alternate Image 1",
    "Alternate Image 2", "Alternate Image 3", "Alternate Image 4", "SDS",
    "SDS_1", "Warranty Information", "Catalog", "Specification Sheet",
    "Instruction/Installation Manual", "Service Manual", "Owners/User Manual",
    "Line Drawing", "MTR", "RoHS", "Full Engineering Drawing", "Energy Star Guide",
    "Technical Bulletin", "Submittal", "Compatibility Chart", "Size Chart",
    "Product Label/Insert", "Video Link", "Video Link 1", "Country Of Origin",
    "Discontinued", "Actual Image (Yes/No)"
])


class CSVProcessor:
    """Processes product catalog CSV inputs into the exact Expected Delivery Format."""

    def __init__(self, pipeline: Optional[AgentPipeline] = None) -> None:
        self.pipeline = pipeline or AgentPipeline()

    def get_delivery_headers(self, sample_delivery_file: Optional[Path] = None) -> list[str]:
        """Load delivery column headers from sample expected file if present."""
        if sample_delivery_file and sample_delivery_file.exists():
            try:
                with open(sample_delivery_file, mode="r", encoding="utf-8-sig") as f:
                    reader = csv.reader(f)
                    return next(reader)
            except Exception as e:
                logger.warning("Could not read delivery template header: %s", e)
        return EXPECTED_DELIVERY_HEADERS

    async def process_file(
        self,
        input_csv_path: str | Path,
        output_dir: str | Path = "output",
        max_rows: Optional[int] = None,
        template_csv_path: Optional[str | Path] = None,
    ) -> dict[str, Any]:
        """Process input CSV and export results in the exact Expected Delivery Format.

        Args:
            input_csv_path: Path to input CSV file.
            output_dir: Output folder directory.
            max_rows: Limit rows processed (for testing/batching).
            template_csv_path: Optional reference expected delivery template file.

        Returns:
            dict containing summary execution metrics and file output paths.
        """
        input_path = Path(input_csv_path)
        out_dir = Path(output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        if not input_path.exists():
            raise FileNotFoundError(f"Input CSV file not found: {input_path}")

        template_path = Path(template_csv_path) if template_csv_path else out_dir / "Unihack_ Expected Output - Delivery Format.csv"
        headers = self.get_delivery_headers(template_path if template_path.exists() else None)

        logger.info("Starting delivery-formatted CSV processing for file: %s", input_path)

        delivery_rows = []
        json_records = []

        with open(input_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        if max_rows is not None:
            rows = rows[:max_rows]

        total_rows = len(rows)
        logger.info("Processing %d records into delivery format", total_rows)

        for idx, row in enumerate(rows, start=1):
            mfg_part_num = row.get("Mfg_Part_Num", "").strip()
            part_desc = row.get("Part_Desc", "").strip()
            part_manuf = row.get("Part_Manuf", "").strip()
            e1_brand = row.get("E1_Brand", "").strip()
            unilog_brand = row.get("Unilog_Brand", "").strip()
            dib_brand = row.get("DIB_Brand", "").strip()

            raw_text = (
                f"Manufacturer Part Number: {mfg_part_num}\n"
                f"Description: {part_desc}\n"
                f"Manufacturer/Brand: {part_manuf}\n"
                f"Brand Details: {e1_brand} | {unilog_brand} | {dib_brand}\n"
            )

            category = self._detect_category_from_row(raw_text)

            try:
                product = await self.pipeline.run(
                    source_type=SourceType.WEB,
                    content=raw_text,
                    category=category,
                    filename=input_path.name,
                    trust_tier=TrustTier.DISTRIBUTOR,
                )

                # Construct exact 252 column delivery row dictionary
                d_row = {h: "" for h in headers}

                # Preserve original input columns
                d_row["Mfg_Part_Num"] = mfg_part_num
                d_row["Part_Desc"] = part_desc
                d_row["E1_Brand"] = e1_brand
                d_row["Unilog_Brand"] = unilog_brand
                d_row["DIB_Brand"] = dib_brand
                d_row["Part_Manuf"] = part_manuf

                # Primary Identifiers
                d_row["PART_NUMBER"] = mfg_part_num
                d_row["MANUFACTURER_PART_NUMBER"] = mfg_part_num
                d_row["SKU - MY_PART_NUMBER"] = mfg_part_num
                d_row["MANUFACTURER_NAME"] = part_manuf.split("(")[0].strip() if part_manuf else ""

                # Extract Brand Name
                brand_candidates = [b for b in [e1_brand, unilog_brand, dib_brand] if b and not b.startswith("--")]
                d_row["BRAND_NAME"] = brand_candidates[0] if brand_candidates else part_manuf.split("(")[0].strip()

                # Descriptions
                d_row["SHORT_DESC"] = part_desc
                d_row["MOBILE_DESC"] = f"{d_row['MANUFACTURER_NAME']}, {product.name}, {mfg_part_num}"
                d_row["INVOICE_DESC"] = part_desc[:40].upper()
                d_row["LONG_DESC1"] = f"{part_desc}. {product.name} extracted with {product.confidence_overall}% confidence."
                d_row["RETAIL_DESC"] = part_desc
                d_row["Product Name"] = product.name or part_desc.split(" ")[0]
                d_row["Actual Image (Yes/No)"] = "Yes"

                # Populate ATTRIBUTE_LABEL i, ATTRIBUTE_VALUE i, ATTRIBUTE_UOM i
                for i, field in enumerate(product.fields[:50], start=1):
                    lbl_key = f"ATTRIBUTE_LABEL {i}"
                    val_key = f"ATTRIBUTE_VALUE {i}"
                    uom_key = f"ATTRIBUTE_UOM {i}"

                    if lbl_key in d_row:
                        d_row[lbl_key] = field.display_name or field.name
                    if val_key in d_row:
                        d_row[val_key] = str(field.value) if field.value is not None else ""
                    if uom_key in d_row:
                        d_row[uom_key] = field.unit or ""

                delivery_rows.append(d_row)

                json_records.append({
                    "mfg_part_num": mfg_part_num,
                    "product_id": str(product.id),
                    "product_name": product.name,
                    "category": product.category,
                    "confidence_overall": product.confidence_overall,
                    "fields": [
                        {
                            "id": str(f.id),
                            "name": f.name,
                            "display_name": f.display_name,
                            "value": f.value,
                            "unit": f.unit,
                            "confidence": f.confidence,
                            "reasoning": f.reasoning,
                            "status": f.status.value if hasattr(f.status, "value") else str(f.status),
                        }
                        for f in product.fields
                    ],
                })

            except Exception as e:
                logger.error("Error processing row %d (%s): %s", idx, mfg_part_num, e)
                d_row = {h: "" for h in headers}
                d_row["Mfg_Part_Num"] = mfg_part_num
                d_row["Part_Desc"] = part_desc
                d_row["SHORT_DESC"] = f"ERROR: {e}"
                delivery_rows.append(d_row)

        # Write Output Delivery CSV
        output_csv_file = out_dir / "Unihack_ Output - Delivery Format.csv"
        with open(output_csv_file, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(delivery_rows)

        # Write Output JSON
        output_json_file = out_dir / "Unihack_ Output - Delivery Format.json"
        with open(output_json_file, mode="w", encoding="utf-8") as f:
            json.dump(
                {
                    "processed_count": len(delivery_rows),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "records": json_records,
                },
                f,
                indent=2,
            )

        logger.info("Successfully wrote delivery format to %s and %s", output_csv_file, output_json_file)

        return {
            "total_processed": len(delivery_rows),
            "output_csv": str(output_csv_file),
            "output_json": str(output_json_file),
        }

    def _detect_category_from_row(self, raw_text: str) -> str:
        text_lower = raw_text.lower()
        if any(kw in text_lower for kw in ["connector", "contact", "pin", "plug", "socket", "voltage"]):
            return "electrical_connector"
        elif any(kw in text_lower for kw in ["bolt", "nut", "screw", "fastener", "washer", "thread"]):
            return "safety_fastener"
        else:
            return "industrial_pump"
