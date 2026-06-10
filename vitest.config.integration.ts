import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * DB integration suite — runs against the local Supabase stack
 * (`pnpm db:start`). Serial: tests share one database and the rate-limit
 * cases are time-sensitive. Never part of `pnpm check`; CI runs it as a
 * dedicated job with the stack up.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    fileParallelism: false,
    globalSetup: "./tests/db/global-setup.ts",
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
