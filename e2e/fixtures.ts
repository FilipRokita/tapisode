import { test as base } from "@playwright/test";

// The limiter keys on the client IP, and every test would otherwise share localhost. Each test
// gets its own address (random per run, so a rerun does not meet the counters of the last one).
const run = Math.floor(Math.random() * 200) + 1;
let counter = 0;

export const test = base.extend({
  extraHTTPHeaders: async ({}, provide) => {
    counter += 1;
    await provide({ "x-forwarded-for": `10.${run}.${Math.floor(counter / 250)}.${(counter % 250) + 1}` });
  },
});

export { expect } from "@playwright/test";
