import base64
import logging
import json
import os
from typing import Dict, Any, Optional, List
import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("ocr_agent.gateway_client")

def _resolve_base_url(url: Optional[str]) -> str:
    raw_url = (url or os.getenv("API_URL") or "").rstrip("/")
    if raw_url.endswith("/api/generate"):
        return raw_url[:-13]
    return raw_url

def _resolve_api_url(url: Optional[str]) -> str:
    raw_url = (url or os.getenv("API_URL") or "").rstrip("/")
    if raw_url and not raw_url.endswith("/api/generate"):
        return f"{raw_url}/api/generate"
    return raw_url

def _resolve_auth_token(token: Optional[str]) -> str:
    return token or os.getenv("API_KEY") or ""

DEFAULT_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-3.6-flash", "gemini-1.5-pro"]

def _get_google_api_keys() -> List[str]:
    keys = []
    for i in range(1, 9):
        val = os.getenv(f"GOOGLE_API_KEY{i}", "").strip()
        if val and not val.startswith("your-"):
            keys.append(val)
    gem_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gem_key and gem_key not in keys:
        keys.append(gem_key)
    return keys

class GeminiGatewayClient:
    """
    Client for interacting with the Gemini API Gateway & Proxy (PRIMARY)
    with automatic fallback to Google API keys.
    """
    def __init__(
        self,
        base_url: Optional[str] = None,
        auth_token: Optional[str] = None,
        timeout: int = 10
    ):
        self.api_url = _resolve_api_url(base_url)
        self.base_url = _resolve_base_url(base_url)
        self.auth_token = _resolve_auth_token(auth_token)
        self.timeout = timeout
        self.headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json",
            "x-api-key": self.auth_token,
            "x-goog-api-key": self.auth_token,
        }

    def get_keys_status(self) -> Dict[str, Any]:
        """Queries the health and availability of the gateway key pool."""
        url = f"{self.base_url}/api/keys/status"
        try:
            response = requests.get(url, headers=self.headers, timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch key pool status: {e}")
            return {"error": str(e), "total_keys": 0, "keys": []}

    def generate_text(
        self,
        prompt: str,
        model: str = "gemini-2.0-flash",
        temperature: float = 0.2
    ) -> str:
        """
        Text generation: PRIMARY = Render Proxy Gateway, FALLBACK = Direct API Keys.
        """
        models_to_try = [model] + [m for m in DEFAULT_MODELS if m != model]

        base_payload = {
            "prompt": prompt,
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": temperature
            }
        }
        
        if self.base_url:
            for target_model in models_to_try:
                # Format A: /api/generate
                direct_gen_url = f"{self.base_url}/api/generate"
                gen_payload = {"model": target_model, "prompt": prompt}
                try:
                    logger.info(f"Attempting PRIMARY Gateway Proxy /api/generate with {target_model}...")
                    response = requests.post(
                        direct_gen_url, json=gen_payload, headers=self.headers, timeout=self.timeout
                    )
                    if response.status_code == 200:
                        data = response.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts and parts[0].get("text"):
                                logger.info(f"PRIMARY Gateway Proxy /api/generate succeeded with {target_model}")
                                return parts[0].get("text", "")
                        if "text" in data and data["text"]:
                            return data["text"]
                except Exception as e:
                    logger.warning(f"PRIMARY Gateway Proxy /api/generate error with {target_model}: {e}")

                # Format B: /v1beta/models/{target_model}:generateContent
                url = f"{self.base_url}/v1beta/models/{target_model}:generateContent"
                try:
                    logger.info(f"Attempting PRIMARY Gateway Proxy /v1beta generateContent with {target_model}...")
                    response = requests.post(
                        url, json=base_payload, headers=self.headers, timeout=self.timeout
                    )
                    if response.status_code == 404:
                        continue
                    response.raise_for_status()
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and parts[0].get("text"):
                            logger.info(f"PRIMARY Gateway Proxy generate_text succeeded with {target_model}")
                            return parts[0].get("text", "")
                except Exception as e:
                    logger.warning(f"PRIMARY Gateway Proxy text error with {target_model}: {e}")

        # 2. FALLBACK to Direct Google API keys
        logger.info("PRIMARY Gateway Proxy unavailable. Falling back to Direct Google API Keys...")
        direct_keys = _get_google_api_keys()

        if direct_keys:
            from google import genai
            for key_idx, direct_key in enumerate(direct_keys):
                try:
                    client = genai.Client(api_key=direct_key)
                    res = client.models.generate_content(
                        model=model,
                        contents=prompt,
                    )
                    if res.text:
                        logger.info(f"FALLBACK Direct GenAI SDK succeeded with key index {key_idx}")
                        return res.text
                except Exception as direct_err:
                    logger.warning(f"Fallback Key {key_idx} failed: {direct_err}")
                    continue

        raise RuntimeError("All generation attempts (PRIMARY Gateway Proxy + FALLBACK API Keys) failed.")

    def generate_multimodal(
        self,
        image_bytes: bytes,
        mime_type: str,
        prompt: str,
        system_instruction: Optional[str] = None,
        model: str = "gemini-2.0-flash",
        temperature: float = 0.1,
        response_mime_type: Optional[str] = "application/json"
    ) -> str:
        """
        Multimodal generation: PRIMARY = Render Proxy Gateway, FALLBACK = Direct API Keys.
        """
        models_to_try = [model] + [m for m in DEFAULT_MODELS if m != model]
        base64_data = base64.b64encode(image_bytes).decode("utf-8")

        user_part_image = {
            "inline_data": {
                "mime_type": mime_type,
                "data": base64_data
            }
        }
        user_part_text = {"text": prompt}

        contents = [
            {
                "role": "user",
                "parts": [user_part_image, user_part_text]
            }
        ]

        payload: Dict[str, Any] = {"contents": contents}
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        gen_config: Dict[str, Any] = {"temperature": temperature}
        if response_mime_type:
            gen_config["responseMimeType"] = response_mime_type
        payload["generationConfig"] = gen_config

        # 1. Try PRIMARY Render Gateway Proxy FIRST
        if self.base_url:
            for target_model in models_to_try:
                url = f"{self.base_url}/v1beta/models/{target_model}:generateContent"
                logger.info(f"Attempting PRIMARY Gateway Proxy multimodal extraction with model: {target_model}")

                try:
                    response = requests.post(
                        url, json=payload, headers=self.headers, timeout=self.timeout
                    )
                    
                    if response.status_code == 404:
                        continue
                        
                    response.raise_for_status()
                    res_data = response.json()

                    candidates = res_data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            text_out = parts[0].get("text", "")
                            if text_out:
                                logger.info(f"PRIMARY Gateway Proxy multimodal extraction succeeded with {target_model}")
                                return text_out

                    if "text" in res_data and res_data["text"]:
                        logger.info("PRIMARY Gateway Proxy multimodal extraction succeeded (flat text response)")
                        return res_data["text"]

                except Exception as e:
                    logger.warning(f"PRIMARY Gateway Proxy error for model {target_model}: {e}")

        # 2. FALLBACK to Direct Google API Keys
        logger.info("PRIMARY Gateway Proxy failed. Falling back to Direct Google API Keys...")
        direct_keys = _get_google_api_keys()

        if direct_keys:
            from google import genai
            from google.genai import types
            for key_idx, direct_key in enumerate(direct_keys):
                try:
                    client = genai.Client(api_key=direct_key)
                    contents_sdk = [
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                        prompt
                    ]
                    config = types.GenerateContentConfig(
                        temperature=temperature,
                        response_mime_type=response_mime_type,
                        system_instruction=system_instruction
                    )
                    res = client.models.generate_content(
                        model=model,
                        contents=contents_sdk,
                        config=config
                    )
                    if res.text:
                        logger.info(f"FALLBACK Direct GenAI SDK succeeded with key index {key_idx}")
                        return res.text
                except Exception as direct_err:
                    logger.warning(f"Fallback Direct Key {key_idx} failed: {direct_err}")
                    continue

        raise RuntimeError("All multimodal attempts (PRIMARY Gateway Proxy + FALLBACK API Keys) failed.")
