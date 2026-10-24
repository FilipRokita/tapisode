import { describe, expect, it, vi } from "vitest";
import { ProviderError, type MediaProvider } from "@/domain/provider";
import { FakeProvider } from "@/lib/providers/fake/provider";
import { openGate, type RequestGate } from "@/lib/providers/gate";
import { TmdbProvider } from "@/lib/providers/tmdb/provider";
import movieJson from "../fixtures/tmdb/movie-released.json";
import ongoingJson from "../fixtures/tmdb/tv-ongoing.json";
import regionsJson from "../fixtures/tmdb/regions.json";
import searchJson from "../fixtures/tmdb/search.json";

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers });

/** A TMDB that answers from fixtures. Everything it serves is invented. */
const tmdbStub = async (url: string): Promise<Response> => {
  const { pathname } = new URL(url);
  if (pathname === "/3/search/multi") return json(searchJson);
  if (pathname === "/3/trending/all/week") return json(searchJson);
  if (pathname === "/3/watch/providers/regions") return json(regionsJson);
  if (pathname === "/3/tv/9001") return json(ongoingJson);
  if (pathname === "/3/movie/9101") return json(movieJson);
  return json({ status_code: 34 }, 404);
};

interface Case {
  readonly name: string;
  readonly make: () => MediaProvider;
  readonly series: { provider: string; type: "tv"; externalId: string };
  readonly movie: { provider: string; type: "movie"; externalId: string };
  readonly searchTerm: string;
}

const cases: Case[] = [
  { name: "fake", make: () => new FakeProvider(() => "2026-10-20"), series: { provider: "fake", type: "tv", externalId: "harbor" }, movie: { provider: "fake", type: "movie", externalId: "marrow" }, searchTerm: "harbor" },
  { name: "tmdb (fixtures)", make: () => new TmdbProvider({ token: "t", gate: openGate, fetch: tmdbStub, today: () => "2026-10-20" }), series: { provider: "tmdb", type: "tv", externalId: "9001" }, movie: { provider: "tmdb", type: "movie", externalId: "9101" }, searchTerm: "fixture" },
];

describe.each(cases)("provider contract: $name", ({ make, series, movie, searchTerm }) => {
  it("searches, and returns nothing for an empty query", async () => {
    const p = make();
    expect((await p.search(searchTerm, 1)).hits.length).toBeGreaterThan(0);
    expect((await p.search("  ", 1)).hits).toEqual([]);
  });

  it("lists popular titles and regions", async () => {
    const p = make();
    expect((await p.popular()).length).toBeGreaterThan(0);
    expect((await p.regions()).length).toBeGreaterThan(0);
  });

  it("returns a series with well-formed seasons", async () => {
    const t = await make().getTitle(series, "PL");
    expect(t?.series).not.toBeNull();
    const seasons = t!.series!.seasons;
    expect(seasons.map((s) => s.number)).toEqual([...seasons.map((s) => s.number)].sort((a, b) => a - b));
    for (const s of seasons) {
      expect(s.number).toBeGreaterThanOrEqual(1);
      expect(s.airedCount).toBeGreaterThanOrEqual(0);
      expect(s.airedCount).toBeLessThanOrEqual(s.episodeCount);
    }
  });

  it("returns a movie with no series data", async () => {
    const t = await make().getTitle(movie, "PL");
    expect(t?.series).toBeNull();
    expect(typeof t?.released).toBe("boolean");
  });

  it("returns null for a title it does not have", async () => {
    expect(await make().getTitle({ ...series, externalId: "999999" }, "PL")).toBeNull();
  });

  it("builds an image URL from a stored path", async () => {
    const p = make();
    const t = await p.getTitle(series, "PL");
    if (t?.posterPath) expect(p.imageUrl(t.posterPath, "w342")).toMatch(/^(https:\/\/|data:)/);
  });

  it("builds an image URL from a stored backdrop path", async () => {
    const p = make();
    const t = await p.getTitle(series, "PL");
    expect(t?.backdropPath).toEqual(expect.any(String));
    expect(p.imageUrl(t!.backdropPath!, "w780")).toMatch(/^(https:\/\/|data:)/);
  });
});

describe("the fake provider's backdrops", () => {
  it("has none for a title marked as having none, and a different image than the poster for the rest", async () => {
    const p = new FakeProvider(() => "2026-10-20");
    expect((await p.getTitle({ provider: "fake", type: "tv", externalId: "lanterns" }, "PL"))?.backdropPath).toBeNull();
    const t = await p.getTitle({ provider: "fake", type: "tv", externalId: "harbor" }, "PL");
    expect(p.imageUrl(t!.backdropPath!, "w780")).not.toBe(p.imageUrl(t!.posterPath!, "w342"));
  });
});

describe("tmdb failures", () => {
  const withFetch = (fetch: (url: string) => Promise<Response>, gate: RequestGate = openGate) => new TmdbProvider({ token: "t", gate, fetch, today: () => "2026-10-20" });

  it("sends the bearer token, English, and no adult results", async () => {
    const seen = vi.fn(tmdbStub);
    await withFetch((u) => seen(u)).search("fixture", 1);
    const url = new URL(seen.mock.calls[0]![0]);
    expect(url.searchParams.get("language")).toBe("en-US");
    expect(url.searchParams.get("include_adult")).toBe("false");
  });

  it("caps the search page at 500", async () => {
    const seen = vi.fn(tmdbStub);
    await withFetch((u) => seen(u)).search("fixture", 9999);
    expect(new URL(seen.mock.calls[0]![0]).searchParams.get("page")).toBe("500");
  });

  it("pauses the gate and throws on 429", async () => {
    const pause = vi.fn(async () => {});
    const p = withFetch(async () => json({}, 429, { "retry-after": "12" }), { acquire: async () => {}, pause });
    await expect(p.search("x", 1)).rejects.toMatchObject({ kind: "rate-limited", retryAfterSeconds: 12 });
    expect(pause).toHaveBeenCalledWith(12);
  });

  it.each([
    ["a server error", async () => json({}, 500), "unavailable"],
    ["a network failure", async () => Promise.reject(new Error("offline")), "unavailable"],
    ["a bad token", async () => json({}, 401), "unavailable"],
    ["a body that is not what we expect", async () => json({ results: "no" }), "invalid-response"],
  ] as const)("throws ProviderError on %s", async (_n, fetch, kind) => {
    const p = withFetch(fetch);
    await expect(p.search("x", 1)).rejects.toBeInstanceOf(ProviderError);
    await expect(p.search("x", 1)).rejects.toMatchObject({ kind });
  });

  it("does not call out when the gate refuses", async () => {
    const seen = vi.fn(tmdbStub);
    const gate: RequestGate = { acquire: async () => Promise.reject(new Error("CATALOG_BUSY")), pause: async () => {} };
    await expect(withFetch((u) => seen(u), gate).search("x", 1)).rejects.toThrow("CATALOG_BUSY");
    expect(seen).not.toHaveBeenCalled();
  });

  it("returns null for a non-numeric id without calling out", async () => {
    const seen = vi.fn(tmdbStub);
    expect(await withFetch((u) => seen(u)).getTitle({ provider: "tmdb", type: "tv", externalId: "abc" }, "PL")).toBeNull();
    expect(seen).not.toHaveBeenCalled();
  });
});
