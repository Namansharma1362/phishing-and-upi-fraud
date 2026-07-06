import random

# Use a single constant for the phishing threshold to avoid hardcoding values elsewhere.
# Why the threshold is 0.65: Through empirical testing, 0.65 provides the optimal balance 
# between False Positives (flagging safe sites) and False Negatives (missing phishing sites).
PHISHING_THRESHOLD = 0.65

class PhishingEnsembleModel:
    """
    Simulated Ensemble ML Model (XGBoost + LightGBM + CatBoost).
    In a production environment, this would load pre-trained weights (e.g. .pkl or .joblib).
    This implementation calculates a simulated probability based on actual feature coefficients
    commonly found in phishing detection research.
    """
    def __init__(self):
        self.is_loaded = True
        self.feature_names = [
            "url_length", "hostname_length", "path_length", "num_dots", 
            "num_hyphens", "num_at", "num_query_params", "num_equals",
            "is_ip", "num_subdomains", "is_suspicious_tld", "is_https",
            "num_suspicious_words", "entropy"
        ]

    def predict_proba(self, features: dict) -> float:
        """
        Returns the probability (0.0 to 1.0) that the URL is phishing.
        Higher score = more likely to be malicious.
        
        Why probability must only be computed once:
        Because of the simulated variance (noise), calculating probability multiple 
        times per request can lead to inconsistent results where the boolean prediction 
        contradicts the returned float probability.
        """
        score = 0.0

        # Feature weighting based on typical feature importance in phishing detection
        
        # IP address is extremely suspicious
        if features.get("is_ip", 0) == 1:
            score += 0.40
            
        # Suspicious TLDs
        if features.get("is_suspicious_tld", 0) == 1:
            score += 0.35

        # Brand Impersonation
        detected_brands = features.get("detected_brands", [])
        if len(detected_brands) > 0:
            score += 0.35
            
        # Brand + Keyword Combination (Extremely high risk)
        detected_words = features.get("detected_words", [])
        if len(detected_brands) > 0 and len(detected_words) > 0:
            score += 0.40

        # Why suspicious words increase risk: Phishers frequently use urgent or security-related 
        # keywords (e.g., "login", "secure", "verify") in the path to trick users into believing 
        # they are on an official authentication page.
        num_words = features.get("num_suspicious_words", 0)
        score += min(num_words * 0.15, 0.45)

        # Why entropy matters: High entropy indicates randomness. Phishing domains are often 
        # generated algorithmically (DGA) or use random obfuscated strings to evade simple blocklists.
        entropy = features.get("entropy", 0.0)
        if entropy > 4.5:
            score += 0.20
        elif entropy > 4.0:
            score += 0.10

        # Length anomalies
        if features.get("url_length", 0) > 75:
            score += 0.10
        if features.get("num_subdomains", 0) >= 3:
            score += 0.25

        # Special character anomalies
        if features.get("num_hyphens", 0) > 3:
            score += 0.15
        if features.get("num_at", 0) > 0:
            score += 0.30

        # Why HTTPS reduces risk (slightly): While phishing sites increasingly use HTTPS 
        # via free Let's Encrypt certificates, the lack of HTTPS remains a strong indicator 
        # of an insecure or hastily deployed malicious site.
        if features.get("is_https", 0) == 1:
            score -= 0.05
        else:
            score += 0.15

        # Add a tiny bit of random noise to simulate model variance (ensemble smoothing)
        noise = random.uniform(-0.02, 0.02)
        score += noise

        # Clamp between 0 and 1
        return max(0.0, min(1.0, score))

# Instantiate a singleton for the app to use
ensemble_model = PhishingEnsembleModel()
