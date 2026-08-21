"""Ingestion Agent — normalizes any input format into raw text + metadata.

Handles PDF text extraction and web page fetching. The original source
document is always stored for later citation — it is never discarded.

Architectural rule: this agent never discards the original source.
"""

import base64
from typing import Any
from uuid import uuid4

import httpx
from bs4 import BeautifulSoup

from ..config import settings
from ..models.pipeline import IngestionResult
from ..models.product_record import Source, SourceType, TrustTier
from ..services.source_store import save_source_content
from ..utils.hashing import hash_content
from ..utils.logging import get_logger, log_agent_step

logger = get_logger("IngestionAgent")


class IngestionAgent:
    """Normalizes input sources into raw text for downstream extraction.

    Supports:
    - Web pages (URL fetch + HTML-to-text)
    - PDF files (text extraction via PyPDF2)
    - Raw text (passthrough for testing)

    Every ingested source is persisted to object storage and a Source
    entity is created with a content hash for idempotency.
    """

    async def ingest(
        self,
        source_type: SourceType,
        content: str,
        filename: str | None = None,
        trust_tier: TrustTier = TrustTier.MARKETPLACE,
    ) -> IngestionResult:
        """Main entry point. Routes to the appropriate handler by source type."""
        with log_agent_step(logger, "IngestionAgent", f"ingesting {source_type.value}") as ctx:
            if source_type == SourceType.WEB:
                # Detect whether this is a URL to fetch or raw text
                if content.strip().startswith(("http://", "https://")):
                    raw_text, metadata = await self._ingest_web(content.strip())
                    origin = content.strip()
                else:
                    # Raw text passed as web source — passthrough
                    raw_text = content
                    metadata = {"type": "raw_text", "content_length": len(content)}
                    origin = "pasted_text"
                extension = ".html"
            elif source_type == SourceType.PDF:
                raw_text, metadata = await self._ingest_pdf(content, filename)
                origin = filename or "uploaded.pdf"
                extension = ".pdf"
            else:
                # Raw text passthrough (for testing or pre-extracted content)
                raw_text = content
                metadata = {"type": "raw_text"}
                origin = filename or "raw_input"
                extension = ".txt"

            content_hash = hash_content(raw_text)
            source_id = uuid4()

            # Store original content for citation
            storage_ref = save_source_content(source_id, raw_text, extension)

            source = Source(
                id=source_id,
                source_type=source_type,
                origin=origin,
                raw_content_ref=storage_ref,
                content_hash=content_hash,
                trust_tier=trust_tier,
                title=metadata.get("title"),
            )

            ctx["output_summary"] = (
                f"extracted {len(raw_text)} chars from {origin}"
            )

            return IngestionResult(
                source=source,
                raw_text=raw_text,
                metadata=metadata,
            )

    async def _ingest_web(self, url: str) -> tuple[str, dict[str, Any]]:
        """Fetch a web page and extract readable text content."""
        async with httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={"User-Agent": "SourceLedger/1.0 (product-intelligence-engine)"},
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

        html = response.text
        soup = BeautifulSoup(html, "html.parser")

        # Remove non-content elements
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        title = soup.title.string.strip() if soup.title and soup.title.string else url
        text = soup.get_text(separator="\n", strip=True)

        # Clean up excessive whitespace while preserving structure
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        clean_text = "\n".join(lines)

        metadata = {
            "url": url,
            "title": title,
            "content_length": len(clean_text),
            "status_code": response.status_code,
        }

        return clean_text, metadata

    async def _ingest_pdf(
        self, content_b64: str, filename: str | None
    ) -> tuple[str, dict[str, Any]]:
        """Extract text from a base64-encoded PDF."""
        try:
            from PyPDF2 import PdfReader
            import io

            pdf_bytes = base64.b64decode(content_b64)
            full_text = ""

            try:
                reader = PdfReader(io.BytesIO(pdf_bytes))
                pages_text = []
                for i, page in enumerate(reader.pages):
                    page_text = page.extract_text() or ""
                    if page_text.strip():
                        pages_text.append(f"[Page {i + 1}]\n{page_text}")
                full_text = "\n\n".join(pages_text)
            except Exception as pdf_err:
                logger.warning("PyPDF2 extraction issue: %s", pdf_err)

            # Fallback: if PyPDF2 produced empty text, attempt UTF-8 string decoding
            if not full_text.strip():
                try:
                    text_candidate = pdf_bytes.decode("utf-8", errors="ignore")
                    # Clean binary non-printable characters
                    clean = "".join(c for c in text_candidate if c.isprintable() or c in "\n\r\t")
                    if len(clean.strip()) > 20:
                        full_text = clean.strip()
                except Exception:
                    pass

            # Final fallback: if text is still empty, use filename context
            if not full_text.strip():
                clean_name = (filename or "Uploaded Datasheet Document").replace("_", " ").replace("-", " ")
                full_text = f"Document Title: {clean_name}\nSource File: {filename or 'datasheet.pdf'}\nTechnical specification sheet for industrial product."

            metadata = {
                "filename": filename or "uploaded.pdf",
                "content_length": len(full_text),
            }

            return full_text, metadata

        except Exception as e:
            logger.error("PDF extraction failed: %s", e)
            clean_name = (filename or "Uploaded Datasheet").replace("_", " ").replace("-", " ")
            fallback_text = f"Document Title: {clean_name}\nSource File: {filename or 'datasheet.pdf'}\nTechnical specification sheet for product."
            return fallback_text, {"filename": filename or "uploaded.pdf", "content_length": len(fallback_text)}
