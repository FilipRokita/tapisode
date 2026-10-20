import { episodeCode } from "@/components/copy";
import { airedEpisodes, isCaughtUp, isFinished, isReleased, isStarted, nextPosition, progressPercent, watchedEpisodes } from "@/domain/progress";
import type { ServiceKey } from "@/domain/services";
import type { TitleView } from "@/domain/view";

/** Everything a card or the "Up next" panel needs to show about one title, derived from the view alone. */
export interface TitleInfo {
  readonly isSeries: boolean;
  /** The last watched episode as `S02E04`, or "Not started". Empty for a movie. */
  readonly stamp: string;
  readonly percent: number;
  readonly watched: number;
  readonly aired: number;
  /** The episode `+1` would mark, as `S02E05`. Null when there is none. */
  readonly target: string | null;
  readonly caughtUp: boolean;
  readonly finished: boolean;
  readonly released: boolean;
  readonly firstService: ServiceKey | null;
  readonly moreServices: number;
  readonly runtime: string | null;
}

const runtimeText = (minutes: number | null): string | null => (minutes === null ? null : `${Math.floor(minutes / 60)}h ${minutes % 60}m`);

export function describeTitle(view: TitleView): TitleInfo {
  const services = view.services ?? [];
  const common = { firstService: services[0] ?? null, moreServices: Math.max(0, services.length - 1), runtime: runtimeText(view.runtimeMinutes), released: isReleased(view.facts) };
  if (view.facts.type === "movie") {
    return { ...common, isSeries: false, stamp: "", percent: 0, watched: 0, aired: 0, target: null, caughtUp: false, finished: false };
  }
  const position = view.state?.position ?? { season: 0, episode: 0 };
  const next = nextPosition(position, view.facts.seasons);
  return {
    ...common,
    isSeries: true,
    stamp: isStarted(position) ? episodeCode(position.season, position.episode) : "Not started",
    percent: progressPercent(position, view.facts.seasons),
    watched: watchedEpisodes(position, view.facts.seasons),
    aired: airedEpisodes(view.facts.seasons),
    target: next ? episodeCode(next.season, next.episode) : null,
    caughtUp: isCaughtUp(view.facts, position),
    finished: isFinished(view.facts, position),
  };
}
