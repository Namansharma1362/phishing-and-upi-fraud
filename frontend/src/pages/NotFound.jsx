/**
 * SentinelAI — 404 Not Found Page
 */

import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../components/common/Button";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    document.title = "Page Not Found — SentinelAI";
  }, []);

  return (
    <main className="not-found" id="not-found-page">
      <p className="not-found-code" aria-label="Error 404">404</p>
      <h1 className="not-found-title">Page Not Found</h1>
      <p className="not-found-desc">
        <code
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-brand-primary)",
            background: "var(--color-brand-muted)",
            padding: "2px 8px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {location.pathname}
        </code>{" "}
        doesn't exist. Maybe it moved, or you typed it wrong.
      </p>
      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "center" }}>
        <Button as={Link} to="/" id="not-found-home-btn">
          ← Back to Home
        </Button>
        <Button as={Link} to="/scan/url" variant="secondary" id="not-found-scan-btn">
          Scan a URL
        </Button>
      </div>
    </main>
  );
}
