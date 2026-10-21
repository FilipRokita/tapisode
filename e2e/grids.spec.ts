import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { enterSandbox } from "./helpers";

const tiles = (page: Page) => page.getByRole("button", { name: /, open details$/ });
const chip = (page: Page, name: string) => page.getByRole("group", { name: "Filter by service" }).getByRole("button", { name, exact: true });
const chipNames = (page: Page) => page.getByRole("group", { name: "Filter by service" }).getByRole("button").allTextContents();

test.describe("grids", () => {
  test("Watchlist and Complete show the template titles and offer exactly the services they carry", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/watchlist");
    await expect(tiles(page)).toHaveCount(6);
    expect(await chipNames(page)).toEqual(["All", "Netflix", "Prime Video", "Disney+", "HBO Max", "Apple TV+", "SkyShowtime"]);
    await page.goto("/app/complete");
    await expect(tiles(page)).toHaveCount(4);
    expect(await chipNames(page)).toEqual(["All", "Prime Video", "Disney+", "HBO Max", "SkyShowtime"]);
  });

  test("filters combine as a union, All clears, a reload keeps them and Back undoes them, without a page load", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/watchlist");
    await page.evaluate(() => ((window as unknown as { __marker: number }).__marker = 1));
    await chip(page, "Netflix").click();
    await expect(tiles(page)).toHaveCount(2);
    await expect(chip(page, "Netflix")).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/\?s=netflix$/);
    await chip(page, "SkyShowtime").click();
    await expect(tiles(page)).toHaveCount(3);
    await page.reload();
    await expect(tiles(page)).toHaveCount(3);
    await expect(chip(page, "Netflix")).toHaveAttribute("aria-pressed", "true");
    await page.evaluate(() => ((window as unknown as { __marker: number }).__marker = 1));
    await page.goBack();
    await expect(tiles(page)).toHaveCount(2);
    await chip(page, "All").click();
    await expect(tiles(page)).toHaveCount(6);
    await expect(chip(page, "All")).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1);
  });

  test("hovering a tile tilts its poster and leaving resets it", async ({ page, isMobile }) => {
    test.skip(isMobile, "needs hover");
    await enterSandbox(page);
    await page.goto("/app/watchlist");
    const tile = tiles(page).first();
    const poster = tile.locator("[data-poster]");
    const box = (await tile.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.2);
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.25);
    await expect.poll(() => poster.evaluate((el) => (el as HTMLElement).style.transform)).toContain("rotateY");
    await page.mouse.move(5, 5);
    await expect.poll(() => poster.evaluate((el) => (el as HTMLElement).style.transform)).toBe("");
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("a tile does not tilt", async ({ page, isMobile }) => {
      test.skip(isMobile, "needs hover");
      await enterSandbox(page);
      await page.goto("/app/watchlist");
      const tile = tiles(page).first();
      const box = (await tile.boundingBox())!;
      await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.2);
      await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.25);
      expect(await tile.locator("[data-poster]").evaluate((el) => (el as HTMLElement).style.transform)).toBe("");
    });
  });

  test("moving a title leaves one grid and arrives in the other", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/watchlist");
    await expect(page.getByText("6 titles waiting for you")).toBeVisible();
    await page.getByRole("button", { name: /Last Train to Marrow.*open details/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Complete", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByText("5 titles waiting for you")).toBeVisible();
    await expect(page.getByRole("button", { name: /Last Train to Marrow.*open details/ })).toHaveCount(0);
    await page.goto("/app/complete");
    await expect(page.getByText("5 finished")).toBeVisible();
    await expect(page.getByRole("button", { name: /Last Train to Marrow.*open details/ })).toBeVisible();
  });

  test("two columns on a phone, auto-fill columns on desktop, and no sideways scroll at 320px", async ({ page, isMobile }) => {
    await enterSandbox(page);
    await page.goto("/app/watchlist");
    const columns = () =>
      page.evaluate(() => {
        const first = [...document.querySelectorAll<HTMLElement>("[data-flip$='|tile']")];
        return new Set(first.map((el) => Math.round(el.getBoundingClientRect().left))).size;
      });
    if (isMobile) expect(await columns()).toBe(2);
    else {
      await page.setViewportSize({ width: 1440, height: 900 });
      await expect.poll(columns).toBeGreaterThanOrEqual(5);
    }
    await page.setViewportSize({ width: 320, height: 700 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
