import "server-only";
import { FRESHNESS } from "@/config/constants";
import { availabilityFor, contentFor, findItem, rowsForItem, saveAvailability, saveContent, upsertItem, type ContentRow } from "@/db/catalog";
import { compareAndSet, toState } from "@/db/library";
import type { ProviderTitle } from "@/domain/provider";
import type { RegionCode } from "@/domain/services";
import { reconcile } from "@/domain/transitions";
import type { TitleRef } from "@/domain/types";
import { getProvider } from "@/lib/providers";
import { factsOf } from "./view";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** How long content may be used before it is fetched again when someone opens the title. */
export function isContentFresh(row: Pick<ContentRow, "fetchedAt" | "seriesState" | "movieReleased">, now = Date.now()): boolean {
  const ongoing = row.seriesState === "ongoing" || row.seriesState === "upcoming" || row.movieReleased === false;
  const age = now - row.fetchedAt.getTime();
  return age < (ongoing ? FRESHNESS.openOngoingHours * HOUR : FRESHNESS.openStaticDays * DAY);
}

export const isAvailabilityFresh = (fetchedAt: Date, now = Date.now()): boolean => now - fetchedAt.getTime() < FRESHNESS.availabilityHours * HOUR;

/**
 * Stores what the provider returned, then repairs every user's position on that title, because the title's seasons
 * may have changed under them (a series ended, a season was added or shortened).
 */
export async function persistTitle(t: ProviderTitle, region: RegionCode): Promise<string> {
  const itemId = await upsertItem(t.ref, t.imdbId);
  await saveContent(itemId, t);
  if (t.availability) await saveAvailability(itemId, region, t.availability);
  const facts = t.series ? ({ type: "tv", state: t.series.state, seasons: t.series.seasons } as const) : ({ type: "movie", released: t.released } as const);
  for (const row of await rowsForItem(itemId)) {
    const current = toState(row);
    const repaired = reconcile(facts, current);
    if (repaired.status !== current.status || repaired.position.season !== current.position.season || repaired.position.episode !== current.position.episode) {
      await compareAndSet(row.userId, itemId, current, repaired);
    }
  }
  return itemId;
}

export type EnsureResult = { readonly ok: true; readonly itemId: string } | { readonly ok: false; readonly reason: "not-found" };

/** Makes sure the title's content and its availability for the region are in the cache and current, fetching only if they are not. */
export async function ensureTitle(ref: TitleRef, region: RegionCode, beforeFetch?: () => Promise<void>): Promise<EnsureResult> {
  const item = await findItem(ref);
  if (item) {
    const [content, availability] = await Promise.all([contentFor([item.id]), availabilityFor([item.id], region)]);
    const c = content.get(item.id);
    const a = availability.get(item.id);
    if (c && isContentFresh(c) && a && isAvailabilityFresh(a.fetchedAt)) return { ok: true, itemId: item.id };
  }
  await beforeFetch?.();
  const title = await getProvider().getTitle(ref, region);
  if (!title) return { ok: false, reason: "not-found" };
  return { ok: true, itemId: await persistTitle(title, region) };
}

/** The facts the rules need for one title, from the cache only. Null when its content is missing. */
export async function factsFor(itemId: string) {
  const content = (await contentFor([itemId])).get(itemId);
  return content ? factsOf(content) : null;
}
