# SourceLedger — System Architecture & Engineering Principles

## 1. Design Philosophy

SourceLedger is built on five core architectural principles:

1. **Explainability over opacity**: No field exists in the catalog without a traceable, verbatim source citation, confidence score (0–100%), and reasoning chain.
2. **Modular Agent Boundaries**: Ingestion, Extraction, Enrichment, Validation, and Explainability operate as isolated pipeline stages with explicit Pydantic contracts.
3. **Fail Loud & Human-in-the-Loop**: Low-confidence attributes (< 80%) or cross-source conflicts are surfaced to a dedicated Review Queue rather than guessed silently.
4. **Resilient Multi-Key Rotator**: Concurrent requests cycle through an 8-key Gemini API pool (`GEMINI_API_KEY_1` to `GEMINI_API_KEY_8`) with thread-safe round-robin allocation.
5. **Domain-Specific Schema Locking**: Extracted attributes are constrained to domain category models (`industrial_pump`, `electrical_connector`, `safety_fastener`, `power_tool`, `home_appliance`, `generic`).

---

## 2. High-Level System Architecture

```
                       ┌─────────────────────────────────────────┐
                       │             Client Layer                │
                       │   React 18 + TypeScript + Vite +        │
                       │   Tailwind CSS v4 + Background Video    │
                       └────────────────────┬────────────────────┘
                                            │ REST / JSON
                       ┌────────────────────▼────────────────────┐
                       │              API Layer                  │
                       │           FastAPI (Python)              │
                       └────────────────────┬────────────────────┘
                                            │
                       ┌────────────────────▼────────────────────┐
                       │       Multi-Key Rotator Pool            │
                       │      Round-robin (8 Gemini Keys)        │
                       └────────────────────┬────────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        │                       Agent Pipeline Orchestration                    │
        │                                                                       │
  ┌─────▼──────────────┐ ┌───────────────────▼──┐ ┌─────────────────────▼──┐
  │  Ingestion Agent   │ │   Extraction Agent   │ │   Enrichment Agent      │
  │  PDF / Web / CSV   │ │   Schema-locked LLM  │ │   Cross-source gap fill │
  │  SHA-256 Hash      │ │   Pydantic Validation│ │   UNSPSC Taxonomy       │
  └─────┬──────────────┘ └───────────────────┬──┘ └─────────────────────┬──┘
        │                                    │                             │
        └───────────────────┬────────────────┴──────────────┬──────────────┘
                            │                               │
                 ┌──────────▼───────────┐       ┌───────────▼──────────┐
                 │   Validation Agent   │       │ Explainability Layer │
                 │  Trust-tier ranking, │       │ Source citation &    │
                 │  confidence scoring  │       │ reasoning annotation │
                 └──────────┬───────────┘       └───────────┬──────────┘
                            │                               │
                            └───────────────┬───────────────┘
                                            │
                       ┌────────────────────▼────────────────────┐
                       │            Data Layer                   │
                       │  PostgreSQL / Supabase / SQLite         │
                       │  Object Storage (raw PDF/HTML sources)  │
                       └─────────────────────────────────────────┘
```

---

## 3. Component Responsibilities

| Component | Class / File | Responsibility | Key Architectural Rule |
|---|---|---|---|
| **Ingestion Agent** | `IngestionAgent` (`backend/src/agents/ingestion_agent.py`) | Parse PDFs, web HTML, and raw text into normalized content with SHA-256 hash | Never discards raw source content; assigns trust tier (Tier 1 OEM, Tier 2 Distributor, Tier 3 Catalog) |
| **Extraction Agent** | `ExtractionAgent` (`backend/src/agents/extraction_agent.py`) | Execute schema-locked LLM extraction against category Pydantic models | Must return JSON matching category fields or trigger automatic JSON repair |
| **Enrichment Agent** | `EnrichmentAgent` (`backend/src/agents/enrichment_agent.py`) | Fill missing required fields from secondary sources and taxonomy lookups | Attaches explicit citation for every filled field |
| **Validation Agent** | `ValidationAgent` (`backend/src/agents/validation_agent.py`) | Calculate weighted confidence score and resolve conflicts | Assigns `auto_committed` ($\ge 80\%$) or `needs_review` ($< 80\%$) |
| **Explainability Layer** | `ExplainabilityLayer` (`backend/src/agents/explainability_layer.py`) | Attach verbatim quote citations and audit reasoning chains | Read-only pass; annotates fields without altering data |
| **Key Rotator** | `KeyRotator` (`backend/src/agents/main.py`) | Thread-safe round-robin pool cycling 8 Gemini API keys | Prevents HTTP 429 Rate Limit errors during batch runs |
| **CSV Exporter** | `CSVProcessor` (`backend/src/services/csv_processor.py`) | Transform catalog records into delivery CSV format | Produces standardized `Unihack_ Output - Delivery Format.csv` |

---

## 4. Category Schema Architecture (`backend/src/models/schemas.py`)

SourceLedger implements category-specific Pydantic schemas:

1. **`industrial_pump`**: `manufacturer`, `model_number`, `pump_type`, `flow_rate` (m³/h), `head_pressure` (m), `power_rating` (kW), `inlet_size`, `outlet_size`, `material_body`, `material_impeller`, `temperature_range`, `max_pressure`, `voltage`, `weight`, `certifications`.
2. **`electrical_connector`**: `manufacturer`, `part_number`, `connector_type`, `number_of_contacts`, `contact_pitch` (mm), `voltage_rating` (V), `current_rating` (A), `gender`, `mounting_type`, `ip_rating`, `material_housing`, `material_contacts`, `wire_gauge_range`, `certifications`.
3. **`safety_fastener`**: `manufacturer`, `part_number`, `fastener_type`, `thread_size`, `thread_pitch` (mm), `length` (mm), `material`, `grade_class`, `finish`, `tensile_strength` (MPa), `proof_load` (kN), `head_type`, `drive_type`, `locking_mechanism`, `certifications`.
4. **`power_tool`**: `manufacturer`, `model_number`, `tool_type`, `voltage` (V), `battery_system`, `is_bare_tool`, `drive_size`, `no_load_rpm`, `torque`, `weight`, `nail_gauge`, `nail_length_range`, `certifications`, `color`, `country_of_manufacture`, `upc`.
5. **`home_appliance`**: `manufacturer`, `model_number`, `appliance_type`, `color_finish`, `energy_star`, `capacity`, `number_of_cycles`, `decibel_level` (dBA), `installation_type`, `dimensions`, `certifications`.
6. **`generic`**: Universal fallback schema for unclassified industrial products.

---

## 5. Technology Stack Upgrades

| Layer | Selection | Upgrade Details |
|---|---|---|
| **Agent SDK** | Official `google.genai` SDK | Upgraded from legacy `google-generativeai` to `google.genai.Client` |
| **Backend API** | FastAPI + Uvicorn | Async route handlers, CORS middleware, OpenAPI docs |
| **Key Management** | `KeyRotator` | Multi-key pool managing `GEMINI_API_KEY_1` through `GEMINI_API_KEY_8` |
| **Frontend UI** | React 18 + TypeScript | Strict typing, full state management, 5s live polling sync |
| **Styling** | Tailwind CSS v4 + HSL Tokens | Custom design system (`#F5E9D8`, `#E8622C`, `#191715`) |
| **Background Visuals** | Hardware-Accelerated MP4 | Replaced canvas 2D animation with `<video>` loop (`/background.mp4`) |
| **Database** | SQLite / Supabase | Relational schema (`products`, `fields`, `sources`, `review_actions`) |
| **CSV Engine** | Python `csv` + Pydantic | Standardized delivery format exporter |

---

## 6. Security & Non-Functional Requirements

- **API Key Protection**: Server-side key rotation; no keys exposed in client bundles or git repositories.
- **Auditability**: Every field edit generates an immutable `ReviewAction` log entry.
- **Idempotency**: Source content hashing (SHA-256) prevents duplicate record creation.
- **Performance**: Single-item extraction completes in $< 10$ seconds; full batch export processes seamlessly via `run_batch_processing.py`.
