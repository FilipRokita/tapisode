import { watchedEpisodes } from "./progress";
import type { MovieFacts, SeriesFacts, Status, UserTitleState } from "./types";

export interface StatsItem {
  readonly state: UserTitleState;
  /** Null when the title's content has been purged and not fetched again. */
  readonly content: {
    readonly facts: SeriesFacts | MovieFacts;
    /** Minutes per episode for a series, minutes for a movie. Null when the provider has none. */
    readonly runtimeMinutes: number | null;
  } | null;
}

export interface Stats {
  readonly episodes: number;
  readonly hours: number;
  readonly finished: number;
  readonly tracked: number;
  readonly byStatus: Readonly<Record<Status, number>>;
  readonly series: number;
  readonly movies: number;
  /** Titles left out of the numbers because their content is not available right now. */
  readonly pending: number;
}

export function computeStats(items: readonly StatsItem[]): Stats {
  const byStatus: Record<Status, number> = { watching: 0, watchlist: 0, complete: 0 };
  let episodes = 0;
  let minutes = 0;
  let series = 0;
  let movies = 0;
  let pending = 0;
  for (const { state, content } of items) {
    byStatus[state.status] += 1;
    if (!content) {
      pending += 1;
      continue;
    }
    if (content.facts.type === "tv") {
      series += 1;
      const watched = watchedEpisodes(state.position, content.facts.seasons);
      episodes += watched;
      if (content.runtimeMinutes !== null) minutes += watched * content.runtimeMinutes;
    } else {
      movies += 1;
      if (state.status === "complete" && content.runtimeMinutes !== null) minutes += content.runtimeMinutes;
    }
  }
  return {
    episodes,
    hours: Math.round(minutes / 60),
    finished: byStatus.complete,
    tracked: byStatus.watching + byStatus.watchlist + byStatus.complete,
    byStatus,
    series,
    movies,
    pending,
  };
}

/** "About N days of watching" on the share card, from the rounded hours so the card agrees with itself. */
export const watchingDays = (hours: number): string => (hours / 24).toFixed(1);
