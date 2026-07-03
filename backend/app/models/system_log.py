"""
SentinelAI — SystemLog ORM Model

Persistent structured log store for backend service events.
Complements real-time structlog output with queryable history.

Used for:
  - Tracking startup/shutdown events
  - Recording ML model load events
  - Alerting on CRITICAL events
  - Post-incident debugging

Note: High-frequency INFO logs should NOT be written here —
only important service lifecycle and error events.

level values: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL"
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SystemLog(Base):
    __tablename__ = "system_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    level: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    service: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    # Arbitrary structured context (request_id, user_id, etc.)
    context_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    def __repr__(self) -> str:
        return f"<SystemLog level={self.level} service={self.service}>"
