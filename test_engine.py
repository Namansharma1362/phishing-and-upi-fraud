import asyncio
import os
import sys

# Add the backend dir to the python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.ml.models.ensemble_model import ensemble_model, PHISHING_THRESHOLD
from app.services.url_features import URLFeatureExtractor
from app.ml.shap_explainer import SHAPExplainer

urls_to_test = [
    "https://google.com",
    "https://motionsites.ai",
    "https://amazon-login-security-example.click",
    "https://icici-bank-login-example.site",
    "http://amazon.verify-account.free",
    "http://paypal-login-security-update.xyz",
    "naman"
]

for url in urls_to_test:
    print(f"\n--- Testing URL: {url} ---")
    if not url.startswith(("http://", "https://")):
        print("Result: HTTP 400 Bad Request - Invalid URL")
        continue
    
    features = URLFeatureExtractor.extract_features(url)
    risk_score = ensemble_model.predict_proba(features)
    is_malicious = risk_score >= PHISHING_THRESHOLD
    
    if risk_score < 0.40:
        classification = "Safe"
    elif risk_score < PHISHING_THRESHOLD:
        classification = "Suspicious"
    else:
        classification = "Malicious"
    
    print(f"Risk Score: {risk_score:.4f}")
    print(f"Classification: {classification}")
    print(f"Is Malicious: {is_malicious}")
    
    raw_explanations = SHAPExplainer.explain(features, base_value=0.10)
    print("SHAP Explanations:")
    for exp in raw_explanations:
        print(f"  - {exp['feature']} (+{exp['contribution']:.2f})")
