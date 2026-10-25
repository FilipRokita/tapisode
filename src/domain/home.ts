import { addDays, type DateString } from "./countdown";
import { airedEpisodes, watchedEpisodes } from "./progress";
import type { TitleView } from "./view";

/** What Home needs to know about a title. A `TitleView` has all of it. */
export type HomeTitle = Pick<TitleView, "id" | "state" | "facts" | "nextEpisode" | "runtimeMinutes" | "activityAt">;

export interface AgendaEntry<T extends HomeTitle> {
  readonly view: T;
  readonly season: number;
  readonly episode: number;
}

export interface AgendaDay<T extends HomeTitle> {
  readonly date: DateString;
  /** 0 for today. */
  readonly daysAway: number;
  readonly entries: readonly AgendaEntry<T>[];
}

/**
 * The next `days` days starting today, with the episodes of the user's series that air on each. Series on the Watching
 * list and the Watchlist count. A series that is not tracked, or is Complete, has no entries. Dates are calendar dates.
 */
export function weekAgenda<T extends HomeTitle>(titles: readonly T[], today: DateString, days = 7): AgendaDay<T>[] {
  const airing = titles
    .filter((t) => t.facts.type === "tv" && (t.state?.status === "watching" || t.state?.status === "watchlist") && t.nextEpisode !== null)
    .sort((a, b) => b.activityAt - a.activityAt);
  return Array.from({ length: days }, (_, daysAway) => {
    const date = addDays(today, daysAway);
    const entries = airing.flatMap((view) => (view.nextEpisode?.airDate === date ? [{ view, season: view.nextEpisode.season, episode: view.nextEpisode.episode }] : []));
    return { date, daysAway, entries };
  });
}

/** The first episode of a tracked series that airs after the window of `weekAgenda`, or null. For when nothing airs this week. */
export function nextAiring<T extends HomeTitle>(titles: readonly T[], today: DateString, days = 7): { readonly view: T; readonly airDate: DateString } | null {
  const lastDay = addDays(today, days - 1);
  let best: { view: T; airDate: DateString } | null = null;
  for (const view of titles) {
    const airDate = view.nextEpisode?.airDate;
    if (view.facts.type !== "tv" || (view.state?.status !== "watching" && view.state?.status !== "watchlist") || !airDate || airDate <= lastDay) continue;
    if (!best || airDate < best.airDate) best = { view, airDate };
  }
  return best;
}

export interface CatchUp<T extends HomeTitle> {
  readonly view: T;
  /** Aired episodes not watched yet. */
  readonly left: number;
  readonly percent: number;
}

/** The Watching series that still have aired episodes to watch, the longest backlog first. */
export function catchUp<T extends HomeTitle>(titles: readonly T[]): CatchUp<T>[] {
  return titles
    .flatMap((view): CatchUp<T>[] => {
      if (view.facts.type !== "tv" || view.state?.status !== "watching") return [];
      const aired = airedEpisodes(view.facts.seasons);
      const watched = watchedEpisodes(view.state.position, view.facts.seasons);
      return aired - watched > 0 ? [{ view, left: aired - watched, percent: Math.round((watched / aired) * 100) }] : [];
    })
    .sort((a, b) => b.left - a.left);
}

export interface Backlog {
  /** Aired episodes of Watching series that the user has not watched. */
  readonly episodes: number;
  /** Rounded hours those episodes take, counting only series that have a runtime. */
  readonly hours: number;
  /** Percent of the aired episodes of Watching series that are watched. 0 when there are none. */
  readonly percent: number;
}

export function backlog(titles: readonly HomeTitle[]): Backlog {
  let aired = 0;
  let watched = 0;
  let minutes = 0;
  for (const t of titles) {
    if (t.facts.type !== "tv" || t.state?.status !== "watching") continue;
    const a = airedEpisodes(t.facts.seasons);
    const w = watchedEpisodes(t.state.position, t.facts.seasons);
    aired += a;
    watched += w;
    if (t.runtimeMinutes !== null) minutes += (a - w) * t.runtimeMinutes;
  }
  return { episodes: aired - watched, hours: Math.round(minutes / 60), percent: aired === 0 ? 0 : Math.round((watched / aired) * 100) };
}

export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  if (hour >= 18 && hour < 23) return "Good evening";
  return "Good night";
}
