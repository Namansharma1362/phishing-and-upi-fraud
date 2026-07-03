/**
 * SentinelAI — Phishing Scanner Page (Phase 3 Stub)
 *
 * Full implementation arrives in Phase 3.
 * This stub shows the page exists in the router with a meaningful
 * preview of what the completed feature will look like.
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";

const UPCOMING_FEATURES = [
  "25+ URL feature extraction",
  "6-model ML comparison (LR, DT, RF, XGBoost, LightGBM, CatBoost)",
  "Soft-voting ensemble of top 3 models",
  "SHAP waterfall & feature importance charts",
  "Plain-English verdict explanation",
  "Result cached for 1 hour (Redis)",
];

export default function PhishingScanner() {
  useEffect(() => {
    document.title = "Phishing Scanner — SentinelAI";
  }, []);

  return (
    <main className="page-stub" id="phishing-scanner-page">
      <div className="stub-icon" aria-hidden="true">🎣</div>

      <div className="stub-badge">
        <Badge variant="info">Phase 3 — Coming Soon</Badge>
      </div>

      <h1 className="stub-title">Phishing URL Scanner</h1>
      <p className="stub-desc">
        Paste any suspicious link and our ML engine will analyse 25+ features
        to classify it as safe, suspicious, or phishing — with a full SHAP explanation.
      </p>

      {/* Build progress indicator */}
      <div className="stub-progress">
        <div className="stub-progress-label">
          <span>Build progress</span>
          <span>Phase 1B / 5</span>
        </div>
        <div className="stub-progress-bar">
          <div className="stub-progress-fill" style={{ width: "30%" }} />
        </div>
      </div>

      {/* Feature preview list */}
      <ul
        style={{
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          marginBottom: "var(--space-8)",
          maxWidth: 380,
          width: "100%",
          textAlign: "left",
        }}
        aria-label="Upcoming features"
      >
        {UPCOMING_FEATURES.map((f) => (
          <li
            key={f}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-secondary)",
            }}
          >
            <span style={{ color: "var(--color-brand-primary)", fontWeight: 700 }}>→</span>
            {f}
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "center" }}>
        <Button as={Link} to="/scan/upi" variant="secondary" id="scanner-check-upi-btn">
          Check a UPI ID instead
        </Button>
        <Button as={Link} to="/" variant="ghost" id="scanner-home-btn">
          ← Back to Home
        </Button>
      </div>
    </main>
  );
}
