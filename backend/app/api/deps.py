"""
SentinelAI — Shared FastAPI Dependencies

This module defines reusable FastAPI dependency functions injected
into route handlers via Depends(). Centralising them here prevents
duplicate dependency logic spread across routers.

Phase 1A: Database session only.
Phase 2 additions: get_current_user, require_admin, verify_token.
"""

from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield a per-request async database session.

    Wraps app.db.session.get_db so route handlers import only from
    app.api.deps — a single stable import location.

    Usage:
        @router.get("/example")
        async def example(db: AsyncSession = Depends(get_db_session)):
            result = await db.execute(...)
    """
    async for session in get_db():
        yield session
