import { execFileSync } from "node:child_process";
import reset from "../tests/setup/global";
import { TEST_DATABASE_URL } from "./db";

/** A clean test database with the real migrations and the sandbox template, so "Try without an account" has lists to copy. */
export default async function setup() {
  await reset();
  execFileSync("npx", ["tsx", "--conditions=react-server", "scripts/seed.ts", "--template-only"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, MEDIA_PROVIDER: "fake" },
  });
}
