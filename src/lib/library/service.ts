import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { availabilityFor, contentFor } from "@/db/catalog";
import { db } from "@/db/client";
import { compareAndSet, deleteIfMatches, insertRow, toState, trackedStates, type LibraryRow } from "@/db/library";
import { mediaItems, userMedia } from "@/db/schema";
import type { RegionCode } from "@/domain/services";
import { computeStats, type Stats, type StatsItem } from "@/domain/stats";
import { transition, type Command, type TransitionError } from "@/domain/transitions";
import type { TitleRef, UserTitleState } from "@/domain/types";
import { ensureTitle, factsFor } from "@/lib/catalog/service";
import type { TitleView } from "@/domain/view";
import { factsOf, toTitleView } from "@/lib/catalog/view";
import { getProvider } from "@/lib/providers";

export type CommandResult =
  /** `state` is null when the title is no longer on any list. */
  | { readonly ok: true; readonly state: UserTitleState | null; readonly activityAt: number }
  | { readonly ok: false; readonly error: TransitionError | "NOT_FOUND" | "CONFLICT"; readonly current?: UserTitleState | null };

/**
 * The one use case behind every change to a user's lists. It checks the change against the rules, then applies it
 * only if the state the caller saw is still the stored one.
 */
export async function applyCommand(userId: string, region: RegionCode, ref: TitleRef, expected: UserTitleState | null, command: Command, beforeFetch?: () => Promise<void>): Promise<CommandResult> {
  const ensured = await ensureTitle(ref, region, beforeFetch);
  if (!ensured.ok) return { ok: false, error: "NOT_FOUND" };
  const facts = await factsFor(ensured.itemId);
  if (!facts) return { ok: false, error: "NOT_FOUND" };

  const result = transition(facts, expected, command);
  if (!result.ok) return { ok: false, error: result.error };

  if (result.value === null) {
    // Removing: nothing to remove is fine, and a state that moved on since is a conflict.
    if (expected === null || (await deleteIfMatches(userId, ensured.itemId, expected))) return { ok: true, state: null, activityAt: Date.now() };
    const [current] = await db.select().from(userMedia).where(and(eq(userMedia.userId, userId), eq(userMedia.mediaItemId, ensured.itemId)));
    return { ok: false, error: "CONFLICT", current: current ? toState(current) : null };
  }
  const row: LibraryRow | null = expected === null ? await insertRow(userId, ensured.itemId, result.value) : await compareAndSet(userId, ensured.itemId, expected, result.value);
  if (!row) {
    const [current] = await db.select().from(userMedia).where(and(eq(userMedia.userId, userId), eq(userMedia.mediaItemId, ensured.itemId)));
    return { ok: false, error: "CONFLICT", current: current ? toState(current) : null };
  }
  return { ok: true, state: toState(row), activityAt: row.activityAt.getTime() };
}

/** Every title on the user's lists, newest activity first, with content and the services for their region. */
export async function listLibrary(userId: string, region: RegionCode): Promise<TitleView[]> {
  const rows = await db
    .select({ row: userMedia, item: mediaItems })
    .from(userMedia)
    .innerJoin(mediaItems, eq(userMedia.mediaItemId, mediaItems.id))
    .where(eq(userMedia.userId, userId))
    .orderBy(desc(userMedia.activityAt));
  const ids = rows.map((r) => r.item.id);
  const [content, availability] = await Promise.all([contentFor(ids), availabilityFor(ids, region)]);
  const provider = getProvider();
  return rows.flatMap(({ row, item }): TitleView[] => {
    const c = content.get(item.id);
    if (!c) return []; // content purged and not fetched again yet: left out, and counted as pending by the caller
    return [toTitleView(item.id, { provider: item.provider, type: item.mediaType, externalId: item.externalId }, c, availability.get(item.id)?.services, toState(row), row.activityAt.getTime(), (p, size) => provider.imageUrl(p, size))];
  });
}

/** How many of the user's titles have no content right now. */
export async function countPending(userId: string): Promise<number> {
  const rows = await db.select({ id: userMedia.mediaItemId }).from(userMedia).where(eq(userMedia.userId, userId));
  const content = await contentFor(rows.map((r) => r.id));
  return rows.filter((r) => !content.has(r.id)).length;
}

export async function userStats(userId: string): Promise<Stats> {
  const rows = await db.select({ row: userMedia }).from(userMedia).where(eq(userMedia.userId, userId));
  const content = await contentFor(rows.map((r) => r.row.mediaItemId));
  const items: StatsItem[] = rows.map(({ row }) => {
    const c = content.get(row.mediaItemId);
    return { state: toState(row), content: c ? { facts: factsOf(c), runtimeMinutes: c.runtimeMinutes } : null };
  });
  return computeStats(items);
}


/** One title for the drawer, whether or not the user tracks it. Fetches it if the cache cannot answer. */
export async function getTitleView(userId: string, region: RegionCode, ref: TitleRef, beforeFetch?: () => Promise<void>): Promise<TitleView | null> {
  const ensured = await ensureTitle(ref, region, beforeFetch);
  if (!ensured.ok) return null;
  const [content, availability, tracked] = await Promise.all([contentFor([ensured.itemId]), availabilityFor([ensured.itemId], region), trackedStates(userId, [ref])]);
  const c = content.get(ensured.itemId);
  if (!c) return null;
  const [activity] = await db.select({ at: userMedia.activityAt }).from(userMedia).where(and(eq(userMedia.userId, userId), eq(userMedia.mediaItemId, ensured.itemId)));
  const provider = getProvider();
  return toTitleView(ensured.itemId, ref, c, availability.get(ensured.itemId)?.services, tracked.get(`${ref.provider}:${ref.type}:${ref.externalId}`) ?? null, activity?.at.getTime() ?? 0, (p, size) => provider.imageUrl(p, size));
}
