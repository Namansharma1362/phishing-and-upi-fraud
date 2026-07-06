/**
 * SentinelAI — Navbar Component
 *
 * Behaviour:
 *   - Transparent over the hero section (top of page)
 *   - Switches to solid frosted-glass after 60px scroll
 *   - Active link detection via React Router's useLocation
 *   - Mobile: hamburger menu toggles nav links
 */

import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { useAuthStore } from "../../store/authStore";
import { authAPI } from "../../api/client";

const NAV_LINKS = [
  { to: "/",          label: "Home",        exact: true },
  { to: "/scan/url",  label: "Scan URL"                },
  { to: "/scan/upi",  label: "Check UPI"               },
  { to: "/dashboard", label: "Dashboard"               },
];

export default function Navbar() {
  const [scrolled, setScrolled]         = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } finally {
      logout();
      navigate("/login");
    }
  };

  // ── Scroll listener ─────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMenuOpen(false), [navigate]);

  return (
    <header
      id="navbar"
      className={`navbar ${scrolled || menuOpen ? "navbar-solid" : "navbar-transparent"}`}
      role="banner"
    >
      <div className="container navbar-inner">

        {/* ── Logo ─────────────────────────────────────── */}
        <Link to="/" className="navbar-logo" aria-label="SentinelAI home">
          <span className="navbar-logo-icon" aria-hidden="true">🛡️</span>
          <span className="navbar-logo-text">SentinelAI</span>
        </Link>

        {/* ── Desktop Navigation ───────────────────────── */}
        <nav aria-label="Main navigation">
          <ul className="navbar-nav" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.exact}
                  className={({ isActive }) =>
                    `navbar-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Desktop Auth Actions ─────────────────────── */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <span style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginRight: "8px" }}>
                {user?.name || "User"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                id="navbar-logout-btn"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                as={Link}
                to="/login"
                variant="ghost"
                size="sm"
                id="navbar-login-btn"
              >
                Sign In
              </Button>
              <Button
                as={Link}
                to="/register"
                variant="primary"
                size="sm"
                id="navbar-register-btn"
              >
                Get Started
              </Button>
            </>
          )}

          {/* ── Mobile Hamburger ──────────────────────── */}
          <button
            id="navbar-hamburger"
            className="navbar-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span style={menuOpen ? { transform: "rotate(45deg) translate(5px, 5px)" } : {}} />
            <span style={menuOpen ? { opacity: 0 } : {}} />
            <span style={menuOpen ? { transform: "rotate(-45deg) translate(5px, -5px)" } : {}} />
          </button>
        </div>
      </div>

      {/* ── Mobile Menu Drawer ───────────────────────────── */}
      {menuOpen && (
        <div
          style={{
            background: "var(--color-bg-surface)",
            borderTop: "1px solid var(--color-border)",
            padding: "var(--space-4) var(--space-6)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exact}
              className={({ isActive }) =>
                `navbar-nav-link ${isActive ? "active" : ""}`
              }
              style={{ padding: "var(--space-3) var(--space-3)" }}
            >
              {link.label}
            </NavLink>
          ))}
          <div style={{ height: 1, background: "var(--color-border)", margin: "var(--space-2) 0" }} />
          {isAuthenticated ? (
            <>
              <div style={{ padding: "var(--space-3)", color: "var(--color-text-secondary)" }}>
                {user?.name || "User"}
              </div>
              <button
                onClick={handleLogout}
                className="navbar-nav-link"
                style={{ padding: "var(--space-3)", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="navbar-nav-link" style={{ padding: "var(--space-3)" }}>Sign In</Link>
              <Link to="/register" className="navbar-nav-link" style={{ padding: "var(--space-3)" }}>Get Started →</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
