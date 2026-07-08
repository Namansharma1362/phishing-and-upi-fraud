class UPISHAPExplainer:
    """
    Simulates SHAP (SHapley Additive exPlanations) for the UPI fraud ensemble model.

    Design rules:
    - Only generate an explanation if the feature actually contributed to the score.
    - Explanation contributions mirror the weights used in upi_model.py exactly.
    - Combination bonuses are explained as separate entries so the user understands
      why co-occurring signals compound the risk.
    - Sorted highest contribution first.

    DISCLAIMER: Educational model inspired by RBI/NPCI fraud awareness guidance.
    Not an official RBI or NPCI algorithm.
    """

    @staticmethod
    def explain(features: dict, base_value: float = 0.05) -> list:
        explanations = []

        # Alias common features for readability
        hour = features.get("transaction_hour", 12)
        amount = features.get("amount", 0)
        num_keywords = features.get("num_scam_keywords", 0)
        detected_keywords = features.get("detected_keywords", [])
        unknown_bank = features.get("is_unknown_bank") == 1
        new_ben = features.get("is_new_beneficiary") == 1
        sim_swap = features.get("sim_swapped") == 1
        intl = features.get("intl_login") == 1
        dev_chg = features.get("device_changed") == 1
        late_night = 0 <= hour <= 5
        brand_imp = features.get("brand_impersonation") == 1
        has_keywords = num_keywords > 0
        high_amount = amount > 25000

        def add(feature: str, contribution: float):
            explanations.append({"feature": feature, "contribution": round(contribution, 2)})

        # ── Device & Identity ─────────────────────────────────────────────────
        if sim_swap:
            add("Recent SIM swap — high account takeover risk", 0.25)

        if intl:
            add("International device login detected", 0.20)

        if dev_chg:
            add("Transaction initiated from a new device", 0.15)

        # ── UPI ID Signals ────────────────────────────────────────────────────
        if brand_imp:
            brands = features.get("detected_brands", [])
            brand_str = brands[0] if brands else "known brand"
            add(f'Brand impersonation detected ("{brand_str}")', 0.20)

        if unknown_bank:
            handle = features.get("bank_handle", "unknown")
            add(f'Unknown bank handle "@{handle}" — not a registered NPCI VPA', 0.20)

        if has_keywords:
            kw_list = '", "'.join(detected_keywords[:3])
            contribution = min(num_keywords * 0.15, 0.30)
            add(f'Contains scam keyword(s): "{kw_list}"', contribution)

        # ── Behavioural Signals ───────────────────────────────────────────────
        if new_ben:
            add("Payment to a new beneficiary (no prior transaction history)", 0.20)

        if late_night:
            add(f"Late-night transaction ({hour}:00) — high-risk window (12 AM–5 AM)", 0.10)

        # ── Amount Signal (only if it added non-zero) ─────────────────────────
        if amount > 5000:
            if amount <= 25000:
                add("Moderate transaction amount (Rs.5,001–25,000)", 0.05)
            elif amount <= 50000:
                add("High transaction amount (Rs.25,001–50,000)", 0.10)
            elif amount <= 100000:
                add("Very high transaction amount (Rs.50,001–1,00,000)", 0.15)
            else:
                add("Extremely high transaction amount (above Rs.1,00,000)", 0.20)

        # ── Combination Bonuses ────────────────────────────────────────────────
        if unknown_bank and has_keywords:
            add("Combined risk: Unknown bank handle + scam keywords", 0.10)

        if unknown_bank and new_ben:
            add("Combined risk: Unknown bank handle + new beneficiary", 0.10)

        if sim_swap and dev_chg:
            add("Combined risk: SIM swap + device change (account takeover pattern)", 0.15)

        if sim_swap and intl:
            add("Combined risk: SIM swap + international login (remote takeover)", 0.20)

        if late_night and high_amount:
            add("Combined risk: Late-night + high amount", 0.10)

        if late_night and new_ben:
            add("Combined risk: Late-night + new beneficiary", 0.10)

        if has_keywords and new_ben:
            add("Combined risk: Scam keywords + new beneficiary", 0.10)

        if brand_imp and has_keywords:
            add("Combined risk: Brand impersonation + scam keywords", 0.15)

        if high_amount and unknown_bank:
            add("Combined risk: High amount + unknown bank", 0.10)

        # ── Transaction Type ──────────────────────────────────────────────────
        if features.get("is_collect_request") == 1:
            add("Collect Request — commonly abused in refund/reward scams", 0.10)

        # ── Merchant Category ─────────────────────────────────────────────────
        if features.get("is_high_risk_category") == 1:
            cat = features.get("merchant_category", "unknown")
            add(f'High-risk merchant category ("{cat}")', 0.08)
        elif features.get("is_medium_risk_category") == 1:
            cat = features.get("merchant_category", "unknown")
            add(f'Medium-risk merchant category ("{cat}")', 0.04)

        # ── Structural VPA Anomalies ──────────────────────────────────────────
        if features.get("entropy", 0.0) > 4.0:
            add("High entropy VPA (possibly algorithmically generated handle)", 0.05)

        if features.get("num_hyphens", 0) >= 2:
            add("Suspicious VPA structure (multiple hyphens)", 0.05)

        # Sort by contribution descending; only return non-zero items
        explanations.sort(key=lambda x: x["contribution"], reverse=True)
        return explanations
