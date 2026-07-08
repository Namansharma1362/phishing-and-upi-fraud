from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.auth import UserProfile
from app.schemas.scan import URLScanRequest, URLScanResponse, UPIScanRequest, UPIScanResponse, SHAPExplanation
from app.services.url_features import URLFeatureExtractor
from app.ml.models.ensemble_model import ensemble_model, PHISHING_THRESHOLD
from app.ml.shap_explainer import SHAPExplainer
from app.services.upi_features import UPIFeatureExtractor
from app.ml.models.upi_model import upi_model, FRAUD_THRESHOLD
from app.ml.shap_explainer_upi import UPISHAPExplainer

router = APIRouter(prefix="/scan", tags=["Scanning"])

@router.post("/url", response_model=URLScanResponse, summary="Scan a URL for phishing")
async def scan_url(
    data: URLScanRequest,
    current_user: UserProfile = Depends(get_current_user)
) -> URLScanResponse:
    """
    Analyzes a URL for phishing indicators using ensemble ML models and SHAP.
    Requires authentication.
    """
    # 0. Validate URL
    # We only accept fully qualified HTTP/HTTPS URLs.
    if not data.url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL. Please provide a valid HTTP or HTTPS URL."
        )

    # Simulate a slight processing delay to mimic real ML inference pipeline (0.5s to 1.5s)
    await asyncio.sleep(0.8)

    # 1. Feature Extraction
    features = URLFeatureExtractor.extract_features(data.url)

    # 2. ML Prediction (Compute probability exactly once)
    risk_score = ensemble_model.predict_proba(features)
    is_malicious = risk_score >= PHISHING_THRESHOLD

    # 3. Classification mapping
    # Why we distinguish between Safe, Suspicious, and Malicious:
    # A simple binary (is_malicious) is necessary for backward compatibility with 
    # existing API integrations. However, a ternary classification improves the User 
    # Experience (UX). It allows the frontend to show yellow warnings for "Suspicious" 
    # sites (0.40 - 0.64), rather than confusing users by marking moderately risky 
    # sites as perfectly "Safe" (0.0 - 0.39) just because they haven't crossed the 
    # strict 0.65 threshold.
    if risk_score < 0.40:
        classification = "Safe"
    elif risk_score < PHISHING_THRESHOLD:
        classification = "Suspicious"
    else:
        classification = "Malicious"

    # 4. SHAP Explainability
    raw_explanations = SHAPExplainer.explain(features, base_value=0.10)
    shap_explanations = [
        SHAPExplanation(feature=exp["feature"], contribution=exp["contribution"])
        for exp in raw_explanations
    ]

    # In Phase 5, we will save this result to the database linked to current_user.id
    
    return URLScanResponse(
        url=data.url,
        risk_score=risk_score,
        classification=classification,
        is_malicious=is_malicious,
        features=features,
        shap_explanations=shap_explanations
    )

@router.post("/upi", response_model=UPIScanResponse, summary="Scan a UPI ID for fraud")
async def scan_upi(
    data: UPIScanRequest,
    current_user: UserProfile = Depends(get_current_user)
) -> UPIScanResponse:
    """
    Analyzes a UPI transaction context for fraud indicators using ML models and SHAP.
    Requires authentication.
    """
    # 0. Validate Input
    if not (0 <= data.transaction_hour <= 23):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction hour. Must be between 0 and 23."
        )
    if data.transaction_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid amount. Must be greater than 0."
        )
    if "@" not in data.upi_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UPI format. Must contain '@'."
        )

    await asyncio.sleep(0.5)

    # 1. Feature Extraction
    features = UPIFeatureExtractor.extract_features(
        data.upi_id, data.transaction_amount, data.is_new_beneficiary, data.transaction_hour
    )

    # 2. ML Prediction
    risk_score = upi_model.predict_proba(features)
    is_fraud = risk_score >= FRAUD_THRESHOLD

    # 3. Classification mapping
    if risk_score < 0.40:
        classification = "Safe"
    elif risk_score < FRAUD_THRESHOLD:
        classification = "Suspicious"
    else:
        classification = "Fraud"

    # 4. SHAP Explainability
    raw_explanations = UPISHAPExplainer.explain(features, base_value=0.10)
    shap_explanations = [
        SHAPExplanation(feature=exp["feature"], contribution=exp["contribution"])
        for exp in raw_explanations
    ]

    return UPIScanResponse(
        upi_id=data.upi_id,
        risk_score=risk_score,
        classification=classification,
        is_fraud=is_fraud,
        features=features,
        shap_explanations=shap_explanations
    )
