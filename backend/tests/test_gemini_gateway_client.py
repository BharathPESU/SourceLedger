"""Unit tests for GeminiGatewayClient adapter."""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from src.tools.gemini_gateway_client import GeminiGatewayClient


@pytest.mark.asyncio
async def test_gateway_client_disabled_by_default():
    client = GeminiGatewayClient(base_url="")
    assert not client.is_proxy_enabled
    with pytest.raises(ValueError, match="not configured"):
        await client.generate_simple("Hello")


@pytest.mark.asyncio
async def test_gateway_client_headers_with_token():
    client = GeminiGatewayClient(base_url="http://localhost:8000", auth_token="test-secret-token")
    headers = client._get_headers()
    assert headers["Authorization"] == "Bearer test-secret-token"
    assert headers["x-api-key"] == "test-secret-token"
    assert headers["x-goog-api-key"] == "test-secret-token"


@pytest.mark.asyncio
async def test_gateway_client_generate_simple_success():
    client = GeminiGatewayClient(base_url="http://localhost:8000", auth_token="test-token")
    mock_response_data = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "Quantum entanglement response."}],
                    "role": "model",
                }
            }
        ]
    }

    mock_post_response = MagicMock()
    mock_post_response.raise_for_status.return_value = None
    mock_post_response.json.return_value = mock_response_data

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_post_response
        result = await client.generate_simple("Explain quantum entanglement.")
        assert result == "Quantum entanglement response."
        mock_post.assert_called_once()


@pytest.mark.asyncio
async def test_gateway_client_health_and_status():
    client = GeminiGatewayClient(base_url="http://localhost:8000", auth_token="test-token")
    
    mock_health_response = MagicMock()
    mock_health_response.raise_for_status.return_value = None
    mock_health_response.json.return_value = {"status": "online", "total_keys_configured": 5}

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_health_response
        health = await client.check_health()
        assert health["status"] == "online"
        assert health["total_keys_configured"] == 5
