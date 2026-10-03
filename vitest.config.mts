import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "test/empty.ts"),
    } },
  test: {
    environment: "node",
    // Integration tests share one test database, so run files one at a time.
    fileParallelism: false,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgres://klinique:klinique@localhost:5432/klinique_test",
      SESSION_SECRET: "test-secret-test-secret-test-secret-123",
    },
  },
});
