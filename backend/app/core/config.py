"""
SentinelAI — Application Configuration
Reads all settings from environment variables / .env file.
Uses lru_cache so Settings() is only instantiated once per process.
"""

from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Application ─────────────────────────────────────────
    APP_NAME: str = "SentinelAI"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # ── PostgreSQL ───────────────────────────────────────────
    POSTGRES_HOST: str
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str

    # ── Redis ────────────────────────────────────────────────
    REDIS_HOST: str
    REDIS_PORT: int = 6379

    # ── CORS ─────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]

    # ── JWT (RS256) ──────────────────────────────────────────
    # Generated and populated in Phase 2.
    JWT_PRIVATE_KEY: str = ""
    JWT_PUBLIC_KEY: str = ""
    JWT_ALGORITHM: str = "RS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Computed properties ──────────────────────────────────

    @property
    def database_url(self) -> str:
        """Async-compatible PostgreSQL DSN for SQLAlchemy."""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def redis_url(self) -> str:
        """Redis connection URL."""
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    """
    Return the cached Settings singleton.
    Called via FastAPI's Depends() or directly at module level.
    """
    return Settings()
