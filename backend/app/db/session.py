"""
SentinelAI — Async Database Session Factory

Creates the SQLAlchemy async engine and session factory.
The engine is created once at module load and disposed on shutdown.

pool_size / max_overflow are tuned for a small production workload.
Adjust based on Postgres max_connections setting.
"""

from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from app.core.config import get_settings

settings = get_settings()

# ── Engine ─────────────────────────────────────────────────────────────────
# pool_pre_ping=True: SQLAlchemy issues a SELECT 1 before using a pooled
# connection to detect stale connections (important after Postgres restarts).
engine = create_async_engine(
    settings.database_url,
    echo=settings.DEBUG,       # Log SQL statements only in debug mode
    pool_size=10,              # Persistent connections in the pool
    max_overflow=20,           # Extra connections allowed under peak load
    pool_pre_ping=True,        # Validate connection health before use
    pool_recycle=3600,         # Recycle connections every hour
)

# ── Session Factory ────────────────────────────────────────────────────────
AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,    # Don't expire objects after commit (avoids extra queries)
    autoflush=False,           # Explicit flush control
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency — yields a per-request async DB session.

    Usage in route handler:
        async def route(db: AsyncSession = Depends(get_db)):
            ...

    The session is automatically rolled back on error and always closed.
    """
    async with AsyncSessionFactory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
