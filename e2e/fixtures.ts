import { test as base } from "@playwright/test";
import { withTestSql } from "./db";

// The limiter keys on the client IP, and every test would otherwise share localhost. Each test gets its own address
// (random per run, so a rerun does not meet the counters of the last one).
const run = Math.floor(Math.random() * 200) + 1;
let counter = 0;

export const test = base.extend<{ cleanup: void }>({
  extraHTTPHeaders: async ({}, provide) => {
    counter += 1;
    await provide({ "x-forwarded-for": `10.${run}.${Math.floor(counter / 250)}.${(counter % 250) + 1}` });
  },
  // The app allows 100 live demo sessions. A whole run creates more than that, so each test removes its own.
  cleanup: [
    async ({}, provide) => {
      await provide();
      await withTestSql((sql) => sql`DELETE FROM "user" WHERE is_anonymous = true`);
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
