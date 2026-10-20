import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// The same .env the app reads. Variables already set in the shell win.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  // Migrations need a direct connection. Locally there is only one URL.
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "" },
});
