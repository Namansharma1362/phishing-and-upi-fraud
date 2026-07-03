"""
SentinelAI — ORM Models Package

Importing all models here ensures they register with Base.metadata,
which is required for Alembic autogenerate to discover all tables.

Import order matters for foreign key resolution:
  Users → UserSessions, URLScans, UPIScans, AuditLogs
  ModelVersions → Predictions
  URLScans / UPIScans → Predictions
"""

from app.models.user import User
from app.models.user_session import UserSession
from app.models.model_version import ModelVersion
from app.models.url_scan import URLScan
from app.models.upi_scan import UPIScan
from app.models.prediction import Prediction
from app.models.system_log import SystemLog
from app.models.audit_log import AuditLog

__all__ = [
    "User",
    "UserSession",
    "ModelVersion",
    "URLScan",
    "UPIScan",
    "Prediction",
    "SystemLog",
    "AuditLog",
]
