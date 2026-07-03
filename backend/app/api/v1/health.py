"""
SentinelAI — Health Check Endpoint

GET /health

Returns the operational status of all backend services:
  - Application version and environment
  - PostgreSQL connectivity
  - Redis connectivity

Used by Docker health checks, load balancers, and uptime monitors.
Returns HTTP 200 even when services are degraded so that the
load balancer can read the body and make routing decisions.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import redis.asyncio as aioredis

from app.api.deps import get_db_session
from app.core.config import get_settings
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)
settings = get_settings()


@router.get(
    "/health",
    tags=["System"],
    summary="System Health Check",
    response_description="Service health status for all backend components",
)
async def health_check(db: AsyncSession = Depends(get_db_session)) -> dict:
    """
    Verify connectivity to PostgreSQL and Redis.

    Returns:
        A JSON object with overall status ("healthy" | "degraded")
        and per-service status details.
    """
    health: dict = {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "services": {
            "database": {"status": "unknown"},
            "cache": {"status": "unknown"},
        },
    }

    # ── PostgreSQL Check ────────────────────────────────────
    try:
        await db.execute(text("SELECT 1"))
        health["services"]["database"]["status"] = "healthy"
        logger.debug("database_ping_success")
    except Exception as exc:
        logger.error("database_ping_failed", error=str(exc))
        health["services"]["database"] = {
            "status": "unhealthy",
            "detail": "Cannot reach database. Check POSTGRES_* environment variables.",
        }
        health["status"] = "degraded"

    # ── Redis Check ─────────────────────────────────────────
    try:
        redis_client = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=3,
        )
        pong = await redis_client.ping()
        await redis_client.aclose()

        if pong:
            health["services"]["cache"]["status"] = "healthy"
            logger.debug("redis_ping_success")
        else:
            raise RuntimeError("Redis PING returned non-truthy response")
    except Exception as exc:
        logger.error("redis_ping_failed", error=str(exc))
        health["services"]["cache"] = {
            "status": "unhealthy",
            "detail": "Cannot reach Redis. Check REDIS_HOST and REDIS_PORT.",
        }
        health["status"] = "degraded"

    logger.info("health_check_completed", overall_status=health["status"])
    return health
