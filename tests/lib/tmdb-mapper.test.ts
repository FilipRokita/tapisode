import { describe, expect, it } from "vitest";
import { ProviderError } from "@/domain/provider";
import { mapMovie, mapSearch, mapTv } from "@/lib/providers/tmdb/mapper";
import movieJson from "../fixtures/tmdb/movie-released.json";
import plannedJson from "../fixtures/tmdb/movie-planned.json";
import announcedJson from "../fixtures/tmdb/tv-announced.json";
import endedJson from "../fixtures/tmdb/tv-ended.json";
import newSeasonJson from "../fixtures/tmdb/tv-new-season.json";
import ongoingJson from "../fixtures/tmdb/tv-ongoing.json";
import searchJson from "../fixtures/tmdb/search.json";

const TODAY = "2026-10-20";

describe("series", () => {
  it("normalizes an ongoing series: no specials, aired counts from the next episode, services for the region", () => {
    const t = mapTv(ongoingJson, "PL", TODAY);
    expect(t.ref).toEqual({ provider: "tmdb", type: "tv", externalId: "9001" });
    expect(t.imdbId).toBe("tt0009001");
    expect(t.series?.state).toBe("ongoing");
    expect(t.backdropPath).toBe("/fixture-harbor-wide.jpg");
    expect(t.series?.seasons).toEqual([
      { number: 1, episodeCount: 8, airedCount: 8 },
      { number: 2, episodeCount: 10, airedCount: 4 },
      { number: 3, episodeCount: 0, airedCount: 0 },
    ]);
    expect(t.series?.nextEpisode).toEqual({ season: 2, episode: 5, airDate: "2026-10-23" });
    expect(t.runtimeMinutes).toBe(52); // series level runtime is empty, so the last aired episode's is used
    expect(t.released).toBe(true);
    expect(t.availability).toEqual(["netflix"]); // 8 and 1796 are one service, and rent is not streaming
    expect(mapTv(ongoingJson, "US", TODAY).availability).toEqual(["hbo"]);
    expect(mapTv(ongoingJson, "DE", TODAY).availability).toEqual([]);
  });

  it("treats Ended and Canceled as ended and every episode as aired", () => {
    const t = mapTv(endedJson, "PL", TODAY);
    expect(t.series?.state).toBe("ended");
    expect(t.series?.seasons).toEqual([{ number: 1, episodeCount: 8, airedCount: 8 }]);
    expect(t.runtimeMinutes).toBe(47);
    expect(t.imdbId).toBeNull();
    expect(t.backdropPath).toBeNull(); // the fixture has none
    expect(mapTv({ ...endedJson, status: "Canceled" }, "PL", TODAY).series?.state).toBe("ended");
  });

  it("is upcoming and unreleased when nothing has aired, and cleans empty dates", () => {
    const t = mapTv(announcedJson, "PL", TODAY);
    expect(t.series?.state).toBe("upcoming");
    expect(t.released).toBe(false);
    expect(t.releaseDate).toBeNull();
    expect(t.availability).toBeNull(); // no provider data at all, which is not the same as no services
    expect(t.runtimeMinutes).toBeNull();
  });

  it("counts a newly announced season as not aired", () => {
    const t = mapTv(newSeasonJson, "PL", TODAY);
    expect(t.series?.seasons.map((s) => s.airedCount)).toEqual([10, 10, 0]);
    expect(t.series?.nextEpisode).toEqual({ season: 3, episode: 1, airDate: "2027-01-01" });
  });

  it("falls back to season dates when there is no episode information", () => {
    const bare = { ...ongoingJson, last_episode_to_air: null, next_episode_to_air: null };
    expect(mapTv(bare, "PL", TODAY).series?.seasons.map((s) => s.airedCount)).toEqual([8, 10, 0]);
  });

  it("rejects a response that is not what we expect", () => {
    expect(() => mapTv({ id: "x" }, "PL", TODAY)).toThrow(ProviderError);
  });
});

describe("movies", () => {
  it("maps a released movie", () => {
    const m = mapMovie(movieJson, "PL");
    expect(m.released).toBe(true);
    expect(m.runtimeMinutes).toBe(118);
    expect(m.backdropPath).toBe("/fixture-orbit-wide.jpg");
    expect(m.availability).toEqual(["prime"]);
    expect(m.series).toBeNull();
  });
  it("maps a planned movie: no runtime, no date, not released", () => {
    const m = mapMovie(plannedJson, "PL");
    expect(m.released).toBe(false);
    expect(m.runtimeMinutes).toBeNull();
    expect(m.releaseDate).toBeNull();
    expect(m.imdbId).toBeNull();
  });
});

describe("search", () => {
  it("keeps series and movies, drops people, and caps the page count at 500", () => {
    const page = mapSearch(searchJson);
    expect(page.hits.map((h) => `${h.ref.type}:${h.ref.externalId}`)).toEqual(["tv:9001", "movie:9101", "tv:9003"]);
    expect(page.hits.map((h) => h.year)).toEqual([2025, 2024, null]);
    expect(page.totalPages).toBe(500);
  });
});
