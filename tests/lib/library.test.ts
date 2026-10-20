import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { countOlderThan, findItem } from "@/db/catalog";
import { db } from "@/db/client";
import { mediaContent, mediaItems, user, userMedia } from "@/db/schema";
import type { TitleRef, UserTitleState } from "@/domain/types";
import { persistTitle } from "@/lib/catalog/service";
import { killSwitch, runMaintenance } from "@/lib/jobs/maintenance";
import { hasFlag } from "@/lib/limits/counter";
import { applyCommand, listLibrary, userStats } from "@/lib/library/service";
import { FakeProvider } from "@/lib/providers/fake/provider";

const fake = (id: string, type: "tv" | "movie"): TitleRef => ({ provider: "fake", type, externalId: id });
const st = (status: UserTitleState["status"], season = 0, episode = 0): UserTitleState => ({ status, position: { season, episode } });
let userId = "";

beforeAll(async () => {
  await db.delete(user);
  const [u] = await db.insert(user).values({ name: "T", email: `lib-${crypto.randomUUID()}@example.test` }).returning();
  userId = u!.id;
});
afterAll(async () => {
  await db.delete(user).where(eq(user.id, userId));
});

describe("applyCommand", () => {
  it("adds a series with +1: fetches it, starts at S01E01 and lists it in Watching", async () => {
    const res = await applyCommand(userId, "PL", fake("salt", "tv"), null, { kind: "plusOne" });
    expect(res).toMatchObject({ ok: true, state: st("watching", 1, 1) });
    const list = await listLibrary(userId, "PL");
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ title: "Salt & Static", services: ["hbo"] });
    expect(list[0]!.poster?.w342).toMatch(/^data:image\/svg/);
  });

  it("applies the same +1 only once when the expected state is stale", async () => {
    const first = await applyCommand(userId, "PL", fake("salt", "tv"), st("watching", 1, 1), { kind: "plusOne" });
    const replay = await applyCommand(userId, "PL", fake("salt", "tv"), st("watching", 1, 1), { kind: "plusOne" });
    expect(first.ok).toBe(true);
    expect(replay).toMatchObject({ ok: false, error: "CONFLICT", current: st("watching", 1, 2) });
  });

  it("finishes an ended series: jumping to the last episode moves it to Complete", async () => {
    const res = await applyCommand(userId, "PL", fake("salt", "tv"), st("watching", 1, 2), { kind: "jumpTo", position: { season: 1, episode: 8 } });
    expect(res).toMatchObject({ ok: true, state: st("complete", 1, 8) });
  });

  it("refuses what the rules refuse, without touching the data", async () => {
    expect(await applyCommand(userId, "PL", fake("harbor", "tv"), null, { kind: "setStatus", status: "complete" })).toMatchObject({ ok: false, error: "STILL_AIRING" });
    expect(await applyCommand(userId, "PL", fake("tidewater", "tv"), null, { kind: "setStatus", status: "watching" })).toMatchObject({ ok: false, error: "NOT_RELEASED" });
    expect(await applyCommand(userId, "PL", fake("nope", "tv"), null, { kind: "plusOne" })).toMatchObject({ ok: false, error: "NOT_FOUND" });
    const [row] = await db.select().from(userMedia).innerJoin(mediaItems, eq(userMedia.mediaItemId, mediaItems.id)).where(eq(mediaItems.externalId, "harbor"));
    expect(row).toBeUndefined();
  });

  it("puts an unreleased title on the Watchlist", async () => {
    expect(await applyCommand(userId, "PL", fake("aurora", "movie"), null, { kind: "setStatus", status: "watchlist" })).toMatchObject({ ok: true, state: st("watchlist") });
  });

  it("restores a snapshot, which is what Undo does", async () => {
    const ref = fake("lights", "tv");
    const added = await applyCommand(userId, "PL", ref, null, { kind: "plusOne" });
    expect(added.ok).toBe(true);
    const back = await applyCommand(userId, "PL", ref, st("watching", 1, 1), { kind: "setStatus", status: "watchlist" });
    expect(back).toMatchObject({ ok: true, state: st("watchlist") });
    const undone = await applyCommand(userId, "PL", ref, st("watchlist"), { kind: "restore", state: st("watching", 1, 1) });
    expect(undone).toMatchObject({ ok: true, state: st("watching", 1, 1) });
  });

  it("undoes an add by removing the title, and refuses if it has moved on since", async () => {
    const ref = fake("rooms", "movie");
    expect((await applyCommand(userId, "PL", ref, null, { kind: "setStatus", status: "watching" })).ok).toBe(true);
    const stale = await applyCommand(userId, "PL", ref, st("complete"), { kind: "restore", state: null });
    expect(stale).toMatchObject({ ok: false, error: "CONFLICT", current: st("watching") });
    const removed = await applyCommand(userId, "PL", ref, st("watching"), { kind: "restore", state: null });
    expect(removed).toMatchObject({ ok: true, state: null });
    const item = await findItem(ref);
    const rows = await db.select().from(userMedia).where(eq(userMedia.mediaItemId, item!.id));
    expect(rows.filter((r) => r.userId === userId)).toHaveLength(0);
  });
});

describe("stats", () => {
  it("counts episodes and hours from the cache", async () => {
    const stats = await userStats(userId);
    expect(stats.byStatus).toEqual({ watching: 1, watchlist: 1, complete: 1 });
    expect(stats.episodes).toBe(8 + 1); // Salt & Static complete, Harbor Lights at S01E01
    expect(stats.pending).toBe(0);
  });
});

describe("the title's data changing under a user", () => {
  it("moves a caught-up series to Complete when it turns out to have ended", async () => {
    const ref = fake("harbor", "tv");
    await applyCommand(userId, "PL", ref, null, { kind: "jumpTo", position: { season: 2, episode: 8 } });
    const ended = await new FakeProvider(() => "2026-10-20").getTitle(ref, "PL");
    await persistTitle({ ...ended!, series: { ...ended!.series!, state: "ended", seasons: [{ number: 1, episodeCount: 8, airedCount: 8 }, { number: 2, episodeCount: 8, airedCount: 8 }], nextEpisode: null } }, "PL");
    const item = await findItem(ref);
    const [row] = await db.select().from(userMedia).where(eq(userMedia.mediaItemId, item!.id));
    expect(row).toMatchObject({ status: "complete", season: 2, episode: 8 });
    expect(row!.completedAt).not.toBeNull();
  });
});

describe("the 6-month rule", () => {
  it("purges content older than five months and keeps the user's list", async () => {
    const old = new Date(Date.now() - 151 * 86_400_000);
    await db.update(mediaContent).set({ fetchedAt: old });
    expect(await countOlderThan(new Date(Date.now() - 150 * 86_400_000))).toBeGreaterThan(0);
    const report = await runMaintenance(Date.now());
    expect(report.purged.content).toBeGreaterThan(0); // purged first, so the rule holds even if the refresh fails
    expect(report.refreshed).toBeGreaterThan(0); // and the titles users track came back as fresh copies
    expect(await countOlderThan(new Date(Date.now() - 150 * 86_400_000))).toBe(0);
    expect((await db.select().from(userMedia).where(eq(userMedia.userId, userId))).length).toBeGreaterThan(0);
  });

  it("refreshes tracked titles whose content is missing, and deletes expired sandboxes and spent counters", async () => {
    await db.delete(mediaContent); // as if everything had been purged
    const [anon] = await db.insert(user).values({ name: "V", email: `v-${crypto.randomUUID()}@example.test`, isAnonymous: true, createdAt: sql`now() - interval '7 hours'` as never }).returning();
    const report = await runMaintenance(Date.now());
    expect(report.refreshed).toBeGreaterThan(0); // the purged titles are tracked, so they came back
    expect(report.sandboxesDeleted).toBeGreaterThanOrEqual(1);
    expect(await db.select().from(user).where(eq(user.id, anon!.id))).toHaveLength(0);
  });
});

describe("the kill switch", () => {
  it("deletes all provider content, keeps the lists and refuses further provider calls", async () => {
    const before = await db.select().from(userMedia).where(eq(userMedia.userId, userId));
    const purged = await killSwitch();
    expect(purged.content).toBeGreaterThan(0);
    expect(await db.select().from(mediaContent)).toHaveLength(0);
    expect(await hasFlag("provider:pause")).toBe(true);
    expect(await db.select().from(userMedia).where(eq(userMedia.userId, userId))).toHaveLength(before.length);
  });
});
