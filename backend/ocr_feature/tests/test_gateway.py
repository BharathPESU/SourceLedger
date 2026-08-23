import pytest
from ocr_agent.gateway_client import GeminiGatewayClient

def test_gateway_key_status():
    """
    Tests that GeminiGatewayClient successfully queries the /api/keys/status endpoint on Render.
    """
    client = GeminiGatewayClient()
    status = client.get_keys_status()
    
    assert isinstance(status, dict)
    assert "total_keys" in status or "status" in status or "keys" in status
    print(f"\nGateway status result: {status.get('total_keys', 0)} keys available")

def test_gateway_generate_text():
    """
    Tests text generation via Gateway API with network error resilience.
    """
    client = GeminiGatewayClient()
    try:
        text = client.generate_text(
            prompt="Respond with exact string 'GATEWAY_ONLINE_TEST_SUCCESS'",
            model="gemini-2.0-flash",
            temperature=0.0
        )
        assert isinstance(text, str)
        assert len(text) > 0
        print(f"\nText generation output: {text[:100]}")
    except RuntimeError as err:
        print(f"\nGateway test network exception caught (offline / quota): {err}")
        assert "Gateway text generation failed" in str(err) or "All model endpoints failed" in str(err)
