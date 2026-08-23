"""Round-Robin Gemini API Key Rotator — SourceLedger.

Provides multi-key rotation with automatic 60-second cooldown for rate-limited
keys (429 RESOURCE_EXHAUSTED) and permanent expiry only for truly invalid keys.
"""

import time
from typing import Dict, List, Optional

from ..config import settings
from ..utils.logging import get_logger

logger = get_logger("APIKeyRotator")

# How long a rate-limited (429) key is cooled down before being retried (seconds)
RATE_LIMIT_COOLDOWN_SECONDS = 60


class APIKeyRotator:
    """Round-robin Gemini API key manager with time-based cooldown for 429s.

    - 429 / RESOURCE_EXHAUSTED  →  key put on 60-second cooldown, then reused
    - 401 / INVALID_API_KEY     →  key permanently blacklisted
    """

    def __init__(self, keys: list[str] | None = None) -> None:
        if keys:
            self._keys = [k.strip() for k in keys if k and k.strip()]
        else:
            self._keys = settings.get_google_api_keys()

        self._index = 0
        # Permanently invalid keys (401, wrong key format, etc.)
        self._dead_keys: set[str] = set()
        # Temporarily rate-limited keys: key → cooldown-expiry timestamp
        self._cooldown_until: Dict[str, float] = {}

    # ── Properties ────────────────────────────────────────────────────────────

    @property
    def total_keys(self) -> int:
        return len(self._keys)

    @property
    def active_keys(self) -> List[str]:
        """Keys that are neither dead nor currently in cooldown."""
        now = time.monotonic()
        return [
            k for k in self._keys
            if k not in self._dead_keys
            and self._cooldown_until.get(k, 0) <= now
        ]

    @property
    def active_keys_count(self) -> int:
        return len(self.active_keys)

    # ── Key management ────────────────────────────────────────────────────────

    def get_next_key(self) -> Optional[str]:
        """Round-robin over currently active keys."""
        available = self.active_keys
        if not available:
            # All keys in cooldown — find the one that recovers soonest
            cooling = {k: v for k, v in self._cooldown_until.items() if k not in self._dead_keys}
            if cooling:
                soonest_key = min(cooling, key=lambda k: cooling[k])
                wait = max(0.0, cooling[soonest_key] - time.monotonic())
                logger.info(f"All keys cooling down. Soonest recovery in {wait:.1f}s for key ...{soonest_key[-6:]}")
                time.sleep(min(wait, 5.0))  # wait up to 5s then retry caller loop
                return self.get_next_key()
            logger.warning("All Gemini API keys are dead (permanently invalid)!")
            return None

        key = available[self._index % len(available)]
        self._index = (self._index + 1) % len(available)
        return key

    def mark_rate_limited(self, key: str) -> None:
        """Put key in cooldown for RATE_LIMIT_COOLDOWN_SECONDS (temporary 429)."""
        if key:
            expiry = time.monotonic() + RATE_LIMIT_COOLDOWN_SECONDS
            self._cooldown_until[key] = expiry
            logger.warning(
                "Key ...%s rate-limited (429) — cooling down for %ds. Active keys: %d/%d",
                key[-6:], RATE_LIMIT_COOLDOWN_SECONDS, self.active_keys_count, self.total_keys
            )

    def mark_expired(self, key: str) -> None:
        """Permanently blacklist a key (invalid API key, not a rate limit)."""
        if key:
            self._dead_keys.add(key)
            logger.warning(
                "Key ...%s permanently DEAD (invalid/unauthorized). Active keys: %d/%d",
                key[-6:], self.active_keys_count, self.total_keys
            )

    def reset(self) -> None:
        """Reset all cooldowns and dead keys."""
        self._dead_keys.clear()
        self._cooldown_until.clear()
        self._index = 0
        logger.info("API Key Rotator reset. All keys restored to active pool.")

    # ── Main rotation call ────────────────────────────────────────────────────

    def call_with_rotation(self, func, *args, **kwargs):
        """Execute a Gemini generate_content call with PRIMARY Render Proxy
        and FALLBACK 8 Round-Robin Google API keys.
        """
        import os
        import requests
        from google import genai as _genai

        model = kwargs.get("model") or (args[0] if args else "gemini-3.6-flash")
        contents = kwargs.get("contents") or (args[1] if len(args) > 1 else "")
        config = kwargs.get("config", None)

        proxy_url = (os.getenv("API_URL") or "https://free-api-erel.onrender.com").rstrip("/")
        if proxy_url.endswith("/api/generate"):
            proxy_url = proxy_url[:-13]
        proxy_token = os.getenv("API_KEY") or ""

        # 1. Try Render Proxy Gateway FIRST (PRIMARY)
        try:
            target_url = f"{proxy_url}/v1beta/models/{model}:generateContent"
            headers = {
                "Authorization": f"Bearer {proxy_token}",
                "x-api-key": proxy_token,
                "Content-Type": "application/json",
            }
            
            prompt_text = ""
            if isinstance(contents, str):
                prompt_text = contents
            elif isinstance(contents, list):
                prompt_text = " ".join(str(item) for item in contents)
            else:
                prompt_text = str(contents)

            temperature = getattr(config, "temperature", 0.2) if config else 0.2
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": prompt_text}]
                    }
                ],
                "generationConfig": {
                    "temperature": temperature
                }
            }

            logger.info("Attempting PRIMARY Render Proxy generate_content with model %s...", model)
            res = requests.post(target_url, json=payload, headers=headers, timeout=45)
            if res.status_code == 200:
                res_data = res.json()
                candidates = res_data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and parts[0].get("text"):
                        text_out = parts[0].get("text", "")
                        logger.info("PRIMARY Render Proxy generate_content OK with model %s", model)
                        
                        # Return object compatible with .text attribute
                        class ProxyResponse:
                            def __init__(self, text):
                                self.text = text
                        return ProxyResponse(text_out)
        except Exception as proxy_err:
            logger.warning("PRIMARY Render Proxy failed: %s. Falling back to 8 Round-Robin Keys...", proxy_err)

        # 2. FALLBACK to 8 Round-Robin Google API keys
        tried: set[str] = set()

        while True:
            key = self.get_next_key()
            if key is None:
                raise RuntimeError("All Gemini API keys are permanently invalid.")

            if key in tried:
                # We've gone full circle — all remaining keys are temporarily cooled
                raise RuntimeError(
                    f"All {self.total_keys} Gemini API keys are rate-limited. "
                    "Tried every key at least once."
                )
            tried.add(key)

            try:
                fresh_client = _genai.Client(api_key=key)
                call_kwargs: dict = {"model": model, "contents": contents}
                if config is not None:
                    call_kwargs["config"] = config

                result = fresh_client.models.generate_content(**call_kwargs)
                logger.info("FALLBACK call_with_rotation OK with key ...%s", key[-6:])
                return result

            except Exception as e:
                err_str = str(e).lower()
                if any(t in err_str for t in ("429", "resource_exhausted", "quota", "rate limit")):
                    self.mark_rate_limited(key)
                    continue  # immediately try the next key
                elif any(t in err_str for t in ("401", "invalid api key", "api_key_invalid", "unauthorized")):
                    self.mark_expired(key)
                    continue
                else:
                    raise  # non-quota error — propagate immediately


# Global singleton rotator instance
key_rotator = APIKeyRotator()
