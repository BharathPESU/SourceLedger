# SourceLedger — Architecture & Engineering Principles

## 1. Design Philosophy

SourceLedger is built on four non-negotiable principles, chosen because they directly map to the hackathon's judging criteria (innovation, technical implementation, business relevance, impact):

1. **Explainability over opacity** — no field exists in the output without a traceable source. This is a hard architectural constraint, not a UI afterthought: the data model itself requires a citation and confidence value alongside every extracted field.
2. **Separation of concerns via agent boundaries** — each pipeline stage (ingest, extract, enrich, validate) is an independent, testable unit with a defined input/output contract. No stage reaches into another's internals.
3. **Fail loud, not silent** — low-confidence or conflicting data is never guessed past; it is surfaced to a human. The system is designed to know what it doesn't know.
4. **Design for scale from day one** — even in an MVP, data models and storage choices assume thousands of SKUs, not one. Dedup and taxonomy mapping are core, not bolted on later.

## 2. High-Level System Architecture

```
                        ┌─────────────────────────────┐
                        │        Client Layer          │
                        │  Dashboard (React) + Field   │
                        │  Inspector + Review Queue UI │
                        └───────────────┬──────────────┘
                                        │ REST/WebSocket
                        ┌───────────────▼──────────────┐
                        │          API Layer            │
                        │        FastAPI (Python)       │
                        └───────────────┬──────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                Agent Orchestration Layer            │
              │                   (LangGraph state machine)         │
              │                                                     │
   ┌──────────▼─────────┐ ┌────────────▼───────────┐ ┌─────────────▼───────────┐
   │  Ingestion Agent    │ │   Extraction Agent      │ │   Enrichment Agent       │
   │  PDF / web / OCR    │ │   Schema-locked LLM      │ │   Cross-source fill,     │
   │                     │ │   structured output      │ │   taxonomy lookup        │
   └──────────┬─────────┘ └────────────┬───────────┘ └─────────────┬───────────┘
              │                        │                            │
              └────────────┬───────────┴────────────┬───────────────┘
                            │                        │
                 ┌──────────▼───────────┐ ┌──────────▼───────────┐
                 │  Validation Agent     │ │  Explainability Layer │
                 │  Conflict resolution, │ │  Source citation +    │
                 │  confidence scoring   │ │  reasoning chain      │
                 └──────────┬───────────┘ └──────────┬───────────┘
                            │                        │
                            └────────────┬───────────┘
                                        │
                        ┌───────────────▼──────────────┐
                        │        Data Layer              │
                        │  PostgreSQL (structured        │
                        │  catalog) + Vector DB (dedup,   │
                        │  similarity) + Object storage    │
                        │  (source documents)             │
                        └────────────────────────────────┘
```

## 3. Component Responsibilities

| Component | Responsibility | Key architectural rule |
|---|---|---|
| Ingestion Agent | Normalize any input format into raw text + metadata | Never discards the original source — always stored for citation |
| Extraction Agent | Produce a schema-locked structured draft from raw text | Output must validate against a Pydantic/JSON-schema model or it is rejected, not passed forward |
| Enrichment Agent | Fill gaps using other sources / catalog similarity | Every added field must attach a source reference |
| Validation Agent | Resolve conflicts, assign confidence, flag for review | Nothing below the confidence threshold is auto-committed |
| Explainability Layer | Attach citation + reasoning to every field | Read-only pass — cannot alter data, only annotate it |
| Catalog Engine | Dedup, taxonomy mapping, storage | Idempotent — re-ingesting the same source must not create duplicates |
| Dashboard | Field Inspector, review queue, bulk quality view | Never shows a field without its confidence and source together |

## 4. Data Model (Core Entities)

- **ProductRecord**: id, category, schema_version, fields[], confidence_overall, taxonomy_code, dedup_cluster_id
- **Field**: name, value, confidence, source_ref, reasoning, status (`auto_committed` / `needs_review` / `human_corrected`)
- **Source**: id, type (pdf/web/image), raw_content_ref, trust_tier
- **ReviewAction**: field_id, original_value, corrected_value, reviewer, timestamp — this is what feeds the active learning loop

Keeping `Field` as its own entity (rather than flattening product records into plain key-value JSON) is what makes explainability and confidence-per-field possible — this is the most important modeling decision in the whole system.

## 5. Software Engineering Principles to Apply

- **Contract-first development**: define the Pydantic schemas and API contracts before writing agent logic, so every stage can be built and tested independently
- **Idempotency**: re-running ingestion on the same source must not duplicate catalog entries — enforced via content hashing
- **Graceful degradation**: if enrichment or an external lookup fails, the pipeline still returns whatever was extracted with lower confidence, rather than failing the whole record
- **Observability by default**: every agent step logs its input, output, and duration — necessary both for debugging and for the "day 1 vs day 30" active-learning demo narrative
- **Twelve-factor config**: no hardcoded API keys or environment assumptions; all config via environment variables
- **Testability**: each agent is a pure function over (input, context) → output wherever possible, so it can be unit tested without hitting a live LLM
- **Small, reviewable commits** mapped to pipeline stages, not to "day 1 dump" — matters for judges who review your repo history

## 6. Recommended Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Agent orchestration | LangGraph | Explicit state machine over agent steps — better fit than a linear chain for conflict-resolution branching and human-in-the-loop routing |
| LLM | Gemini or GPT-4-class model via API, with structured/JSON output mode | Structured output mode enforces schema compliance at the model level, reducing parsing failures |
| Vision/OCR | Gemini vision (or Tesseract as a lighter fallback) | Needed for scanned/photographed catalog pages |
| Backend API | FastAPI | Async-friendly, auto-generates OpenAPI docs, fast to build and demo |
| Structured storage | PostgreSQL | Relational integrity for product records and review history |
| Vector storage | Qdrant or Chroma | Embedding similarity for dedup and "similar SKU" enrichment lookups |
| Object storage | Local filesystem or S3-compatible bucket | Keeps original source documents for citation/audit |
| Frontend | React + Tailwind | Fast to build a clean, professional dashboard; component reuse for Field Inspector and Review Queue |
| Task queue (stretch) | Redis + a worker process | Needed only if demoing true bulk/batch ingestion at scale |
| Containerization | Docker Compose | One-command spin-up for judges/demo reliability |

## 7. Non-Functional Requirements

- **Reliability during demo**: the live demo path must work offline from flaky wifi where possible — pre-cache or mock external calls if network is a risk during judging
- **Latency**: single-product extraction should complete in well under 30 seconds to keep a live demo compelling
- **Auditability**: every committed field must be traceable to a source and timestamp indefinitely (no silent overwrites)
- **Security**: no secrets committed to the repo; API keys via `.env`, excluded from version control

---
*See `product-idea.md` for the full feature set, `prd.md` for the phased build plan.*
