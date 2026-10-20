import { existsSync } from "node:fs";

// The same .env the app reads. Variables already set in the shell win.
if (existsSync(".env")) process.loadEnvFile(".env");

/**
 * Fills the database with the sandbox template and, locally, a dev account.
 *   npm run db:seed                    template and dev account
 *   npm run db:seed -- --template-only just the template, which is what a host needs
 *   npm run db:seed -- --if-missing    does nothing when the template already exists
 */
async function main() {
  const { getEnv } = await import("../src/config/env");
  const { seedDevUser, seedTemplate, templateExists, DEV_USER } = await import("../src/lib/seed/seed");
  if (process.argv.includes("--if-missing") && (await templateExists())) {
    console.log("Template already exists, nothing to seed.");
    return;
  }
  const provider = getEnv().MEDIA_PROVIDER;
  const templateId = await seedTemplate(provider);
  console.log(`Template ready (${provider}).`);
  if (!process.argv.includes("--template-only")) {
    await seedDevUser(templateId);
    console.log(`Dev account: ${DEV_USER.email} / ${DEV_USER.password}`);
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
