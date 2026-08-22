"""CSV Exporter — maps ProductRecord fields to the Unihack 252-column delivery format.

The delivery format has:
- Fixed columns (MFR URL, SHORT_DESC, LONG_DESC1, …)
- ITEM_FEATURES_1 … ITEM_FEATURES_20 (one feature per column)
- ATTRIBUTE_LABEL n / ATTRIBUTE_VALUE n / ATTRIBUTE_UOM n × 50 triplets
- Document links (Specification Sheet, Owners/User Manual, …)
- Dimensional and packaging fields (LENGTH, HEIGHT, WIDTH, WEIGHT, …)
- Product images, country of origin, discontinued flag

This module is the single source of truth for how our field names map to
the delivery column names. Any schema change should be reflected here.
"""

import csv
import io
import json
from typing import Any, Dict, List, Optional

from ..models.product_record import ProductField, ProductRecord
from ..utils.logging import get_logger

logger = get_logger("csv_exporter")

# ── The exact 252-column header row ──────────────────────────────────
DELIVERY_COLUMNS = [
    "MFR URL", "Ref URL 1", "Ref URL 2", "Ref URL 3", "Ref URL 4", "Ref URL 5",
    "PART_NUMBER", "Dept", "Class", "Fine",
    "SKU - MY_PART_NUMBER", "Mfg_Part_Num", "Part_Desc",
    "E1_Brand", "Unilog_Brand", "DIB_Brand", "Part_Manuf",
    "MANUFACTURER_NAME", "BRAND_NAME", "TRADE_NAME",
    "MANUFACTURER_PART_NUMBER", "ALTERNATE_PART_NUMBER",
    "Classpath",
    "MOBILE_DESC", "INVOICE_DESC", "SHORT_DESC", "LONG_DESC1",
    "RETAIL_DESC", "MARKETING_DESCRIPTION",
    *[f"ITEM_FEATURES_{i}" for i in range(1, 21)],
    "With", "Standard/Approvals", "Prop 65", "Application", "Includes",
    "Product Name",
    *[col for i in range(1, 51) for col in (
        f"ATTRIBUTE_LABEL {i}", f"ATTRIBUTE_VALUE {i}", f"ATTRIBUTE_UOM {i}"
    )],
    "UPC", "EAN", "GTIN", "UNSPSC",
    "Warranty", "List Price", "Selling Qty", "Selling UOM",
    "Standard Packaging Information",
    "LENGTH", "LENGTH_UOM", "HEIGHT", "HEIGHT_UOM",
    "WIDTH", "WIDTH_UOM", "WEIGHT", "WEIGHT_UOM",
    "VOLUME", "VOLUME_UOM",
    "Product Image",
    "Alternate Image 1", "Alternate Image 2", "Alternate Image 3", "Alternate Image 4",
    "SDS", "SDS_1", "Warranty Information", "Catalog",
    "Specification Sheet", "Instruction/Installation Manual",
    "Service Manual", "Owners/User Manual",
    "Line Drawing", "MTR", "RoHS", "Full Engineering Drawing",
    "Energy Star Guide", "Technical Bulletin", "Submittal",
    "Compatibility Chart", "Size Chart", "Product Label/Insert",
    "Video Link", "Video Link 1",
    "Country Of Origin", "Discontinued", "Actual Image (Yes/No)",
]

# ── Internal field name → delivery column name ────────────────────────
# Fields in this map are written directly into their fixed columns.
# All other extracted fields go into ATTRIBUTE_LABEL/VALUE/UOM slots.
FIXED_FIELD_MAP: Dict[str, str] = {
    # URLs
    "mfr_url":              "MFR URL",
    "specification_sheet":  "Specification Sheet",
    "product_image":        "Product Image",
    "owners_manual":        "Owners/User Manual",
    "sds":                  "SDS",
    "video_link":           "Video Link",

    # Identity
    "part_number":          "PART_NUMBER",
    "mfg_part_num":         "Mfg_Part_Num",
    "model_number":         "PART_NUMBER",          # fallback for PART_NUMBER
    "part_desc":            "Part_Desc",
    "product_name_field":   "Product Name",

    # Taxonomy
    "dept":                 "Dept",
    "category_class":       "Class",
    "fine_category":        "Fine",
    "classpath":            "Classpath",
    "category_path":        "Classpath",            # alias

    # Manufacturer / brand
    "manufacturer":         "MANUFACTURER_NAME",
    "brand":                "BRAND_NAME",
    "trade_name":           "TRADE_NAME",
    "alternate_part_number":"ALTERNATE_PART_NUMBER",

    # Descriptions
    "short_desc":           "SHORT_DESC",
    "long_desc1":           "LONG_DESC1",
    "long_desc2":           "RETAIL_DESC",
    "marketing_description":"MARKETING_DESCRIPTION",
    "mobile_desc":          "MOBILE_DESC",
    "invoice_desc":         "INVOICE_DESC",
    "retail_desc":          "RETAIL_DESC",

    # Certifications / compliance
    "certifications":       "Standard/Approvals",
    "standard_approvals":   "Standard/Approvals",
    "rohs":                 "RoHS",

    # Identifiers
    "upc":                  "UPC",
    "ean":                  "EAN",
    "gtin":                 "GTIN",
    "unspsc_code":          "UNSPSC",
    "unspsc":               "UNSPSC",

    # Dimensions / packaging
    "length":               "LENGTH",
    "height":               "HEIGHT",
    "width":                "WIDTH",
    "weight":               "WEIGHT",
    "warranty":             "Warranty",
    "list_price":           "List Price",

    # Origin / status
    "country_of_origin":        "Country Of Origin",
    "country_of_manufacture":   "Country Of Origin",
    "discontinued":             "Discontinued",
}

# Fields to SKIP — used internally but never exported as attributes
_SKIP_FIELDS = {
    "item_features", "item_keywords", "item_key_selling_points",
    "category_path",  # handled via Classpath
    "part_manuf",     # handled via MANUFACTURER_NAME
    "long_desc2",     # handled via RETAIL_DESC
}

# Fields already placed in fixed columns — excluded from ATTRIBUTE slots
_FIXED_ONLY = set(FIXED_FIELD_MAP.keys()) | _SKIP_FIELDS


def _get(fields: Dict[str, ProductField], *keys: str) -> str:
    """Return the string value of the first matching key, or empty string."""
    for k in keys:
        f = fields.get(k)
        if f and f.value is not None:
            v = f.value
            if isinstance(v, list):
                return "; ".join(str(x) for x in v)
            return str(v)
    return ""


def _get_list(fields: Dict[str, ProductField], key: str) -> List[str]:
    """Return a list value or empty list."""
    f = fields.get(key)
    if f and isinstance(f.value, list):
        return [str(x) for x in f.value]
    if f and f.value:
        # Might be a JSON-encoded list string
        try:
            parsed = json.loads(str(f.value))
            if isinstance(parsed, list):
                return [str(x) for x in parsed]
        except Exception:
            pass
        return [str(f.value)]
    return []


def product_record_to_row(product: ProductRecord) -> Dict[str, str]:
    """Map a ProductRecord to a flat dict with the 252 delivery column names.

    Strategy:
    1. Write all fixed-column fields directly.
    2. Expand ITEM_FEATURES list across ITEM_FEATURES_1…20 columns.
    3. Put remaining extracted fields (specs, attributes) into
       ATTRIBUTE_LABEL n / ATTRIBUTE_VALUE n / ATTRIBUTE_UOM n slots.
    """
    # Build a lookup: field.name → ProductField
    field_map: Dict[str, ProductField] = {}
    for f in product.fields:
        if f.name not in field_map:
            field_map[f.name] = f
        # Also index by display_name snake_case for fuzzy lookup
        dn_key = f.display_name.lower().replace(" ", "_").replace("/", "_")
        if dn_key not in field_map:
            field_map[dn_key] = f

    row: Dict[str, str] = {col: "" for col in DELIVERY_COLUMNS}

    # ── 1. Fixed columns ─────────────────────────────────────────────
    for internal_name, col_name in FIXED_FIELD_MAP.items():
        val = _get(field_map, internal_name)
        if val and not row[col_name]:  # don't overwrite if already set
            row[col_name] = val

    # PART_NUMBER fallback chain
    if not row["PART_NUMBER"]:
        row["PART_NUMBER"] = _get(field_map, "part_number", "mfg_part_num", "model_number", "sku")
    if not row["Mfg_Part_Num"]:
        row["Mfg_Part_Num"] = row["PART_NUMBER"]
    if not row["SKU - MY_PART_NUMBER"]:
        row["SKU - MY_PART_NUMBER"] = row["PART_NUMBER"]
    if not row["MANUFACTURER_PART_NUMBER"]:
        row["MANUFACTURER_PART_NUMBER"] = row["PART_NUMBER"]

    # Part_Desc fallback
    if not row["Part_Desc"]:
        row["Part_Desc"] = _get(field_map, "part_desc", "short_desc") or product.name

    # Product Name column
    row["Product Name"] = product.name

    # MANUFACTURER_NAME fallback
    if not row["MANUFACTURER_NAME"]:
        row["MANUFACTURER_NAME"] = _get(field_map, "manufacturer", "brand", "part_manuf")
    if not row["BRAND_NAME"]:
        row["BRAND_NAME"] = row["MANUFACTURER_NAME"]
    if not row["Part_Manuf"]:
        row["Part_Manuf"] = row["MANUFACTURER_NAME"]
    if not row["E1_Brand"]:
        row["E1_Brand"] = row["BRAND_NAME"]

    # Brand columns remain empty when no source-backed brand exists.

    # Taxonomy defaults
    if not row["Dept"]:
        row["Dept"] = _get(field_map, "dept") or "Industrial & Commercial"
    if not row["Class"]:
        row["Class"] = _get(field_map, "category_class") or "Equipment & Supplies"
    if not row["Fine"]:
        row["Fine"] = _get(field_map, "fine_category") or product.category.replace("_", " ").title()
    if not row["Classpath"]:
        row["Classpath"] = (
            _get(field_map, "classpath", "category_path")
            or f"{row['Dept']}>{row['Class']}>{row['Fine']}"
        )

    # UNSPSC
    if not row["UNSPSC"]:
        row["UNSPSC"] = _get(field_map, "unspsc_code", "unspsc")

    # Country of Origin
    if not row["Country Of Origin"]:
        row["Country Of Origin"] = _get(field_map, "country_of_origin", "country_of_manufacture")

    # Actual Image
    row["Actual Image (Yes/No)"] = "Yes" if row.get("Product Image") else "No"
    row["Discontinued"] = "No"

    # Standard/Approvals — certifications list → semicolon-joined
    if not row["Standard/Approvals"]:
        certs = _get_list(field_map, "certifications") or _get_list(field_map, "standard_approvals")
        row["Standard/Approvals"] = "; ".join(certs)

    # ── 2. ITEM_FEATURES expansion ───────────────────────────────────
    features = _get_list(field_map, "item_features")
    for i, feat in enumerate(features[:20], start=1):
        row[f"ITEM_FEATURES_{i}"] = feat

    # ── 3. ATTRIBUTE slots ───────────────────────────────────────────
    # Collect fields that aren't in fixed columns and aren't skipped
    attribute_fields: List[ProductField] = []
    seen_attr_names = set()

    for f in product.fields:
        if f.name in _FIXED_ONLY:
            continue
        if f.name in seen_attr_names:
            continue
        if f.value is None:
            continue
        # Skip list-type fields that belong in features/keywords
        if isinstance(f.value, list) and f.name in ("item_keywords", "item_key_selling_points"):
            continue
        seen_attr_names.add(f.name)
        attribute_fields.append(f)

    for slot, f in enumerate(attribute_fields[:50], start=1):
        val = f.value
        if isinstance(val, list):
            val = "; ".join(str(x) for x in val)
        else:
            val = str(val) if val is not None else ""

        row[f"ATTRIBUTE_LABEL {slot}"] = f.display_name
        row[f"ATTRIBUTE_VALUE {slot}"] = val
        row[f"ATTRIBUTE_UOM {slot}"] = f.unit or ""

    logger.info(
        "csv_exporter: mapped '%s' → %d attributes, %d features, %d fixed columns",
        product.name,
        len(attribute_fields),
        len(features),
        sum(1 for v in row.values() if v),
    )
    return row


def products_to_csv_bytes(products: List[ProductRecord]) -> bytes:
    """Serialize a list of ProductRecords to UTF-8 BOM CSV bytes (Excel-compatible).

    Returns the complete CSV file contents as bytes, ready to send as a
    file download response.
    """
    buf = io.StringIO()
    writer = csv.DictWriter(
        buf,
        fieldnames=DELIVERY_COLUMNS,
        extrasaction="ignore",
        lineterminator="\r\n",
        quoting=csv.QUOTE_MINIMAL,
    )
    writer.writeheader()
    for product in products:
        try:
            row = product_record_to_row(product)
            writer.writerow(row)
        except Exception as e:
            logger.error("csv_exporter: failed to export product '%s': %s", product.name, e)

    # UTF-8 BOM for Excel compatibility (matches the sample file)
    return "\ufeff".encode("utf-8") + buf.getvalue().encode("utf-8")


def single_product_to_csv_bytes(product: ProductRecord) -> bytes:
    """Export a single ProductRecord to CSV bytes."""
    return products_to_csv_bytes([product])
