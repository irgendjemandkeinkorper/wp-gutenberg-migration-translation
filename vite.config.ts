import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/wp-gutenberg-migration-translation/",
  plugins: [react()],
  test: {
    environment: "jsdom",
  },
});
