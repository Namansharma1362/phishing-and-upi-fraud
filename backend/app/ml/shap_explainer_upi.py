class UPISHAPExplainer:
    """
    Simulates SHAP (SHapley Additive exPlanations) values for the UPI ensemble model.
    Returns plain-English explanations with simulated percentage contributions.
    """
    @staticmethod
    def explain(features: dict, base_value: float = 0.05) -> list:
        explanations = []

        detected_keywords = features.get("detected_keywords", [])
        if len(detected_keywords) > 0:
            explanations.append({
                "feature": f"Contains scam keyword '{', '.join(detected_keywords)}'",
                "contribution": min(len(detected_keywords) * 0.30, 0.45)
            })

        is_new_beneficiary = features.get("is_new_beneficiary", 0)
        
        if is_new_beneficiary == 1:
            explanations.append({"feature": "New beneficiary", "contribution": 0.20})
            
            if features.get("is_high_amount") == 1:
                explanations.append({"feature": "Large transaction amount", "contribution": 0.15})
            elif features.get("is_very_high_amount") == 1:
                explanations.append({"feature": "Very large transaction amount", "contribution": 0.25})
        else:
            # If it's an existing beneficiary and the amount is high, it's less risky but maybe still notable,
            # but usually SHAP would show negative contribution for existing beneficiary. We won't show it to keep it simple.
            pass

        if features.get("is_unknown_bank") == 1:
            explanations.append({"feature": "Unknown bank handle", "contribution": 0.15})

        if features.get("is_late_night") == 1:
            explanations.append({"feature": "Late-night transaction", "contribution": 0.15})

        if features.get("num_hyphens", 0) >= 2 or features.get("num_digits", 0) >= 6:
            explanations.append({"feature": "Suspicious UPI ID structure", "contribution": 0.10})
            
        entropy = features.get("entropy", 0.0)
        if entropy > 4.0:
            explanations.append({"feature": "High entropy UPI ID (randomized)", "contribution": 0.10})

        # Sort by contribution (highest first)
        explanations.sort(key=lambda x: x["contribution"], reverse=True)
        return explanations
