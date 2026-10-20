import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Fixed-window counters behind the request limits. Serverless has no shared memory, so they live here. */
export const requestCounter = pgTable(
  "request_counter",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("request_counter_expires_idx").on(t.expiresAt)],
);

/** When each scheduled job last finished. */
export const maintenanceRun = pgTable("maintenance_run", {
  job: text("job").primaryKey(),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }).notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
});
