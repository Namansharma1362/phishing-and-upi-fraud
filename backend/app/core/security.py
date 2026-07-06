"""
SentinelAI — Security Utilities (Phase 2)

Handles:
  - bcrypt password hashing / verification
  - RS256 JWT access token creation and verification
  - Refresh token generation (random bytes → SHA-256 hash for DB storage)

Design decisions:
  - RS256 (asymmetric): private key signs, public key verifies.
    Safer than HS256 because the public key can be shared with downstream
    services without exposing the signing secret.
  - Refresh tokens are opaque random bytes — never a JWT.
    The raw token is sent to the client (HTTP-only cookie).
    Only the SHA-256 hash is stored in the DB, so a DB leak doesn't
    expose live tokens (same principle as password hashing).
  - passlib CryptContext handles bcrypt upgrades transparently.
"""

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

# ── Password Hashing ──────────────────────────────────────────────────────────
# bcrypt cost factor 12 — ~250ms on modern hardware (intentionally slow)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(plain: str) -> str:
    """Hash a plaintext password with bcrypt."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the stored bcrypt hash."""
    return pwd_context.verify(plain, hashed)


# ── JWT Access Tokens ─────────────────────────────────────────────────────────

def create_access_token(subject: str, additional_claims: dict | None = None) -> str:
    """
    Create a short-lived RS256 JWT access token.

    Args:
        subject: The user's UUID string (stored in 'sub' claim).
        additional_claims: Optional extra claims (e.g., email, role).

    Returns:
        Signed JWT string.
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": subject,
        "iat": now,
        "exp": expire,
        "type": "access",
    }
    if additional_claims:
        payload.update(additional_claims)

    return jwt.encode(
        payload,
        settings.JWT_PRIVATE_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    """
    Decode and verify a JWT access token.

    Raises:
        JWTError: If the token is invalid, expired, or tampered.

    Returns:
        Decoded payload dict.
    """
    return jwt.decode(
        token,
        settings.JWT_PUBLIC_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


# ── Refresh Tokens ────────────────────────────────────────────────────────────

def generate_refresh_token() -> str:
    """
    Generate a cryptographically secure, URL-safe random token.
    This is the raw value sent to the client as an HTTP-only cookie.

    Returns:
        64-character URL-safe string.
    """
    return secrets.token_urlsafe(48)


def hash_refresh_token(raw_token: str) -> str:
    """
    Hash the raw refresh token for database storage.
    Only the hash is persisted — the raw token is never stored.

    Returns:
        SHA-256 hex digest.
    """
    return hashlib.sha256(raw_token.encode()).hexdigest()
