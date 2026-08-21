# SourceLedger — AI-Powered Product Intelligence Engine
*Every product fact, ledgered back to its source.*
### UniHack 2026 · Team ERROR_404_NOT_FOUND

---

## 1. One-Line Pitch

SourceLedger turns scattered, incomplete product information — a name, a spec sheet, a scanned catalog page, a URL — into a fully structured, validated, source-cited product record, ready to drop into any commerce system, at catalog scale.

## 2. The Problem (Restated)

Industrial companies hold product data across websites, PDFs, scanned catalogs, and technical documents. Turning that mess into clean, trustworthy, commerce-ready product data is slow, manual, and error-prone. The gap isn't "can AI write product descriptions" — it's **can AI produce data a business can actually trust and act on.**

## 3. Why SourceLedger, Not Just Another "LLM Extracts JSON" Demo

Most hackathon entries in this space will do: input → LLM → JSON. SourceLedger's differentiation is that every field in the output is:

- **Schema-locked** — not freeform text, a strict validated product schema
- **Multi-source reconciled** — when sources disagree, SourceLedger resolves it, doesn't just pick one
- **Cited** — every field traces back to the exact source text it came from
- **Confidence-scored** — so a human knows what to trust vs. what to check
- **Taxonomy-mapped** — fits into real industrial classification standards, not an ad-hoc category list

This is the difference between a toy and a tool a procurement or catalog team would actually adopt.

## 4. Core Product Concept

SourceLedger is a multi-agent pipeline plus a review dashboard:

**Input** → Ingestion → Extraction → Enrichment → Validation → Explainability layer → **Structured, cited, confidence-scored product record** → Human review queue for anything uncertain → Catalog store (deduped, taxonomy-mapped)

## 5. Full Feature Set

### 5.1 Core Pipeline Features
- **Multi-format ingestion**: PDFs, scraped web pages, spec sheets, scanned/photographed catalog pages (OCR + vision model)
- **Domain-aware extraction templates**: category-specific schemas (e.g. pumps need flow rate + head pressure; fasteners need thread pitch + material grade) instead of one generic schema for all products
- **Enrichment agent**: fills missing fields from manufacturer sites, similar SKUs already in the catalog, and standard taxonomies
- **Conflict resolution with provenance ranking**: sources are trust-ranked (manufacturer spec sheet > distributor page > forum/marketplace post); clear conflicts auto-resolve, ambiguous ones escalate to human review
- **Compliance & standards awareness**: auto-flags missing certification fields buyers filter by (RoHS, CE, ISO, etc.)
- **Auto-taxonomy suggestion**: maps products to UNSPSC/eCl@ss codes; if no clean fit, proposes a new sub-category with similar existing products shown for comparison

### 5.2 Trust & Explainability Features
- **Field Inspector UI**: click any field in a structured record → see the exact source excerpt highlighted, the reasoning chain, and a confidence score. This is the single highest-impact feature for demo purposes — it turns "trust me" into "verify me."
- **Confidence scoring per field**, not just per record
- **Human-in-the-loop review queue**: anything below a confidence threshold routes to a review UI instead of being silently guessed

### 5.3 Scale Features
- **Vector-based deduplication**: near-duplicate SKU detection across large catalogs using embedding similarity
- **Bulk ingestion with quality dashboard**: upload a batch of listings, get catalog-wide stats — % fully validated, % needing review, % flagged conflicting, average confidence by category
- **Delta/diff mode**: re-crawl a known source and surface what changed (price, spec revision, discontinued status) — turns SourceLedger from a one-time enrichment tool into ongoing catalog maintenance

### 5.4 Learning Loop
- **Active learning from corrections**: when a human corrects a field in the review queue, that correction feeds back into future extraction for that category — accuracy visibly improves with use ("day 1 vs. day 30" demo narrative)

## 6. Demo Script (What Wins the Room)

1. Paste a messy, real industrial product page → watch the structured record populate field-by-field live, each with a confidence bar
2. Click a field → Field Inspector shows the source snippet and reasoning
3. Show one deliberately ambiguous field getting caught and routed to the review queue (proves it isn't overclaiming)
4. Run a batch of 50–100 sample SKUs → show the quality dashboard and dedup/taxonomy clustering, proving this works at catalog scale, not just for one product

## 7. Alternate Angles (Considered, for Reference)

These were evaluated and set aside in favor of the full pipeline, but are documented as fallback scope if time runs short:

- **Angle B — Catalog Copilot**: conversational interface over the same engine ("find all pumps missing flow rate specs"). More viscerally impressive live, but riskier to build well in the time available.
- **Angle C — Trust Score as a Service**: narrow the whole product to just the validation + explainability layer, sitting on top of an existing catalog rather than generating new records. Smaller build, very sharp story — **this is the fallback MVP if the full pipeline can't be finished in time.**
- **Angle D — Vertical Wedge**: go deep on one industrial category (e.g. electrical components) instead of broad — easier to build a convincing demo dataset, less impressive breadth.

## 8. Must-Build vs. Stretch (Given Hackathon Time Constraints)

**Must-build (core demo path):**
- Ingestion (PDF + web page, skip scanned images if time-constrained)
- Extraction agent with schema-locked output
- Validation agent with confidence scoring
- Field Inspector explainability UI
- One end-to-end live demo flow

**Stretch goals (only if core path is solid early):**
- OCR for scanned catalogs
- Vector dedup at scale
- Delta/diff mode
- Active learning loop
- Auto-taxonomy suggestion for novel categories

**Fallback if behind schedule:** collapse to Angle C (Trust Score as a Service) — smaller surface area, same "we verify, not just generate" story.

---
*See `architecture.md` for system design and tech stack, `prd.md` for the step-by-step build plan, and `master-agent-prompt.md` for the coding agent brief.*
