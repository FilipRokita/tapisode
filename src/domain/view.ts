import type { DateString } from "./countdown";
import type { PosterSize } from "./provider";
import type { ServiceKey } from "./services";
import type { TitleFacts, TitleRef, UserTitleState } from "./types";

export type PosterUrls = Readonly<Record<Extract<PosterSize, "w92" | "w185" | "w342">, string>>;

/** A title as the UI uses it: content from the cache, our services, and the user's own state. */
export interface TitleView {
  readonly id: string;
  readonly ref: TitleRef;
  readonly title: string;
  readonly overview: string;
  readonly year: number | null;
  readonly poster: PosterUrls | null;
  /** The drawer's background image. Null when the title has none. */
  readonly backdrop: string | null;
  readonly runtimeMinutes: number | null;
  readonly facts: TitleFacts;
  readonly nextEpisode: { readonly season: number; readonly episode: number; readonly airDate: DateString } | null;
  /** Null when we have no availability data for the user's region yet. */
  readonly services: readonly ServiceKey[] | null;
  readonly state: UserTitleState | null;
  readonly activityAt: number;
}

/** One row of search results. */
export interface SearchRow {
  readonly ref: TitleRef;
  readonly title: string;
  readonly year: number | null;
  readonly poster: Pick<PosterUrls, "w92"> | null;
  /** The user's state when the title is already on a list. */
  readonly state: UserTitleState | null;
}
