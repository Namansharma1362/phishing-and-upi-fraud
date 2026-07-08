from pydantic import BaseModel, HttpUrl
from typing import List

class URLScanRequest(BaseModel):
    url: str

class SHAPExplanation(BaseModel):
    feature: str
    contribution: float

class URLScanResponse(BaseModel):
    url: str
    risk_score: float
    classification: str
    is_malicious: bool
    features: dict
    shap_explanations: List[SHAPExplanation]

class UPIScanRequest(BaseModel):
    upi_id: str
    transaction_amount: float
    is_new_beneficiary: bool
    transaction_hour: int
    # Optional contextual signals — all default to safe values for backward compatibility
    device_changed: bool = False
    sim_swapped: bool = False
    intl_login: bool = False
    transaction_type: str = "Send Money"
    merchant_category: str = "Other"

class UPIScanResponse(BaseModel):
    upi_id: str
    risk_score: float
    classification: str
    is_fraud: bool
    features: dict
    shap_explanations: List[SHAPExplanation]

