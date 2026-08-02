import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/wp-gutenberg-migration-translation/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    exclude: process.env.UI_TEST
      ? ["**/node_modules/**", "**/dist/**"]
      : ["**/node_modules/**", "**/dist/**", "**/*.ui.test.tsx"],
  },
});
