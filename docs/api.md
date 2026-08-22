# SourceLedger — API Specification

**Base URL**: `http://localhost:8000/api`  
**Content-Type**: `application/json`  

---

## Endpoints Summary

| Endpoint | Method | Description |
|---|---|---|
| `/api/ingest` | `POST` | Process a raw PDF, web URL, or CSV file through the multi-agent pipeline |
| `/api/products` | `GET` | List all catalog products with optional status/category filters |
| `/api/products/{id}` | `GET` | Retrieve detailed product record including fields and audit timeline |
| `/api/fields/approve` | `POST` | Approve single field or all fields for a product record |
| `/api/fields/edit` | `POST` | Override an attribute value, logging a `ReviewAction` entry |
| `/api/review` | `GET` | Retrieve all attributes across catalog currently flagged `needs_review` |
| `/api/dashboard/stats` | `GET` | Fetch overall catalog metrics, category confidence breakdown, and recent runs |
| `/api/export/csv` | `GET` | Export catalog data as a delivery CSV file matching UniHack specifications |

---

## Endpoint Details

### 1. Ingest Source / Document
`POST /api/ingest`

**Request Body** (JSON or Multipart Form):
```json
{
  "source_type": "pdf",
  "category": "industrial_pump",
  "url": "https://example.com/datasheet.pdf",
  "raw_text": "Optional raw text payload..."
}
```

**Response** (200 OK):
```json
{
  "product": {
    "id": "prod-101",
    "title": "Grundfos CR 15-3 Centrifugal Pump",
    "category": "industrial_pump",
    "status": "auto_committed",
    "confidence": 94,
    "confidence_level": "high",
    "fields_reviewed_count": 15,
    "fields_count": 15,
    "source_document": "Grundfos_CR15_Datasheet.pdf",
    "fields": [
      {
        "id": "f-1",
        "name": "flow_rate",
        "label": "Flow Rate",
        "value": "15.0",
        "unit": "m³/h",
        "confidence": 98,
        "confidence_level": "high",
        "source_excerpt": "Rated flow rate: 15.0 m³/h at 2900 RPM",
        "reasoning": "Direct match from performance table section 3.2",
        "is_approved": true,
        "is_corrected": false
      }
    ]
  },
  "source": {
    "id": "src-202",
    "name": "Grundfos_CR15_Datasheet.pdf",
    "type": "pdf",
    "trust_tier": "Tier 1 OEM"
  }
}
```

---

### 2. Override Field Attribute
`POST /api/fields/edit`

**Request Body**:
```json
{
  "product_id": "prod-101",
  "field_id": "f-1",
  "new_value": "16.5"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "product_id": "prod-101",
  "field_id": "f-1",
  "updated_value": "16.5",
  "audit_entry": {
    "id": "audit-9921",
    "timestamp": "Just now",
    "field_id": "f-1",
    "field_name": "Flow Rate",
    "previous_value": "15.0",
    "new_value": "16.5",
    "changed_by": "Lead Catalog Engineer",
    "change_type": "manual_override",
    "confidence_before": 98,
    "confidence_after": 99,
    "reason": "Manual override of attribute value to \"16.5\""
  }
}
```

---

### 3. Export Delivery CSV
`GET /api/export/csv`

**Response**: Attachment download `SourceLedger_Delivery_Catalog.csv` matching `Unihack_ Output - Delivery Format.csv` headers.
