from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_web_app_ui_route():
    """
    Tests GET / endpoint renders dashboard HTML cleanly without 500 template error.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert "Gemini API Gateway OCR Agent" in response.text

def test_web_app_gateway_status():
    """
    Tests GET /api/gateway/status endpoint.
    """
    response = client.get("/api/gateway/status")
    assert response.status_code == 200
    data = response.json()
    assert "total_keys" in data or "status" in data
