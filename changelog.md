# SourceLedger — Release & Feature Changelog

All notable changes, architectural updates, and new features implemented in **SourceLedger** are documented in this file.

---

## [Unreleased] — Supabase Authentication & Multi-Page Multimodal OCR

### 🔐 Supabase Authentication Implementation

Added a production-ready, zero-trust authentication layer powered by **Supabase Auth** while preserving all existing product intelligence, database schemas, and FastAPI backend services.

#### Added Features
- **Email & Password Authentication**:
  - **Sign Up (`SignUpView.tsx`)**: Input validation (email format, minimum password length, matching password confirmation), account creation via Supabase, and verification prompt.
  - **Sign In (`SignInView.tsx`)**: Credential authentication, unverified email detection, inline error handling, and session restoration.
  - **Email Verification Access Gate (`VerifyEmailView.tsx`)**: Access block page for accounts with unconfirmed email addresses. Includes resend verification link button with cooldown timer.
- **Password Recovery Flow**:
  - **Forgot Password (`ForgotPasswordView.tsx`)**: Password reset request with generic non-revealing security notification (*"If an account exists for this email, a password reset link has been sent."*).
  - **Reset Password (`ResetPasswordView.tsx`)**: Dedicated session recovery screen for defining new account passwords.
- **Google OAuth 2.0 Integration**:
  - Integrated Supabase OAuth provider (`signInWithGoogle`) for seamless Google single sign-on across mobile and desktop devices.
- **Route Protection & Session Management**:
  - Wrapped root application in `AuthProvider` (`AuthContext.tsx`).
  - Implemented automatic session persistence (`persistSession`, `autoRefreshToken`, `detectSessionInUrl`).
  - Protected application routes (`Dashboard`, `Catalog`, `Field Inspector`, `Review Queue`, `Sources`, `OCR Agent`, `Settings`) behind authentication and email verification state.
- **UI & Navigation Enhancements**:
  - Built glassmorphic `AuthCardLayout.tsx` matching the SourceLedger design system (`#F5E9D8`, `#191715`, `#E8622C`, backdrop blur filters, smooth transitions).
  - Added user initials avatar and **Sign Out** popover menu in `TopNav.tsx`.
  - Added **Sign Out** button dock action in `LeftRail.tsx`.
- **Environment & Configuration Templates**:
  - Added `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to root `.env.example` and `frontend/.env.example`.

---

### 📄 Ledger Multimodal OCR Feature Implementation

Upgraded the multimodal OCR capabilities into **Ledger Multimodal OCR Agent**, restructuring its workflow to support multi-page PDF documents and seamlessly routing extracted product intelligence through the main ingestion and audit pipelines.

#### Added & Refactored Features
- **Multi-Page PDF Screenshot & Vision OCR Pipeline**:
  - Implemented `render_pdf_pages()` and `process_document_to_page_images()` in `backend/ocr_feature/ocr_agent/tools.py` using `PyMuPDF` (`fitz`) and `pypdfium2` fallback.
  - Automatically renders each PDF page into high-resolution PNG page screenshots (`screenshot_1.png`, `screenshot_2.png`, ...).
  - Iterates vision OCR across all document pages, extracting structured attributes while maintaining precise page citations (`Page 1`, `Page 2`).
- **Unified Pipeline Integration**:
  - Restructured OCR extraction to follow the identical governance pipeline as file uploads and URL text ingestion.
  - Extracted product data automatically populates the SQLite database (`sourceledger.db`), **Dashboard**, **Products Catalog**, **Review Queue** (for fields under confidence threshold), and **Field Inspector**.
- **Ingestion Modal & UI Standardization**:
  - Renamed "Gemini Multimodal OCR Agent" to **"Ledger Multimodal OCR Agent"**.
  - Integrated OCR dropzone into the primary **Ingest New Source** modal alongside raw text/spec URL options for consistent card layout.
  - Updated dropzones in `IngestModal.tsx` and `OcrAgentView.tsx` to support `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.tiff`, and `.bmp`.
  - Added "Ingest & Extract Provenance" action button triggering unified pipeline persistence.
- **Proxy Gateway & API Key Security**:
  - Integrated external proxy API gateway (`https://free-api-erel.onrender.com/api/generate`) with `Bearer` authentication.
  - Extracted API keys into environment variables (`.env` / `backend/.env`), removing hardcoded credentials across the codebase.

---

### 🧪 Verification & Automated Testing
- **Frontend Type Safety**: `npx tsc --noEmit` passed with **0 errors**.
- **Backend Test Suite**: `pytest backend/ocr_feature/tests` passed with 100% success (`8 passed`).
- **Live Supabase Verification**: Verified live API endpoints for Sign Up, Email Verification Guard (`email_not_confirmed`), Sign In, and Admin Confirmation.
