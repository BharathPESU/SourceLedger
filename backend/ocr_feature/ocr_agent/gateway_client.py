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
    raw_url = (url or os.getenv("API_URL") or "https://free-api-erel.onrender.com").rstrip("/")
    if raw_url.endswith("/api/generate"):
        return raw_url[:-13]
    return raw_url

def _resolve_auth_token(token: Optional[str]) -> str:
    return token or os.getenv("API_KEY") or ""

DEFAULT_MODELS = ["gemini-3.6-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]

class GeminiGatewayClient:
    """
    Client for interacting with the Gemini API Round-Robin Gateway & Proxy.
    Loads API_URL and API_KEY from environment variables (.env).
    """
    def __init__(
        self,
        base_url: Optional[str] = None,
        auth_token: Optional[str] = None,
        timeout: int = 60
    ):
        self.base_url = _resolve_base_url(base_url)
        self.auth_token = _resolve_auth_token(auth_token)
        self.timeout = timeout
        self.headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json",
        }

    def get_keys_status(self) -> Dict[str, Any]:
        """
        Queries the health and availability of the gateway key pool.
        """
        url = f"{self.base_url}/api/keys/status"
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch key pool status: {e}")
            return {"error": str(e), "total_keys": 0, "keys": []}

    def generate_text(
        self,
        prompt: str,
        model: str = "gemini-3.6-flash",
        temperature: float = 0.2
    ) -> str:
        """
        Text generation using native pass-through endpoint /v1beta/models/{model}:generateContent.
        """
        models_to_try = [model] + [m for m in DEFAULT_MODELS if m != model]
        payload = {
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
        
        last_exception = None
        for target_model in models_to_try:
            url = f"{self.base_url}/v1beta/models/{target_model}:generateContent"
            try:
                response = requests.post(
                    url, json=payload, headers=self.headers, timeout=self.timeout
                )
                if response.status_code == 404:
                    continue
                response.raise_for_status()
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
            except Exception as e:
                logger.warning(f"generate_text error with {target_model}: {e}")
                last_exception = e

        raise RuntimeError(f"Gateway text generation failed: {last_exception}")

    def generate_multimodal(
        self,
        image_bytes: bytes,
        mime_type: str,
        prompt: str,
        system_instruction: Optional[str] = None,
        model: str = "gemini-3.6-flash",
        temperature: float = 0.1,
        response_mime_type: Optional[str] = "application/json"
    ) -> str:
        """
        Native pass-through generation supporting multimodal (image + text) payloads.
        Attempts primary model and falls back to alternative models if rate limited.
        """
        # Try direct Google GenAI SDK first with KeyRotator if GOOGLE_API_KEY is available
        direct_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY1")
        if direct_key:
            try:
                from google import genai
                from google.genai import types
                client = genai.Client(api_key=direct_key)
                contents = [
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
                    contents=contents,
                    config=config
                )
                if res.text:
                    return res.text
            except Exception as direct_err:
                logger.warning(f"Direct Google GenAI SDK multimodal failed: {direct_err}. Trying HTTP gateway...")

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

        last_exception = None

        for target_model in models_to_try:
            url = f"{self.base_url}/v1beta/models/{target_model}:generateContent"
            logger.info(f"Attempting multimodal extraction with model: {target_model}")

            try:
                response = requests.post(
                    url, json=payload, headers=self.headers, timeout=5
                )
                
                # If model parameter endpoint returned 404 or unsupported model, try next
                if response.status_code == 404:
                    logger.warning(f"Model {target_model} returned 404. Retrying with next model...")
                    continue
                    
                response.raise_for_status()
                res_data = response.json()

                candidates = res_data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text_out = parts[0].get("text", "")
                        if text_out:
                            return text_out

                # If response format is slightly different or empty parts
                if "text" in res_data:
                    return res_data["text"]

            except requests.HTTPError as http_err:
                logger.warning(f"HTTP Error for model {target_model}: {http_err}. Response: {response.text}")
                last_exception = http_err
            except Exception as e:
                logger.warning(f"Error calling {target_model}: {e}")
                last_exception = e

        raise RuntimeError(f"All model endpoints failed. Last error: {last_exception}")
