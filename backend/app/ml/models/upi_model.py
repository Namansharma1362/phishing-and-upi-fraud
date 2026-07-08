import random

# Phishing threshold from url model is 0.65.
FRAUD_THRESHOLD = 0.65

class UPIEnsembleModel:
    """
    Simulated Ensemble ML Model (XGBoost + LightGBM + Random Forest) for UPI Fraud.
    This calculates a simulated probability based on actual feature coefficients
    commonly found in financial fraud detection research.
    """
    def __init__(self):
        self.is_loaded = True

    def predict_proba(self, features: dict) -> float:
        """
        Returns the probability (0.0 to 1.0) that the UPI transaction is fraudulent.
        Higher score = more likely to be malicious.
        """
        score = 0.0

        # Scam keywords are a massive red flag (e.g. cashback-offer@ybl)
        num_keywords = features.get("num_scam_keywords", 0)
        if num_keywords > 0:
            score += min(num_keywords * 0.30, 0.45)

        # Beneficiary Trust
        if features.get("is_new_beneficiary") == 1:
            score += 0.20
            
            # High amount to new beneficiary is very suspicious
            if features.get("is_high_amount") == 1:
                score += 0.15
            elif features.get("is_very_high_amount") == 1:
                score += 0.25
        else:
            # Existing beneficiary drops the risk significantly
            score -= 0.15

        # Unknown Bank Handle
        if features.get("is_unknown_bank") == 1:
            score += 0.15

        # Timing Anomalies
        if features.get("is_late_night") == 1:
            score += 0.15

        # Structure Anomalies
        if features.get("num_hyphens", 0) >= 2:
            score += 0.10
        if features.get("num_digits", 0) >= 6:
            score += 0.10
            
        entropy = features.get("entropy", 0.0)
        if entropy > 4.0:
            score += 0.10

        # Add a tiny bit of random noise to simulate model variance (ensemble smoothing)
        noise = random.uniform(-0.02, 0.02)
        score += noise

        # Clamp between 0 and 1
        return max(0.0, min(1.0, score))

# Instantiate a singleton for the app to use
upi_model = UPIEnsembleModel()
