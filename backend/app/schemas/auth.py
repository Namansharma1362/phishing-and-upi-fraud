"""
SentinelAI — Auth Pydantic Schemas (Phase 2)

Defines request/response shapes for all authentication endpoints.
Pydantic validates and sanitizes all input before it reaches business logic.
"""

import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Register ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Enforce: at least one letter, one digit."""
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        return v

    @field_validator("name")
    @classmethod
    def name_no_html(cls, v: str) -> str:
        """Strip leading/trailing whitespace; reject obvious HTML."""
        v = v.strip()
        if "<" in v or ">" in v:
            raise ValueError("Name contains invalid characters.")
        return v


class RegisterResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int          # seconds until access token expires


# ── Me (current user profile) ─────────────────────────────────────────────────

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    is_active: bool
    created_at: datetime


# ── Refresh ───────────────────────────────────────────────────────────────────

class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


# ── Generic message ───────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str
