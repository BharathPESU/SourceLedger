# SourceLedger

**AI-Powered Product Intelligence Engine**
*Every product fact, ledgered back to its source.*

UniHack 2026 · Team ERROR_404_NOT_FOUND

---

## What It Does

SourceLedger transforms scattered, incomplete product information — a spec sheet PDF, a product web page, a scanned catalog — into fully structured, validated, **source-cited** product records ready for any commerce system.

Every field in every product record carries:
- A **confidence score** (0–100)
- A **source citation** (the exact excerpt it came from)
- A **reasoning chain** (why this value was chosen)
- A **review status** (auto-committed, needs review, or human-corrected)

## Architecture

```
Input → Ingestion Agent → Extraction Agent → Enrichment Agent → Validation Agent → Explainability Layer → Structured Record
                                                                                                              ↓
                                                                                          Field Inspector UI + Review Queue
```

See [`docs/architecture.md`](docs/architecture.md) for the full system design.

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env with your API keys

# 2. Start infrastructure
docker compose up -d

# 3. Backend
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload

# 4. Frontend
cd frontend
npm install
npm run dev
```

## Tech Stack

| Layer | Choice |
|---|---|
| Agent Orchestration | LangGraph |
| LLM | Gemini (structured output mode) |
| Backend API | FastAPI (Python) |
| Database | PostgreSQL |
| Frontend | React + TypeScript + Tailwind CSS |

## Documentation

- [`docs/product-idea.md`](docs/product-idea.md) — Product concept and full feature set
- [`docs/architecture.md`](docs/architecture.md) — System design, data model, tech stack
- [`docs/prd.md`](docs/prd.md) — Phased implementation plan
- [`docs/master-agent-prompt.md`](docs/master-agent-prompt.md) — Build agent operating rules

## License

Hackathon project — see event terms.
