"""
SentinelAI — Authentication Service (Phase 2)

Implements:
  - User registration with duplicate email check
  - Login with timing-safe password verification
  - Access + refresh token issuance
  - Refresh token rotation (single-use, stored as hash)
  - Logout (revoke current session)
  - Current user retrieval
  - AuditLog entries for every auth action

Security notes:
  - verify_password runs even when user not found to prevent timing attacks
    that could reveal whether an email exists in the system.
  - Refresh tokens are hashed before DB storage (SHA-256).
    The raw token goes to the client as an HTTP-only cookie only.
  - On refresh, the old token is immediately invalidated and a new one issued
    (refresh token rotation prevents replay attacks).
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, Request, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.audit_log import AuditLog
from app.models.user import User
from app.models.user_session import UserSession
from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    RefreshResponse,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UserProfile,
)

settings = get_settings()
logger = get_logger(__name__)


class AuthService:
    """Stateless auth service — all state lives in DB / Redis."""

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _make_access_token(user: User) -> tuple[str, int]:
        """Return (access_token, expires_in_seconds)."""
        token = create_access_token(
            subject=str(user.id),
            additional_claims={"email": user.email, "name": user.name},
        )
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        return token, expires_in

    @staticmethod
    async def _write_audit(
        db: AsyncSession,
        action: str,
        user_id: str | None,
        request: Request,
        resource: str = "auth",
        resource_id: str | None = None,
    ) -> None:
        """Insert a row into audit_logs for this auth action."""
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        db.add(log)
        # Committed together with the parent transaction

    # ── Register ──────────────────────────────────────────────────────────────

    @staticmethod
    async def register(
        data: RegisterRequest, db: AsyncSession, request: Request
    ) -> RegisterResponse:
        """
        Create a new user account.

        Raises:
            409 if email already registered.
        """
        # Check for duplicate email
        result = await db.execute(
            select(User).where(User.email == data.email.lower())
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

        user = User(
            name=data.name.strip(),
            email=data.email.lower(),
            password_hash=hash_password(data.password),
        )
        db.add(user)
        await db.flush()   # Get the generated UUID without full commit

        await AuthService._write_audit(
            db, "user.register", str(user.id), request, resource_id=str(user.id)
        )
        await db.commit()
        await db.refresh(user)

        logger.info("user_registered", user_id=str(user.id), email=user.email)

        return RegisterResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            created_at=user.created_at,
        )

    # ── Login ─────────────────────────────────────────────────────────────────

    @staticmethod
    async def login(
        data: LoginRequest, db: AsyncSession, request: Request
    ) -> tuple[TokenResponse, str]:
        """
        Authenticate a user and issue access + refresh tokens.

        Returns:
            (TokenResponse, raw_refresh_token)
            The caller is responsible for setting the refresh token cookie.

        Raises:
            401 if credentials are invalid.
        """
        result = await db.execute(
            select(User).where(User.email == data.email.lower())
        )
        user: User | None = result.scalar_one_or_none()

        # Always run verify_password to prevent timing-based email enumeration
        dummy_hash = "$2b$12$KIXhq0JDiGJWvXAn7mUeWOIELT0TRuORXXXXXXXXXXXXXXXXXXXXXu"
        pw_hash = user.password_hash if user else dummy_hash
        password_ok = verify_password(data.password, pw_hash)

        if not user or not password_ok or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Issue tokens
        access_token, expires_in = AuthService._make_access_token(user)
        raw_refresh = generate_refresh_token()
        refresh_hash = hash_refresh_token(raw_refresh)
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

        session = UserSession(
            user_id=user.id,
            refresh_token_hash=refresh_hash,
            device_info=request.headers.get("user-agent", "unknown")[:255],
            ip_address=request.client.host if request.client else None,
            expires_at=expires_at,
        )
        db.add(session)

        await AuthService._write_audit(
            db, "user.login", str(user.id), request, resource_id=str(user.id)
        )
        await db.commit()

        logger.info("user_logged_in", user_id=str(user.id))

        return (
            TokenResponse(access_token=access_token, expires_in=expires_in),
            raw_refresh,
        )

    # ── Refresh ───────────────────────────────────────────────────────────────

    @staticmethod
    async def refresh(
        raw_token: str, db: AsyncSession, request: Request
    ) -> tuple[RefreshResponse, str]:
        """
        Rotate a refresh token.

        - Looks up the hashed token in user_sessions.
        - Revokes the old session and creates a new one.
        - Returns a new access token + new refresh token.

        Raises:
            401 if the token is invalid, expired, or already revoked.
        """
        token_hash = hash_refresh_token(raw_token)
        now = datetime.now(timezone.utc)

        result = await db.execute(
            select(UserSession)
            .where(UserSession.refresh_token_hash == token_hash)
            .where(UserSession.revoked_at.is_(None))
            .where(UserSession.expires_at > now)
        )
        session: UserSession | None = result.scalar_one_or_none()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token is invalid or expired. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Load user
        user_result = await db.execute(
            select(User).where(User.id == session.user_id)
        )
        user: User | None = user_result.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive.",
            )

        # Revoke old session
        session.revoked_at = now
        db.add(session)

        # Issue new tokens
        access_token, expires_in = AuthService._make_access_token(user)
        new_raw_refresh = generate_refresh_token()
        new_hash = hash_refresh_token(new_raw_refresh)
        new_expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        new_session = UserSession(
            user_id=user.id,
            refresh_token_hash=new_hash,
            device_info=request.headers.get("user-agent", "unknown")[:255],
            ip_address=request.client.host if request.client else None,
            expires_at=new_expires,
        )
        db.add(new_session)

        await AuthService._write_audit(
            db, "user.token_refresh", str(user.id), request, resource_id=str(user.id)
        )
        await db.commit()

        logger.info("token_refreshed", user_id=str(user.id))

        return (
            RefreshResponse(access_token=access_token, expires_in=expires_in),
            new_raw_refresh,
        )

    # ── Logout ────────────────────────────────────────────────────────────────

    @staticmethod
    async def logout(
        raw_token: str, db: AsyncSession, request: Request, user_id: str
    ) -> MessageResponse:
        """
        Revoke the current refresh token / session.

        The access token is short-lived so we don't track it —
        it will expire naturally within ACCESS_TOKEN_EXPIRE_MINUTES.
        """
        token_hash = hash_refresh_token(raw_token)

        await db.execute(
            update(UserSession)
            .where(UserSession.refresh_token_hash == token_hash)
            .where(UserSession.revoked_at.is_(None))
            .values(revoked_at=datetime.now(timezone.utc))
        )

        await AuthService._write_audit(
            db, "user.logout", user_id, request, resource_id=user_id
        )
        await db.commit()

        logger.info("user_logged_out", user_id=user_id)

        return MessageResponse(message="Successfully logged out.")

    # ── Get current user ──────────────────────────────────────────────────────

    @staticmethod
    async def get_current_user(token: str, db: AsyncSession) -> UserProfile:
        """
        Decode the access token and return the user profile.

        Raises:
            401 if the token is invalid or the user no longer exists.
        """
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = decode_access_token(token)
            user_id: str = payload.get("sub")
            if not user_id:
                raise credentials_exception
        except Exception:
            raise credentials_exception

        result = await db.execute(select(User).where(User.id == UUID(user_id)))
        user: User | None = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise credentials_exception

        return UserProfile(
            id=str(user.id),
            name=user.name,
            email=user.email,
            is_active=user.is_active,
            created_at=user.created_at,
        )
