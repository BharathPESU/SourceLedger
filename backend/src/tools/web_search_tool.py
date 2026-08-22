"""Web Search Tool for SourceLedger Agents — real search with fallback.

Replaces the previous stub that returned Google search URLs.
Now uses the DuckDuckGo Instant Answer API to find actual manufacturer
pages, PDF spec sheets, and product images. Falls back to structured
guessed URLs only if all live searches fail.
"""

import json
import re
import ssl
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

from ..utils.logging import get_logger

logger = get_logger("web_search_tool")

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

# Skip SSL cert verification — many manufacturer sites use intermediate CAs
# not trusted in the server environment.
_SSL_CTX = ssl.create_default_context()
_SSL_CTX.check_hostname = False
_SSL_CTX.verify_mode = ssl.CERT_NONE


def _http_get(url: str, timeout: int = 8) -> str:
    """Fetch a URL and return the body as UTF-8 text, or empty string on error."""
    try:
        req = urllib.request.Request(url, headers=_HEADERS)
        with urllib.request.urlopen(req, timeout=timeout, context=_SSL_CTX) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception as exc:
        logger.debug("HTTP GET failed for %s: %s", url, exc)
        return ""


def _ddg_search(query: str, num: int = 8) -> List[Dict[str, str]]:
    """Search DuckDuckGo HTML and return list of {title, url, snippet}."""
    encoded = urllib.parse.quote_plus(query)
    html = _http_get(f"https://html.duckduckgo.com/html/?q={encoded}")
    if not html:
        return []

    results = []
    # DDG HTML search result structure
    blocks = re.findall(
        r'<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>.*?'
        r'<a[^>]+class="result__snippet"[^>]*>(.*?)</a>',
        html,
        re.DOTALL,
    )
    for href, title_html, snippet_html in blocks[:num]:
        # DDG proxies URLs — extract the real URL from uddg= param
        real_url = href
        m = re.search(r"uddg=([^&]+)", href)
        if m:
            real_url = urllib.parse.unquote(m.group(1))
        title = re.sub(r"<[^>]+>", "", title_html).strip()
        snippet = re.sub(r"<[^>]+>", "", snippet_html).strip()
        if real_url.startswith("http"):
            results.append({"title": title, "url": real_url, "snippet": snippet})

    # Fallback: grab any result__url spans
    if not results:
        urls = re.findall(r'class="result__url"[^>]*>([^<]+)</span>', html)
        for u in urls[:num]:
            u = u.strip()
            if not u.startswith("http"):
                u = "https://" + u
            results.append({"title": "", "url": u, "snippet": ""})

    return results


def _find_pdf_url(results: List[Dict[str, str]], query_hint: str = "") -> str:
    """Return the first result URL that looks like a real PDF datasheet."""
    pdf_signals = ["datasheet", "specsheet", "spec-sheet", "manual", "catalogue", "brochure"]
    for r in results:
        url = r["url"].lower()
        title = (r.get("title", "") + r.get("snippet", "")).lower()
        is_pdf = url.endswith(".pdf") or ".pdf" in url
        has_signal = any(s in url or s in title for s in pdf_signals)
        if is_pdf or has_signal:
            return r["url"]
    return ""


def _find_mfr_url(results: List[Dict[str, str]], brand: str) -> str:
    """Return the best manufacturer URL — prefer brand's own domain."""
    brand_domain = brand.lower().replace(" ", "").replace(".", "") + ".com"
    # First pass: brand's own domain
    for r in results:
        url = r["url"].lower()
        if brand_domain in url or brand.lower().replace(" ", "") in url:
            return r["url"]
    # Second pass: product/catalog page from any domain
    product_signals = ["/product", "/catalog", "/p/", "/item", "/part"]
    for r in results:
        if any(s in r["url"].lower() for s in product_signals):
            return r["url"]
    # Fallback: first result
    return results[0]["url"] if results else ""


def _find_image_url(part_number: str, brand: str) -> str:
    """Search for a real product image and return a direct image URL."""
    # Try DuckDuckGo Images API (JSON endpoint)
    query = f"{brand} {part_number} product photo"
    encoded = urllib.parse.quote_plus(query)
    token_html = _http_get(f"https://duckduckgo.com/?q={encoded}&iax=images&ia=images")
    vqd_match = re.search(r'vqd=["\']?([^"\'&]+)', token_html)
    if vqd_match:
        vqd = vqd_match.group(1)
        img_url = (
            f"https://duckduckgo.com/i.js?l=us-en&o=json&q={encoded}&vqd={vqd}&f=,,,,,,"
        )
        img_json = _http_get(img_url)
        if img_json:
            try:
                data = json.loads(img_json)
                results = data.get("results", [])
                for r in results:
                    src = r.get("image", "")
                    # Skip tiny icons and logos
                    w = r.get("width", 0)
                    h = r.get("height", 0)
                    if src and w >= 100 and h >= 100:
                        return src
            except Exception:
                pass

    # Fallback: scrape DuckDuckGo HTML images page for og:image tags or img srcs
    html = _http_get(f"https://html.duckduckgo.com/html/?q={encoded}+product+image")
    imgs = re.findall(r'<img[^>]+src="(https?://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"', html, re.I)
    for img in imgs:
        # Exclude DDG's own assets and tiny icons
        if "duckduckgo.com" not in img and len(img) > 30:
            return img

    return ""


def search_product_datasheets(part_number: str, brand: str) -> Dict[str, Any]:
    """Search for official manufacturer product datasheets, images, and manuals.

    Strategy:
    1. Run 3 targeted DuckDuckGo searches in sequence.
    2. Parse results to find real manufacturer URLs, PDF links, and images.
    3. Fall back to constructed structured URLs only as a last resort.

    Args:
        part_number: Part number or model number (e.g. "CR 15-3", "776495-1")
        brand: Manufacturer or brand name (e.g. "Grundfos", "TE Connectivity")

    Returns:
        Dict: mfr_url, specification_sheet, product_image, owners_manual, web_snippets
    """
    logger.info("▶ WebSearchTool: searching specs for '%s %s'", brand, part_number)

    results: Dict[str, Any] = {
        "mfr_url": "",
        "specification_sheet": "",
        "product_image": "",
        "owners_manual": "",
        "web_snippets": [],
    }

    # ── Search 1: General product page ──────────────────────────────
    q1 = f"{brand} {part_number} product specifications"
    r1 = _ddg_search(q1, num=10)
    if r1:
        results["mfr_url"] = _find_mfr_url(r1, brand)
        results["web_snippets"] = [
            r.get("snippet", "") for r in r1[:5] if r.get("snippet")
        ]

    # ── Search 2: Datasheet / PDF ────────────────────────────────────
    q2 = f"{brand} {part_number} datasheet filetype:pdf"
    r2 = _ddg_search(q2, num=8)
    all_results = r1 + r2
    pdf_url = _find_pdf_url(all_results)
    if pdf_url:
        results["specification_sheet"] = pdf_url

    # Second PDF = manual
    q3 = f"{brand} {part_number} installation manual"
    r3 = _ddg_search(q3, num=5)
    pdf2 = _find_pdf_url(r3)
    if pdf2 and pdf2 != results["specification_sheet"]:
        results["owners_manual"] = pdf2

    # ── Search 3: Product image ───────────────────────────────────────
    img = _find_image_url(part_number, brand)
    if img:
        results["product_image"] = img

    # Never fabricate likely-looking links. An empty result means the field stays absent.

    logger.info(
        "✓ WebSearchTool: mfr_url=%s | spec=%s | img=%s",
        results["mfr_url"][:60] if results["mfr_url"] else "—",
        "✓" if results["specification_sheet"] else "✗",
        "✓" if results["product_image"] else "✗",
    )
    return results
