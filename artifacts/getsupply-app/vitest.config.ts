import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    env: {
      VITE_CLERK_PUBLISHABLE_KEY: "pk_test_ZXhhbXBsZS5jbGVyay5hY2NvdW50cy5kZXYk",
    },
  },
});