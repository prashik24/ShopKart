// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Dev-only: forward /api to your local backend
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
