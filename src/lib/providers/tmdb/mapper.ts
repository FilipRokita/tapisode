import { z } from "zod";
import type { DateString } from "@/domain/countdown";
import { ProviderError, type ProviderTitle, type SearchHit, type SearchPage } from "@/domain/provider";
import type { RegionCode, ServiceKey } from "@/domain/services";
import type { Season, SeriesState, TitleRef } from "@/domain/types";

/** Which TMDB provider ids stand for each of our services. Variants such as "with ads" count as the same service. */
export const TMDB_SERVICE_IDS: Readonly<Record<ServiceKey, readonly number[]>> = {
  netflix: [8, 1796],
  prime: [119, 9, 2100],
  disney: [337],
  hbo: [1899],
  apple: [350],
  sky: [1773],
};

const serviceByProviderId = new Map<number, ServiceKey>(
  (Object.entries(TMDB_SERVICE_IDS) as [ServiceKey, readonly number[]][]).flatMap(([key, ids]) => ids.map((id): [number, ServiceKey] => [id, key])),
);

const date = z.string().nullish();
const episodeRef = z.object({ season_number: z.number(), episode_number: z.number(), runtime: z.number().nullish(), air_date: date });
const providers = z.object({ results: z.record(z.string(), z.object({ flatrate: z.array(z.object({ provider_id: z.number() })).optional() })) });

const tvSchema = z.object({
  id: z.number(),
  name: z.string(),
  overview: z.string().nullish(),
  first_air_date: date,
  status: z.string(),
  poster_path: z.string().nullish(),
  backdrop_path: z.string().nullish(),
  episode_run_time: z.array(z.number()).optional(),
  seasons: z.array(z.object({ season_number: z.number(), episode_count: z.number(), air_date: date })),
  last_episode_to_air: episodeRef.nullish(),
  next_episode_to_air: episodeRef.nullish(),
  external_ids: z.object({ imdb_id: z.string().nullish() }).optional(),
  "watch/providers": providers.optional(),
});

const movieSchema = z.object({
  id: z.number(),
  title: z.string(),
  overview: z.string().nullish(),
  release_date: date,
  status: z.string(),
  poster_path: z.string().nullish(),
  backdrop_path: z.string().nullish(),
  runtime: z.number().nullish(),
  imdb_id: z.string().nullish(),
  external_ids: z.object({ imdb_id: z.string().nullish() }).optional(),
  "watch/providers": providers.optional(),
});

const searchSchema = z.object({
  page: z.number(),
  total_pages: z.number(),
  results: z.array(
    z.object({ id: z.number(), media_type: z.string().optional(), title: z.string().optional(), name: z.string().optional(), release_date: date, first_air_date: date, poster_path: z.string().nullish() }),
  ),
});

function parse<T>(schema: z.ZodType<T>, json: unknown, what: string): T {
  const result = schema.safeParse(json);
  if (!result.success) throw new ProviderError("invalid-response", `Unexpected ${what} response: ${z.prettifyError(result.error)}`);
  return result.data;
}

const clean = (d: string | null | undefined): DateString | null => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);
const yearOf = (d: string | null | undefined): number | null => {
  const c = clean(d);
  return c ? Number(c.slice(0, 4)) : null;
};

function availability(json: z.infer<typeof providers> | undefined, region: RegionCode): readonly ServiceKey[] | null {
  if (!json) return null;
  const ids = json.results[region]?.flatrate ?? [];
  return [...new Set(ids.flatMap((p) => serviceByProviderId.get(p.provider_id) ?? []))];
}

/**
 * How many episodes of each season have aired. The provider only says how many each season will have, so this works it out
 * from the next episode, then the last aired one, then the season dates, in that order of trust.
 */
export function airedCounts(tv: z.infer<typeof tvSchema>, today: DateString): Season[] {
  const ended = tv.status === "Ended" || tv.status === "Canceled";
  const next = tv.next_episode_to_air && tv.next_episode_to_air.season_number >= 1 ? tv.next_episode_to_air : null;
  const last = tv.last_episode_to_air && tv.last_episode_to_air.season_number >= 1 ? tv.last_episode_to_air : null;
  return tv.seasons
    .filter((s) => s.season_number >= 1)
    .sort((a, b) => a.season_number - b.season_number)
    .map((s) => {
      const count = s.episode_count;
      let aired: number;
      if (ended) aired = count;
      else if (next) aired = s.season_number < next.season_number ? count : s.season_number === next.season_number ? next.episode_number - 1 : 0;
      else if (last) aired = s.season_number < last.season_number ? count : s.season_number === last.season_number ? last.episode_number : 0;
      else aired = clean(s.air_date) !== null && (s.air_date as string) <= today ? count : 0;
      return { number: s.season_number, episodeCount: count, airedCount: Math.max(0, Math.min(aired, count)) };
    });
}

export function mapTv(json: unknown, region: RegionCode, today: DateString): ProviderTitle {
  const tv = parse(tvSchema, json, "series");
  const seasons = airedCounts(tv, today);
  const ended = tv.status === "Ended" || tv.status === "Canceled";
  const airedTotal = seasons.reduce((n, s) => n + s.airedCount, 0);
  const state: SeriesState = ended ? "ended" : airedTotal > 0 ? "ongoing" : "upcoming";
  const nextEp = tv.next_episode_to_air;
  const nextAir = nextEp ? clean(nextEp.air_date) : null;
  return {
    ref: { provider: "tmdb", type: "tv", externalId: String(tv.id) },
    imdbId: tv.external_ids?.imdb_id || null,
    title: tv.name,
    overview: tv.overview ?? "",
    releaseDate: clean(tv.first_air_date),
    posterPath: tv.poster_path ?? null,
    backdropPath: tv.backdrop_path ?? null,
    runtimeMinutes: tv.episode_run_time?.[0] ?? tv.last_episode_to_air?.runtime ?? null,
    released: airedTotal > 0,
    series: { state, seasons, nextEpisode: nextEp && nextAir && nextEp.season_number >= 1 ? { season: nextEp.season_number, episode: nextEp.episode_number, airDate: nextAir } : null },
    availability: availability(tv["watch/providers"], region),
  };
}

export function mapMovie(json: unknown, region: RegionCode): ProviderTitle {
  const m = parse(movieSchema, json, "movie");
  return {
    ref: { provider: "tmdb", type: "movie", externalId: String(m.id) },
    imdbId: m.imdb_id || m.external_ids?.imdb_id || null,
    title: m.title,
    overview: m.overview ?? "",
    releaseDate: clean(m.release_date),
    posterPath: m.poster_path ?? null,
    backdropPath: m.backdrop_path ?? null,
    runtimeMinutes: m.runtime && m.runtime > 0 ? m.runtime : null,
    released: m.status === "Released",
    series: null,
    availability: availability(m["watch/providers"], region),
  };
}

export function mapSearch(json: unknown): SearchPage {
  const page = parse(searchSchema, json, "search");
  const hits = page.results.flatMap((r): SearchHit[] => {
    if (r.media_type !== "tv" && r.media_type !== "movie") return [];
    const title = r.media_type === "tv" ? r.name : r.title;
    if (!title) return [];
    const ref: TitleRef = { provider: "tmdb", type: r.media_type, externalId: String(r.id) };
    return [{ ref, title, year: yearOf(r.media_type === "tv" ? r.first_air_date : r.release_date), posterPath: r.poster_path ?? null }];
  });
  return { hits, page: page.page, totalPages: Math.min(page.total_pages, 500) };
}
