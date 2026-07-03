"""
SentinelAI — ModelVersion ORM Model

Tracks every trained model artifact with its evaluation metrics.
This is the ML model registry — enables version control, rollback,
and A/B testing of phishing/UPI models.

Only one ModelVersion per model_type should have is_active=True.
The inference layer always loads the active version at startup.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Float, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.prediction import Prediction


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    # "phishing" | "upi"
    model_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    algorithm: Mapped[str] = mapped_column(String(100), nullable=False)
    training_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # ── Evaluation Metrics ───────────────────────────────────
    f1_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    auc_roc: Mapped[float | None] = mapped_column(Float, nullable=True)
    precision: Mapped[float | None] = mapped_column(Float, nullable=True)
    recall: Mapped[float | None] = mapped_column(Float, nullable=True)
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    dataset_size: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Deployment State ────────────────────────────────────
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    artifact_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # ── Relationships ────────────────────────────────────────
    predictions: Mapped[list["Prediction"]] = relationship(
        "Prediction",
        back_populates="model_version",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<ModelVersion type={self.model_type} version={self.version} "
            f"active={self.is_active} f1={self.f1_score}>"
        )
