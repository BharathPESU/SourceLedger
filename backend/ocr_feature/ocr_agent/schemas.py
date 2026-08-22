from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class DocumentType(str, Enum):
    GENERAL = "general"
    RECEIPT_INVOICE = "receipt_invoice"
    ID_CARD = "id_card"
    TABLE = "table"
    FORM = "form"

class IssueSeverity(str, Enum):
    ERROR = "ERROR"
    WARNING = "WARNING"
    INFO = "INFO"

class ValidationIssue(BaseModel):
    severity: IssueSeverity
    field: str
    message: str
    expected_value: Optional[Any] = None
    actual_value: Optional[Any] = None

class ValidationReport(BaseModel):
    is_valid: bool = Field(description="True if output passes critical validation checks")
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0, description="Overall confidence (0.0 to 1.0)")
    math_checks_passed: bool = Field(default=True, description="True if mathematical totals match line items")
    completeness_score: float = Field(default=1.0, ge=0.0, le=1.0, description="Score based on required fields present")
    issues: List[ValidationIssue] = Field(default_factory=list, description="List of validation errors or warnings")
    refinement_recommended: bool = Field(default=False, description="True if agent should execute refinement tool")

class LineItem(BaseModel):
    description: str = Field(description="Item name or service description")
    quantity: Optional[float] = Field(default=1.0, description="Quantity purchased")
    unit_price: Optional[float] = Field(default=None, description="Price per unit")
    total_price: Optional[float] = Field(default=None, description="Total line price")

class ReceiptInvoiceExtraction(BaseModel):
    merchant_name: Optional[str] = Field(default=None, description="Name of store or company")
    merchant_address: Optional[str] = Field(default=None, description="Merchant physical address")
    merchant_phone: Optional[str] = Field(default=None, description="Merchant contact number")
    invoice_number: Optional[str] = Field(default=None, description="Invoice or receipt reference number")
    date: Optional[str] = Field(default=None, description="Transaction or invoice date (YYYY-MM-DD format if possible)")
    due_date: Optional[str] = Field(default=None, description="Payment due date if applicable")
    currency: Optional[str] = Field(default="$", description="Currency symbol or code (USD, EUR, INR, etc.)")
    line_items: List[LineItem] = Field(default_factory=list, description="List of items or services purchased")
    subtotal: Optional[float] = Field(default=None, description="Sum of line items before tax/discounts")
    tax: Optional[float] = Field(default=None, description="Tax amount")
    discount: Optional[float] = Field(default=0.0, description="Discount amount applied")
    total_amount: Optional[float] = Field(default=None, description="Final total amount charged or due")
    payment_method: Optional[str] = Field(default=None, description="Cash, Credit Card, Bank Transfer, etc.")

class IDCardExtraction(BaseModel):
    document_title: Optional[str] = Field(default=None, description="Passport, Driver License, National ID, etc.")
    full_name: Optional[str] = Field(default=None, description="Full name of card holder")
    id_number: Optional[str] = Field(default=None, description="ID or Passport number")
    date_of_birth: Optional[str] = Field(default=None, description="Date of birth (YYYY-MM-DD)")
    expiry_date: Optional[str] = Field(default=None, description="Expiration date (YYYY-MM-DD)")
    issue_date: Optional[str] = Field(default=None, description="Issue date (YYYY-MM-DD)")
    gender: Optional[str] = Field(default=None, description="Gender/Sex")
    nationality: Optional[str] = Field(default=None, description="Country of citizenship or residence")
    address: Optional[str] = Field(default=None, description="Residential address")
    additional_fields: Dict[str, Any] = Field(default_factory=dict, description="Any other key fields detected on ID")

class TableExtraction(BaseModel):
    table_title: Optional[str] = Field(default=None, description="Title or caption of the table")
    columns: List[str] = Field(default_factory=list, description="Column header names")
    rows: List[Dict[str, Any]] = Field(default_factory=list, description="List of row dictionaries key-value per column")
    row_count: int = Field(default=0)
    summary: Optional[str] = Field(default=None, description="Brief summary of table contents")

class GeneralDocumentExtraction(BaseModel):
    document_title: Optional[str] = Field(default=None, description="Detected title of document")
    document_type: str = Field(default="general", description="Detected category")
    language: Optional[str] = Field(default="English", description="Primary document language")
    summary: Optional[str] = Field(default=None, description="High level summary of the document")
    raw_text: Optional[str] = Field(default=None, description="Full OCR raw text extracted")
    key_value_pairs: Dict[str, Any] = Field(default_factory=dict, description="Extracted key-value fields")
    tables: List[TableExtraction] = Field(default_factory=list, description="Any embedded tables detected")

class AgentStep(BaseModel):
    step_number: int
    tool_name: str
    action_summary: str
    status: str
    output_summary: Optional[str] = None

class ExtractionResult(BaseModel):
    document_type: DocumentType
    structured_data: Dict[str, Any]
    validation_report: ValidationReport
    raw_text: Optional[str] = None
    agent_trajectory: List[AgentStep] = Field(default_factory=list)
