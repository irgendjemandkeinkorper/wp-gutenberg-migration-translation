import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/wp-gutenberg-migration-translation/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    // The suite includes local HTTP servers, subprocesses, and large DOM fixtures.
    // Keep genuine hangs bounded while allowing those integration tests to share CI workers.
    testTimeout: 15_000,
    exclude: process.env.UI_TEST
      ? ["**/node_modules/**", "**/dist/**", "e2e/**"]
      : ["**/node_modules/**", "**/dist/**", "e2e/**", "**/*.ui.test.tsx"],
  },
});
