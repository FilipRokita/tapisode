import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { browseLists } from "@/lib/catalog/browse";
import { applyCommand } from "@/lib/library/service";

let userId = "";

beforeAll(async () => {
  const [u] = await db.insert(user).values({ name: "B", email: `browse-${crypto.randomUUID()}@example.test` }).returning();
  userId = u!.id;
});
afterAll(async () => {
  await db.delete(user).where(eq(user.id, userId));
});

describe("browseLists", () => {
  it("returns the three lists with poster urls and release dates", async () => {
    const lists = await browseLists(userId, "PL");
    expect(lists.trending.length).toBeGreaterThan(0);
    expect(lists.inCinemas.length).toBeGreaterThan(0);
    expect(lists.comingSoon.map((r) => r.title)).toEqual(["Copper Sky", "Winterline"]);
    expect(lists.trending[0]!.poster?.w185).toMatch(/^data:image\/svg/);
    expect(lists.comingSoon[0]!.releaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("leaves out what the user already tracks", async () => {
    expect((await browseLists(userId, "PL")).trending.map((r) => r.ref.externalId)).toContain("job");
    await applyCommand(userId, "PL", { provider: "fake", type: "movie", externalId: "job" }, null, { kind: "setStatus", status: "watchlist" });
    const lists = await browseLists(userId, "PL");
    expect(lists.trending.map((r) => r.ref.externalId)).not.toContain("job");
    expect(lists.inCinemas.map((r) => r.ref.externalId)).not.toContain("job");
  });
});
