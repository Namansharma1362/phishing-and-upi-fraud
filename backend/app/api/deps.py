"""
SentinelAI — FastAPI Auth Dependencies (Phase 2)

Provides injectable dependencies for:
  - Extracting the Bearer token from the Authorization header
  - Decoding + validating the access token
  - Redis-backed rate limiting (sliding window)

Usage in route handlers:
    async def route(
        current_user: UserProfile = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ):
        ...
"""

from fastapi import Cookie, Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db
from app.schemas.auth import UserProfile
from app.services.auth_service import AuthService

settings = get_settings()
bearer_scheme = HTTPBearer(auto_error=False)


# ── Token Extractor ───────────────────────────────────────────────────────────

async def get_bearer_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    """Extract raw JWT from Authorization: Bearer <token> header."""
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


# ── Current User ──────────────────────────────────────────────────────────────

async def get_current_user(
    token: str = Depends(get_bearer_token),
    db: AsyncSession = Depends(get_db),
) -> UserProfile:
    """
    FastAPI dependency — decode token and return authenticated user profile.
    Raises 401 if token is missing, invalid, or expired.
    """
    return await AuthService.get_current_user(token, db)


# ── Optional Current User ─────────────────────────────────────────────────────

async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> UserProfile | None:
    """
    Like get_current_user, but returns None instead of raising 401.
    Used on endpoints that work both authenticated and anonymously.
    """
    if not credentials or credentials.scheme.lower() != "bearer":
        return None
    try:
        return await AuthService.get_current_user(credentials.credentials, db)
    except HTTPException:
        return None


# ── Rate Limiter ──────────────────────────────────────────────────────────────

async def rate_limit_auth(request: Request) -> None:
    """
    Redis sliding-window rate limiter for auth endpoints.
    10 requests per minute per IP. Fails open if Redis is unavailable.
    """
    import redis.asyncio as aioredis

    ip = request.client.host if request.client else "unknown"
    key = f"ratelimit:auth:{ip}"
    limit = 10
    window = 60  # seconds

    try:
        redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        results = await pipe.execute()
        await redis_client.aclose()

        count = results[0]
        if count > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many requests. Please wait {window} seconds.",
                headers={"Retry-After": str(window)},
            )
    except HTTPException:
        raise
    except Exception:
        pass  # Fail open — Redis unavailable
