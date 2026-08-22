import os
import json
import logging
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from ocr_agent import OCRAgentSystem, GeminiGatewayClient, DocumentType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ocr_web_app")

app = FastAPI(
    title="Ledger Multimodal OCR Agent Gateway",
    description="Extract structured text from image files powered by Ledger Gateway API and Agent Tool Loops.",
    version="1.0.0"
)

# Ensure templates directory exists
templates_dir = os.path.join(os.path.dirname(__file__), "templates")
os.makedirs(templates_dir, exist_ok=True)
templates = Jinja2Templates(directory=templates_dir)

agent = OCRAgentSystem()

@app.get("/", response_class=HTMLResponse)
async def serve_ui(request: Request):
    """
    Render main web interface dashboard.
    """
    return templates.TemplateResponse(request=request, name="index.html")

@app.get("/api/gateway/status")
async def gateway_status():
    """
    Check current status of the Gemini Gateway Key Pool.
    """
    try:
        client = agent.client
        return client.get_keys_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/extract")
async def extract_image(
    file: UploadFile = File(...),
    document_type: str = Form("general"),
    enable_refinement: bool = Form(True)
):
    """
    Extract structured text from uploaded image using the OCR Agent.
    """
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # Map document_type string to enum
        doc_type_enum = DocumentType.GENERAL
        try:
            doc_type_enum = DocumentType(document_type.lower())
        except ValueError:
            pass

        logger.info(f"Received OCR extraction request for filename: {file.filename}, type: {doc_type_enum.value}")

        result = agent.extract_structured_text(
            image_input=image_bytes,
            document_type=doc_type_enum,
            enable_refinement=enable_refinement
        )

        return JSONResponse(content=result.model_dump())

    except Exception as e:
        logger.error(f"Extraction endpoint error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"OCR Extraction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
