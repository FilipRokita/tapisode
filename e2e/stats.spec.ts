import type { Page } from "@playwright/test";
import { lastAiredPosition, lastPosition } from "../src/domain/progress";
import { computeStats, type StatsItem } from "../src/domain/stats";
import type { Position, Season } from "../src/domain/types";
import { FAKE_TITLES } from "../src/lib/providers/fake/data";
import { TEMPLATES } from "../src/lib/seed/template";
import { withTestSql } from "./db";
import { expect, test } from "./fixtures";
import { enterSandbox } from "./helpers";

/** What the rules compute for the fake template, derived from the fake data and the domain functions. */
function expectedStats() {
  const items: StatsItem[] = TEMPLATES.fake.map((entry) => {
    const t = FAKE_TITLES.find((x) => x.id === entry.ref.externalId)!;
    if (!t.series) {
      return { state: { status: entry.status, position: { season: 0, episode: 0 } }, content: { facts: { type: "movie", released: t.released === true }, runtimeMinutes: t.runtimeMinutes } };
    }
    const seasons: Season[] = t.series.counts.map((episodeCount, i) => ({ number: i + 1, episodeCount, airedCount: t.series!.aired[i]! }));
    let position: Position = { season: 0, episode: 0 };
    if (entry.status === "complete") position = lastPosition(seasons)!;
    else if (entry.status === "watching" && entry.at === "caught-up") position = lastAiredPosition(seasons);
    else if (entry.status === "watching" && typeof entry.at === "object") position = { season: entry.at.season, episode: entry.at.episode };
    return { state: { status: entry.status, position }, content: { facts: { type: "tv", state: t.series.state, seasons }, runtimeMinutes: t.runtimeMinutes } };
  });
  return computeStats(items);
}

const tile = (page: Page, label: string) => page.locator("div", { has: page.locator(`small:text-is("${label}")`) }).last().locator("span[aria-hidden]");

test.describe("stats", () => {
  test("the tiles show what the rules compute, and the counters end at their final value", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/stats");
    const want = expectedStats();
    await expect(tile(page, "Episodes watched")).toHaveText(String(want.episodes), { timeout: 15_000 });
    await expect(tile(page, "Estimated hours")).toHaveText(String(want.hours));
    await expect(tile(page, "Titles finished")).toHaveText(String(want.finished));
    await expect(tile(page, "Titles tracked")).toHaveText(String(want.tracked));
    expect(want.byStatus).toEqual({ watching: 4, watchlist: 6, complete: 4 });
  });

  test("the state bar is proportional", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/stats");
    const bar = page.getByRole("img", { name: "4 watching, 6 watchlist, 4 complete" });
    await expect(bar).toBeVisible();
    await expect.poll(async () => {
      const widths = await bar.locator("i").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
      return [widths[1]! / widths[0]!, widths[2]! / widths[0]!].map((r) => Math.round(r * 10) / 10);
    }).toEqual([1.5, 1]);
  });

  test("the share sheet switches format and saves a PNG of the right size", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/stats");
    await page.getByRole("button", { name: "Create share card" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("img", { name: "Your Tapisode stats card" })).toBeVisible();
    const save = async (name: string, width: number, height: number) => {
      const [download] = await Promise.all([page.waitForEvent("download"), sheet.getByRole("button", { name: "Save image" }).click()]);
      expect(download.suggestedFilename()).toBe(name);
      const stream = (await download.createReadStream())!;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk as Buffer);
      const bytes = Buffer.concat(chunks);
      expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(bytes.readUInt32BE(16)).toBe(width);
      expect(bytes.readUInt32BE(20)).toBe(height);
    };
    await save("tapisode-stats-story.png", 1080, 1920);
    await sheet.getByRole("tab", { name: "Post 1:1" }).click();
    await expect.poll(() => sheet.getByRole("img", { name: "Your Tapisode stats card" }).evaluate((el) => (el as HTMLImageElement).src.includes("height%3D%221080%22"))).toBe(true);
    await save("tapisode-stats-post.png", 1080, 1080);
    await expect(page.getByText("Saved tapisode-stats-post.png")).toBeVisible();
  });

  test("a title whose content is missing is mentioned and left out of the numbers", async ({ page }) => {
    await enterSandbox(page);
    await withTestSql((sql) => sql`DELETE FROM media_content WHERE media_item_id = (SELECT id FROM media_items WHERE external_id = 'salt')`);
    await page.goto("/app/stats");
    await expect(page.getByText("1 title is not counted while it loads.")).toBeVisible();
  });

  test("nothing overflows at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await enterSandbox(page);
    await page.goto("/app/stats");
    await expect(page.getByRole("heading", { name: "Stats" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
