import io
import pytest
from PIL import Image, ImageDraw, ImageFont

from ocr_agent.schemas import DocumentType, IssueSeverity
from ocr_agent.tools import ImagePreprocessorTool, ValidationTool
from ocr_agent.agent import OCRAgentSystem

def create_synthetic_receipt_image() -> bytes:
    """
    Creates a simple synthetic receipt image in memory using PIL.
    """
    img = Image.new("RGB", (600, 800), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    lines = [
        "GROCERY SUPERSTORE",
        "123 Main Street, City",
        "Date: 2026-08-22",
        "Invoice #: INV-98765",
        "----------------------------------",
        "Apples (2.0 x $2.50)       $5.00",
        "Milk (1.0 x $3.50)         $3.50",
        "Bread (1.0 x $2.50)        $2.50",
        "----------------------------------",
        "Subtotal:                 $11.00",
        "Tax (8%):                  $0.88",
        "TOTAL:                    $11.88",
        "----------------------------------",
        "Payment: Credit Card",
        "THANK YOU FOR YOUR BUSINESS!"
    ]
    
    y = 40
    for line in lines:
        draw.text((40, y), line, fill=(0, 0, 0))
        y += 40
        
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_image_preprocessor_tool():
    img_bytes = create_synthetic_receipt_image()
    processed_bytes, mime_type, meta = ImagePreprocessorTool.preprocess_image(img_bytes)
    
    assert mime_type == "image/png"
    assert meta["width"] == 600
    assert meta["height"] == 800
    assert len(processed_bytes) > 0

def test_validation_tool_math_checks():
    # Valid Receipt Data
    valid_data = {
        "merchant_name": "GROCERY SUPERSTORE",
        "date": "2026-08-22",
        "invoice_number": "INV-98765",
        "line_items": [
            {"description": "Apples", "quantity": 2.0, "unit_price": 2.50, "total_price": 5.00},
            {"description": "Milk", "quantity": 1.0, "unit_price": 3.50, "total_price": 3.50},
            {"description": "Bread", "quantity": 1.0, "unit_price": 2.50, "total_price": 2.50}
        ],
        "subtotal": 11.00,
        "tax": 0.88,
        "total_amount": 11.88
    }
    
    report = ValidationTool.validate(valid_data, DocumentType.RECEIPT_INVOICE)
    assert report.is_valid is True
    assert report.math_checks_passed is True
    assert report.confidence_score >= 0.9

    # Invalid Receipt Data with Math Mismatch
    invalid_data = {
        "merchant_name": "GROCERY SUPERSTORE",
        "date": "2026-08-22",
        "line_items": [
            {"description": "Apples", "quantity": 2.0, "unit_price": 2.50, "total_price": 99.00} # Mismatch!
        ],
        "subtotal": 11.00,
        "tax": 0.88,
        "total_amount": 11.88
    }

    invalid_report = ValidationTool.validate(invalid_data, DocumentType.RECEIPT_INVOICE)
    assert invalid_report.math_checks_passed is False
    assert invalid_report.refinement_recommended is True
    assert len(invalid_report.issues) > 0

def test_full_ocr_agent_extraction():
    img_bytes = create_synthetic_receipt_image()
    agent = OCRAgentSystem()
    
    result = agent.extract_structured_text(
        image_input=img_bytes,
        document_type=DocumentType.RECEIPT_INVOICE,
        enable_refinement=True
    )
    
    assert result.document_type == DocumentType.RECEIPT_INVOICE
    assert isinstance(result.structured_data, dict)
    assert len(result.agent_trajectory) >= 3
    print(f"\nExtracted Merchant: {result.structured_data.get('merchant_name')}")
    print(f"Extracted Total: {result.structured_data.get('total_amount')}")
    print(f"Validation Confidence: {result.validation_report.confidence_score}")

def test_pdf_document_processing():
    import fitz
    doc = fitz.open()
    page1 = doc.new_page(width=595, height=842)
    page1.insert_text((50, 100), "INDUSTRIAL PUMP SPECIFICATION SHEET - PAGE 1\nModel: PUMP-2000X\nFlow Rate: 150 GPM")
    page2 = doc.new_page(width=595, height=842)
    page2.insert_text((50, 100), "INDUSTRIAL PUMP SPECIFICATION SHEET - PAGE 2\nVoltage: 480V\nPower: 25 HP")
    pdf_bytes = doc.tobytes()

    pages = ImagePreprocessorTool.process_document_to_page_images(pdf_bytes, filename="pump_spec.pdf")
    assert len(pages) == 2
    assert pages[0][1] == "image/png"
    assert pages[1][1] == "image/png"

    agent = OCRAgentSystem()
    result = agent.extract_structured_text(
        image_input=pdf_bytes,
        document_type=DocumentType.GENERAL,
        filename="pump_spec.pdf"
    )
    assert len(result.agent_trajectory) >= 3

