"""Export routes for SourceLedger catalog data.

Generates downloadable CSV files matching Unihack_ Expected Output - Delivery Format.csv.
"""

import csv
import io
from uuid import UUID
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..models.unihack_schema import UNIHACK_DELIVERY_COLUMNS, map_product_fields_to_unihack_row
from ..db.store import store
from ..utils.logging import get_logger

logger = get_logger("routes_export")

router = APIRouter(prefix="/api", tags=["export"])


@router.get("/export/csv")
async def export_all_products_csv():
    """Export all ledgered products into the exact 252-column Unihack Delivery CSV format."""
    products = await store.list_products()
    if not products:
        # Create empty CSV with Unihack headers
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=UNIHACK_DELIVERY_COLUMNS)
        writer.writeheader()
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=Unihack_Delivery_Format.csv"}
        )

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=UNIHACK_DELIVERY_COLUMNS)
    writer.writeheader()

    # Failure indicators — products with these in their name are extraction
    # failures and must NOT appear in the export CSV.
    _FAILURE_INDICATORS = [
        "not found", "no product found", "no match found", "no data found",
        "unknown product", "extracted product", "ingested product", "csv product",
    ]
    exported_count = 0
    skipped_count = 0

    for prod in products:
        # Guard: skip products whose name indicates extraction failure
        name_lower = prod.name.lower().strip()
        if any(ind in name_lower for ind in _FAILURE_INDICATORS) or not name_lower:
            logger.warning(
                "Export: SKIPPING product '%s' (id=%s) — extraction failure indicator detected",
                prod.name[:60], str(prod.id)[:8],
            )
            skipped_count += 1
            continue

        sku_val = getattr(prod, 'sku', str(prod.id)[:8])
        row = map_product_fields_to_unihack_row(prod.fields, title=prod.name, sku=sku_val)
        writer.writerow(row)
        exported_count += 1

    output.seek(0)
    logger.info(
        "Generated Unihack Delivery CSV export: %d products exported, %d skipped (extraction failures)",
        exported_count, skipped_count,
    )

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Unihack_Delivery_Format_{exported_count}_items.csv"}
    )


@router.get("/products/{product_id}/export-csv")
async def export_single_product_csv(product_id: UUID):
    """Export a single product record in Unihack Delivery CSV format."""
    product = store.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=UNIHACK_DELIVERY_COLUMNS)
    writer.writeheader()

    sku_val = getattr(product, 'sku', str(product.id)[:8])
    row = map_product_fields_to_unihack_row(product.fields, title=product.name, sku=sku_val)
    writer.writerow(row)

    output.seek(0)
    safe_name = "".join(c if c.isalnum() else "_" for c in product.name[:30])
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Unihack_Delivery_{safe_name}.csv"}
    )
