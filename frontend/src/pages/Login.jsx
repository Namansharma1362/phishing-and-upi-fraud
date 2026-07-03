/**
 * SentinelAI — Login Page (Phase 2 Stub)
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";

export default function Login() {
  useEffect(() => {
    document.title = "Sign In — SentinelAI";
  }, []);

  return (
    <main className="page-stub" id="login-page">
      <div className="stub-icon" aria-hidden="true">🔑</div>
      <div className="stub-badge">
        <Badge variant="info">Phase 2 — Coming Soon</Badge>
      </div>
      <h1 className="stub-title">Sign In</h1>
      <p className="stub-desc">
        JWT-based authentication with email and password is being built in Phase 2.
        RS256-signed access tokens + HTTP-only refresh token cookies.
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

      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "center" }}>
        <Button as={Link} to="/" variant="secondary" id="login-home-btn">
          ← Back to Home
        </Button>
        <Button as={Link} to="/register" variant="ghost" id="login-register-btn">
          Create account instead
        </Button>
      </div>
    </main>
  );
}
