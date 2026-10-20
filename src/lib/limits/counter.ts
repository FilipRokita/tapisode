import "server-only";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { requestCounter } from "@/db/schema";

/**
 * Counts one event in a fixed time window and returns the count so far. The counter lives in the database
 * because serverless instances share no memory. Rows are kept for two windows, then the cron deletes them.
 */
export async function hit(key: string, windowSeconds: number, now = Date.now()): Promise<number> {
  const windowMs = windowSeconds * 1000;
  const bucket = Math.floor(now / windowMs);
  const [row] = await db
    .insert(requestCounter)
    .values({ key: `${key}:${bucket}`, count: 1, expiresAt: new Date((bucket + 2) * windowMs) })
    .onConflictDoUpdate({ target: requestCounter.key, set: { count: sql`${requestCounter.count} + 1` } })
    .returning({ count: requestCounter.count });
  return row?.count ?? Number.POSITIVE_INFINITY;
}

/** True while the caller is within `limit` events per window. */
export const allow = async (key: string, limit: number, windowSeconds: number): Promise<boolean> => (await hit(key, windowSeconds)) <= limit;

/** Sets a flag that is true until it expires. */
export async function setFlag(key: string, seconds: number): Promise<void> {
  const expiresAt = new Date(Date.now() + seconds * 1000);
  await db.insert(requestCounter).values({ key, count: 1, expiresAt }).onConflictDoUpdate({ target: requestCounter.key, set: { expiresAt } });
}

export async function hasFlag(key: string): Promise<boolean> {
  const [row] = await db.select({ key: requestCounter.key }).from(requestCounter).where(and(eq(requestCounter.key, key), gt(requestCounter.expiresAt, sql`now()`)));
  return row !== undefined;
}

export async function deleteExpiredCounters(): Promise<number> {
  const rows = await db.delete(requestCounter).where(lt(requestCounter.expiresAt, sql`now()`)).returning({ key: requestCounter.key });
  return rows.length;
}
