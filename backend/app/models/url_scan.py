"""
SentinelAI — URLScan ORM Model

Records every URL scan request and its detection result.
user_id is nullable — unauthenticated scans are allowed,
but they won't appear in any user's history.

The features_json column stores the extracted feature vector
so we can audit exactly what the model saw, without recalculating.

verdict values: "PHISHING" | "LEGITIMATE" | "SUSPICIOUS"
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.prediction import Prediction


class URLScan(Base):
    __tablename__ = "url_scans"

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
    # Raw URL as submitted by the user
    url_raw: Mapped[str] = mapped_column(Text, nullable=False)
    # Normalised form (scheme added, trailing slash removed, etc.)
    url_normalized: Mapped[str] = mapped_column(Text, nullable=False, index=True)

    # Detection output
    verdict: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)

    # Extracted feature vector — persisted for audit / retraining
    features_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Performance monitoring
    scan_duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    # ── Relationships ────────────────────────────────────────
    user: Mapped["User | None"] = relationship("User", back_populates="url_scans")
    prediction: Mapped["Prediction | None"] = relationship(
        "Prediction",
        primaryjoin="Prediction.url_scan_id == URLScan.id",
        back_populates="url_scan",
        uselist=False,
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<URLScan id={self.id} verdict={self.verdict} url={self.url_raw[:40]}>"
