/**
 * SentinelAI — Register Page (Phase 2 Stub)
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";

export default function Register() {
  useEffect(() => {
    document.title = "Create Account — SentinelAI";
  }, []);

  return (
    <main className="page-stub" id="register-page">
      <div className="stub-icon" aria-hidden="true">✨</div>
      <div className="stub-badge">
        <Badge variant="info">Phase 2 — Coming Soon</Badge>
      </div>
      <h1 className="stub-title">Create Account</h1>
      <p className="stub-desc">
        Register with your email and password to unlock scan history, saved reports,
        and dashboard analytics. bcrypt-hashed passwords, RS256 JWT tokens.
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
        <Button as={Link} to="/" variant="secondary" id="register-home-btn">
          ← Back to Home
        </Button>
        <Button as={Link} to="/login" variant="ghost" id="register-login-btn">
          Already have an account?
        </Button>
      </div>
    </main>
  );
}
