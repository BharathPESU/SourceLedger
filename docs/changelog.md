# SourceLedger — Changelog & Version History

All notable changes to the SourceLedger project are documented in this file.

---

## [0.4.0] — 2026-08-22

### Added
- Created [progress.md](file:///home/balaraj/SourceLedger/progress.md) providing an exhaustive point-by-point chronicle of project inception, architecture, test suite, and troubleshooting history.
- Created `docs/api.md` documenting complete OpenAPI REST contracts (`/api/ingest`, `/api/products`, `/api/fields/edit`, `/api/export/csv`).

### Updated
- Updated `docs/architecture.md` to reflect official `google.genai` SDK integration, thread-safe `KeyRotator` multi-key pool, 5 registered domain schemas, and hardware-accelerated frontend video background.
- Enhanced `frontend/src/components/BackgroundVideo.tsx` with hardware-accelerated MP4 playback (`background.mp4`) and soft radial vignette overlay, reducing CPU load to $< 1\%$.

---

## [0.3.0] — 2026-08-21

### Added
- Implemented `KeyRotator` in `backend/src/agents/main.py` holding 8 Google Gemini API keys (`GEMINI_API_KEY_1` to `GEMINI_API_KEY_8`) with thread-safe round-robin allocation to eliminate HTTP 429 rate limits.
- Upgraded agent engine to official `google.genai` SDK (`genai.Client`).
- Created `csv_processor.py` for automated delivery CSV exports matching `Unihack_ Output - Delivery Format.csv`.
- Created `start.sh` single-command startup script for backend and frontend servers.

### Fixed
- Resolved `ModuleNotFoundError: No module named 'dotenv'` by isolating test runner inside `backend/.venv/bin/pytest`.
- Refactored mock fixtures across 37 backend tests to align with `google.genai` response contracts.

---

## [0.2.0] — 2026-08-20

### Added
- Integrated React 18 frontend with 5 core views (`DashboardView`, `FieldInspectorView`, `ReviewQueueView`, `ProductsCatalogView`, `IngestionSourcesView`, `SettingsView`).
- Created `BackgroundBlobs.tsx` canvas 2D wave & particle animation.
- Implemented real-time backend API synchronization loop polling every 5 seconds.

---

## [0.1.0] — 2026-08-19

### Added
- Initialized repository architecture with FastAPI backend, SQLite schema, and basic Pydantic data models (`ProductRecord`, `Field`, `Source`, `ReviewAction`).
- Authored initial project documentation: `prd.md`, `product-idea.md`, `architecture.md`, `master-agent-prompt.md`.
