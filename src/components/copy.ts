import type { ChangeTitleResult } from "@/actions/library";
import type { TransitionError } from "@/domain/transitions";
import type { Status } from "@/domain/types";

/** Every message the app shows about a change, in one place. English only, and no em dashes. */
export const STATUS_LABEL: Record<Status, string> = { watching: "Watching", watchlist: "Watchlist", complete: "Complete" };

export const episodeCode = (season: number, episode: number): string => `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;

const TRANSITION_ERRORS: Record<TransitionError, string> = {
  NOT_RELEASED: "Not released yet. You can add it to Watchlist.",
  NOT_A_SERIES: "Only series have episodes.",
  CAUGHT_UP: "You are caught up.",
  FINISHED: "You have finished this series.",
  STILL_AIRING: "Still airing. It stays in Watching until the series ends.",
  PICK_AN_EPISODE: "Pick an episode to continue from.",
  INVALID_POSITION: "That episode does not exist.",
  NOT_AIRED: "That episode has not aired yet.",
  INCONSISTENT_STATE: "That change is not possible.",
};

const SERVER_ERRORS = {
  NOT_FOUND: "Title not found.",
  CONFLICT: "This changed on another device. Showing the latest.",
  UNAUTHORIZED: "Your session ended. Sign in again.",
  INVALID_INPUT: "Something went wrong. Try again.",
  RATE_LIMITED: "Too many requests. Try again in a minute.",
  BUSY: "The catalog is busy. Try again in a moment.",
  UNAVAILABLE: "The catalog is unavailable right now.",
} as const;

export const OFFLINE_MESSAGE = "You're offline. Changes can't be saved right now.";

export function errorMessage(error: TransitionError | keyof typeof SERVER_ERRORS): string {
  return error in TRANSITION_ERRORS ? TRANSITION_ERRORS[error as TransitionError] : SERVER_ERRORS[error as keyof typeof SERVER_ERRORS];
}

export type ChangeFailure = Extract<ChangeTitleResult, { ok: false }>;
