import { describe, expect, it } from "vitest";
import { addDays } from "@/domain/countdown";
import { backlog, catchUp, greetingFor, nextAiring, weekAgenda, type HomeTitle } from "@/domain/home";
import type { Status } from "@/domain/types";
import { ended, ongoing, releasedMovie } from "./fixtures";

const TODAY = "2026-10-25";

const series = (id: string, status: Status | null, next: string | null, over: Partial<HomeTitle> = {}): HomeTitle => ({
  id,
  facts: ongoing,
  state: status && { status, position: { season: 2, episode: 2 } },
  nextEpisode: next ? { season: 2, episode: 5, airDate: next } : null,
  runtimeMinutes: 50,
  activityAt: 1,
  ...over,
});

describe("addDays", () => {
  it("crosses months and years, and goes back", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("weekAgenda", () => {
  it("has one entry per day, today first", () => {
    const days = weekAgenda([], TODAY);
    expect(days.map((d) => d.date)).toEqual(["2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31"]);
    expect(days.map((d) => d.daysAway)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("includes episodes from today to the seventh day and nothing outside", () => {
    const titles = [series("today", "watching", "2026-10-25"), series("last", "watching", "2026-10-31"), series("past", "watching", "2026-10-24"), series("later", "watching", "2026-11-01")];
    const days = weekAgenda(titles, TODAY);
    expect(days[0]!.entries.map((e) => e.view.id)).toEqual(["today"]);
    expect(days[6]!.entries.map((e) => e.view.id)).toEqual(["last"]);
    expect(days.flatMap((d) => d.entries).length).toBe(2);
  });

  it("counts Watching and Watchlist series only, and carries the episode", () => {
    const titles = [series("a", "watching", "2026-10-26"), series("b", "watchlist", "2026-10-26"), series("c", "complete", "2026-10-26"), series("d", null, "2026-10-26"), series("e", "watching", null)];
    const entries = weekAgenda(titles, TODAY)[1]!.entries;
    expect(entries.map((e) => e.view.id)).toEqual(["a", "b"]);
    expect(entries[0]).toMatchObject({ season: 2, episode: 5 });
  });

  it("ignores movies and orders a day by the newest activity", () => {
    const titles = [series("old", "watching", "2026-10-27", { activityAt: 1 }), series("new", "watching", "2026-10-27", { activityAt: 9 }), series("film", "watching", "2026-10-27", { facts: releasedMovie })];
    expect(weekAgenda(titles, TODAY)[2]!.entries.map((e) => e.view.id)).toEqual(["new", "old"]);
  });
});

describe("nextAiring", () => {
  it("is the soonest episode after the seven days, of a tracked series", () => {
    const titles = [series("far", "watching", "2026-12-01"), series("soon", "watchlist", "2026-11-03"), series("inside", "watching", "2026-10-30"), series("done", "complete", "2026-11-02"), series("none", "watching", null)];
    expect(nextAiring(titles, TODAY)?.view.id).toBe("soon");
    expect(nextAiring(titles, TODAY)?.airDate).toBe("2026-11-03");
  });

  it("treats the first day after the window as outside it, and is null with nothing", () => {
    expect(nextAiring([series("edge", "watching", "2026-11-01")], TODAY)?.view.id).toBe("edge");
    expect(nextAiring([series("edge", "watching", "2026-10-31")], TODAY)).toBeNull();
    expect(nextAiring([], TODAY)).toBeNull();
  });
});

describe("catchUp", () => {
  it("lists Watching series with aired episodes left, longest first", () => {
    const a = series("a", "watching", null);
    const b = series("b", "watching", null, { state: { status: "watching", position: { season: 1, episode: 2 } } });
    const done = series("done", "watching", null, { state: { status: "watching", position: { season: 2, episode: 4 } } });
    const rows = catchUp([a, done, b, series("w", "watchlist", null)]);
    expect(rows.map((r) => [r.view.id, r.left])).toEqual([["b", 10], ["a", 2]]);
    expect(rows[1]!.percent).toBe(83);
  });
});

describe("backlog", () => {
  it("counts the aired episodes still to watch and the hours they take", () => {
    // ongoing: 8 + 4 aired. Position S2E2 means 8 + 2 watched, so 2 are left.
    expect(backlog([series("a", "watching", null)])).toEqual({ episodes: 2, hours: 2, percent: 83 });
  });

  it("only counts Watching series", () => {
    expect(backlog([series("a", "watchlist", null), series("b", "complete", null, { facts: ended })])).toEqual({ episodes: 0, hours: 0, percent: 0 });
  });

  it("leaves a series without a runtime out of the hours but not the episodes", () => {
    expect(backlog([series("a", "watching", null, { runtimeMinutes: null })])).toMatchObject({ episodes: 2, hours: 0 });
  });

  it("is zero for an empty library", () => {
    expect(backlog([])).toEqual({ episodes: 0, hours: 0, percent: 0 });
  });
});

describe("greetingFor", () => {
  it("changes at 5, 12, 18 and 23", () => {
    expect([4, 5, 11, 12, 17, 18, 22, 23, 0].map(greetingFor)).toEqual(["Good night", "Good morning", "Good morning", "Good afternoon", "Good afternoon", "Good evening", "Good evening", "Good night", "Good night"]);
  });
});
