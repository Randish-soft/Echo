import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,               // 0.0.0.0 to work in Docker
    port: 5173,
    strictPort: true,
    watch: { usePolling: true },  // reliable file watching in Docker Desktop
    proxy: {
      "/api": {
        target: "http://api-dev:8080", // Docker service name from compose.dev
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: true
  }
});
