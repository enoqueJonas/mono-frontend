import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "rn06-*.spec.ts",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: 0,
  workers: 1,
  reporter: [["line"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.RN06_E2E_UI_URL ?? "http://127.0.0.1:3000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  outputDir: "../test-results/rn06-e2e",
});
