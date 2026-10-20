import type { Status, TitleRef } from "@/domain/types";

/** What goes on the sandbox template's lists. Real providers list ids only: no catalog content is committed. */
export interface TemplateEntry {
  readonly ref: TitleRef;
  readonly status: Status;
  /** For a series in Watching: where the user is. Left out means not started. */
  readonly at?: "caught-up" | { readonly season: number; readonly episode: number };
}

const tmdb = (type: "tv" | "movie", id: number): TitleRef => ({ provider: "tmdb", type, externalId: String(id) });
const fake = (type: "tv" | "movie", id: string): TitleRef => ({ provider: "fake", type, externalId: id });

/**
 * Applied in order, so the last Watching entry is the one shown as "Up next". The positions are clamped to the real
 * seasons at seed time, so a series that changed since this was written still gets a valid one.
 */
export const TEMPLATES: Readonly<Record<"tmdb" | "fake", readonly TemplateEntry[]>> = {
  tmdb: [
    { ref: tmdb("movie", 872585), status: "watchlist" },
    { ref: tmdb("movie", 346698), status: "watchlist" },
    { ref: tmdb("movie", 361743), status: "watchlist" },
    { ref: tmdb("tv", 87108), status: "watchlist" },
    { ref: tmdb("tv", 100088), status: "watchlist" },
    { ref: tmdb("tv", 1396), status: "complete" },
    { ref: tmdb("tv", 60059), status: "complete" },
    { ref: tmdb("movie", 603), status: "complete" },
    { ref: tmdb("movie", 157336), status: "complete" },
    { ref: tmdb("movie", 27205), status: "complete" },
    { ref: tmdb("movie", 155), status: "complete" },
    { ref: tmdb("movie", 693134), status: "watching" },
    { ref: tmdb("tv", 1399), status: "watching", at: { season: 4, episode: 3 } },
    { ref: tmdb("tv", 95396), status: "watching", at: { season: 2, episode: 4 } },
    { ref: tmdb("tv", 94997), status: "watching", at: "caught-up" },
    { ref: tmdb("tv", 66732), status: "watching", at: { season: 5, episode: 7 } },
  ],
  fake: [
    { ref: fake("movie", "marrow"), status: "watchlist" },
    { ref: fake("tv", "ember"), status: "watchlist" },
    { ref: fake("movie", "tide"), status: "watchlist" },
    { ref: fake("tv", "moth"), status: "watchlist" },
    { ref: fake("movie", "signal"), status: "watchlist" },
    { ref: fake("tv", "cartog"), status: "watchlist" },
    { ref: fake("tv", "velvet"), status: "complete" },
    { ref: fake("movie", "orbit"), status: "complete" },
    { ref: fake("movie", "road"), status: "complete" },
    { ref: fake("tv", "lanterns"), status: "complete" },
    { ref: fake("tv", "orchard"), status: "watching" },
    { ref: fake("tv", "kingdoms"), status: "watching", at: "caught-up" },
    { ref: fake("tv", "salt"), status: "watching", at: { season: 1, episode: 7 } },
    { ref: fake("tv", "harbor"), status: "watching", at: { season: 2, episode: 4 } },
  ],
};
