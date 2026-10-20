import { describe, expect, it } from "vitest";
import { airDateLabel, countdownLabel, daysUntil } from "@/domain/countdown";
import { filterServices, matchesServices, sortByActivity } from "@/domain/lists";
import { computeStats, watchingDays, type StatsItem } from "@/domain/stats";
import { SERVICE_KEYS } from "@/domain/services";
import { NOT_STARTED } from "@/domain/types";
import { ended, ongoing, releasedMovie } from "./fixtures";

const item = (status: StatsItem["state"]["status"], position: StatsItem["state"]["position"], facts: NonNullable<StatsItem["content"]>["facts"] | null, runtimeMinutes: number | null): StatsItem => ({
  state: { status, position },
  content: facts ? { facts, runtimeMinutes } : null,
});

describe("computeStats", () => {
  it("counts series episodes only, and adds a finished movie's runtime to the hours", () => {
    const stats = computeStats([
      item("watching", { season: 2, episode: 4 }, ongoing, 60), // 12 episodes, 720 min
      item("complete", { season: 2, episode: 10 }, ended, 30), // 18 episodes, 540 min
      item("complete", NOT_STARTED, releasedMovie, 120), // 120 min
      item("watching", NOT_STARTED, releasedMovie, 100), // not finished: no hours
      item("watchlist", NOT_STARTED, ended, 30),
    ]);
    expect(stats).toEqual({
      episodes: 30,
      hours: 23, // 1380 minutes
      finished: 2,
      tracked: 5,
      byStatus: { watching: 2, watchlist: 1, complete: 2 },
      series: 3,
      movies: 2,
      pending: 0,
    });
  });
  it("leaves a title with no runtime out of the hours but still counts its episodes", () => {
    const stats = computeStats([item("watching", { season: 1, episode: 8 }, ended, null)]);
    expect(stats.episodes).toBe(8);
    expect(stats.hours).toBe(0);
  });
  it("counts a title without content as pending and leaves it out of the numbers", () => {
    const stats = computeStats([item("complete", NOT_STARTED, null, null), item("watching", { season: 1, episode: 2 }, ended, 60)]);
    expect(stats.pending).toBe(1);
    expect(stats.tracked).toBe(2);
    expect(stats.episodes).toBe(2);
    expect(stats.series).toBe(1);
  });
  it("shows days from the rounded hours", () => {
    expect(watchingDays(82)).toBe("3.4");
    expect(watchingDays(0)).toBe("0.0");
  });
});

describe("countdown", () => {
  it.each([
    ["2026-10-20", "2026-10-20", 0],
    ["2026-10-21", "2026-10-20", 1],
    ["2026-11-01", "2026-10-20", 12],
    ["2026-10-19", "2026-10-20", -1],
    ["2027-01-01", "2026-12-31", 1],
  ])("%s from %s is %i days", (air, today, days) => {
    expect(daysUntil(air, today)).toBe(days);
  });
  it.each([
    [null, null],
    ["2026-10-19", null],
    ["2026-10-20", "New episode today"],
    ["2026-10-21", "Next in 1 day"],
    ["2026-10-24", "Next in 4 days"],
    ["2026-12-04", "Next in 45 days"],
    ["2026-12-05", "Next on 5 Dec"],
  ])("label for %s is %s", (air, label) => {
    expect(countdownLabel(air, "2026-10-20")).toBe(label);
  });
  it("formats the drawer date", () => {
    expect(airDateLabel("2026-10-23")).toBe("Fri 23 Oct");
  });
});

describe("list helpers", () => {
  const entries = [
    { id: "a", status: "watching" as const, activityAt: 1, services: ["netflix" as const] },
    { id: "b", status: "watching" as const, activityAt: 3, services: ["hbo" as const, "netflix" as const] },
    { id: "c", status: "watching" as const, activityAt: 2, services: [] },
  ];
  it("sorts by most recent activity", () => {
    expect(sortByActivity(entries).map((e) => e.id)).toEqual(["b", "c", "a"]);
  });
  it("offers only services that carry a title, in our fixed order", () => {
    expect(filterServices(entries, SERVICE_KEYS)).toEqual(["netflix", "hbo"]);
  });
  it("matches on any selected service, and on everything when nothing is selected", () => {
    const first = entries[0]!;
    expect(matchesServices(first, new Set())).toBe(true);
    expect(matchesServices(first, new Set(["netflix"]))).toBe(true);
    expect(matchesServices(first, new Set(["hbo"]))).toBe(false);
    expect(matchesServices(first, new Set(["hbo", "netflix"]))).toBe(true);
  });
});
