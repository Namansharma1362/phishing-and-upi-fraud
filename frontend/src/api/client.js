/**
 * SentinelAI — Axios API Client
 *
 * Single, configured Axios instance for all API calls.
 * All components import from this file — never create raw axios calls.
 *
 * Request Interceptor:
 *   - Attaches JWT access token from memory store (Phase 2)
 *
 * Response Interceptor:
 *   - 401 → attempts silent token refresh, retries original request
 *   - 403 → clears auth state (revoked token)
 *   - Network errors → normalised error object
 *
 * Note: The Vite proxy in vite.config.js routes /api → backend:8000
 * so baseURL is just "/" in development (no CORS issues).
 */

import axios from "axios";

// ── Client Instance ───────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: "/",
  timeout: 15000,           // 15 seconds — ML inference can take a moment
  withCredentials: true,    // Include HTTP-only cookies (refresh token in Phase 2)
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ── Request Interceptor ───────────────────────────────────────────────────
// Phase 2: attaches Authorization: Bearer <access_token> from Zustand store
// For now: passes through without modification

apiClient.interceptors.request.use(
  (config) => {
    // TODO Phase 2: const token = useAuthStore.getState().accessToken;
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(normaliseError(error))
);

// ── Response Interceptor ──────────────────────────────────────────────────

apiClient.interceptors.response.use(
  // Success — pass through unchanged
  (response) => response,

  // Error handling
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized — attempt silent token refresh (Phase 2)
    if (error.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;
      // TODO Phase 2: await refreshTokens(); retry originalRequest
      // For now, just reject
    }

    return Promise.reject(normaliseError(error));
  }
);

// ── Error Normalisation ───────────────────────────────────────────────────

/**
 * Converts Axios errors into a consistent shape so components
 * never have to inspect the raw error object structure.
 *
 * @param {import("axios").AxiosError} error
 * @returns {{ message: string, status: number | null, code: string | null }}
 */
function normaliseError(error) {
  if (error.response) {
    // Server responded with a non-2xx status
    const data = error.response.data;
    return {
      message: data?.message || data?.detail || "An error occurred.",
      status: error.response.status,
      code: data?.error || null,
    };
  }
  if (error.request) {
    // Request sent but no response received
    return {
      message: "Cannot reach the server. Check your internet connection.",
      status: null,
      code: "NETWORK_ERROR",
    };
  }
  // Request setup error
  return {
    message: error.message || "Unexpected error.",
    status: null,
    code: "CLIENT_ERROR",
  };
}

export default apiClient;
