import math
import re

# --- RBI/NPCI-Inspired Configuration ---
# Scam keywords commonly reported by RBI and NPCI fraud awareness campaigns.
# Source: Publicly available RBI and NPCI consumer fraud awareness materials.
SCAM_KEYWORDS = {
    "kyc", "verify", "verification", "refund", "cashback", "reward",
    "offer", "support", "help", "customercare", "lottery", "prize",
    "gift", "winner", "claim", "update", "bonus", "otp", "wallet",
    "secure", "helpdesk", "care", "service", "apply", "approved"
}

# Known, trusted bank handles registered with NPCI.
KNOWN_BANK_HANDLES = {
    "okicici", "okhdfcbank", "oksbi", "okaxis", "apl", "ybl", "ibl",
    "axl", "paytm", "upi", "icici", "sbi", "hdfc", "kotak", "rbl",
    "barodampay", "indus", "pnb", "fbl", "yesbankltd", "aubank",
    "ikwik", "airtel", "jio", "pingpay", "slice", "naviaxis"
}

# Brand names commonly impersonated in UPI fraud.
BRANDS = {
    "sbi", "hdfc", "icici", "axis", "kotak", "paytm", "phonepe",
    "googlepay", "gpay", "bhim", "npci", "rbi", "amazon", "flipkart",
    "razorpay", "juspay", "upi"
}

# High-risk merchant categories per NPCI fraud pattern data.
HIGH_RISK_CATEGORIES = {
    "gift_cards", "cryptocurrency", "investment", "international_transfer"
}
MEDIUM_RISK_CATEGORIES = {
    "travel", "entertainment", "recharge"
}

# Transaction types with elevated risk profiles.
HIGH_RISK_TX_TYPES = {"collect_request"}


class UPIFeatureExtractor:
    @staticmethod
    def shannon_entropy(string: str) -> float:
        """Calculate the Shannon entropy of a string."""
        if not string:
            return 0.0
        prob = [float(string.count(c)) / len(string) for c in dict.fromkeys(list(string))]
        entropy = -sum([p * math.log(p) / math.log(2.0) for p in prob])
        return entropy

    @staticmethod
    def extract_features(
        upi_id: str,
        amount: float,
        is_new_beneficiary: bool,
        hour: int,
        device_changed: bool = False,
        sim_swapped: bool = False,
        intl_login: bool = False,
        transaction_type: str = "send_money",
        merchant_category: str = "other"
    ) -> dict:
        upi_lower = upi_id.lower().strip()
        parts = upi_lower.split("@")

        is_valid_format = 1 if len(parts) == 2 and parts[0] and parts[1] else 0
        vpa_name = parts[0] if is_valid_format else upi_lower
        bank_handle = parts[1] if is_valid_format else ""

        # --- Bank Handle Reputation ---
        is_known_bank = 1 if bank_handle in KNOWN_BANK_HANDLES else 0
        is_unknown_bank = 1 if is_valid_format and bank_handle not in KNOWN_BANK_HANDLES else 0

        # --- Character Features ---
        num_digits = sum(c.isdigit() for c in vpa_name)
        num_hyphens = vpa_name.count("-")
        num_underscores = vpa_name.count("_")
        num_dots = vpa_name.count(".")
        num_special_chars = sum(not c.isalnum() for c in vpa_name)

        # --- Scam Keyword Detection ---
        detected_keywords = [word for word in SCAM_KEYWORDS if word in vpa_name]
        num_scam_keywords = len(detected_keywords)

        # --- Brand Impersonation Detection ---
        # Check if a known brand name appears in the VPA along with suspicious words
        detected_brands = [brand for brand in BRANDS if brand in vpa_name]
        brand_impersonation = 0
        if detected_brands and (num_scam_keywords > 0 or num_hyphens > 0):
            brand_impersonation = 1

        # --- Amount Features ---
        is_small_amount = 1 if amount <= 1000 else 0
        is_medium_amount = 1 if 1000 < amount <= 10000 else 0
        is_high_amount = 1 if 10000 < amount <= 50000 else 0
        is_very_high_amount = 1 if amount > 50000 else 0

        # --- Timing Features (RBI Behavioural Guidance) ---
        # Normal: 8 AM–8 PM, Medium Risk: 8 PM–11 PM, High Risk: 11 PM–5 AM
        is_normal_hours = 1 if 8 <= hour <= 20 else 0
        is_evening_risk = 1 if 20 < hour <= 23 else 0
        is_late_night = 1 if (0 <= hour <= 5) else 0

        # Legacy timing fields for backward compat
        is_morning = 1 if 6 <= hour <= 11 else 0
        is_afternoon = 1 if 12 <= hour <= 16 else 0
        is_evening = 1 if 17 <= hour <= 23 else 0

        # --- Device & SIM Signals ---
        device_changed_flag = 1 if device_changed else 0
        sim_swapped_flag = 1 if sim_swapped else 0
        intl_login_flag = 1 if intl_login else 0

        # --- Transaction Type Risk ---
        tx_type_lower = transaction_type.lower().replace(" ", "_")
        is_collect_request = 1 if "collect" in tx_type_lower else 0
        is_high_risk_tx_type = 1 if tx_type_lower in HIGH_RISK_TX_TYPES else 0

        # --- Merchant Category Risk ---
        cat_lower = merchant_category.lower().replace(" ", "_")
        is_high_risk_category = 1 if cat_lower in HIGH_RISK_CATEGORIES else 0
        is_medium_risk_category = 1 if cat_lower in MEDIUM_RISK_CATEGORIES else 0

        # --- Entropy & Length ---
        entropy = UPIFeatureExtractor.shannon_entropy(vpa_name)
        vpa_length = len(vpa_name)

        return {
            # Identity
            "is_valid_format": is_valid_format,
            "vpa_name": vpa_name,
            "bank_handle": bank_handle,
            # Bank Handle
            "is_known_bank": is_known_bank,
            "is_unknown_bank": is_unknown_bank,
            # Structure
            "num_digits": num_digits,
            "num_hyphens": num_hyphens,
            "num_underscores": num_underscores,
            "num_dots": num_dots,
            "num_special_chars": num_special_chars,
            "vpa_length": vpa_length,
            "entropy": round(entropy, 4),
            # Threat Keywords
            "detected_keywords": detected_keywords,
            "num_scam_keywords": num_scam_keywords,
            # Brand Impersonation
            "detected_brands": detected_brands,
            "brand_impersonation": brand_impersonation,
            # Amount
            "amount": amount,
            "is_small_amount": is_small_amount,
            "is_medium_amount": is_medium_amount,
            "is_high_amount": is_high_amount,
            "is_very_high_amount": is_very_high_amount,
            # Beneficiary
            "is_new_beneficiary": 1 if is_new_beneficiary else 0,
            # Timing
            "transaction_hour": hour,
            "is_normal_hours": is_normal_hours,
            "is_evening_risk": is_evening_risk,
            "is_late_night": is_late_night,
            "is_morning": is_morning,
            "is_afternoon": is_afternoon,
            "is_evening": is_evening,
            # Device & SIM Signals
            "device_changed": device_changed_flag,
            "sim_swapped": sim_swapped_flag,
            "intl_login": intl_login_flag,
            # Transaction Context
            "transaction_type": transaction_type,
            "is_collect_request": is_collect_request,
            "is_high_risk_tx_type": is_high_risk_tx_type,
            "merchant_category": merchant_category,
            "is_high_risk_category": is_high_risk_category,
            "is_medium_risk_category": is_medium_risk_category,
        }
