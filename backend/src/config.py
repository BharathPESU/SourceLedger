"""Application configuration loaded from environment variables.

Follows twelve-factor config: all secrets and environment-specific
settings come from env vars, never hardcoded. Copy .env.example to
.env and fill in real values before running.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Central configuration for the SourceLedger backend.

    Every setting can be overridden by an environment variable of the
    same name (case-insensitive). See .env.example for documentation
    of each setting.
    """

    # ── LLM API ──────────────────────────────────────────────────────
    google_api_key: str = ""
    openai_api_key: str = ""

    # ── Database ─────────────────────────────────────────────────────
    database_url: str = (
        "postgresql+asyncpg://sourceledger:sourceledger@localhost:5432/sourceledger"
    )

    # ── Vector DB (stretch — Phase 5) ────────────────────────────────
    qdrant_url: str = "http://localhost:6333"

    # ── App ──────────────────────────────────────────────────────────
    app_env: str = "development"
    log_level: str = "INFO"

    # Fields with confidence below this threshold route to the review
    # queue instead of being auto-committed.
    confidence_threshold: int = 70

    # ── Storage ──────────────────────────────────────────────────────
    source_storage_path: str = "./storage/sources"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
