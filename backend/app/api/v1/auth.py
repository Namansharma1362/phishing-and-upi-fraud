"""
SentinelAI — Auth API Router (Phase 2)

Endpoints:
  POST /api/v1/auth/register   → create account
  POST /api/v1/auth/login      → get access + refresh tokens
  POST /api/v1/auth/refresh    → rotate refresh token (uses cookie)
  POST /api/v1/auth/logout     → revoke session
  GET  /api/v1/auth/me         → current user profile

Cookie strategy:
  - Refresh token: HTTP-only, Secure (dev: SameSite=lax), path=/api/v1/auth
  - Access token: returned in JSON body — stored in memory by the frontend
    (never localStorage — XSS would steal it)

Rate limiting:
  - register, login, refresh: Depends(rate_limit_auth) — 10 req/min per IP
"""

from fastapi import APIRouter, Cookie, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, rate_limit_auth
from app.core.config import get_settings
from app.db.session import get_db
from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    RefreshResponse,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UserProfile,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()

REFRESH_COOKIE_NAME = "sentinel_refresh"
COOKIE_MAX_AGE = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86_400  # seconds


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    """Write the refresh token into an HTTP-only cookie."""
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",      # "strict" in production
        secure=False,        # True in production (HTTPS only)
        path="/api/v1/auth", # Limit cookie scope to auth routes
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Delete the refresh cookie on logout."""
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/api/v1/auth",
    )


# ── POST /register ─────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user account",
    dependencies=[Depends(rate_limit_auth)],
)
async def register(
    data: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> RegisterResponse:
    """Register a new user. Returns the created user profile (no tokens)."""
    return await AuthService.register(data, db, request)


# ── POST /login ────────────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and receive tokens",
    dependencies=[Depends(rate_limit_auth)],
)
async def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate with email/password.

    Returns:
      - access_token in JSON body
      - refresh token as HTTP-only cookie (sentinel_refresh)
    """
    token_response, raw_refresh = await AuthService.login(data, db, request)
    _set_refresh_cookie(response, raw_refresh)
    return token_response


# ── POST /refresh ──────────────────────────────────────────────────────────────

@router.post(
    "/refresh",
    response_model=RefreshResponse,
    summary="Rotate refresh token and get new access token",
    dependencies=[Depends(rate_limit_auth)],
)
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    sentinel_refresh: str | None = Cookie(default=None),
) -> RefreshResponse:
    """
    Exchange a valid refresh token cookie for a new access token
    and a rotated refresh token cookie.
    """
    if not sentinel_refresh:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided. Please log in.",
        )

    refresh_response, new_raw_refresh = await AuthService.refresh(
        sentinel_refresh, db, request
    )
    _set_refresh_cookie(response, new_raw_refresh)
    return refresh_response


# ── POST /logout ───────────────────────────────────────────────────────────────

@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Revoke current session",
)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
    sentinel_refresh: str | None = Cookie(default=None),
) -> MessageResponse:
    """
    Revoke the refresh token and clear the cookie.
    Access token expires naturally (short-lived — 15 min).
    """
    _clear_refresh_cookie(response)

    if sentinel_refresh:
        return await AuthService.logout(
            sentinel_refresh, db, request, current_user.id
        )

    return MessageResponse(message="Logged out.")


# ── GET /me ────────────────────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UserProfile,
    summary="Get current authenticated user profile",
)
async def me(
    current_user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    """Return the profile of the currently authenticated user."""
    return current_user
