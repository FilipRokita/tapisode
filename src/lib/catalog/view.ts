import type { ContentRow } from "@/db/catalog";
import type { PosterSize, ProviderTitle } from "@/domain/provider";
import { SERVICE_KEYS, type ServiceKey } from "@/domain/services";
import type { Season, TitleFacts } from "@/domain/types";
import type { PosterUrls } from "@/domain/view";

export function factsOf(row: Pick<ContentRow, "seriesState" | "seasons" | "movieReleased">): TitleFacts {
  if (row.seriesState) return { type: "tv", state: row.seriesState, seasons: (row.seasons ?? []) as readonly Season[] };
  return { type: "movie", released: row.movieReleased === true };
}

const isServiceKey = (s: string): s is ServiceKey => (SERVICE_KEYS as readonly string[]).includes(s);
export const serviceKeys = (services: readonly string[]): ServiceKey[] => services.filter(isServiceKey);

export function posterUrls(path: string | null, imageUrl: (path: string, size: PosterSize) => string): PosterUrls | null {
  return path ? { w92: imageUrl(path, "w92"), w185: imageUrl(path, "w185"), w342: imageUrl(path, "w342") } : null;
}

/** The facts the rules need, straight from what a provider returned (no cache involved). */
export function factsFrom(t: ProviderTitle): TitleFacts {
  return t.series ? { type: "tv", state: t.series.state, seasons: t.series.seasons } : { type: "movie", released: t.released };
}
