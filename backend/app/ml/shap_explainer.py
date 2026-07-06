class SHAPExplainer:
    """
    Simulated SHAP (SHapley Additive exPlanations) Explainer.
    In production, this would use the `shap` library (e.g., shap.TreeExplainer(model)).
    Here, it attributes the final risk score back to the most impactful features.
    """
    
    @staticmethod
    def explain(features: dict, base_value: float = 0.10) -> list[dict]:
        """
        Returns a list of feature contributions to explain the model's prediction.
        Only returns the top contributing features.
        """
        explanations = []

        detected_brands = features.get("detected_brands", [])
        detected_words = features.get("detected_words", [])
        suspicious_tld_detected = features.get("suspicious_tld_detected")
        
        if len(detected_brands) > 0:
            explanations.append({"feature": f"Brand impersonation detected ({', '.join(b.capitalize() for b in detected_brands)})", "contribution": 0.35})
            
        if len(detected_brands) > 0 and len(detected_words) > 0:
            explanations.append({"feature": "Multiple phishing indicators detected (Brand + Keyword combo)", "contribution": 0.40})

        if features.get("is_ip") == 1:
            explanations.append({"feature": "Uses IP Address instead of Domain", "contribution": 0.40})
            
        if suspicious_tld_detected:
            explanations.append({"feature": f"Suspicious Top-Level Domain ({suspicious_tld_detected})", "contribution": 0.35})
            
        if len(detected_words) > 0:
            explanations.append({"feature": f"Contains phishing keyword '{', '.join(detected_words)}'", "contribution": min(len(detected_words) * 0.15, 0.45)})
            
        entropy = features.get("entropy", 0.0)
        if entropy > 4.5:
            explanations.append({"feature": "High URL Entropy (Likely obfuscated/random)", "contribution": 0.20})
            
        if features.get("num_subdomains", 0) >= 3:
            explanations.append({"feature": "Too many subdomains", "contribution": 0.25})
            
        if features.get("num_at", 0) > 0:
            explanations.append({"feature": "Contains '@' symbol (Credential harvesting trick)", "contribution": 0.30})
            
        if features.get("is_https", 0) == 0:
            explanations.append({"feature": "No HTTPS (Insecure Connection)", "contribution": 0.15})

        # Sort by contribution descending
        explanations.sort(key=lambda x: x["contribution"], reverse=True)
        
        # Return top 3 explanations
        return explanations[:3]
