import type { MovieFacts, Season, SeriesFacts } from "@/domain/types";

export const season = (number: number, episodeCount: number, airedCount = episodeCount): Season => ({ number, episodeCount, airedCount });

/** Two ended seasons: 8 and 10 episodes. */
export const ended: SeriesFacts = { type: "tv", state: "ended", seasons: [season(1, 8), season(2, 10)] };
/** Ongoing, season 2 is airing: 8 and 10 episodes, 4 of season 2 aired. */
export const ongoing: SeriesFacts = { type: "tv", state: "ongoing", seasons: [season(1, 8), season(2, 10, 4)] };
/** Announced, nothing aired. */
export const upcoming: SeriesFacts = { type: "tv", state: "upcoming", seasons: [season(1, 6, 0)] };
export const releasedMovie: MovieFacts = { type: "movie", released: true };
export const unreleasedMovie: MovieFacts = { type: "movie", released: false };
