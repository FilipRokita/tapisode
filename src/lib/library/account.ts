import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { mediaItems, user as userTable, userMedia } from "@/db/schema";
import { persistTitle } from "@/lib/catalog/service";
import { getProvider } from "@/lib/providers";

const BATCH = 5;
const MAX_TITLES = 60;

/**
 * After the user changes country, loads availability for the new region for their titles, a few at a time and within
 * the breaker. A title that cannot be refreshed now simply shows no services until it is opened.
 */
export async function setAvailabilityRegion(userId: string, region: string): Promise<void> {
  const rows = await db
    .select({ provider: mediaItems.provider, type: mediaItems.mediaType, externalId: mediaItems.externalId })
    .from(userMedia)
    .innerJoin(mediaItems, eq(userMedia.mediaItemId, mediaItems.id))
    .where(eq(userMedia.userId, userId))
    .limit(MAX_TITLES);
  const provider = getProvider();
  for (let i = 0; i < rows.length; i += BATCH) {
    await Promise.allSettled(
      rows.slice(i, i + BATCH).map(async (r) => {
        const title = await provider.getTitle({ provider: r.provider, type: r.type, externalId: r.externalId }, region);
        if (title) await persistTitle(title, region);
      }),
    );
  }
}

/** Everything we hold about the user, as a file they can keep. It has our own data only: no catalog text, since that is not ours to hand out. */
export async function exportUserData(userId: string) {
  const rows = await db
    .select({ item: mediaItems, row: userMedia })
    .from(userMedia)
    .innerJoin(mediaItems, eq(userMedia.mediaItemId, mediaItems.id))
    .where(eq(userMedia.userId, userId));
  return rows.map(({ item, row }) => ({
    provider: item.provider,
    type: item.mediaType,
    externalId: item.externalId,
    imdbId: item.imdbId,
    status: row.status,
    season: row.season,
    episode: row.episode,
    addedAt: row.createdAt.toISOString(),
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
  }));
}

export async function updateCountry(userId: string, country: string): Promise<void> {
  await db.update(userTable).set({ country }).where(eq(userTable.id, userId));
}

/** Deletes the user. Their titles and sessions go with them through the foreign keys, and the catalog keys stay. */
export async function deleteUser(userId: string): Promise<void> {
  await db.delete(userTable).where(eq(userTable.id, userId));
}
