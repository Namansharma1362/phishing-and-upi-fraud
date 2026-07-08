"""
SentinelAI — History API Router (Phase 5)

Provides paginated, filtered scan history endpoints for authenticated users.
Each user can only access their own scan records (enforced by user_id filter).
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserProfile
from app.schemas.history import (
    URLHistoryPage, URLHistoryItem,
    UPIHistoryPage, UPIHistoryItem,
    DashboardStats,
)
from app.models.url_scan import URLScan
from app.models.upi_scan import UPIScan

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/url", response_model=URLHistoryPage, summary="Get URL scan history")
async def get_url_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    classification: Optional[str] = Query(None, description="Filter by Safe/Suspicious/Malicious"),
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> URLHistoryPage:
    """
    Returns the authenticated user's URL scan history, newest first.
    Only returns scans belonging to this user (enforced by user_id filter).
    """
    user_uuid = uuid.UUID(current_user.id)
    offset = (page - 1) * limit

    # Base filter: only this user's scans
    filters = [URLScan.user_id == user_uuid]
    if classification:
        filters.append(URLScan.verdict == classification.upper())

    # Count total matching rows
    count_query = select(func.count()).select_from(URLScan).where(*filters)
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Fetch paginated rows
    query = (
        select(URLScan)
        .where(*filters)
        .order_by(desc(URLScan.created_at))
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    rows = result.scalars().all()

    items = [
        URLHistoryItem(
            id=str(row.id),
            url=row.url_raw,
            risk_score=row.confidence,
            classification=row.verdict.capitalize() if row.verdict else "Unknown",
            is_malicious=row.verdict == "MALICIOUS",
            created_at=row.created_at,
        )
        for row in rows
    ]

    return URLHistoryPage(items=items, total=total, page=page, limit=limit)


@router.get("/upi", response_model=UPIHistoryPage, summary="Get UPI scan history")
async def get_upi_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    classification: Optional[str] = Query(None, description="Filter by Safe/Suspicious/Fraud"),
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UPIHistoryPage:
    """
    Returns the authenticated user's UPI scan history, newest first.
    Only returns scans belonging to this user (enforced by user_id filter).
    """
    user_uuid = uuid.UUID(current_user.id)
    offset = (page - 1) * limit

    filters = [UPIScan.user_id == user_uuid]
    if classification:
        filters.append(UPIScan.verdict == classification.upper())

    count_query = select(func.count()).select_from(UPIScan).where(*filters)
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = (
        select(UPIScan)
        .where(*filters)
        .order_by(desc(UPIScan.created_at))
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    rows = result.scalars().all()

    items = [
        UPIHistoryItem(
            id=str(row.id),
            upi_id=row.upi_id,
            amount=row.amount or 0.0,
            risk_score=row.risk_score / 100.0,  # stored as int 0-100, convert back to 0-1
            classification=row.verdict.capitalize() if row.verdict else "Unknown",
            is_fraud=row.verdict == "FRAUD",
            created_at=row.created_at,
        )
        for row in rows
    ]

    return UPIHistoryPage(items=items, total=total, page=page, limit=limit)


@router.get("/dashboard", response_model=DashboardStats, summary="Get dashboard statistics")
async def get_dashboard_stats(
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardStats:
    """
    Returns aggregated statistics and last 5 scans of each type for the dashboard.
    Single efficient query per table — no N+1 problems.
    """
    user_uuid = uuid.UUID(current_user.id)

    # ── URL Stats ────────────────────────────────────────────────────────────
    url_count_q = select(func.count()).select_from(URLScan).where(URLScan.user_id == user_uuid)
    url_phishing_q = select(func.count()).select_from(URLScan).where(
        URLScan.user_id == user_uuid, URLScan.verdict == "MALICIOUS"
    )
    url_avg_q = select(func.avg(URLScan.confidence)).where(URLScan.user_id == user_uuid)
    url_recent_q = (
        select(URLScan)
        .where(URLScan.user_id == user_uuid)
        .order_by(desc(URLScan.created_at))
        .limit(5)
    )

    # ── UPI Stats ────────────────────────────────────────────────────────────
    upi_count_q = select(func.count()).select_from(UPIScan).where(UPIScan.user_id == user_uuid)
    upi_fraud_q = select(func.count()).select_from(UPIScan).where(
        UPIScan.user_id == user_uuid, UPIScan.verdict == "FRAUD"
    )
    upi_recent_q = (
        select(UPIScan)
        .where(UPIScan.user_id == user_uuid)
        .order_by(desc(UPIScan.created_at))
        .limit(5)
    )

    # Execute all queries
    total_url = (await db.execute(url_count_q)).scalar_one()
    phishing = (await db.execute(url_phishing_q)).scalar_one()
    avg_risk_raw = (await db.execute(url_avg_q)).scalar_one()
    url_rows = (await db.execute(url_recent_q)).scalars().all()

    total_upi = (await db.execute(upi_count_q)).scalar_one()
    fraud = (await db.execute(upi_fraud_q)).scalar_one()
    upi_rows = (await db.execute(upi_recent_q)).scalars().all()

    avg_risk = round(float(avg_risk_raw or 0.0), 3)

    recent_url = [
        URLHistoryItem(
            id=str(r.id),
            url=r.url_raw,
            risk_score=r.confidence,
            classification=r.verdict.capitalize() if r.verdict else "Unknown",
            is_malicious=r.verdict == "MALICIOUS",
            created_at=r.created_at,
        )
        for r in url_rows
    ]

    recent_upi = [
        UPIHistoryItem(
            id=str(r.id),
            upi_id=r.upi_id,
            amount=r.amount or 0.0,
            risk_score=r.risk_score / 100.0,
            classification=r.verdict.capitalize() if r.verdict else "Unknown",
            is_fraud=r.verdict == "FRAUD",
            created_at=r.created_at,
        )
        for r in upi_rows
    ]

    return DashboardStats(
        total_url_scans=total_url,
        phishing_detected=phishing,
        total_upi_scans=total_upi,
        fraud_detected=fraud,
        avg_risk_score=avg_risk,
        recent_url_scans=recent_url,
        recent_upi_scans=recent_upi,
    )
