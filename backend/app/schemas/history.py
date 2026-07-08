"""
SentinelAI — History Pydantic Schemas (Phase 5)

Response shapes for the scan history endpoints.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class URLHistoryItem(BaseModel):
    id: str
    url: str
    risk_score: float
    classification: str
    is_malicious: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UPIHistoryItem(BaseModel):
    id: str
    upi_id: str
    amount: float
    risk_score: float
    classification: str
    is_fraud: bool
    created_at: datetime

    class Config:
        from_attributes = True


class URLHistoryPage(BaseModel):
    items: List[URLHistoryItem]
    total: int
    page: int
    limit: int


class UPIHistoryPage(BaseModel):
    items: List[UPIHistoryItem]
    total: int
    page: int
    limit: int


class DashboardStats(BaseModel):
    total_url_scans: int
    phishing_detected: int
    total_upi_scans: int
    fraud_detected: int
    avg_risk_score: float
    recent_url_scans: List[URLHistoryItem]
    recent_upi_scans: List[UPIHistoryItem]
