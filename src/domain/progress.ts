import { NOT_STARTED, type Position, type Season, type SeriesFacts, type TitleFacts } from "./types";

export const isStarted = (p: Position): boolean => p.season > 0;

export const samePosition = (a: Position, b: Position): boolean => a.season === b.season && a.episode === b.episode;

const withEpisodes = (seasons: readonly Season[]): readonly Season[] => seasons.filter((s) => s.episodeCount > 0);

/** The episode that comes after `p`, whether or not it has aired. Null when `p` is the last episode. */
export function nextPosition(p: Position, seasons: readonly Season[]): Position | null {
  const real = withEpisodes(seasons);
  if (!isStarted(p)) {
    const first = real[0];
    return first ? { season: first.number, episode: 1 } : null;
  }
  const current = real.find((s) => s.number === p.season);
  if (current && p.episode < current.episodeCount) return { season: current.number, episode: p.episode + 1 };
  const next = real.find((s) => s.number > p.season);
  return next ? { season: next.number, episode: 1 } : null;
}

/** The final episode of the final season, aired or not. */
export function lastPosition(seasons: readonly Season[]): Position | null {
  const last = withEpisodes(seasons).at(-1);
  return last ? { season: last.number, episode: last.episodeCount } : null;
}

/** The last episode that has aired, or not started when nothing has. */
export function lastAiredPosition(seasons: readonly Season[]): Position {
  const last = seasons.filter((s) => s.airedCount > 0).at(-1);
  return last ? { season: last.number, episode: last.airedCount } : NOT_STARTED;
}

export function isAired(p: Position, seasons: readonly Season[]): boolean {
  const season = seasons.find((s) => s.number === p.season);
  return season !== undefined && p.episode >= 1 && p.episode <= season.airedCount;
}

export const airedEpisodes = (seasons: readonly Season[]): number => seasons.reduce((sum, s) => sum + s.airedCount, 0);

/** A series is out once an episode has aired. A movie is out when its provider says released. */
export function isReleased(title: TitleFacts): boolean {
  return title.type === "movie" ? title.released : airedEpisodes(title.seasons) > 0;
}

/** Ongoing series, and the user is on the last aired episode. */
export function isCaughtUp(title: SeriesFacts, p: Position): boolean {
  return title.state === "ongoing" && isStarted(p) && samePosition(p, lastAiredPosition(title.seasons));
}

/** Ended series, and the user is on its last episode. */
export function isFinished(title: SeriesFacts, p: Position): boolean {
  const last = lastPosition(title.seasons);
  return title.state === "ended" && last !== null && samePosition(p, last);
}

/** Episodes watched: every episode of the seasons before the pointer, plus the pointer's own. */
export function watchedEpisodes(p: Position, seasons: readonly Season[]): number {
  if (!isStarted(p)) return 0;
  const before = seasons.filter((s) => s.number < p.season).reduce((sum, s) => sum + s.episodeCount, 0);
  return before + p.episode;
}

/** Episodes watched out of episodes aired across the whole series, never above 100. */
export function progressPercent(p: Position, seasons: readonly Season[]): number {
  const aired = airedEpisodes(seasons);
  return aired === 0 ? 0 : Math.min(100, Math.round((watchedEpisodes(p, seasons) / aired) * 100));
}

/** Pulls a stored pointer back inside the series after its seasons changed under it. */
export function clampPosition(p: Position, seasons: readonly Season[]): Position {
  if (!isStarted(p)) return NOT_STARTED;
  const real = withEpisodes(seasons);
  const last = real.at(-1);
  if (!last) return NOT_STARTED;
  const exact = real.find((s) => s.number === p.season);
  if (exact) return { season: exact.number, episode: Math.max(1, Math.min(p.episode, exact.episodeCount)) };
  if (p.season > last.number) return { season: last.number, episode: last.episodeCount };
  const before = real.filter((s) => s.number < p.season).at(-1);
  return before ? { season: before.number, episode: before.episodeCount } : NOT_STARTED;
}
