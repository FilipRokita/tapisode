import { describe, expect, it } from "vitest";
import { browseLists } from "@/lib/catalog/browse";

describe("browseLists", () => {
  it("returns the three lists with poster urls, stills and release dates", async () => {
    const lists = await browseLists("PL");
    expect(lists.trending.length).toBeGreaterThan(0);
    expect(lists.inCinemas.length).toBeGreaterThan(0);
    expect(lists.comingSoon.map((r) => r.title)).toEqual(["Copper Sky", "Winterline"]);
    expect(lists.trending[0]!.poster?.w185).toMatch(/^data:image\/svg/);
    expect(lists.inCinemas[0]!.backdrop).toMatch(/^data:image\/svg/);
    expect(lists.comingSoon[0]!.releaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("keeps titles the user tracks: the lists are the same for everyone", async () => {
    expect((await browseLists("PL")).trending.map((r) => r.ref.externalId)).toEqual(["lights", "job", "hours", "rooms"]);
  });
});
