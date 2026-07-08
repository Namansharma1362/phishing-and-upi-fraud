import random

# Classification threshold as per NPCI/RBI-aligned risk tiers.
FRAUD_THRESHOLD = 0.65

class UPIEnsembleModel:
    """
    Simulated Ensemble ML Model (XGBoost + LightGBM + Random Forest) for UPI Fraud.

    DISCLAIMER: This is an educational AI fraud risk assessment model inspired by
    publicly available RBI and NPCI fraud awareness guidance. It does NOT implement
    or represent any official RBI or NPCI algorithm or scoring system.

    Architecture Philosophy:
    - No single feature should classify a transaction as Fraud alone.
    - Risk is cumulative: multiple moderate signals combine into a fraud verdict.
    - Amount alone is never sufficient for fraud classification.
    - Behavioural signals (SIM swap, device change, late-night) carry high weight.
    - Combination bonuses model how real fraud patterns manifest in the wild.
    """

    def __init__(self):
        self.is_loaded = True

    def predict_proba(self, features: dict) -> float:
        """
        Computes fraud probability (0.0 to 1.0) exactly once.
        Never duplicates the probability calculation.
        All weights are documented with rationale from RBI/NPCI public advisories.
        """
        score = 0.0

        # ── STEP 1: DEVICE & IDENTITY SIGNALS ────────────────────────────────
        # RBI Circular (2021): SIM swap fraud is the most common account-takeover
        # mechanism. A recent SIM swap combined with any transaction is a critical red flag.
        if features.get("sim_swapped") == 1:
            score += 0.25

        # NPCI Advisory: Login from an international device while initiating a domestic
        # UPI transaction is behaviorally anomalous and strongly associated with fraud.
        if features.get("intl_login") == 1:
            score += 0.20

        # RBI Guidelines: A device change immediately before a large transaction
        # is a recognized indicator of account takeover attempts.
        if features.get("device_changed") == 1:
            score += 0.15

        # ── STEP 2: UPI ID REPUTATION SIGNALS ────────────────────────────────
        # NPCI: Unknown/unregistered VPA handles are frequently used in one-time
        # fraud operations since they avoid KYC linkage to a real bank account.
        if features.get("is_unknown_bank") == 1:
            score += 0.20

        # NPCI Fraud Advisory: Brand impersonation (e.g., sbi-kyc@unknown) is
        # the primary social engineering vector in UPI fraud incidents.
        if features.get("brand_impersonation") == 1:
            score += 0.20

        # RBI/NPCI: Scam keywords (cashback, refund, kyc, verify, etc.) in the
        # VPA are a strong signal that the ID was created specifically for fraud.
        # Capped at +0.30 to prevent single-feature over-classification.
        num_keywords = features.get("num_scam_keywords", 0)
        if num_keywords > 0:
            score += min(num_keywords * 0.15, 0.30)

        # ── STEP 3: BEHAVIOURAL TRANSACTION SIGNALS ───────────────────────────
        # RBI: Payments to first-time beneficiaries with no prior transaction history
        # carry inherently higher risk, especially when combined with other signals.
        if features.get("is_new_beneficiary") == 1:
            score += 0.20

        # RBI Behavioural Fraud Pattern: Transactions between midnight and 5 AM are
        # statistically overrepresented in UPI fraud cases (victim is asleep/coerced).
        hour = features.get("transaction_hour", 12)
        if 0 <= hour <= 5:
            score += 0.10

        # ── STEP 4: TRANSACTION AMOUNT ────────────────────────────────────────
        # RBI Principle: Amount alone should NEVER be sufficient for fraud classification.
        # It only adds a marginal signal proportional to the financial exposure risk.
        amount = features.get("amount", 0)
        if amount <= 5000:
            score += 0.00      # No additional risk for small amounts
        elif amount <= 25000:
            score += 0.05      # Moderate amount: small marginal risk
        elif amount <= 50000:
            score += 0.10      # High amount: moderate marginal risk
        elif amount <= 100000:
            score += 0.15      # Very high amount: elevated marginal risk
        else:
            score += 0.20      # Extremely high amount: maximum marginal risk

        # ── STEP 5: COMBINATION BONUSES ───────────────────────────────────────
        # Real-world fraud rarely relies on a single signal. These bonuses reflect
        # the compound risk when multiple suspicious signals occur simultaneously.
        # Source: NPCI Fraud Pattern Analysis (publicly available summaries).

        unknown_bank = features.get("is_unknown_bank") == 1
        has_keywords = num_keywords > 0
        new_ben = features.get("is_new_beneficiary") == 1
        sim_swap = features.get("sim_swapped") == 1
        intl = features.get("intl_login") == 1
        dev_chg = features.get("device_changed") == 1
        late_night = 0 <= hour <= 5
        brand_imp = features.get("brand_impersonation") == 1
        high_amount = amount > 25000

        # Unknown bank + scam keywords: dual VPA-level fraud indicators
        if unknown_bank and has_keywords:
            score += 0.10

        # Unknown bank + new beneficiary: no trust anchor on either side
        if unknown_bank and new_ben:
            score += 0.10

        # SIM swap + device change: strongest account takeover combination
        if sim_swap and dev_chg:
            score += 0.15

        # SIM swap + international login: remote account takeover pattern
        if sim_swap and intl:
            score += 0.20

        # Late night + high amount: coercive fraud or unauthorized access
        if late_night and high_amount:
            score += 0.10

        # Late night + new beneficiary: urgency-manipulation fraud pattern
        if late_night and new_ben:
            score += 0.10

        # Scam keywords + new beneficiary: engineered social trust attack
        if has_keywords and new_ben:
            score += 0.10

        # Brand impersonation + scam keywords: impersonation scam setup
        if brand_imp and has_keywords:
            score += 0.15

        # Large amount + unknown bank: high financial exposure with no KYC anchor
        if high_amount and unknown_bank:
            score += 0.10

        # ── STEP 6: TRANSACTION TYPE SIGNAL ──────────────────────────────────
        # NPCI Warning: Collect Requests are widely misused in refund/reward scams
        # where victim is tricked into approving an outgoing payment.
        if features.get("is_collect_request") == 1:
            score += 0.10

        # ── STEP 7: MERCHANT CATEGORY SIGNAL ─────────────────────────────────
        if features.get("is_high_risk_category") == 1:
            score += 0.08
        elif features.get("is_medium_risk_category") == 1:
            score += 0.04

        # ── STEP 8: STRUCTURAL VPA ANOMALIES ─────────────────────────────────
        # Algorithmically generated or obfuscated VPA handles often have high entropy
        # or unusual structural patterns (multiple hyphens, excessive digits).
        if features.get("entropy", 0.0) > 4.0:
            score += 0.05
        if features.get("num_hyphens", 0) >= 2:
            score += 0.05

        # Small ensemble noise to simulate model variance across classifiers
        noise = random.uniform(-0.01, 0.01)
        score += noise

        # Clamp strictly between 0.0 and 1.0
        return max(0.0, min(1.0, score))


# Singleton — instantiated once at startup, shared across all requests
upi_model = UPIEnsembleModel()
