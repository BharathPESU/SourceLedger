"""Unihack E-Commerce Delivery Schema & Export Formatter.

Defines the exact 252 columns required by Unihack_ Expected Output - Delivery Format.csv
and maps SourceLedger ProductRecord objects into compliance rows.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

UNIHACK_DELIVERY_COLUMNS: List[str] = [
    'MFR URL', 'Ref URL 1', 'Ref URL 2', 'Ref URL 3', 'Ref URL 4', 'Ref URL 5',
    'PART_NUMBER', 'Dept', 'Class', 'Fine', 'SKU - MY_PART_NUMBER', 'Mfg_Part_Num',
    'Part_Desc', 'E1_Brand', 'Unilog_Brand', 'DIB_Brand', 'Part_Manuf',
    'MANUFACTURER_NAME', 'BRAND_NAME', 'TRADE_NAME', 'MANUFACTURER_PART_NUMBER',
    'ALTERNATE_PART_NUMBER', 'Classpath', 'MOBILE_DESC', 'INVOICE_DESC',
    'SHORT_DESC', 'LONG_DESC1', 'RETAIL_DESC', 'MARKETING_DESCRIPTION',
] + [f'ITEM_FEATURES_{i}' for i in range(1, 21)] + [
    'With', 'Standard/Approvals', 'Prop 65', 'Application', 'Includes', 'Product Name',
]

# Add ATTRIBUTE_LABEL 1..50, ATTRIBUTE_VALUE 1..50, ATTRIBUTE_UOM 1..50
for i in range(1, 51):
    UNIHACK_DELIVERY_COLUMNS.extend([
        f'ATTRIBUTE_LABEL {i}',
        f'ATTRIBUTE_VALUE {i}',
        f'ATTRIBUTE_UOM {i}',
    ])

UNIHACK_DELIVERY_COLUMNS.extend([
    'UPC', 'EAN', 'GTIN', 'UNSPSC', 'Warranty', 'List Price', 'Selling Qty', 'Selling UOM',
    'Standard Packaging Information', 'LENGTH', 'LENGTH_UOM', 'HEIGHT', 'HEIGHT_UOM',
    'WIDTH', 'WIDTH_UOM', 'WEIGHT', 'WEIGHT_UOM', 'VOLUME', 'VOLUME_UOM',
    'Product Image', 'Alternate Image 1', 'Alternate Image 2', 'Alternate Image 3', 'Alternate Image 4',
    'SDS', 'SDS_1', 'Warranty Information', 'Catalog', 'Specification Sheet',
    'Instruction/Installation Manual', 'Service Manual', 'Owners/User Manual',
    'Line Drawing', 'MTR', 'RoHS', 'Full Engineering Drawing', 'Energy Star Guide',
    'Technical Bulletin', 'Submittal', 'Compatibility Chart', 'Size Chart',
    'Product Label/Insert', 'Video Link', 'Video Link 1', 'Country Of Origin',
    'Discontinued', 'Actual Image (Yes/No)'
])


class AttributeTriplet(BaseModel):
    label: str
    value: str
    uom: str = ""


class UnihackExtractionPayload(BaseModel):
    """Structured extraction payload produced by Agents using google.genai."""
    product_name: str = Field(description="Primary Product Name")
    manufacturer_name: str = Field(default="", description="Manufacturer Name")
    brand_name: str = Field(default="", description="Brand Name")
    mfg_part_num: str = Field(default="", description="Manufacturer Part Number")
    part_number: str = Field(default="", description="Internal or Catalog Part Number")
    dept: str = Field(default="Industrial & Commercial", description="Department category")
    category_class: str = Field(default="Equipment & Supplies", description="Product class")
    fine_category: str = Field(default="General", description="Fine product category")
    classpath: str = Field(default="", description="Full taxonomy path e.g. Dept > Class > Fine")
    
    short_desc: str = Field(default="", description="Short e-commerce summary description")
    long_desc1: str = Field(default="", description="Detailed e-commerce product description")
    marketing_description: str = Field(default="", description="Marketing / promotional overview")
    mobile_desc: str = Field(default="", description="Concise mobile app product description")
    invoice_desc: str = Field(default="", description="Short billing/invoice line description")
    
    item_features: List[str] = Field(default_factory=list, description="List of up to 20 key features/bullet points")
    attributes: List[AttributeTriplet] = Field(default_factory=list, description="Technical attribute label, value, uom triplets up to 50")
    
    standards_approvals: str = Field(default="", description="Standards / Certifications e.g. CE, UL, NSF, Energy Star")
    application: str = Field(default="", description="Intended application or environment")
    includes: str = Field(default="", description="Included accessories or package contents")
    with_feature: str = Field(default="", description="Notable 'With' feature e.g. With CleanBoost")
    
    mfr_url: str = Field(default="", description="Official Manufacturer Product URL")
    ref_urls: List[str] = Field(default_factory=list, description="Reference URLs")
    product_image: str = Field(default="", description="Primary Product Image URL or filename")
    specification_sheet: str = Field(default="", description="PDF Specification Sheet link/filename")
    owners_manual: str = Field(default="", description="Owners / User Manual PDF link/filename")
    installation_manual: str = Field(default="", description="Installation Manual PDF link/filename")
    country_of_origin: str = Field(default="", description="Country of origin")


def map_product_fields_to_unihack_row(fields: List[Any], title: str = "", sku: str = "") -> Dict[str, str]:
    """Converts SourceLedger fields into a complete 252-column Unihack CSV dict row."""
    # Initialize all columns with empty string
    row: Dict[str, str] = {col: "" for col in UNIHACK_DELIVERY_COLUMNS}
    
    # Helper to retrieve field value by name
    field_map = {f.name: f.value for f in fields if f.value is not None}
    
    # Set default catalog brand labels matching hackathon format
    row['E1_Brand'] = field_map.get('e1_brand', '-- Unbranded --')
    row['Unilog_Brand'] = field_map.get('unilog_brand', '-- No Unilog Brand --')
    row['DIB_Brand'] = field_map.get('dib_brand', '-- No DIB Brand --')
    row['Part_Manuf'] = field_map.get('part_manuf', 'SourceLedger Catalog')
    row['Actual Image (Yes/No)'] = field_map.get('actual_image', 'Yes')
    row['Discontinued'] = field_map.get('discontinued', 'No')

    # Core Identifiers
    prod_name = field_map.get('product_name') or field_map.get('part_desc') or title
    mfr = field_map.get('manufacturer') or field_map.get('manufacturer_name') or field_map.get('brand') or ""
    mfg_part = str(field_map.get('mfg_part_num') or field_map.get('part_number') or field_map.get('model_number') or sku)
    
    row['Product Name'] = str(prod_name)
    row['Part_Desc'] = str(prod_name)
    row['MANUFACTURER_NAME'] = str(mfr)
    row['BRAND_NAME'] = str(field_map.get('brand_name') or mfr)
    row['Mfg_Part_Num'] = mfg_part
    row['MANUFACTURER_PART_NUMBER'] = mfg_part
    row['PART_NUMBER'] = mfg_part
    row['SKU - MY_PART_NUMBER'] = sku or mfg_part
    
    # Taxonomy
    row['Dept'] = str(field_map.get('dept', 'Industrial & Commercial'))
    row['Class'] = str(field_map.get('category_class', 'Equipment & Supplies'))
    row['Fine'] = str(field_map.get('fine_category', 'General'))
    row['Classpath'] = str(field_map.get('classpath', f"{row['Dept']}>{row['Class']}>{row['Fine']}"))
    
    # Descriptions
    row['SHORT_DESC'] = str(field_map.get('short_desc') or prod_name)
    row['LONG_DESC1'] = str(field_map.get('long_desc1') or field_map.get('marketing_description') or prod_name)
    row['MARKETING_DESCRIPTION'] = str(field_map.get('marketing_description') or row['LONG_DESC1'])
    row['MOBILE_DESC'] = str(field_map.get('mobile_desc') or row['SHORT_DESC'])
    row['INVOICE_DESC'] = str(field_map.get('invoice_desc') or row['SHORT_DESC'][:50])
    row['RETAIL_DESC'] = str(field_map.get('retail_desc') or row['SHORT_DESC'])
    
    # Features (up to 20)
    features = field_map.get('item_features')
    if isinstance(features, list):
        for idx, feat in enumerate(features[:20], start=1):
            row[f'ITEM_FEATURES_{idx}'] = str(feat)

    # Technical Attributes (up to 50 triplets)
    # Collect custom fields not explicitly in header mappings
    attr_idx = 1
    for f in fields:
        if f.name in [
            'product_name', 'manufacturer', 'manufacturer_name', 'mfg_part_num', 'part_number',
            'model_number', 'short_desc', 'long_desc1', 'marketing_description', 'item_features',
            'dept', 'category_class', 'fine_category', 'classpath', 'certifications', 'standards_approvals',
            'mfr_url', 'ref_urls', 'product_image', 'specification_sheet', 'owners_manual'
        ]:
            continue
        if attr_idx > 50:
            break
        label = f.display_name or f.name.replace('_', ' ').title()
        val = str(f.value) if f.value is not None else ""
        uom = str(f.unit) if f.unit else ""
        if val:
            row[f'ATTRIBUTE_LABEL {attr_idx}'] = label
            row[f'ATTRIBUTE_VALUE {attr_idx}'] = val
            row[f'ATTRIBUTE_UOM {attr_idx}'] = uom
            attr_idx += 1

    # Approvals & Specs
    row['Standard/Approvals'] = str(field_map.get('standards_approvals') or field_map.get('certifications') or '')
    row['Application'] = str(field_map.get('application') or '')
    row['Includes'] = str(field_map.get('includes') or '')
    row['With'] = str(field_map.get('with_feature') or '')
    
    # Media & Docs
    row['MFR URL'] = str(field_map.get('mfr_url') or '')
    row['Product Image'] = str(field_map.get('product_image') or '')
    row['Specification Sheet'] = str(field_map.get('specification_sheet') or '')
    row['Owners/User Manual'] = str(field_map.get('owners_manual') or '')
    row['Instruction/Installation Manual'] = str(field_map.get('installation_manual') or '')
    row['Country Of Origin'] = str(field_map.get('country_of_origin') or 'USA')
    
    return row
