"""
Gemini API Gateway Powered Multimodal OCR Agent Package.
"""

from .gateway_client import GeminiGatewayClient
from .agent import OCRAgentSystem
from .schemas import (
    DocumentType,
    GeneralDocumentExtraction,
    ReceiptInvoiceExtraction,
    IDCardExtraction,
    TableExtraction,
    ExtractionResult,
)

__all__ = [
    "GeminiGatewayClient",
    "OCRAgentSystem",
    "DocumentType",
    "GeneralDocumentExtraction",
    "ReceiptInvoiceExtraction",
    "IDCardExtraction",
    "TableExtraction",
    "ExtractionResult",
]
