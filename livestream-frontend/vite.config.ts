import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis",
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true, // Enable WebSocket proxy
      },
      "/live": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "/videos": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
    },
  },
});
