/**
 * SentinelAI — Application Shell
 *
 * Assembles the complete page structure:
 *   BrowserRouter → Layout (Navbar + main content + Footer) → Routes
 *
 * Route map:
 *   /             → Home (landing page)
 *   /scan/url     → PhishingScanner
 *   /scan/upi     → UPIChecker
 *   /dashboard    → Dashboard (auth-gated)
 *   /login        → Login
 *   /register     → Register
 *   *             → NotFound (404)
 *
 * Layout behaviour:
 *   - Navbar is fixed at top (all pages)
 *   - Footer is shown on all pages
 *   - Scroll-to-top on every route change
 */

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Navbar   from "./components/layout/Navbar";
import Footer   from "./components/layout/Footer";

import Home            from "./pages/Home";
import PhishingScanner from "./pages/PhishingScanner";
import UPIChecker      from "./pages/UPIChecker";
import Dashboard       from "./pages/Dashboard";
import Login           from "./pages/Login";
import Register        from "./pages/Register";
import NotFound        from "./pages/NotFound";

// ── Scroll Restoration ────────────────────────────────────────────────────────
// Scrolls window to top on every route change (SPA default behaviour).

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

// ── Page Layout ───────────────────────────────────────────────────────────────
// Wraps every page with consistent Navbar + Footer structure.

function AppLayout() {
  return (
    <>
      <ScrollToTop />
      <a
        href="#main-content"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
        onFocus={(e) => (e.target.style.left = "var(--space-4)")}
        onBlur={(e) => (e.target.style.left = "-9999px")}
      >
        Skip to main content
      </a>

      <Navbar />

      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/scan/url"  element={<PhishingScanner />} />
        <Route path="/scan/upi"  element={<UPIChecker />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />
        <Route path="*"          element={<NotFound />} />
      </Routes>

      <Footer />
    </>
  );
}

// ── App Root ──────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
