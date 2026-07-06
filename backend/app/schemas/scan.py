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
