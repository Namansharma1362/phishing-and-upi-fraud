import sys
sys.path.append('backend')
from app.services.upi_features import UPIFeatureExtractor
from app.ml.models.upi_model import upi_model, FRAUD_THRESHOLD

def classify(score):
    if score < 0.40: return "Safe"
    if score < FRAUD_THRESHOLD: return "Suspicious"
    return "Fraud"

tests = [
    {
        "label": "1. rahul@ybl, Rs.500, known beneficiary (Expected: Safe)",
        "upi": "rahul@ybl", "amount": 500, "new": False, "hour": 14,
        "device_changed": False, "sim_swapped": False, "intl_login": False,
        "tx_type": "Send Money", "cat": "Other",
        "expected": "Safe"
    },
    {
        "label": "2. naman@sbi, Rs.50000, known beneficiary (Expected: Safe - high amount alone is not fraud)",
        "upi": "naman@sbi", "amount": 50000, "new": False, "hour": 14,
        "device_changed": False, "sim_swapped": False, "intl_login": False,
        "tx_type": "Send Money", "cat": "Other",
        "expected": "Safe"
    },
    {
        "label": "3. cashback-offer@unknownbank, Rs.500, no behaviour signals (Expected: Suspicious)",
        "upi": "cashback-offer@unknownbank", "amount": 500, "new": False, "hour": 14,
        "device_changed": False, "sim_swapped": False, "intl_login": False,
        "tx_type": "Send Money", "cat": "Other",
        "expected": "Suspicious"
    },
    {
        "label": "4. cashback-offer@unknownbank, Rs.75000, new ben, 2AM (Expected: Fraud)",
        "upi": "cashback-offer@unknownbank", "amount": 75000, "new": True, "hour": 2,
        "device_changed": False, "sim_swapped": False, "intl_login": False,
        "tx_type": "Send Money", "cat": "Other",
        "expected": "Fraud"
    },
    {
        "label": "5. kyc-update@unknownbank, Rs.120000, new ben, SIM+device changed (Expected: Fraud)",
        "upi": "kyc-update@unknownbank", "amount": 120000, "new": True, "hour": 14,
        "device_changed": True, "sim_swapped": True, "intl_login": False,
        "tx_type": "Send Money", "cat": "Other",
        "expected": "Fraud"
    },
    {
        "label": "6. amazonrefund@sbi, Rs.2000, existing ben (Expected: Suspicious - keyword but known bank)",
        "upi": "amazonrefund@sbi", "amount": 2000, "new": False, "hour": 14,
        "device_changed": False, "sim_swapped": False, "intl_login": False,
        "tx_type": "Send Money", "cat": "Other",
        "expected": "Suspicious"
    },
    {
        "label": "7. friend@ybl, Rs.2000, known ben, 2PM (Expected: Safe)",
        "upi": "friend@ybl", "amount": 2000, "new": False, "hour": 14,
        "device_changed": False, "sim_swapped": False, "intl_login": False,
        "tx_type": "Send Money", "cat": "Other",
        "expected": "Safe"
    },
]

print("=" * 70)
print("UPI FRAUD ENGINE - VERIFICATION SUITE")
print("=" * 70)

all_pass = True
for t in tests:
    features = UPIFeatureExtractor.extract_features(
        t['upi'], t['amount'], t['new'], t['hour'],
        t['device_changed'], t['sim_swapped'], t['intl_login'],
        t['tx_type'], t['cat']
    )
    risk = upi_model.predict_proba(features)
    actual = classify(risk)
    passed = actual == t['expected']
    if not passed:
        all_pass = False
    status = "PASS" if passed else "FAIL"
    print(f"\n[{status}] {t['label']}")
    print(f"       Score: {risk:.4f}  |  Got: {actual}  |  Expected: {t['expected']}")

print("\n" + "=" * 70)
print("ALL TESTS PASSED" if all_pass else "SOME TESTS FAILED - review weights")
print("=" * 70)
