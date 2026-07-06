import math
import re
from urllib.parse import urlparse

TARGET_BRANDS = {
    "amazon", "google", "paypal", "microsoft", "apple", "facebook", "instagram", 
    "netflix", "icici", "hdfc", "sbi", "axis", "kotak", "phonepe", "paytm", "gpay", "upi"
}

SUSPICIOUS_WORDS = {
    "login", "signin", "verify", "verification", "secure", "security", "account", 
    "update", "bank", "netbanking", "wallet", "payment", "otp", "recover", "support", 
    "reset", "confirm", "unlock"
}

SUSPICIOUS_TLDS = {
    ".click", ".xyz", ".top", ".gq", ".cf", ".ml", ".tk", ".work", ".fit", 
    ".cam", ".loan", ".review", ".zip", ".country", ".site", ".pw", ".ga"
}

class URLFeatureExtractor:
    @staticmethod
    def shannon_entropy(string: str) -> float:
        """Calculate the Shannon entropy of a string."""
        if not string:
            return 0.0
        prob = [float(string.count(c)) / len(string) for c in dict.fromkeys(list(string))]
        entropy = - sum([p * math.log(p) / math.log(2.0) for p in prob])
        return entropy

    @staticmethod
    def extract_features(url: str) -> dict:
        """
        Extract numerical features from a URL for machine learning analysis.
        Returns a dictionary of features.
        """
        if not url.startswith(("http://", "https://")):
            url = "http://" + url  # default scheme for parsing

        parsed = urlparse(url)
        hostname = parsed.hostname or ""
        path = parsed.path or ""
        query = parsed.query or ""

        # Basic lengths
        url_length = len(url)
        hostname_length = len(hostname)
        path_length = len(path)

        # Count special characters in the whole URL
        num_dots = url.count(".")
        num_hyphens = url.count("-")
        num_at = url.count("@")
        num_query_params = url.count("&") + (1 if url.count("?") else 0)
        num_equals = url.count("=")

        # Hostname structural analysis
        is_ip = 1 if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", hostname) else 0
        
        # Subdomains count (excluding www)
        clean_host = hostname.removeprefix("www.")
        num_subdomains = clean_host.count(".") if not is_ip else 0

        # TLD checking
        tld = "." + clean_host.split(".")[-1] if "." in clean_host and not is_ip else ""
        suspicious_tld_detected = tld.lower() if tld.lower() in SUSPICIOUS_TLDS else None
        is_suspicious_tld = 1 if suspicious_tld_detected else 0

        # Security
        is_https = 1 if parsed.scheme == "https" else 0

        # Keyword and Brand analysis
        url_lower = url.lower()
        detected_words = [word for word in SUSPICIOUS_WORDS if word in url_lower]
        num_suspicious_words = len(detected_words)
        
        detected_brands = [brand for brand in TARGET_BRANDS if brand in url_lower]

        # Entropy (Phishing URLs often have high entropy due to random string generation)
        entropy = URLFeatureExtractor.shannon_entropy(url)

        return {
            "url_length": url_length,
            "hostname_length": hostname_length,
            "path_length": path_length,
            "num_dots": num_dots,
            "num_hyphens": num_hyphens,
            "num_at": num_at,
            "num_query_params": num_query_params,
            "num_equals": num_equals,
            "is_ip": is_ip,
            "num_subdomains": num_subdomains,
            "is_suspicious_tld": is_suspicious_tld,
            "suspicious_tld_detected": suspicious_tld_detected,
            "is_https": is_https,
            "num_suspicious_words": num_suspicious_words,
            "detected_words": detected_words,
            "detected_brands": detected_brands,
            "entropy": entropy
        }
