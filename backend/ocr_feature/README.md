# Gemini API Gateway Multimodal OCR Agent & Structured Text Extractor

An autonomous AI Agent system in Python that extracts structured text from unstructured image files (PNG, JPEG, WEBP, BMP, GIF, TIFF) using the high-availability Gemini API Gateway specified by `API_URL` and `API_KEY` in `.env`.

## Features
- **Gateway Integration**: Connects via `API_URL` and `API_KEY` configured in `.env`.
- **Multimodal Payload Encoding**: Supports inline base64 image encoding with automatic dimension resizing and format conversion.
- **Agent Self-Validation Tool**: Audits structured JSON output against document schemas, missing fields, and mathematical consistency (subtotals, line items, taxes, totals).
- **Refinement Loop Tool**: Automatically re-engages Gemini API with targeted validation issue feedback to correct discrepancies.
- **Web App Dashboard & CLI**: Includes a modern glassmorphism FastAPI dashboard and CLI tool.

## Installation & Usage

### 1. Setup Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

### 2. Run CLI Extraction
```bash
python -m ocr_agent.cli sample.png --type receipt_invoice
```

### 3. Run Web Dashboard
```bash
python app.py
```
Open your browser at `http://localhost:8000`.

### 4. Run Tests
```bash
pytest tests/
```
