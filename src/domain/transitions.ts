import { clampPosition, isAired, isFinished, isReleased, isStarted, lastPosition, nextPosition, samePosition } from "./progress";
import { err, ok, type Result } from "./result";
import { NOT_STARTED, type Position, type SeriesFacts, type Status, type TitleFacts, type UserTitleState } from "./types";

export type Command =
  | { readonly kind: "plusOne" }
  | { readonly kind: "setStatus"; readonly status: Status }
  | { readonly kind: "jumpTo"; readonly position: Position }
  | { readonly kind: "restore"; readonly state: UserTitleState | null };

export type TransitionError =
  | "NOT_RELEASED"
  | "NOT_A_SERIES"
  | "CAUGHT_UP"
  | "FINISHED"
  | "STILL_AIRING"
  | "PICK_AN_EPISODE"
  | "INVALID_POSITION"
  | "NOT_AIRED"
  | "INCONSISTENT_STATE";

/**
 * Whether a state can exist for a title. Every transition result satisfies this, so the app
 * never stores a state the rules would not have produced.
 */
export function isConsistent(title: TitleFacts, s: UserTitleState): boolean {
  if (title.type === "movie") return !isStarted(s.position) && (title.released || s.status === "watchlist");
  if (!isReleased(title) && s.status !== "watchlist") return false;
  const last = lastPosition(title.seasons);
  switch (s.status) {
    case "watchlist":
      return !isStarted(s.position);
    case "complete":
      return title.state === "ended" && last !== null && samePosition(s.position, last);
    case "watching":
      return samePosition(s.position, clampPosition(s.position, title.seasons)) && !isFinished(title, s.position);
  }
}

const atPosition = (title: SeriesFacts, position: Position): UserTitleState => ({
  status: isFinished(title, position) ? "complete" : "watching",
  position,
});

function plusOne(title: TitleFacts, current: UserTitleState | null): Result<UserTitleState, TransitionError> {
  if (title.type !== "tv") return err("NOT_A_SERIES");
  if (!isReleased(title)) return err("NOT_RELEASED");
  const from = current?.position ?? NOT_STARTED;
  if (isFinished(title, from)) return err("FINISHED");
  const next = nextPosition(from, title.seasons);
  if (next === null || !isAired(next, title.seasons)) return err(title.state === "ended" ? "FINISHED" : "CAUGHT_UP");
  return ok(atPosition(title, next));
}

function setStatus(title: TitleFacts, current: UserTitleState | null, status: Status): Result<UserTitleState, TransitionError> {
  if (!isReleased(title) && status !== "watchlist") return err("NOT_RELEASED");
  if (title.type === "movie") return ok({ status, position: NOT_STARTED });
  switch (status) {
    case "watchlist":
      return ok({ status, position: NOT_STARTED });
    case "complete": {
      const last = lastPosition(title.seasons);
      return title.state !== "ended" || last === null ? err("STILL_AIRING") : ok({ status, position: last });
    }
    case "watching":
      return current?.status === "complete" ? err("PICK_AN_EPISODE") : ok({ status, position: current?.position ?? NOT_STARTED });
  }
}

function jumpTo(title: TitleFacts, position: Position): Result<UserTitleState, TransitionError> {
  if (title.type !== "tv") return err("NOT_A_SERIES");
  if (!isReleased(title)) return err("NOT_RELEASED");
  const season = title.seasons.find((s) => s.number === position.season);
  if (!season || position.episode < 1 || position.episode > season.episodeCount) return err("INVALID_POSITION");
  if (!isAired(position, title.seasons)) return err("NOT_AIRED");
  return ok(atPosition(title, position));
}

/**
 * The one place that decides what a user's action does. The client previews it, the server applies it.
 * A null result means the title is no longer tracked, which is what undoing an add does.
 */
export function transition(title: TitleFacts, current: UserTitleState | null, command: Command): Result<UserTitleState | null, TransitionError> {
  switch (command.kind) {
    case "plusOne":
      return plusOne(title, current);
    case "setStatus":
      return setStatus(title, current, command.status);
    case "jumpTo":
      return jumpTo(title, command.position);
    case "restore":
      return command.state === null || isConsistent(title, command.state) ? ok(command.state) : err("INCONSISTENT_STATE");
  }
}

/** Repairs a stored state after the title's data changed (a refresh added, removed or finished episodes). */
export function reconcile(title: TitleFacts, s: UserTitleState): UserTitleState {
  if (title.type === "movie") return { status: s.status, position: NOT_STARTED };
  if (s.status === "watchlist") return { status: "watchlist", position: NOT_STARTED };
  const position = clampPosition(s.position, title.seasons);
  const last = lastPosition(title.seasons);
  if (isFinished(title, position)) return { status: "complete", position };
  if (s.status === "complete") return { status: "watching", position: last === null ? NOT_STARTED : position };
  return { status: "watching", position };
}
