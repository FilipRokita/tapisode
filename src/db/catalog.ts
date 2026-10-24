import "server-only";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import type { ProviderTitle } from "@/domain/provider";
import type { TitleRef } from "@/domain/types";
import { db } from "./client";
import { mediaAvailability, mediaContent, mediaItems, userMedia } from "./schema";

export type ContentRow = typeof mediaContent.$inferSelect;
export type ItemRow = typeof mediaItems.$inferSelect;

export async function upsertItem(ref: TitleRef, imdbId: string | null): Promise<string> {
  const [row] = await db
    .insert(mediaItems)
    .values({ provider: ref.provider, mediaType: ref.type, externalId: ref.externalId, imdbId })
    .onConflictDoUpdate({ target: [mediaItems.provider, mediaItems.mediaType, mediaItems.externalId], set: { imdbId: sql`COALESCE(excluded.imdb_id, ${mediaItems.imdbId})` } })
    .returning({ id: mediaItems.id });
  return row!.id;
}

export async function findItem(ref: TitleRef): Promise<ItemRow | null> {
  const [row] = await db
    .select()
    .from(mediaItems)
    .where(and(eq(mediaItems.provider, ref.provider), eq(mediaItems.mediaType, ref.type), eq(mediaItems.externalId, ref.externalId)));
  return row ?? null;
}

export async function saveContent(itemId: string, t: ProviderTitle): Promise<void> {
  const values = {
    mediaItemId: itemId,
    title: t.title,
    overview: t.overview,
    releaseDate: t.releaseDate,
    posterPath: t.posterPath,
    backdropPath: t.backdropPath,
    runtimeMinutes: t.runtimeMinutes,
    movieReleased: t.series ? null : t.released,
    seriesState: t.series?.state ?? null,
    seasons: t.series ? [...t.series.seasons] : null,
    nextEpisode: t.series?.nextEpisode ?? null,
    fetchedAt: sql`now()`,
  };
  await db.insert(mediaContent).values(values).onConflictDoUpdate({ target: mediaContent.mediaItemId, set: values });
}

export async function saveAvailability(itemId: string, region: string, services: readonly string[]): Promise<void> {
  const values = { mediaItemId: itemId, region, services: [...services], fetchedAt: sql`now()` };
  await db.insert(mediaAvailability).values(values).onConflictDoUpdate({ target: [mediaAvailability.mediaItemId, mediaAvailability.region], set: values });
}

export async function contentFor(itemIds: readonly string[]): Promise<Map<string, ContentRow>> {
  if (itemIds.length === 0) return new Map();
  const rows = await db.select().from(mediaContent).where(inArray(mediaContent.mediaItemId, [...itemIds]));
  return new Map(rows.map((r) => [r.mediaItemId, r]));
}

export async function availabilityFor(itemIds: readonly string[], region: string): Promise<Map<string, { services: string[]; fetchedAt: Date }>> {
  if (itemIds.length === 0) return new Map();
  const rows = await db
    .select()
    .from(mediaAvailability)
    .where(and(inArray(mediaAvailability.mediaItemId, [...itemIds]), eq(mediaAvailability.region, region)));
  return new Map(rows.map((r) => [r.mediaItemId, { services: r.services, fetchedAt: r.fetchedAt }]));
}

/** Deletes provider data older than the cutoff, in bounded batches. Keys and users' lists are untouched. */
export async function purgeOlderThan(cutoff: Date, batch = 500): Promise<{ content: number; availability: number }> {
  const before = cutoff.toISOString(); // raw SQL takes timestamps as ISO strings
  let content = 0;
  let availability = 0;
  for (;;) {
    const gone = await db.execute(sql`
      DELETE FROM media_content WHERE media_item_id IN (
        SELECT media_item_id FROM media_content WHERE fetched_at < ${before} LIMIT ${batch}) RETURNING 1`);
    content += gone.length;
    if (gone.length < batch) break;
  }
  for (;;) {
    const gone = await db.execute(sql`
      DELETE FROM media_availability WHERE (media_item_id, region) IN (
        SELECT media_item_id, region FROM media_availability WHERE fetched_at < ${before} LIMIT ${batch}) RETURNING 1`);
    availability += gone.length;
    if (gone.length < batch) break;
  }
  return { content, availability };
}

export interface RefreshCandidate {
  readonly id: string;
  readonly ref: TitleRef;
}

/**
 * Titles that some user tracks and whose content is missing or older than its refresh age, the stalest first.
 * "Ongoing" covers series still airing, announced series and movies not yet released.
 */
export async function refreshCandidates(ongoingDays: number, staticDays: number, limit: number): Promise<RefreshCandidate[]> {
  const rows = await db.execute<{ id: string; provider: string; media_type: "tv" | "movie"; external_id: string }>(sql`
    SELECT i.id, i.provider, i.media_type, i.external_id
    FROM media_items i
    LEFT JOIN media_content c ON c.media_item_id = i.id
    WHERE EXISTS (SELECT 1 FROM user_media u WHERE u.media_item_id = i.id)
      AND (c.media_item_id IS NULL
        OR c.fetched_at < now() - make_interval(days => CASE
             WHEN c.series_state IN ('ongoing', 'upcoming') OR c.movie_released = false THEN ${ongoingDays}::int ELSE ${staticDays}::int END))
    ORDER BY c.fetched_at NULLS FIRST
    LIMIT ${limit}::int`);
  return rows.map((r) => ({ id: r.id, ref: { provider: r.provider, type: r.media_type, externalId: r.external_id } }));
}

/** Every user row on one title, for repairing positions after the title's data changed. */
export async function rowsForItem(itemId: string) {
  return db.select().from(userMedia).where(eq(userMedia.mediaItemId, itemId));
}

export async function countOlderThan(cutoff: Date): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(mediaContent).where(lt(mediaContent.fetchedAt, cutoff));
  return row?.n ?? 0;
}
