import math
import re

SCAM_KEYWORDS = {
    "cashback", "refund", "reward", "gift", "offer", "lottery", 
    "support", "bank", "kyc", "update", "secure", "verify", 
    "wallet", "otp", "bonus"
}

KNOWN_BANK_HANDLES = {
    "okicici", "okhdfcbank", "oksbi", "okaxis", "apl", "ybl", "ibl", "axl", "paytm", "upi"
}

class UPIFeatureExtractor:
    @staticmethod
    def shannon_entropy(string: str) -> float:
        """Calculate the Shannon entropy of a string."""
        if not string:
            return 0.0
        prob = [float(string.count(c)) / len(string) for c in dict.fromkeys(list(string))]
        entropy = - sum([p * math.log(p) / math.log(2.0) for p in prob])
        return entropy

    @staticmethod
    def extract_features(upi_id: str, amount: float, is_new_beneficiary: bool, hour: int) -> dict:
        upi_lower = upi_id.lower()
        parts = upi_lower.split("@")
        
        is_valid_format = 1 if len(parts) == 2 else 0
        vpa_name = parts[0] if is_valid_format else upi_lower
        bank_handle = parts[1] if is_valid_format else ""

        # Bank handle reputation
        is_known_bank = 1 if bank_handle in KNOWN_BANK_HANDLES else 0
        is_unknown_bank = 1 if is_valid_format and bank_handle not in KNOWN_BANK_HANDLES else 0

        # Character features
        num_digits = sum(c.isdigit() for c in vpa_name)
        num_hyphens = vpa_name.count("-")
        num_special_chars = sum(not c.isalnum() for c in vpa_name)

        # Scam keywords
        detected_keywords = [word for word in SCAM_KEYWORDS if word in vpa_name]
        num_scam_keywords = len(detected_keywords)

        # Amount features
        is_small_amount = 1 if amount <= 1000 else 0
        is_medium_amount = 1 if 1000 < amount <= 10000 else 0
        is_high_amount = 1 if 10000 < amount <= 50000 else 0
        is_very_high_amount = 1 if amount > 50000 else 0

        # Timing features
        is_late_night = 1 if 0 <= hour <= 5 else 0
        is_morning = 1 if 6 <= hour <= 11 else 0
        is_afternoon = 1 if 12 <= hour <= 16 else 0
        is_evening = 1 if 17 <= hour <= 23 else 0

        # Entropy & Length
        entropy = UPIFeatureExtractor.shannon_entropy(vpa_name)
        vpa_length = len(vpa_name)

        return {
            "is_valid_format": is_valid_format,
            "vpa_name": vpa_name,
            "bank_handle": bank_handle,
            "is_known_bank": is_known_bank,
            "is_unknown_bank": is_unknown_bank,
            "num_digits": num_digits,
            "num_hyphens": num_hyphens,
            "num_special_chars": num_special_chars,
            "detected_keywords": detected_keywords,
            "num_scam_keywords": num_scam_keywords,
            "amount": amount,
            "is_small_amount": is_small_amount,
            "is_medium_amount": is_medium_amount,
            "is_high_amount": is_high_amount,
            "is_very_high_amount": is_very_high_amount,
            "is_new_beneficiary": 1 if is_new_beneficiary else 0,
            "transaction_hour": hour,
            "is_late_night": is_late_night,
            "is_morning": is_morning,
            "is_afternoon": is_afternoon,
            "is_evening": is_evening,
            "entropy": entropy,
            "vpa_length": vpa_length
        }
