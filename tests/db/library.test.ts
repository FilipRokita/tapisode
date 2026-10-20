import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { compareAndSet, findRow, insertRow, toState } from "@/db/library";
import { mediaItems, user, userMedia } from "@/db/schema";
import type { UserTitleState } from "@/domain/types";

const state = (status: UserTitleState["status"], season = 0, episode = 0): UserTitleState => ({ status, position: { season, episode } });

let userId = "";
let itemId = "";

beforeAll(async () => {
  const [u] = await db.insert(user).values({ name: "Test", email: `t-${crypto.randomUUID()}@example.test` }).returning();
  const [m] = await db.insert(mediaItems).values({ provider: "fake", mediaType: "tv", externalId: crypto.randomUUID() }).returning();
  userId = u!.id;
  itemId = m!.id;
});

afterAll(async () => {
  await db.delete(user).where(eq(user.id, userId));
  await db.delete(mediaItems).where(eq(mediaItems.id, itemId));
});

describe("user_media", () => {
  it("adds a title once, however many times it is sent", async () => {
    const [a, b] = await Promise.all([insertRow(userId, itemId, state("watching", 1, 1)), insertRow(userId, itemId, state("watching", 1, 1))]);
    expect([a, b].filter(Boolean)).toHaveLength(1);
    const row = await findRow(userId, itemId);
    expect(toState(row!)).toEqual(state("watching", 1, 1));
    expect(row!.startedAt).not.toBeNull();
    expect(row!.completedAt).toBeNull();
  });

  it("applies a change only when the stored state is the one the caller saw", async () => {
    const stale = await compareAndSet(userId, itemId, state("watching", 1, 5), state("watching", 1, 6));
    expect(stale).toBeNull();
    const fresh = await compareAndSet(userId, itemId, state("watching", 1, 1), state("watching", 1, 2));
    expect(toState(fresh!)).toEqual(state("watching", 1, 2));
  });

  it("lets exactly one of two simultaneous taps win", async () => {
    const results = await Promise.all([
      compareAndSet(userId, itemId, state("watching", 1, 2), state("watching", 1, 3)),
      compareAndSet(userId, itemId, state("watching", 1, 2), state("watching", 1, 3)),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(toState((await findRow(userId, itemId))!)).toEqual(state("watching", 1, 3));
  });

  it("sets completedAt on Complete and clears it when leaving", async () => {
    const done = await compareAndSet(userId, itemId, state("watching", 1, 3), state("complete", 2, 10));
    expect(done!.completedAt).not.toBeNull();
    const back = await compareAndSet(userId, itemId, state("complete", 2, 10), state("watching", 2, 9));
    expect(back!.completedAt).toBeNull();
    expect(back!.startedAt).not.toBeNull();
  });

  it("keeps startedAt when a series goes back to Watchlist", async () => {
    const row = await compareAndSet(userId, itemId, state("watching", 2, 9), state("watchlist"));
    expect(row!.startedAt).not.toBeNull();
    expect(toState(row!)).toEqual(state("watchlist"));
  });

  it("rejects a position that breaks the pairing rule", async () => {
    await expect(compareAndSet(userId, itemId, state("watchlist"), state("watching", 0, 3))).rejects.toThrow();
  });

  it("removes a user's titles with the user and leaves the catalog key", async () => {
    const [u] = await db.insert(user).values({ name: "Gone", email: `g-${crypto.randomUUID()}@example.test` }).returning();
    await insertRow(u!.id, itemId, state("watchlist"));
    await db.delete(user).where(eq(user.id, u!.id));
    expect(await findRow(u!.id, itemId)).toBeNull();
    const [item] = await db.select().from(mediaItems).where(eq(mediaItems.id, itemId));
    expect(item).toBeDefined();
    expect(await db.select().from(userMedia).where(eq(userMedia.mediaItemId, itemId))).toHaveLength(1);
  });
});
