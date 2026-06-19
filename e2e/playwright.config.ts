import { defineConfig, devices } from "@playwright/test";

// The frontend URL. `just verify` brings the app up (compose) before running
// these flows, so the config does not start servers itself.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : "line",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(chromiumExecutable
          ? { launchOptions: { executablePath: chromiumExecutable } }
          : {}),
      },
    },
  ],
});
