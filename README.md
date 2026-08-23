```text
   ███████╗ ██████╗ ██╗   ██╗██████╗  ██████╗███████╗██╗     ███████╗██████╗  ██████╗ ███████╗██████╗ 
   ██╔════╝██╔═══██╗██║   ██║██╔══██╗██╔════╝██╔════╝██║     ██╔════╝██╔══██╗██╔════╝ ██╔════╝██╔══██╗
   ███████╗██║   ██║██║   ██║██████╔╝██║     █████╗  ██║     █████╗  ██║  ██║██║  ███╗█████╗  ██████╔╝
   ╚════██║██║   ██║██║   ██║██╔══██╗██║     ██╔══╝  ██║     ██╔══╝  ██║  ██║██║   ██║██╔══╝  ██╔══██╗
   ███████║╚██████╔╝╚██████╔╝██║  ██║╚██████╗███████╗███████╗███████╗██████╔╝╚██████╔╝███████╗██║  ██║
   ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚══════╝╚══════╝╚══════╝╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝
```

**SourceLedger** is an AI-powered Product Intelligence Engine designed to convert unstructured, messy industrial product datasheets, catalog PDFs, web pages, and CSV listings into normalized, commerce-ready product records with complete explainability, confidence scoring, and field-level source provenance.

---

## Table of Contents

1. [What is SourceLedger?](#1-what-is-sourceledger)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Key Features](#4-key-features)
5. [How SourceLedger Works](#5-how-sourceledger-works)
6. [Multi-Agent Architecture](#6-multi-agent-architecture)
7. [System Architecture](#7-system-architecture)
8. [Project Structure](#8-project-structure)
9. [Technology Stack](#9-technology-stack)
10. [API Reference](#10-api-reference)
11. [Database](#11-database)
12. [Authentication & Security](#12-authentication--security)
13. [Prerequisites](#13-prerequisites)
14. [Quick Start](#14-quick-start)
15. [Manual Installation](#15-manual-installation)
16. [Environment Variables](#16-environment-variables)
17. [Running the Application](#17-running-the-application)
18. [Testing](#18-testing)
19. [Configuration](#19-configuration)
20. [Troubleshooting](#20-troubleshooting)
21. [Evaluation / Quality Metrics](#21-evaluation--quality-metrics)
22. [Limitations](#22-limitations)
23. [Future Roadmap](#23-future-roadmap)
24. [License](#24-license)
25. [Contributors](#25-contributors)

---

## 1. What is SourceLedger?

**SourceLedger** is an enterprise-grade AI Product Intelligence and Catalog Harmonization System. Built for industrial e-commerce, distributor onboarding, and catalog data engineering, SourceLedger ingests multi-format documents (PDF specification sheets, scanned catalog images, vendor web pages, raw text, and bulk CSV files) and transforms them into standardized, commerce-ready product records.

Unlike black-box AI tools that output unverified attributes, SourceLedger operates under a strict **Golden Rule**: *No product attribute exists in the catalog without a verifiable source citation, a 0–100% confidence score, and an explicit AI reasoning chain.* Low-confidence fields (≤ 70%) or cross-source conflicts are automatically routed to a human Review Queue, ensuring complete data governance.

---

## 2. Problem Statement

Industrial distributors and e-commerce platforms process millions of complex technical listings from thousands of manufacturers. Today, this workflow suffers from critical friction:

- **Unstructured & Disparate Sources**: Product specifications are trapped in multi-page PDF datasheets, unstructured vendor web pages, scanned image catalogs, and noisy CSV exports.
- **Inconsistent Taxonomy & Units**: Measurements (e.g., flow rate, voltage, thread size) are recorded in mixed units (GPM vs. m³/h, HP vs. kW) or fractional formats (3/8 in vs. 0.375 in).
- **Lack of Provenance & Trust**: Standard LLM extractions suffer from hallucinations, silently fabricating part numbers or attributes without audit trails.
- **Manual Review Bottlenecks**: Catalog managers spend hundreds of hours manually cross-checking spec sheets, leading to high onboarding costs and delayed time-to-market.

---

## 3. Solution Overview

SourceLedger resolves catalog chaos through a multi-agent orchestration pipeline that pairs multimodal vision LLMs with deterministic validation rules:

```text
  Input Documents (PDF / Web / Image / CSV / Text)
                         │
                         ▼
        ┌──────────────────────────────────┐
        │        Ingestion Agent           │  ──► SHA-256 Hashing & Storage
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │  Ledger Multimodal OCR Agent     │  ──► PyMuPDF / pypdfium2 Vision Rendering
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │        Extraction Agent          │  ──► Category Schema Locking (Pydantic)
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │        Enrichment Agent          │  ──► Secondary Gap-Fill & Taxonomy Mapping
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │        Validation Agent          │  ──► Conflict Resolution & Confidence Scoring
        └────────────────┬─────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
   Auto-Committed               Needs Review Queue
   (Confidence ≥ 70%)           (Human-in-the-Loop Audit Trail)
          │                             │
          └──────────────┬──────────────┘
                         │
                         ▼
           Standardized Delivery CSV Export
```

---

## 4. Key Features

- **Multi-Format Ingestion**: Ingests PDF specification sheets, web URLs/HTML, scanned document images, raw text, and bulk CSV files.
- **Ledger Multimodal OCR Agent**: Multi-page PDF page screenshot rendering using PyMuPDF (`fitz`) and `pypdfium2` fallback, capturing high-resolution vision extractions with page-level citations.
- **Domain-Specific Schema Locking**: Enforces category-specific Pydantic schemas across 6 industrial domains (`industrial_pump`, `electrical_connector`, `safety_fastener`, `power_tool`, `home_appliance`, `generic`).
- **Confidence Scoring & Trust-Tier Ranking**: Computes overall and field-level confidence scores (0–100%) incorporating source trust tiers (Tier 1 OEM Manufacturer, Tier 2 Authorized Distributor, Tier 3 Marketplace).
- **Field Inspector & Provenance**: Surfaces verbatim source excerpts, confidence badges, and LLM reasoning chains for every catalog field.
- **Human-in-the-Loop Review Queue**: Dedicated workflow for catalog managers to review, accept, edit, or reject flagged attributes with immutable `ReviewAction` audit logging.
- **Catalog Copilot & Multi-Agent Data Chat**: Real-time conversational interface with live read & execution access to the SQLite database. Dispatches multi-agent tools on demand to filter specifications, scan cross-source conflicts, identify product variant families, and run anti-hardcoding audits.
- **Supabase Authentication**: Production authentication suite featuring email/password sign-up, email verification access guard, sign-in, password reset workflows, and Google OAuth 2.0.
- **Standardized Delivery CSV Exporter**: Exports catalog records into delivery CSV format.
- **Per-User Data Isolation**: Strict ownership enforcement — every product, source, and review action is scoped to its authenticated user. Cross-user data leakage is architecturally impossible.

---

## 5. How SourceLedger Works

### File Ingestion & OCR
1. **Ingest Source**: Users upload files via the **Ingest New Source** modal or select **Ledger Multimodal OCR Agent**.
2. **Vision Preprocessor**: PDF documents are rendered into high-resolution PNG page screenshots.
3. **Multimodal Extraction**: Multimodal vision models analyze page screenshots concurrently, extracting attributes into structured JSON.

### Extraction, Enrichment & Validation
1. **Schema Locking**: Extracted JSON is validated against Pydantic category models. Malformed responses trigger automatic JSON repair loops.
2. **Secondary Gap Fill**: The Enrichment Agent cross-references secondary sources and catalog entries to populate missing attributes.
3. **Trust & Conflict Resolution**: The Validation Agent compares conflicting values across sources, favoring higher trust tiers (Tier 1 OEM over Tier 3 Marketplace).
4. **Status Assignment**: Records with overall confidence ≥ 70% are marked `auto_committed`; records with fields < 70% are routed to `needs_review`.

---

## 6. Multi-Agent Architecture

SourceLedger employs six specialized backend agents:

```text
                                  ┌─────────────────────────┐
                                  │      CopilotEngine      │  (Conversational Multi-Agent Router)
                                  └────────────┬────────────┘
                                               │
      ┌──────────────┬──────────────┬──────────┴──────┬──────────────┬──────────────┐
      │              │              │                  │              │              │
┌─────▼────────┐ ┌───▼──────────┐ ┌▼─────────────┐ ┌─▼───────────┐ ┌▼────────────┐ ┌▼────────────┐
│IngestionAgent│ │ExtractionAgent│ │EnrichmentAgent│ │Validation   │ │GraphAgent   │ │Explainability│
│PDF/Web/CSV   │ │(Schema Lock) │ │(Taxonomy)    │ │Agent (Trust)│ │(Variants)   │ │Layer (Audit) │
└──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

1. **`IngestionAgent`** — Parses raw PDFs, HTML, text, and CSV files; generates unique SHA-256 content hashes for idempotency.
2. **`ExtractionAgent`** — Executes category-locked LLM extractions against category schemas.
3. **`EnrichmentAgent`** — Fills missing attributes using secondary sources and maps UNSPSC/eCl@ss taxonomy codes.
4. **`ValidationAgent`** — Calculates weighted field and record confidence scores, resolves multi-source conflicts, and sets review statuses.
5. **`GraphAgent`** — Analyzes product relationships, part-number prefix/suffix variants, compatibility, and cross-references.
6. **`ExplainabilityLayer`** — Annotates extracted fields with verbatim source text excerpts and LLM reasoning chains.
7. **`CopilotEngine`** — Conversational catalog intelligence router. Synthesizes natural language answers by executing multi-agent tools over live SQLite records.
8. **`KeyRotator`** — Thread-safe round-robin rotator managing API keys to prevent HTTP 429 rate limit errors.

---

## 7. System Architecture

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                 │
│          React 18 + TypeScript + Vite + Tailwind CSS v4 + Motion          │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ REST APIs / JSON
┌─────────────────────────────────────▼─────────────────────────────────────┐
│                              FASTAPI BACKEND                              │
│         FastAPI Router + Async Handlers + Pydantic v2 Schema Engine        │
└──────────────────┬──────────────────┬──────────────────┬──────────────────┘
                   │                  │                  │
                   ▼                  ▼                  ▼
        ┌──────────────────┐┌──────────────────┐┌──────────────────┐
        │  Multi-Agent     ││ Persistent Store ││ Supabase Auth    │
        │  Orchestration   ││ SQLite DB        ││ Session & OAuth  │
        └──────────────────┘└──────────────────┘└──────────────────┘
```

---

## 8. Project Structure

```text
SourceLedger/
├── backend/
│   ├── ocr_feature/
│   │   ├── ocr_agent/
│   │   │   ├── agent.py               # Multimodal OCR Agent system
│   │   │   ├── gateway_client.py      # LLM Gateway client & fallback router
│   │   │   ├── prompts.py             # Vision OCR prompt templates
│   │   │   ├── schemas.py             # OCR Pydantic models
│   │   │   └── tools.py               # Preprocessing & fallback extractors
│   │   └── tests/                     # OCR pytest suite
│   ├── src/
│   │   ├── agents/                    # Multi-agent system implementations
│   │   │   ├── enrichment_agent.py
│   │   │   ├── explainability_layer.py
│   │   │   ├── extraction_agent.py
│   │   │   ├── graph_agent.py
│   │   │   ├── ingestion_agent.py
│   │   │   ├── key_rotator.py
│   │   │   └── validation_agent.py
│   │   ├── api/                       # FastAPI router endpoints
│   │   │   ├── routes_conflicts.py
│   │   │   ├── routes_copilot.py
│   │   │   ├── routes_dashboard.py
│   │   │   ├── routes_export.py
│   │   │   ├── routes_fields.py
│   │   │   ├── routes_graph.py
│   │   │   ├── routes_ingest.py
│   │   │   ├── routes_ocr.py
│   │   │   ├── routes_products.py
│   │   │   └── routes_review.py
│   │   ├── db/
│   │   │   ├── store.py               # SQLite persistent product store (per-user isolation)
│   │   │   └── supabase_client.py
│   │   ├── models/
│   │   │   ├── product_record.py
│   │   │   └── schemas.py             # Category schema registry
│   │   ├── services/
│   │   │   ├── catalog_qa_service.py
│   │   │   ├── copilot_service.py
│   │   │   ├── csv_processor.py
│   │   │   ├── dashboard_service.py
│   │   │   └── jsonld_exporter.py
│   │   ├── config.py                  # Environment settings (pydantic-settings, no hardcoded keys)
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example                   # Backend env template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                  # Supabase authentication screens
│   │   │   ├── CatalogCopilotView.tsx
│   │   │   ├── DashboardView.tsx
│   │   │   ├── FieldInspectorView.tsx
│   │   │   ├── IngestModal.tsx
│   │   │   ├── ProductsCatalogView.tsx
│   │   │   └── ReviewQueueView.tsx
│   │   ├── context/                   # AuthContext provider
│   │   ├── lib/                       # API client & Supabase SDK
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docs/                              # Architecture & PRD documentation
├── input/                             # Sample input datasets
├── output/                            # Generated output CSV files
├── sample_data/                       # Category-specific sample documents
├── supabase/                          # Supabase migrations & config
├── docker-compose.yml
├── run_batch_processing.py            # CLI bulk CSV batch processor
├── start.sh                           # One-command startup script
├── .env.example                       # Root environment template
├── CHANGELOG.md
└── README.md
```

---

## 9. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend UI** | React 18 + TypeScript | Component-based web application |
| **Build Tool** | Vite | Fast HMR dev server and production bundler |
| **Styling** | Tailwind CSS v4 + Motion | Glassmorphic design system and micro-animations |
| **Charts & Icons** | Recharts + Lucide React | Data visualization and UI icons |
| **Authentication** | Supabase Auth | Email/password & Google OAuth 2.0 |
| **Backend API** | FastAPI + Uvicorn | High-performance async REST API |
| **Schema Engine** | Pydantic v2 + Pydantic Settings | Schema locking and env config (no hardcoded keys) |
| **Document OCR** | PyMuPDF, pypdfium2, Pillow | PDF rendering and image pre-processing |
| **Database** | SQLite + Supabase | Local persistent store with optional cloud sync |
| **AI / LLM** | Google Gemini API / API Gateway | Multimodal vision & structured text extraction |
| **CSV Engine** | Pandas + Python `csv` | Delivery format CSV generation |
| **Testing** | Pytest + Pytest-Asyncio | Backend unit and integration tests |

---

## 10. API Reference

**Base URL**: `http://localhost:8000/api`  
**Swagger UI**: `http://localhost:8000/docs`  
**ReDoc**: `http://localhost:8000/redoc`

| Endpoint | Method | Description |
|---|---|---|
| `/api/copilot/chat` | `POST` | Natural language chat with multi-agent tool execution |
| `/api/copilot/suggestions` | `GET` | Contextual quick-start prompt suggestions |
| `/api/ingest` | `POST` | Ingest PDF, web URL, text, or CSV through multi-agent pipeline |
| `/api/extract` | `POST` | Multimodal Vision OCR extraction |
| `/api/products` | `GET` | List catalog products (scoped to authenticated user) |
| `/api/products/{id}` | `GET` | Retrieve detailed product record |
| `/api/fields/approve` | `POST` | Approve a field or all fields |
| `/api/fields/edit` | `POST` | Override an attribute and log a `ReviewAction` |
| `/api/review` | `GET` | Fields flagged `needs_review` |
| `/api/dashboard/stats` | `GET` | Catalog quality metrics |
| `/api/export/csv` | `GET` | Export delivery CSV |

All endpoints require `x-user-id` header for per-user data isolation.

---

## 11. Database

SourceLedger uses a dual-layer persistence strategy:

1. **SQLite Database (`backend/sourceledger.db`)**: Primary zero-config persistent store. Stores all ingested sources, product records, fields, and review actions. Survives server restarts.
2. **Supabase Postgres**: Optional cloud sync via `backend/src/db/supabase_client.py`.

### Tables
- `sources`: `id` (UUID), `content_hash` (TEXT), `user_id` (TEXT), `data` (JSON)
- `products`: `id` (UUID), `category`, `name`, `confidence`, `user_id` (TEXT), `data` (JSON)
- `review_actions`: `id` (UUID), `product_id` (UUID), `user_id` (TEXT), `data` (JSON)

All tables include a `user_id` column enforcing per-user data isolation at the storage layer.

---

## 12. Authentication & Security

- **Email & Password Authentication**: Full sign-up, sign-in, and email verification guard.
- **Google OAuth 2.0**: Integrated Google single sign-on.
- **Password Reset Flow**: Request recovery and set new passwords.
- **Per-User Data Isolation**: Every product, source, and review action is owned by its uploader. Cross-user access returns 404/403 — enforced at both the API and storage layers.
- **No Hardcoded Keys**: All LLM API keys are read strictly from `.env` via `pydantic-settings`. Zero credentials in source code.
- **SHA-256 Content Hashing**: Document idempotency without exposing raw content.

---

## 13. Prerequisites

- **Python**: 3.10+ (3.12 recommended)
- **Node.js**: 18.0+ (24.x supported)
- **npm**: 9.0+

---

## 14. Quick Start

```bash
chmod +x start.sh
./start.sh
```

The script automatically:
1. Verifies Python, Node, npm prerequisites.
2. Creates Python virtual environment and installs dependencies.
3. Installs frontend Node modules.
4. Creates default `.env` files from `.env.example`.
5. Launches FastAPI backend on `http://localhost:8000` and Vite frontend on `http://localhost:3000`.

---

## 15. Manual Installation

### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in your API keys in backend/.env
uvicorn src.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Fill in your Supabase credentials in frontend/.env
npm run dev -- --port 3000
```

---

## 16. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `GOOGLE_API_KEY1` .. `GOOGLE_API_KEY8` | Optional | Gemini API keys for round-robin key rotation |
| `API_URL` | Required | Gateway proxy URL for LLM requests |
| `API_KEY` | Required | Gateway proxy authentication key |
| `CONFIDENCE_THRESHOLD` | Optional (default `70`) | Auto-commit threshold |
| `SUPABASE_URL` | Optional | Supabase project URL |
| `SUPABASE_KEY` | Optional | Supabase API key |

### Frontend (`frontend/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Required | Supabase project URL for auth |
| `VITE_SUPABASE_ANON_KEY` | Required | Supabase public anon key |

---

## 17. Running the Application

- **Web App**: `http://localhost:3000`
- **API**: `http://localhost:8000/api`
- **Swagger Docs**: `http://localhost:8000/docs`
- **CLI Batch**: `python3 run_batch_processing.py`

---

## 18. Testing

```bash
# Backend unit & integration tests
python3 -m pytest backend/tests

# OCR agent tests
python3 -m pytest backend/ocr_feature/tests

# Frontend type check
cd frontend && npm run lint
```

---

## 19. Configuration

- **Confidence Threshold**: Set `CONFIDENCE_THRESHOLD=70` in `backend/.env`.
- **Supported Categories**: Add schemas in `backend/src/models/schemas.py`.
- **Key Rotation**: Add up to 8 Gemini keys as `GOOGLE_API_KEY1`..`GOOGLE_API_KEY8`.

---

## 20. Troubleshooting

| Issue | Fix |
|---|---|
| 500 OCR Agent Error | Install `pillow`, `pymupdf`, `pypdfium2`, `jinja2` in `backend/.venv` |
| CORS / Connection Refused | Confirm FastAPI is running on port 8000 |
| Supabase Auth Redirect Error | Add `http://localhost:3000` to Site URL in Supabase Dashboard → Auth → URL Configuration |
| 0% Confidence on All Fields | Check `CONFIDENCE_THRESHOLD` — categories without a registered schema fall back to `generic` |

---

## 21. Evaluation / Quality Metrics

- **Pipeline Velocity**: Single-item extraction under 3 seconds using parallel vision page concurrency.
- **Schema Compliance**: 100% Pydantic schema validation across all 6 industrial domain models.
- **Provenanced Output**: Every extracted attribute carries a verbatim quote, confidence score, and LLM reasoning chain.
- **Data Isolation**: Smoke-tested — cross-user product access returns `None` at the store layer.

---

## 22. Limitations

- **Vector Database**: Qdrant vector embedding is configured as a Phase 5 stretch target and disabled by default.
- **OCR Scan Quality**: Highly degraded or handwritten scans are processed best-effort and flagged for human review.

---

## 23. Future Roadmap

- [ ] **Vector Similarity Deduplication**: Qdrant embeddings for clustering duplicate listings across suppliers.
- [ ] **UNSPSC Automated Taxonomy Mapping**: Expand automated UNSPSC/eCl@ss lookups.
- [ ] **Active Learning Loop**: Feed `ReviewAction` human corrections back into prompt refinement.
- [ ] **Multi-Tenant Cloud Deploy**: Cloud Run deployment with tenant-scoped Supabase Row Level Security.

---

## 24. License

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

SourceLedger is open-source software licensed under the **[Apache License, Version 2.0](LICENSE)**.

```text
Copyright 2026 SourceLedger Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## 25. Contributors

- **Balaraj R** — Founder
- **Bharath CD** — Co-founder

---

*This README reflects the current implementation of SourceLedger and is maintained alongside codebase updates.*
