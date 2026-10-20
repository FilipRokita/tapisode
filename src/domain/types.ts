/** The three lists a title can be on. A title on none of them is simply not tracked. */
export const STATUSES = ["watching", "watchlist", "complete"] as const;
export type Status = (typeof STATUSES)[number];

export type MediaType = "tv" | "movie";

/** Identity of a catalog title. TMDB numbers movies and series separately, so the type is part of the key. */
export interface TitleRef {
  readonly provider: string;
  readonly type: MediaType;
  readonly externalId: string;
}

/** The last watched episode. `season: 0` means not started. */
export interface Position {
  readonly season: number;
  readonly episode: number;
}

export const NOT_STARTED: Position = { season: 0, episode: 0 };

export interface Season {
  readonly number: number;
  readonly episodeCount: number;
  /** How many of the season's episodes have aired. Equals `episodeCount` for an ended series. */
  readonly airedCount: number;
}

export type SeriesState = "upcoming" | "ongoing" | "ended";

export interface SeriesFacts {
  readonly type: "tv";
  readonly state: SeriesState;
  /** Ordered by season number. Specials (season 0) are never included. */
  readonly seasons: readonly Season[];
}

export interface MovieFacts {
  readonly type: "movie";
  readonly released: boolean;
}

export type TitleFacts = SeriesFacts | MovieFacts;

/** What the user has recorded about one title. */
export interface UserTitleState {
  readonly status: Status;
  readonly position: Position;
}
