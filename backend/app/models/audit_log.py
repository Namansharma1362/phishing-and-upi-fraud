"""
SentinelAI — AuditLog ORM Model

Immutable record of all data-modifying actions in the system.
Answers "who did what, to which resource, when, from where."

Required for:
  - Security compliance (GDPR, ISO 27001)
  - Forensic investigation after incidents
  - Detecting abuse patterns (bulk scans, repeated login attempts)

Design: AuditLog rows are NEVER updated or deleted.
They are an append-only ledger.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    # Nullable — anonymous actions (e.g., unauthenticated scan) have no user
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # e.g., "USER_LOGIN", "USER_LOGOUT", "URL_SCAN", "UPI_SCAN"
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # e.g., "users", "url_scans", "upi_scans"
    resource: Mapped[str] = mapped_column(String(100), nullable=False)
    # UUID or identifier of the affected resource row
    resource_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Network context
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # State capture for data-modification actions (nullable for read actions)
    old_value_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    new_value_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    # ── Relationships ────────────────────────────────────────
    user: Mapped["User | None"] = relationship("User", back_populates="audit_logs")

    def __repr__(self) -> str:
        return (
            f"<AuditLog action={self.action} resource={self.resource} "
            f"user_id={self.user_id}>"
        )
