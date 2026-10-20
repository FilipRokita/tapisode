import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");

/** npm run catalog:kill. Deletes all provider content and stops all provider calls. See docs/catalog-data.md. */
async function main() {
  if (!process.argv.includes("--yes")) {
    console.error("This deletes all provider content and stops all provider calls. Run it again with --yes to confirm.");
    process.exit(1);
  }
  const { killSwitch } = await import("../src/lib/jobs/maintenance");
  console.log(await killSwitch());
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
