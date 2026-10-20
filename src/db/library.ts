import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { UserTitleState } from "@/domain/types";
import { db } from "./client";
import { mediaItems, userMedia } from "./schema";

export type LibraryRow = typeof userMedia.$inferSelect;

export const toState = (row: Pick<LibraryRow, "status" | "season" | "episode">): UserTitleState => ({
  status: row.status,
  position: { season: row.season, episode: row.episode },
});

export async function findRow(userId: string, mediaItemId: string): Promise<LibraryRow | null> {
  const [row] = await db.select().from(userMedia).where(and(eq(userMedia.userId, userId), eq(userMedia.mediaItemId, mediaItemId)));
  return row ?? null;
}

/** Adds a title to the user's lists. Returns null when the user already has it, so a double tap adds it once. */
export async function insertRow(userId: string, mediaItemId: string, next: UserTitleState): Promise<LibraryRow | null> {
  const [row] = await db
    .insert(userMedia)
    .values({
      userId,
      mediaItemId,
      status: next.status,
      season: next.position.season,
      episode: next.position.episode,
      startedAt: next.status === "watchlist" ? null : sql`now()`,
      completedAt: next.status === "complete" ? sql`now()` : null,
    })
    .onConflictDoNothing()
    .returning();
  return row ?? null;
}

/**
 * Changes a title's state only if it still is what the caller saw. Returns null when it is not, so a double tap,
 * a retry or a second device can never apply the same change twice.
 */
export async function compareAndSet(userId: string, mediaItemId: string, expected: UserTitleState, next: UserTitleState): Promise<LibraryRow | null> {
  const [row] = await db
    .update(userMedia)
    .set({
      status: next.status,
      season: next.position.season,
      episode: next.position.episode,
      startedAt: next.status === "watchlist" ? userMedia.startedAt : sql`COALESCE(${userMedia.startedAt}, now())`,
      completedAt: next.status === "complete" ? sql`COALESCE(${userMedia.completedAt}, now())` : null,
      activityAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(userMedia.userId, userId),
        eq(userMedia.mediaItemId, mediaItemId),
        eq(userMedia.status, expected.status),
        eq(userMedia.season, expected.position.season),
        eq(userMedia.episode, expected.position.episode),
      ),
    )
    .returning();
  return row ?? null;
}

/** Removes a title from the user's lists, only if it still is what the caller saw. */
export async function deleteIfMatches(userId: string, mediaItemId: string, expected: UserTitleState): Promise<boolean> {
  const rows = await db
    .delete(userMedia)
    .where(
      and(
        eq(userMedia.userId, userId),
        eq(userMedia.mediaItemId, mediaItemId),
        eq(userMedia.status, expected.status),
        eq(userMedia.season, expected.position.season),
        eq(userMedia.episode, expected.position.episode),
      ),
    )
    .returning({ id: userMedia.id });
  return rows.length === 1;
}

/**
 * Hands a visitor's titles to the account they just signed up or signed in with. On a clash the account's own
 * row wins. Whatever is left stays with the old user and goes when that user is deleted.
 */
export async function moveLibrary(fromUserId: string, toUserId: string): Promise<void> {
  await db.execute(sql`
    UPDATE user_media SET user_id = ${toUserId}
    WHERE user_id = ${fromUserId}
      AND media_item_id NOT IN (SELECT media_item_id FROM user_media WHERE user_id = ${toUserId})`);
}

/** Copies one user's titles to another, as they are. Used to give a sandbox visitor a filled list. */
export async function copyLibrary(fromUserId: string, toUserId: string): Promise<void> {
  await db.execute(sql`
    INSERT INTO user_media (user_id, media_item_id, status, season, episode, started_at, completed_at, activity_at)
    SELECT ${toUserId}, media_item_id, status, season, episode, started_at, completed_at, activity_at
    FROM user_media WHERE user_id = ${fromUserId}
    ON CONFLICT DO NOTHING`);
}

/** The user's state for each of the given titles, keyed `provider:type:externalId`. Titles they do not track are absent. */
export async function trackedStates(userId: string, refs: readonly { provider: string; type: string; externalId: string }[]): Promise<Map<string, UserTitleState>> {
  if (refs.length === 0) return new Map();
  const rows = await db
    .select({ provider: mediaItems.provider, type: mediaItems.mediaType, externalId: mediaItems.externalId, row: userMedia })
    .from(userMedia)
    .innerJoin(mediaItems, eq(userMedia.mediaItemId, mediaItems.id))
    .where(eq(userMedia.userId, userId));
  const wanted = new Set(refs.map((r) => `${r.provider}:${r.type}:${r.externalId}`));
  return new Map(rows.flatMap((r) => (wanted.has(`${r.provider}:${r.type}:${r.externalId}`) ? [[`${r.provider}:${r.type}:${r.externalId}`, toState(r.row)] as const] : [])));
}
