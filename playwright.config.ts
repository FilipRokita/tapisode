import { defineConfig, devices } from "@playwright/test";

const PORT = 3210;
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://tapisode:tapisode@localhost:5432/tapisode_test";

export default defineConfig({
  testDir: "e2e",
  // Runs after the web server starts: drops and re-migrates the test database, so every run
  // starts with no sandboxes, no limiter counters and no cached titles.
  globalSetup: "./tests/setup/global.ts",
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
