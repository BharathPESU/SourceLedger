"""Dashboard and metadata API routes."""

from fastapi import APIRouter

from ..db.store import store
from ..models.api import (
    CategoryListResponse,
    DashboardStats,
    HealthResponse,
)
from ..models.schemas import list_categories

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard() -> DashboardStats:
    """Catalog-wide quality statistics — answers 'does this work at scale?'"""
    stats = await store.get_dashboard_stats()
    return DashboardStats(**stats)


@router.get("/dashboard/quality")
async def get_quality_dashboard():
    """Phase 11: Live Data Quality & Trust Dashboard endpoint with suspicious-fill & diversity alerts."""
    from ..services.dashboard_service import compute_quality_dashboard_metrics
    return await compute_quality_dashboard_metrics()


@router.get("/categories", response_model=CategoryListResponse)
async def get_categories() -> CategoryListResponse:
    """List all available product categories and their schemas."""
    return CategoryListResponse(categories=list_categories())


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    from ..config import settings

    return HealthResponse(
        status="ok",
        version="0.1.0",
        environment=settings.app_env,
    )


@router.post("/catalog/qa")
async def ask_catalog_question(payload: dict):
    """Phase 12e: Natural-language Catalog Q&A RAG engine over structured ProductRecord database."""
    from ..services.catalog_qa_service import answer_catalog_question
    question = payload.get("question", "").strip()
    if not question:
        return {"error": "question parameter is required"}
    return await answer_catalog_question(question)
