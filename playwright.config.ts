import { defineConfig, devices } from "@playwright/test";

// E2E verification of the conversion UI in a real browser. The suite runs
// against the Vite dev server with the production base path, uses the
// deterministic Local-only cleanup mode (no LLM key needed), and asserts that
// converted output satisfies the selected GolfNow template contract.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL: "http://localhost:5173/wp-gutenberg-migration-translation/",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --port 5173 --strictPort",
    url: "http://localhost:5173/wp-gutenberg-migration-translation/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
