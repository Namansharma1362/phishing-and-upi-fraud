/**
 * SentinelAI — UPI Fraud Checker Page (Phase 4 Stub)
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";

const UPCOMING_FEATURES = [
  "UPI VPA format & keyword analysis",
  "Transaction amount & timing anomaly detection",
  "New beneficiary risk scoring",
  "Device change & SIM swap signals",
  "Transaction velocity scoring",
  "SHAP explanation per risk factor",
];

export default function UPIChecker() {
  useEffect(() => {
    document.title = "UPI Fraud Checker — SentinelAI";
  }, []);

  return (
    <main className="page-stub" id="upi-checker-page">
      <div className="stub-icon" aria-hidden="true">📱</div>

      <div className="stub-badge">
        <Badge variant="info">Phase 4 — Coming Soon</Badge>
      </div>

      <h1 className="stub-title">UPI Fraud Checker</h1>
      <p className="stub-desc">
        Enter a UPI ID and transaction context. Our fraud model evaluates
        20+ behavioural signals to give you a risk score with a plain-English explanation.
      </p>

      <div className="stub-progress">
        <div className="stub-progress-label">
          <span>Build progress</span>
          <span>Phase 1B / 5</span>
        </div>
        <div className="stub-progress-bar">
          <div className="stub-progress-fill" style={{ width: "30%" }} />
        </div>
      </div>

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
            <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>→</span>
            {f}
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "center" }}>
        <Button as={Link} to="/scan/url" variant="secondary" id="upi-scan-url-btn">
          Scan a URL instead
        </Button>
        <Button as={Link} to="/" variant="ghost" id="upi-home-btn">
          ← Back to Home
        </Button>
      </div>
    </main>
  );
}
