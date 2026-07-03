import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // Bind to 0.0.0.0 so the Vite dev server is accessible inside Docker
    host: "0.0.0.0",
    port: 5173,
    watch: {
      usePolling: true,
    },

    // Proxy API calls to the FastAPI backend container.
    // Inside Docker, the backend is reachable via service name "backend".
    // This avoids CORS issues in development.
    proxy: {
      "/api": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
    },
  },
});
