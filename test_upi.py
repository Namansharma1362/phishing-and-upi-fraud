import asyncio
import sys
sys.path.append('backend')
from app.services.upi_features import UPIFeatureExtractor
from app.ml.models.upi_model import upi_model, FRAUD_THRESHOLD
from app.ml.shap_explainer_upi import UPISHAPExplainer

tests = [
    {"upi": "friend@ybl", "amount": 500, "new": False, "hour": 14},
    {"upi": "cashback-offer@unknownbank", "amount": 50000, "new": True, "hour": 3},
    {"upi": "reward-support@okaxis", "amount": 20000, "new": True, "hour": 23},
]

for t in tests:
    print(f"\n--- Testing UPI: {t['upi']} ---")
    features = UPIFeatureExtractor.extract_features(t['upi'], t['amount'], t['new'], t['hour'])
    risk = upi_model.predict_proba(features)
    print(f"Risk Score: {risk:.4f}")
    if risk < 0.40:
        print("Classification: Safe")
    elif risk < FRAUD_THRESHOLD:
        print("Classification: Suspicious")
    else:
        print("Classification: Fraud")
        
    exps = UPISHAPExplainer.explain(features)
    for e in exps:
        print(f"  - {e['feature']} (+{e['contribution']:.2f})")
