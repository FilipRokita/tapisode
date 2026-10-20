import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "./client";
import { maintenanceRun, user } from "./schema";

/** Deletes sandbox users created before the cutoff. Their lists and sessions go with them. */
export async function deleteExpiredSandboxes(cutoff: Date): Promise<number> {
  const rows = await db.delete(user).where(and(eq(user.isAnonymous, true), lt(user.createdAt, cutoff))).returning({ id: user.id });
  return rows.length;
}

export async function recordRun(job: string, details: Record<string, unknown>): Promise<void> {
  await db
    .insert(maintenanceRun)
    .values({ job, lastSuccessAt: sql`now()`, details })
    .onConflictDoUpdate({ target: maintenanceRun.job, set: { lastSuccessAt: sql`now()`, details } });
}

export async function lastRun(job: string) {
  const [row] = await db.select().from(maintenanceRun).where(eq(maintenanceRun.job, job));
  return row ?? null;
}
