/**
 * SentinelAI — Dashboard Page (Phase 5 Stub)
 * Requires authentication — shows a login prompt for unauthenticated users.
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";

import { useAuthStore } from "../store/authStore";

export default function Dashboard() {
  useEffect(() => {
    document.title = "Dashboard — SentinelAI";
  }, []);

  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <main className="page-stub" id="dashboard-auth-gate">
        <div className="stub-icon" aria-hidden="true">🔒</div>
        <div className="stub-badge">
          <Badge variant="suspicious">Authentication Required</Badge>
        </div>
        <h1 className="stub-title">Your Dashboard</h1>
        <p className="stub-desc">
          Sign in to view your complete scan history, risk trends, and saved reports
          across all your URL and UPI checks.
        </p>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "center" }}>
          <Button as={Link} to="/login" size="lg" id="dashboard-login-btn">
            Sign In
          </Button>
          <Button as={Link} to="/register" variant="secondary" size="lg" id="dashboard-register-btn">
            Create Account
          </Button>
        </div>
      </main>
    );
  }

  // Phase 5: real dashboard content goes here
  return (
    <main className="page-stub" id="dashboard-page">
      <div className="stub-icon" aria-hidden="true">📊</div>
      <div className="stub-badge">
        <Badge variant="info">Phase 5 — Coming Soon</Badge>
      </div>
      <h1 className="stub-title">Dashboard</h1>
      <p className="stub-desc">Your scan history and analytics will appear here.</p>
    </main>
  );
}
