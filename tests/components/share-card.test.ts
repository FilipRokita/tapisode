import { describe, expect, it } from "vitest";
import { buildShareCardSvg, CARD_SIZE, STORY_SAFE, type CardPalette } from "@/components/stats/share-card-svg";
import type { Stats } from "@/domain/stats";

const palette: CardPalette = {
  background: "#a00001",
  foreground: "#a00002",
  dim: "#a00003",
  faint: "#a00004",
  brand: "#a00005",
  brandText: "#a00006",
  textSoft: "#a00007",
  surface: "#a00008",
  border: "#a00009",
  borderStrong: "#a0000a",
  mutedLegend: "#a0000b",
  light: "#a0000c",
};

const stats: Stats = { episodes: 90, hours: 71, finished: 4, tracked: 14, byStatus: { watching: 4, watchlist: 6, complete: 4 }, series: 8, movies: 6, pending: 0 };

describe("buildShareCardSvg", () => {
  it("is 1080 by 1920 for the story and 1080 by 1080 for the post", () => {
    expect(buildShareCardSvg(stats, palette, "story", 2026)).toContain('width="1080" height="1920"');
    expect(buildShareCardSvg(stats, palette, "post", 2026)).toContain('width="1080" height="1080"');
    expect(CARD_SIZE.story.height).toBe(1920);
  });

  it.each(["story", "post"] as const)("%s shows the numbers, the split and the year", (format) => {
    const svg = buildShareCardSvg(stats, palette, format, 2031);
    for (const text of [">90<", ">71<", ">4<", ">14<", "8 series · 6 movies", "2031 SO FAR", "3.0 days"]) expect(svg).toContain(text);
  });

  it("keeps every line of the story out of the strips Instagram covers", () => {
    const svg = buildShareCardSvg(stats, palette, "story", 2026);
    const ys = [...svg.matchAll(/<text [^>]*\by="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(ys.length).toBeGreaterThan(10);
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(STORY_SAFE.top);
      expect(y).toBeLessThanOrEqual(STORY_SAFE.bottom);
    }
  });

  it("draws one arc per state that has titles", () => {
    const arcs = (s: Stats) => (buildShareCardSvg(s, palette, "story", 2026).match(/stroke-linecap="round" stroke-dasharray/g) ?? []).length;
    expect(arcs(stats)).toBe(3);
    expect(arcs({ ...stats, byStatus: { watching: 4, watchlist: 0, complete: 0 }, tracked: 4 })).toBe(1);
    expect(arcs({ ...stats, byStatus: { watching: 0, watchlist: 0, complete: 0 }, tracked: 0 })).toBe(0);
  });

  it("uses no colors outside the palette", () => {
    const allowed = new Set([...Object.values(palette), "none"]);
    for (const format of ["story", "post"] as const) {
      const svg = buildShareCardSvg(stats, palette, format, 2026);
      const used = [...svg.matchAll(/\b(?:fill|stroke|stop-color)="([^"]+)"/g)].map((m) => m[1]!).filter((v) => !v.startsWith("url("));
      expect(used.length).toBeGreaterThan(10);
      for (const color of used) expect(allowed.has(color), `${format}: ${color}`).toBe(true);
    }
  });
});
