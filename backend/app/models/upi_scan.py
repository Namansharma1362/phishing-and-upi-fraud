"""
SentinelAI — UPIScan ORM Model

Records every UPI transaction fraud check and its result.
Stores the full transaction context that was analyzed (amount,
receiver, device signals) alongside the verdict.

verdict values: "FRAUD" | "LEGITIMATE" | "SUSPICIOUS"

Note: amount and receiver_name are nullable because a minimal
scan only requires the UPI ID; richer inputs improve accuracy.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.prediction import Prediction


class UPIScan(Base):
    __tablename__ = "upi_scans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ── Transaction Inputs ───────────────────────────────────
    upi_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    receiver_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ── Detection Output ─────────────────────────────────────
    verdict: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)

    # List of pattern names that triggered risk flags
    patterns_flagged_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Performance monitoring
    scan_duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    # ── Relationships ────────────────────────────────────────
    user: Mapped["User | None"] = relationship("User", back_populates="upi_scans")
    prediction: Mapped["Prediction | None"] = relationship(
        "Prediction",
        primaryjoin="Prediction.upi_scan_id == UPIScan.id",
        back_populates="upi_scan",
        uselist=False,
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<UPIScan id={self.id} upi_id={self.upi_id} verdict={self.verdict}>"
