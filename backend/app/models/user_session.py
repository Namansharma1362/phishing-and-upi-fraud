"""
SentinelAI — UserSession ORM Model

Tracks active refresh token sessions per user.
Enables:
  - Multi-device login management
  - Token revocation (blacklisting)
  - Session audit trail (IP, device info)

Security: refresh_token_hash stores SHA-256 of the raw token,
never the token itself. Raw token lives only in the HTTP-only cookie.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # SHA-256 hash of the raw refresh token — never store raw tokens
    refresh_token_hash: Mapped[str] = mapped_column(
        String(64),  # SHA-256 hex digest = 64 chars
        unique=True,
        nullable=False,
        index=True,
    )
    # User-Agent string for device identification
    device_info: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # IPv6 max length = 45 chars
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    # Set when the user explicitly logs out or token is rotated
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ────────────────────────────────────────
    user: Mapped["User"] = relationship("User", back_populates="sessions")

    @property
    def is_valid(self) -> bool:
        """True if the session is not revoked and not expired."""
        from datetime import timezone
        now = datetime.now(tz=timezone.utc)
        return self.revoked_at is None and self.expires_at > now

    def __repr__(self) -> str:
        return f"<UserSession user_id={self.user_id} valid={self.is_valid}>"
