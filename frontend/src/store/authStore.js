/**
 * SentinelAI — Zustand Auth Store
 *
 * Stores:
 *  - accessToken: short-lived JWT (in memory only — never persisted to
 *    localStorage to prevent XSS theft)
 *  - user: decoded profile from /auth/me
 *  - isAuthenticated: derived boolean
 *
 * On app load, we attempt a silent refresh via the HTTP-only cookie.
 * If the cookie is valid, we get a new access token without prompting login.
 */

import { create } from "zustand";

export const useAuthStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,       // True during initial silent-refresh on mount

  // ── Actions ────────────────────────────────────────────────────────────────

  setAccessToken: (token) =>
    set({ accessToken: token, isAuthenticated: !!token }),

  setUser: (user) => set({ user }),

  login: (token, user) =>
    set({ accessToken: token, user, isAuthenticated: true }),

  logout: () =>
    set({ accessToken: null, user: null, isAuthenticated: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  /**
   * Called once on app mount (in App.jsx or a top-level useEffect).
   * Attempts to silently get a new access token using the HTTP-only cookie.
   * On success, also fetches the user profile.
   */
  initializeAuth: async () => {
    const { setLoading, login, logout } = get();
    setLoading(true);
    try {
      // Dynamic import to avoid circular dependency
      const { authAPI } = await import("../api/client");

      const { data: refreshData } = await authAPI.refresh();
      const token = refreshData.access_token;

      const { data: meData } = await authAPI.me().catch(async () => {
        // Me failed — still set token, user stays null
        return { data: null };
      });

      login(token, meData);
    } catch {
      // No valid session — user is logged out (this is normal)
      logout();
    } finally {
      setLoading(false);
    }
  },
}));
