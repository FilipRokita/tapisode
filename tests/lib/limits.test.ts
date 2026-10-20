import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { requestCounter } from "@/db/schema";
import { allow, deleteExpiredCounters, hasFlag, hit, setFlag } from "@/lib/limits/counter";
import { dbGate } from "@/lib/limits/gate";
import { LIMITS } from "@/lib/limits/limits";
import { CatalogBusyError } from "@/lib/providers/gate";

beforeEach(async () => {
  await db.delete(requestCounter);
});

describe("counters", () => {
  it("counts inside a window and starts over in the next", async () => {
    expect(await hit("k", 60, 1_000)).toBe(1);
    expect(await hit("k", 60, 2_000)).toBe(2);
    expect(await hit("k", 60, 61_000)).toBe(1);
  });
  it("allows up to the limit and refuses past it", async () => {
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await allow("user:a", 3, 60));
    expect(results).toEqual([true, true, true, false, false]);
  });
  it("keeps keys apart", async () => {
    await allow("user:a", 1, 60);
    expect(await allow("user:b", 1, 60)).toBe(true);
  });
  it("flags expire, and expired rows are cleaned up", async () => {
    await setFlag("f", 60);
    expect(await hasFlag("f")).toBe(true);
    await setFlag("f", -1);
    expect(await hasFlag("f")).toBe(false);
    expect(await deleteExpiredCounters()).toBeGreaterThanOrEqual(1);
  });
});

describe("the provider breaker", () => {
  it("lets through no more than the per-second ceiling, however big the burst", async () => {
    const burst = LIMITS.providerPerSecond * 5;
    const results = await Promise.allSettled(Array.from({ length: burst }, () => dbGate.acquire()));
    const passed = results.filter((r) => r.status === "fulfilled").length;
    const refused = results.filter((r) => r.status === "rejected" && r.reason instanceof CatalogBusyError).length;
    // The window is one second, so a burst may straddle two of them. It can never exceed two ceilings.
    expect(passed).toBeLessThanOrEqual(LIMITS.providerPerSecond * 2);
    expect(passed + refused).toBe(burst);
    expect(refused).toBeGreaterThan(0);
  });
  it("refuses everything while paused", async () => {
    await dbGate.pause(30);
    await expect(dbGate.acquire()).rejects.toBeInstanceOf(CatalogBusyError);
  });
});
