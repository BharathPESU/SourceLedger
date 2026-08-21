# SourceLedger — Product Requirements Document

## 1. Overview

**Product**: SourceLedger — AI-Powered Product Intelligence Engine
**Event**: UniHack 2026 (Unilog)
**Team**: ERROR_404_NOT_FOUND
**Problem statement**: AI-Powered Product Intelligence for Industrial Commerce

## 2. Goals

- Transform limited/unstructured product information into structured, commerce-ready product records
- Validate and enrich product data with visible source attribution and confidence
- Demonstrate a design that scales to full catalogs, not single products
- Deliver a working, demo-reliable MVP within the hackathon window (register/build by 23 Aug, evaluations 24 Aug–1 Sep, finale 4 Sep)

## 3. Non-Goals (for the hackathon MVP)

- Production-grade auth/multi-tenant security
- Full support for every industrial category — a representative subset is sufficient
- Real integration with Unilog's actual systems (a realistic mock dataset is sufficient)
- Perfect OCR accuracy on low-quality scans — best-effort, flagged low-confidence when uncertain

## 4. User Personas

- **Catalog Manager**: needs to bulk-process incomplete listings and trust what gets auto-committed vs. what needs review
- **Data Reviewer**: needs a fast, clear queue of only the fields that need a human decision
- **Judge/Evaluator**: needs to see, within 3–5 minutes, that the system generates, validates, and explains data at scale — not just once

## 5. Functional Requirements

### FR1 — Ingestion
- Accept a PDF, a pasted URL/HTML, or an uploaded image of a catalog page
- Extract raw text/content and store the original source for later citation

### FR2 — Structured Extraction
- Given raw content + a product category, produce a draft structured record matching that category's schema
- Reject and retry (or flag) any output that fails schema validation

### FR3 — Enrichment
- For missing fields, attempt to fill from: (a) other provided sources, (b) similar existing catalog entries, (c) standard taxonomy defaults where applicable
- Every enriched field must carry a source reference

### FR4 — Validation
- Detect conflicts between sources for the same field
- Resolve using source trust ranking where possible; otherwise mark `needs_review`
- Assign a confidence score (0–100) per field and an overall record confidence

### FR5 — Explainability
- For any field, expose: value, source excerpt, confidence, reasoning summary
- Field Inspector UI must be able to display this for every field, not a sampled subset

### FR6 — Review Queue
- List all fields with status `needs_review` across records
- Allow a reviewer to accept, edit, or reject a value
- Store the correction as a `ReviewAction` for the learning loop

### FR7 — Catalog / Scale View
- Support bulk upload (batch of sources)
- Dashboard showing: total records, % auto-committed, % needing review, average confidence by category
- Basic duplicate detection across the batch (flag likely-duplicate SKUs)

### FR8 — Taxonomy Mapping
- Map each record to a standard category code (UNSPSC/eCl@ss subset) where a clean match exists
- If no match, propose a new sub-category and show nearest existing matches

## 6. Success Metrics (for the demo, not production)

- End-to-end single-product flow completes in under 30 seconds
- At least 3 distinct product categories represented in the schema/demo dataset
- Every field shown in the demo has a visible source and confidence — zero unexplained fields
- Bulk demo run processes at least 30–50 sample listings with a coherent quality dashboard

## 7. Step-by-Step Implementation Plan

### Phase 0 — Setup (Day 0, a few hours)
1. Register the team, confirm roles across teammates (or scope solo build)
2. Set up repo, environment config (`.env` for API keys, never committed), Docker Compose skeleton
3. Pick 3 representative product categories for the demo (e.g. industrial pump, electrical connector, safety fastener) and gather 5–10 real-world sample sources per category (spec sheets, product pages)

### Phase 1 — Core Data Contracts (Day 1, morning)
4. Define the `ProductRecord` and `Field` schemas (Pydantic) per category
5. Define the API contract between pipeline stages (ingestion → extraction → enrichment → validation)
6. Stand up PostgreSQL schema for `ProductRecord`, `Field`, `Source`, `ReviewAction`

### Phase 2 — Ingestion + Extraction (Day 1, afternoon–evening)
7. Build the Ingestion Agent: PDF text extraction, URL/HTML fetch + parse; stub OCR as stretch
8. Build the Extraction Agent: prompt + structured output mode against the category schema
9. Validate extraction output against schema; reject/retry on failure
10. Test against your 3 sample categories until extraction is reliably schema-valid

### Phase 3 — Enrichment + Validation (Day 2, morning–afternoon)
11. Build the Enrichment Agent: fill missing fields from secondary sources/similar catalog entries
12. Build the Validation Agent: conflict detection, trust-tier ranking, confidence scoring
13. Wire LangGraph state machine connecting ingestion → extraction → enrichment → validation, with branching to `needs_review`

### Phase 4 — Explainability + Review UI (Day 2, evening–Day 3 morning)
14. Build the Field Inspector API endpoint (field → source excerpt + reasoning + confidence)
15. Build the React dashboard: record view with Field Inspector, and the Review Queue with accept/edit/reject actions
16. Wire `ReviewAction` storage on every human correction

### Phase 5 — Scale Features (Day 3, if on schedule)
17. Bulk ingestion endpoint + quality dashboard (aggregate confidence, % needing review)
18. Vector embedding + similarity check for duplicate detection across the batch
19. Taxonomy mapping lookup (UNSPSC/eCl@ss subset) + "propose new sub-category" fallback path

### Phase 6 — Demo Readiness (Final day)
20. Rehearse the exact demo script from `product-idea.md` section 6, timed
21. Pre-cache/mock any network-dependent calls that could fail live
22. Prepare fallback: if scale features aren't finished, demo still shows full single-record pipeline + explainability convincingly (Angle C fallback framing if needed)
23. Final README, architecture diagram, and pitch deck ready for submission

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM structured output fails validation intermittently | Add schema-repair retry step; log failure rate as a metric, not a blocker |
| Live demo network dependency fails during judging | Pre-run and cache key demo examples as fallback |
| Scope creep into all stretch features | Lock to the "must-build" list in `product-idea.md` §8 before touching stretch goals |
| Time runs out before scale features are built | Fall back to Angle C framing (trust/validation layer) — still a complete, coherent story |

## 9. Submission Checklist

- [ ] Working demo (live or recorded backup video)
- [ ] Repo with clean commit history matching phases above
- [ ] `product-idea.md`, `architecture.md`, `prd.md` included in repo docs
- [ ] Pitch deck covering problem, solution, architecture, demo, impact
- [ ] README with setup instructions (Docker Compose one-liner ideally)

---
*See `architecture.md` for system design and `master-agent-prompt.md` for the build agent's operating brief.*
