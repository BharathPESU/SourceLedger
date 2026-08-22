"""URL Fetcher Tool for SourceLedger Agents.

Scrapes manufacturer product pages (MFR URL) to extract official bullet points,
specifications, and documentation links.
"""

import ssl
import urllib.parse
import urllib.request
import re
from typing import Dict, Any
from ..utils.logging import get_logger

logger = get_logger("url_fetcher_tool")

# SSL context that skips certificate chain verification.
# Needed because many manufacturer sites use intermediate CAs not trusted
# by the system certificate store in the server environment.
_SSL_CTX = ssl.create_default_context()
_SSL_CTX.check_hostname = False
_SSL_CTX.verify_mode = ssl.CERT_NONE

def fetch_manufacturer_page(url: str) -> Dict[str, Any]:
    """Scrapes an official manufacturer landing page to extract specs and documentation links.

    Args:
        url: Manufacturer URL to fetch

    Returns:
        Dict containing text_content, pdf_links, image_links, and page_title.
    """
    logger.info("▶ URLFetcherTool: fetching %s", url)
    result: Dict[str, Any] = {
        "url": url,
        "page_title": "",
        "text_content": "",
        "pdf_links": [],
        "image_links": []
    }
    
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
            }
        )
        with urllib.request.urlopen(req, timeout=8, context=_SSL_CTX) as response:
            html = response.read().decode('utf-8', errors='ignore')
            
            # Title
            title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
            if title_match:
                result["page_title"] = title_match.group(1).strip()

            # Clean body text
            body_text = re.sub(r'<script.*?>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
            body_text = re.sub(r'<style.*?>.*?</style>', '', body_text, flags=re.DOTALL | re.IGNORECASE)
            body_text = re.sub(r'<[^>]+>', ' ', body_text)
            result["text_content"] = re.sub(r'\s+', ' ', body_text).strip()[:1500]

            # PDF links
            pdfs = re.findall(r'href="([^"]+\.pdf[^"]*)"', html, re.IGNORECASE)
            result["pdf_links"] = list(set(pdfs))[:5]
            
            # Image links
            imgs = re.findall(r'src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"', html, re.IGNORECASE)
            result["image_links"] = list(set(imgs))[:5]

    except Exception as e:
        logger.warning("URLFetcherTool exception for %s: %s", url, e)

    return result
