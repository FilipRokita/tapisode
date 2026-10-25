import type { DateString } from "./countdown";
import type { RegionCode, ServiceKey } from "./services";
import type { MediaType, Season, SeriesState, TitleRef } from "./types";

export type PosterSize = "w92" | "w154" | "w185" | "w342" | "w500";
export type BackdropSize = "w300" | "w780" | "w1280";

/** One row of search results. Providers do not return availability or seasons for search, so neither is here. */
export interface SearchHit {
  readonly ref: TitleRef;
  readonly title: string;
  readonly year: number | null;
  readonly posterPath: string | null;
}

/** The lists Home shows besides the user's own. */
export type BrowseList = "trending" | "in-cinemas" | "coming-soon";

/** A title in one of those lists. `releaseDate` is when it came out, or comes out for "coming-soon". */
export interface BrowseHit extends SearchHit {
  readonly releaseDate: DateString | null;
  /** The wide still of the title, for the cards that show one. Null when the provider has none. */
  readonly backdropPath: string | null;
}

export interface SearchPage {
  readonly hits: readonly SearchHit[];
  readonly page: number;
  readonly totalPages: number;
}

/** A title as the provider describes it, already normalized to our own vocabulary. */
export interface ProviderTitle {
  readonly ref: TitleRef;
  readonly imdbId: string | null;
  readonly title: string;
  readonly overview: string;
  readonly releaseDate: DateString | null;
  readonly posterPath: string | null;
  /** The wide still the drawer uses as its background. Null when the provider has none. */
  readonly backdropPath: string | null;
  /** Minutes per episode for a series, minutes for a movie. Null when the provider has none. */
  readonly runtimeMinutes: number | null;
  /** Movies only: the provider reports the title as released. */
  readonly released: boolean;
  /** Series only. */
  readonly series: {
    readonly state: SeriesState;
    readonly seasons: readonly Season[];
    readonly nextEpisode: { readonly season: number; readonly episode: number; readonly airDate: DateString } | null;
  } | null;
  /** Services carrying the title in the requested region. Null when the provider has no data for it. */
  readonly availability: readonly ServiceKey[] | null;
}

export interface Region {
  readonly code: RegionCode;
  readonly name: string;
}

/** Why a provider call failed. Adapters throw these, and only these. */
export class ProviderError extends Error {
  constructor(
    readonly kind: "rate-limited" | "unavailable" | "invalid-response",
    message: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/**
 * The port every data provider implements. Nothing outside the adapters knows TMDB concepts.
 * A call returns null when the provider simply has no such data, and throws `ProviderError` when it fails.
 */
export interface MediaProvider {
  readonly id: string;
  search(query: string, page: number): Promise<SearchPage>;
  popular(): Promise<readonly SearchHit[]>;
  /** A list for Home. "in-cinemas" and "coming-soon" are movies in the given region, "coming-soon" soonest first. */
  browse(list: BrowseList, region: RegionCode): Promise<readonly BrowseHit[]>;
  getTitle(ref: TitleRef, region: RegionCode): Promise<ProviderTitle | null>;
  regions(): Promise<readonly Region[]>;
  /** Builds a full image URL from a stored path. The database keeps paths only. */
  imageUrl(path: string, size: PosterSize | BackdropSize): string;
}

export type { MediaType };
