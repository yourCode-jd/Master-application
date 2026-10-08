import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3002";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 45_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL,
    browserName: "chromium",
    headless: true,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH, args: ["--no-sandbox"] } : undefined,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  // By default the suite owns one production-style server. Set PLAYWRIGHT_BASE_URL
  // only when intentionally testing an already-running QA server.
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: "pnpm exec next start -p 3002",
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
});
