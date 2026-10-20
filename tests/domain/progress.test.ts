import { describe, expect, it } from "vitest";
import {
  clampPosition,
  isAired,
  isCaughtUp,
  isFinished,
  isReleased,
  lastAiredPosition,
  lastPosition,
  nextPosition,
  progressPercent,
  watchedEpisodes,
} from "@/domain/progress";
import { NOT_STARTED } from "@/domain/types";
import { ended, ongoing, releasedMovie, season, unreleasedMovie, upcoming } from "./fixtures";

const p = (s: number, e: number) => ({ season: s, episode: e });

describe("nextPosition", () => {
  it.each([
    ["not started goes to S01E01", NOT_STARTED, ended.seasons, p(1, 1)],
    ["inside a season", p(1, 3), ended.seasons, p(1, 4)],
    ["end of a season rolls to the next", p(1, 8), ended.seasons, p(2, 1)],
    ["last episode has no next", p(2, 10), ended.seasons, null],
    ["a season with no episodes is skipped", p(1, 8), [season(1, 8), season(2, 0), season(3, 5)], p(3, 1)],
    ["numbers may skip", p(1, 8), [season(1, 8), season(3, 5)], p(3, 1)],
    ["nothing to watch", NOT_STARTED, [season(1, 0)], null],
  ])("%s", (_name, from, seasons, expected) => {
    expect(nextPosition(from, seasons)).toEqual(expected);
  });
});

describe("last positions", () => {
  it("last position is the final episode of the final season with episodes", () => {
    expect(lastPosition(ended.seasons)).toEqual(p(2, 10));
    expect(lastPosition([season(1, 8), season(2, 0)])).toEqual(p(1, 8));
    expect(lastPosition([])).toBeNull();
  });
  it("last aired position follows airedCount", () => {
    expect(lastAiredPosition(ongoing.seasons)).toEqual(p(2, 4));
    expect(lastAiredPosition(upcoming.seasons)).toEqual(NOT_STARTED);
  });
  it("isAired checks the season's airedCount", () => {
    expect(isAired(p(2, 4), ongoing.seasons)).toBe(true);
    expect(isAired(p(2, 5), ongoing.seasons)).toBe(false);
    expect(isAired(p(9, 1), ongoing.seasons)).toBe(false);
  });
});

describe("release, caught up and finished", () => {
  it("series is released once an episode aired, movie by its flag", () => {
    expect(isReleased(ongoing)).toBe(true);
    expect(isReleased(upcoming)).toBe(false);
    expect(isReleased(releasedMovie)).toBe(true);
    expect(isReleased(unreleasedMovie)).toBe(false);
  });
  it("caught up only for an ongoing series on its last aired episode", () => {
    expect(isCaughtUp(ongoing, p(2, 4))).toBe(true);
    expect(isCaughtUp(ongoing, p(2, 3))).toBe(false);
    expect(isCaughtUp(ongoing, NOT_STARTED)).toBe(false);
    expect(isCaughtUp(ended, p(2, 10))).toBe(false);
    expect(isCaughtUp(upcoming, NOT_STARTED)).toBe(false);
  });
  it("finished only for an ended series on its last episode", () => {
    expect(isFinished(ended, p(2, 10))).toBe(true);
    expect(isFinished(ended, p(2, 9))).toBe(false);
    expect(isFinished(ongoing, p(2, 10))).toBe(false);
  });
});

describe("counting", () => {
  it.each([
    [NOT_STARTED, 0],
    [p(1, 1), 1],
    [p(1, 8), 8],
    [p(2, 1), 9],
    [p(2, 4), 12],
  ])("watched episodes at %j is %i", (pos, n) => {
    expect(watchedEpisodes(pos, ongoing.seasons)).toBe(n);
  });
  it.each([
    [NOT_STARTED, 0],
    [p(1, 8), 67],
    [p(2, 4), 100],
  ])("progress at %j is %i%% of 12 aired episodes", (pos, pct) => {
    expect(progressPercent(pos, ongoing.seasons)).toBe(pct);
  });
  it("is 0 when nothing aired and never above 100", () => {
    expect(progressPercent(NOT_STARTED, upcoming.seasons)).toBe(0);
    expect(progressPercent(p(2, 10), ongoing.seasons)).toBe(100);
  });
});

describe("clampPosition", () => {
  it.each([
    ["inside stays", p(1, 5), [season(1, 8)], p(1, 5)],
    ["too far in the season clamps to its end", p(1, 12), [season(1, 8)], p(1, 8)],
    ["season removed past the end clamps to the last episode", p(3, 2), [season(1, 8), season(2, 10)], p(2, 10)],
    ["season missing in the middle falls back to the one before", p(2, 3), [season(1, 8), season(3, 5)], p(1, 8)],
    ["season now empty falls back to the one before", p(2, 3), [season(1, 8), season(2, 0)], p(1, 8)],
    ["nothing left", p(1, 3), [season(1, 0)], NOT_STARTED],
    ["not started stays", NOT_STARTED, [season(1, 8)], NOT_STARTED],
  ])("%s", (_n, pos, seasons, expected) => {
    expect(clampPosition(pos, seasons)).toEqual(expected);
  });
});
