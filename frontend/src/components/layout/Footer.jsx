/**
 * SentinelAI — Footer Component
 */

import { Link } from "react-router-dom";

const PRODUCT_LINKS = [
  { to: "/scan/url",  label: "Phishing Scanner" },
  { to: "/scan/upi",  label: "UPI Fraud Checker" },
  { to: "/dashboard", label: "Dashboard" },
];

const COMPANY_LINKS = [
  { to: "/",       label: "About" },
  { to: "/",       label: "Security" },
  { to: "/",       label: "Privacy Policy" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-inner">

          {/* ── Brand ─────────────────────────────────── */}
          <div>
            <div className="footer-brand-name">
              <span aria-hidden="true">🛡️</span>
              SentinelAI
            </div>
            <p className="footer-brand-desc">
              AI-powered phishing and UPI fraud detection with real-time explainability.
              Protect yourself and your community from digital fraud.
            </p>
          </div>

          {/* ── Product Links ─────────────────────────── */}
          <div>
            <p className="footer-col-title">Product</p>
            <ul className="footer-links" role="list">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Company Links ─────────────────────────── */}
          <div>
            <p className="footer-col-title">Company</p>
            <ul className="footer-links" role="list">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* ── Bottom Bar ───────────────────────────────── */}
        <div className="footer-bottom">
          <p className="footer-copy">
            © {year} SentinelAI. Built for cybersecurity awareness.
          </p>
          <p className="footer-copy" style={{ color: "var(--color-text-muted)" }}>
            Made with 🛡️ for a safer internet
          </p>
        </div>
      </div>
    </footer>
  );
}
