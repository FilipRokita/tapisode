import { defineConfig, devices } from "@playwright/test";
import { TEST_DATABASE_URL } from "./e2e/db";

const PORT = 3210;

export default defineConfig({
  testDir: "e2e",
  // Runs after the web server starts: drops and re-migrates the test database and seeds the sandbox template,
  // so every run starts with no accounts, no limiter counters and no cached titles.
  globalSetup: "./e2e/global-setup.ts",
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  // The production build, so the tests see what a visitor sees.
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { DATABASE_URL: TEST_DATABASE_URL, BETTER_AUTH_URL: `http://localhost:${PORT}`, MEDIA_PROVIDER: "fake" },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
});
