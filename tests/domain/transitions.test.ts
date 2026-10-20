import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { clampPosition, lastPosition, nextPosition } from "@/domain/progress";
import { isConsistent, reconcile, transition, type Command } from "@/domain/transitions";
import { NOT_STARTED, type Position, type Season, type TitleFacts, type UserTitleState } from "@/domain/types";
import { ended, ongoing, releasedMovie, season, unreleasedMovie, upcoming } from "./fixtures";

const p = (s: number, e: number): Position => ({ season: s, episode: e });
const st = (status: UserTitleState["status"], position: Position): UserTitleState => ({ status, position });
const run = (title: TitleFacts, current: UserTitleState | null, command: Command) => transition(title, current, command);

describe("+1", () => {
  it.each([
    ["from nothing starts at S01E01 in Watching", ended, null, st("watching", p(1, 1))],
    ["from Watchlist moves to Watching at S01E01", ended, st("watchlist", NOT_STARTED), st("watching", p(1, 1))],
    ["advances inside a season", ended, st("watching", p(1, 3)), st("watching", p(1, 4))],
    ["rolls into the next season", ended, st("watching", p(1, 8)), st("watching", p(2, 1))],
    ["the last episode of an ended series completes it", ended, st("watching", p(2, 9)), st("complete", p(2, 10))],
    ["an aired episode of an ongoing series stays in Watching", ongoing, st("watching", p(2, 3)), st("watching", p(2, 4))],
  ])("%s", (_n, title, current, expected) => {
    expect(run(title, current, { kind: "plusOne" })).toEqual({ ok: true, value: expected });
  });

  it.each([
    ["caught up on an ongoing series", ongoing, st("watching", p(2, 4)), "CAUGHT_UP"],
    ["already finished", ended, st("complete", p(2, 10)), "FINISHED"],
    ["not released", upcoming, null, "NOT_RELEASED"],
    ["a movie has no episodes", releasedMovie, null, "NOT_A_SERIES"],
  ] as const)("is refused: %s", (_n, title, current, error) => {
    expect(run(title, current, { kind: "plusOne" })).toEqual({ ok: false, error });
  });
});

describe("moving between states by hand", () => {
  it.each([
    ["series to Complete lands on the last episode", ended, st("watching", p(1, 3)), "complete", st("complete", p(2, 10))],
    ["series to Watchlist resets the position", ended, st("watching", p(1, 3)), "watchlist", st("watchlist", NOT_STARTED)],
    ["Watchlist to Watching keeps it not started", ended, st("watchlist", NOT_STARTED), "watching", st("watching", NOT_STARTED)],
    ["not tracked to Watching starts not started", ended, null, "watching", st("watching", NOT_STARTED)],
    ["Watching to Watching changes nothing", ended, st("watching", p(1, 3)), "watching", st("watching", p(1, 3))],
    ["a movie to Complete", releasedMovie, st("watching", NOT_STARTED), "complete", st("complete", NOT_STARTED)],
    ["a completed movie back to Watching", releasedMovie, st("complete", NOT_STARTED), "watching", st("watching", NOT_STARTED)],
    ["an unreleased series to Watchlist", upcoming, null, "watchlist", st("watchlist", NOT_STARTED)],
  ] as const)("%s", (_n, title, current, status, expected) => {
    expect(run(title, current, { kind: "setStatus", status })).toEqual({ ok: true, value: expected });
  });

  it.each([
    ["a series still airing cannot be Complete", ongoing, st("watching", p(2, 4)), "complete", "STILL_AIRING"],
    ["a completed series cannot go back to Watching by hand", ended, st("complete", p(2, 10)), "watching", "PICK_AN_EPISODE"],
    ["an unreleased series cannot be Watching", upcoming, null, "watching", "NOT_RELEASED"],
    ["an unreleased movie cannot be Complete", unreleasedMovie, null, "complete", "NOT_RELEASED"],
  ] as const)("is refused: %s", (_n, title, current, status, error) => {
    expect(run(title, current, { kind: "setStatus", status })).toEqual({ ok: false, error });
  });
});

describe("picking an episode", () => {
  it.each([
    ["from Watchlist moves to Watching", ended, st("watchlist", NOT_STARTED), p(1, 3), st("watching", p(1, 3))],
    ["from Complete moves back to Watching", ended, st("complete", p(2, 10)), p(2, 2), st("watching", p(2, 2))],
    ["the last episode of an ended series completes it", ended, st("watching", p(1, 1)), p(2, 10), st("complete", p(2, 10))],
    ["not tracked yet starts tracking", ended, null, p(2, 1), st("watching", p(2, 1))],
    ["the last aired episode of an ongoing series stays in Watching", ongoing, null, p(2, 4), st("watching", p(2, 4))],
  ])("%s", (_n, title, current, position, expected) => {
    expect(run(title, current, { kind: "jumpTo", position })).toEqual({ ok: true, value: expected });
  });

  it.each([
    ["an episode that has not aired", ongoing, p(2, 5), "NOT_AIRED"],
    ["an episode that does not exist", ended, p(1, 9), "INVALID_POSITION"],
    ["a season that does not exist", ended, p(3, 1), "INVALID_POSITION"],
    ["episode zero", ended, p(1, 0), "INVALID_POSITION"],
    ["an unreleased series", upcoming, p(1, 1), "NOT_RELEASED"],
  ] as const)("is refused: %s", (_n, title, position, error) => {
    expect(run(title, null, { kind: "jumpTo", position })).toEqual({ ok: false, error });
  });
});

describe("undo restores a snapshot, if it is a state the rules allow", () => {
  it("accepts a consistent one", () => {
    expect(run(ended, st("complete", p(2, 10)), { kind: "restore", state: st("watching", p(2, 9)) })).toEqual({ ok: true, value: st("watching", p(2, 9)) });
  });
  it("undoes an add by restoring nothing", () => {
    expect(run(ended, st("watching", p(1, 1)), { kind: "restore", state: null })).toEqual({ ok: true, value: null });
  });
  it("rejects an inconsistent one", () => {
    expect(run(ended, null, { kind: "restore", state: st("complete", p(1, 1)) })).toEqual({ ok: false, error: "INCONSISTENT_STATE" });
  });
});

describe("reconcile after the title's data changed", () => {
  it.each([
    ["a caught-up series that has ended becomes Complete", { ...ongoing, state: "ended" as const, seasons: [season(1, 8), season(2, 4)] }, st("watching", p(2, 4)), st("complete", p(2, 4))],
    ["a completed series that gained a season goes back to Watching", { ...ended, seasons: [...ended.seasons, season(3, 6, 2)] }, st("complete", p(2, 10)), st("watching", p(2, 10))],
    ["a completed series that is no longer ended goes back to Watching", { ...ongoing, seasons: [season(1, 8), season(2, 10)] }, st("complete", p(2, 10)), st("watching", p(2, 10))],
    ["a pointer past the end is pulled back", { ...ended, seasons: [season(1, 8)] }, st("watching", p(2, 3)), st("complete", p(1, 8))],
    ["Watchlist stays not started", ended, st("watchlist", NOT_STARTED), st("watchlist", NOT_STARTED)],
    ["a movie never has a position", releasedMovie, st("watching", p(1, 1)), st("watching", NOT_STARTED)],
  ])("%s", (_n, title, current, expected) => {
    expect(reconcile(title, current)).toEqual(expected);
  });
});

// --- properties: whatever the user does, the stored state stays one the rules allow ---------------------------

const seasonsArb = fc
  .array(fc.integer({ min: 0, max: 12 }), { minLength: 1, maxLength: 5 })
  .chain((counts) =>
    fc
      .tuple(...counts.map((c) => fc.integer({ min: 0, max: c })))
      .map((aired): Season[] => counts.map((c, i) => season(i + 1, c, aired[i] ?? 0))),
  );

const titleArb: fc.Arbitrary<TitleFacts> = fc.oneof(
  seasonsArb.map((seasons): TitleFacts => ({ type: "tv", state: "ongoing", seasons })),
  seasonsArb.map((seasons): TitleFacts => ({ type: "tv", state: "ended", seasons: seasons.map((s) => ({ ...s, airedCount: s.episodeCount })) })),
  seasonsArb.map((seasons): TitleFacts => ({ type: "tv", state: "upcoming", seasons: seasons.map((s) => ({ ...s, airedCount: 0 })) })),
  fc.boolean().map((released): TitleFacts => ({ type: "movie", released })),
);

const commandArb: fc.Arbitrary<Command> = fc.oneof(
  fc.constant<Command>({ kind: "plusOne" }),
  fc.constantFrom("watching", "watchlist", "complete").map((status): Command => ({ kind: "setStatus", status })),
  fc.record({ season: fc.integer({ min: 0, max: 6 }), episode: fc.integer({ min: 0, max: 14 }) }).map((position): Command => ({ kind: "jumpTo", position })),
);

/** Starts from "not tracked" and applies commands, keeping only the ones the rules accept. */
const reachable = (title: TitleFacts, commands: readonly Command[]): UserTitleState[] => {
  const states: UserTitleState[] = [];
  let current: UserTitleState | null = null;
  for (const command of commands) {
    const result = transition(title, current, command);
    if (result.ok) {
      current = result.value;
      if (current) states.push(current);
    }
  }
  return states;
};

describe("properties", () => {
  it("every state reached through commands is consistent", () => {
    fc.assert(
      fc.property(titleArb, fc.array(commandArb, { maxLength: 40 }), (title, commands) => {
        for (const state of reachable(title, commands)) expect(isConsistent(title, state)).toBe(true);
      }),
      { numRuns: 400 },
    );
  });

  it("reconcile always produces a consistent state for a released title", () => {
    fc.assert(
      fc.property(titleArb, fc.constantFrom("watching", "watchlist", "complete"), fc.integer({ min: 0, max: 7 }), fc.integer({ min: 0, max: 14 }), (title, status, s, e) => {
        fc.pre(title.type === "movie" ? title.released : title.seasons.some((x) => x.airedCount > 0));
        expect(isConsistent(title, reconcile(title, { status, position: { season: s, episode: e } }))).toBe(true);
      }),
      { numRuns: 400 },
    );
  });

  it("+1 never goes backwards and always lands on an existing, aired episode", () => {
    fc.assert(
      fc.property(titleArb, fc.array(commandArb, { maxLength: 30 }), (title, commands) => {
        if (title.type !== "tv") return;
        let current: UserTitleState | null = null;
        for (const command of [...commands, { kind: "plusOne" } as const]) {
          const result = transition(title, current, command);
          if (!result.ok) continue;
          if (command.kind === "plusOne" && current) {
            expect(result.value?.position).toEqual(nextPosition(current.position, title.seasons));
          }
          current = result.value;
        }
      }),
      { numRuns: 300 },
    );
  });

  it("clamping is idempotent and stays inside the series", () => {
    fc.assert(
      fc.property(seasonsArb, fc.integer({ min: 0, max: 8 }), fc.integer({ min: 0, max: 15 }), (seasons, s, e) => {
        const once = clampPosition({ season: s, episode: e }, seasons);
        expect(clampPosition(once, seasons)).toEqual(once);
        if (once.season > 0) expect(once.episode).toBeLessThanOrEqual(seasons.find((x) => x.number === once.season)?.episodeCount ?? 0);
        const last = lastPosition(seasons);
        if (last === null) expect(once).toEqual(NOT_STARTED);
      }),
      { numRuns: 300 },
    );
  });
});
