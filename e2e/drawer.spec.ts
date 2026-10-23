import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { withTestSql } from "./db";
import { enterSandbox } from "./helpers";

const dialog = (page: Page) => page.getByRole("dialog");
const card = (page: Page, title: string) => page.locator("article:not([aria-hidden=true])", { hasText: title });
const open = async (page: Page, title: string) => {
  await card(page, title).getByRole("button", { name: new RegExp(title) }).click();
  await expect(dialog(page)).toBeVisible();
};

test.describe("title drawer", () => {
  test("opens a title with its progress, services and state, and closes with Escape and Back", async ({ page }) => {
    await enterSandbox(page);
    await open(page, "Salt & Static");
    const d = dialog(page);
    await expect(d).toContainText("S01E07");
    await expect(d).toContainText("7 of 8 episodes watched · next S01E08");
    await expect(d.getByRole("img", { name: "88% watched" })).toBeVisible();
    await expect(d).toContainText("HBO Max");
    await expect(d).toContainText("Ended");
    await expect(page).toHaveURL(/\?t=fake:tv:salt$/);
    await page.keyboard.press("Escape");
    await expect(d).toBeHidden();
    await expect(page).not.toHaveURL(/\?t=/);
    await open(page, "Salt & Static");
    await page.goBack();
    await expect(d).toBeHidden();
  });

  test("+1 in the drawer updates the panel and the list behind it", async ({ page }) => {
    await enterSandbox(page);
    await page.locator("section:not([aria-hidden=true])", { hasText: "Up next" }).getByRole("button", { name: /The Quiet Harbor/ }).click();
    const d = dialog(page);
    await d.getByRole("button", { name: /\+1 Episode/ }).click();
    await expect(d).toContainText("S02E05");
    await expect(d).toContainText("13 of 16 episodes watched");
    await expect(d.locator("[data-current]")).toHaveAttribute("data-episode", "2-5");
    await page.keyboard.press("Escape");
    await expect(page.locator("section:not([aria-hidden=true])", { hasText: "Up next" })).toContainText("S02E05");
  });

  test("one marker, on the current episode only; a picked episode moves it; unaired ones are disabled", async ({ page }) => {
    await enterSandbox(page);
    await page.locator("section:not([aria-hidden=true])", { hasText: "Up next" }).getByRole("button", { name: /The Quiet Harbor/ }).click();
    const d = dialog(page);
    await expect(d.locator("[data-marker]")).toHaveCount(1);
    await expect(d.locator("[data-current]")).toHaveCount(1);
    await expect(d.locator("[data-current]")).toHaveAttribute("data-episode", "2-4");
    await expect(d.locator('[data-episode="2-5"]')).not.toHaveAttribute("data-current", "");
    await d.locator('[data-episode="2-3"]').click();
    await expect(d.locator("[data-current]")).toHaveAttribute("data-episode", "2-3");
    await expect(d).toContainText("S02E03");
    await expect(d.locator('[data-episode="2-9"]')).toBeDisabled();
    await expect(d.locator('[data-episode="2-10"]')).toBeDisabled();
  });

  test("Remove takes a title off every list, Undo puts it back, and Add puts it on the Watchlist", async ({ page }) => {
    await enterSandbox(page);
    await open(page, "Paper Kingdoms");
    const d = dialog(page);
    await d.getByRole("button", { name: "Remove from my lists" }).click();
    await expect(page.getByText("Removed from your lists")).toBeVisible();
    await expect(d.getByRole("button", { name: "Add to my list" })).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByText("Undone")).toBeVisible();
    await expect(d).toContainText("S03E07");
    await d.getByRole("button", { name: "Remove from my lists" }).click();
    await d.getByRole("button", { name: "Add to my list" }).click();
    await expect(page.getByText("Moved to Watchlist")).toBeVisible();
    await expect(d.getByRole("button", { name: "Remove from my lists" })).toBeVisible();
  });

  test("Watching to Watchlist resets progress, and Undo restores it", async ({ page }) => {
    await enterSandbox(page);
    await open(page, "Paper Kingdoms");
    const d = dialog(page);
    await d.getByRole("button", { name: "Watchlist", exact: true }).click();
    await expect(page.getByText("Moved to Watchlist. Progress reset.")).toBeVisible();
    await expect(d).toContainText("Not started");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByText("Undone")).toBeVisible();
    await expect(d).toContainText("S03E07");
  });

  test("Complete on an ongoing series is refused and changes nothing", async ({ page }) => {
    await enterSandbox(page);
    await page.locator("section:not([aria-hidden=true])", { hasText: "Up next" }).getByRole("button", { name: /The Quiet Harbor/ }).click();
    const d = dialog(page);
    await expect(d).toContainText("Still airing. It stays in Watching until the series ends.");
    await d.getByRole("button", { name: "Complete", exact: true }).click();
    await expect(page.getByText("Still airing. It stays in Watching until the series ends.").last()).toBeVisible();
    await expect(d.getByRole("button", { name: "Watching", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(d).toContainText("S02E04");
  });

  test("Complete to Watching on a finished series asks for an episode", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/complete?t=fake:tv:lanterns");
    const d = dialog(page);
    await expect(d).toContainText("You finished this series");
    await d.getByRole("button", { name: "Watching", exact: true }).click();
    await expect(page.getByText("Pick an episode to continue from.")).toBeVisible();
    await expect(d.getByRole("button", { name: "Complete", exact: true })).toHaveAttribute("aria-pressed", "true");
  });

  test("a movie can be marked watched and not watched", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/complete?t=fake:movie:orbit");
    const d = dialog(page);
    await expect(d).toContainText("Watched");
    await d.getByRole("button", { name: "Mark as not watched" }).click();
    await expect(d).toContainText("Not watched yet");
    await expect(d.getByRole("button", { name: "Watchlist", exact: true })).toHaveAttribute("aria-pressed", "true");
    await d.getByRole("button", { name: "Mark as watched" }).click();
    await expect(d.getByRole("button", { name: "Mark as not watched" })).toBeVisible();
  });

  test("an untracked title opened from a link shows no status, and picking Watching adds it", async ({ page, isMobile }) => {
    await enterSandbox(page);
    await page.goto("/app/watching?t=fake:tv:lights");
    const d = dialog(page);
    await expect(d).toContainText("Harbor Lights");
    for (const status of ["Watching", "Watchlist", "Complete"]) await expect(d.getByRole("button", { name: status, exact: true })).toHaveAttribute("aria-pressed", "false");
    await d.getByRole("button", { name: "Watching", exact: true }).click();
    await expect(d.getByRole("button", { name: "Watching", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    if (!isMobile) await expect.poll(async () => (await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /Watching/ }).textContent())?.replace(/\D/g, "")).toBe("5");
    else await expect(page.getByText("5 in progress")).toBeVisible();
  });

  test("undoing the add of a title removes it from the lists", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/watching?t=fake:tv:lights");
    const d = dialog(page);
    await d.getByRole("button", { name: "Watchlist", exact: true }).click();
    await expect(d.getByRole("button", { name: "Watchlist", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByText("Undone")).toBeVisible();
    for (const status of ["Watching", "Watchlist", "Complete"]) await expect(d.getByRole("button", { name: status, exact: true })).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("Escape");
    await page.goto("/app/watchlist");
    await expect(page.getByText("6 titles waiting for you")).toBeVisible();
  });

  test("a title whose content was purged shows the loading state, then the title", async ({ page }) => {
    await enterSandbox(page);
    await withTestSql((sql) => sql`DELETE FROM media_content WHERE media_item_id = (SELECT id FROM media_items WHERE external_id = 'salt')`);
    await page.goto("/app/watching?t=fake:tv:salt");
    await expect(dialog(page).getByRole("heading", { name: "Salt & Static" })).toBeVisible();
    await expect(dialog(page)).toContainText("S01E07");
  });

  test("a bad title shows a message", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/watching?t=fake:tv:nope");
    await expect(dialog(page).getByRole("alert")).toContainText("Title not found.");
  });

  test("no horizontal scroll at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await enterSandbox(page);
    await page.goto("/app/watching?t=fake:tv:harbor");
    const d = dialog(page);
    await expect(d).toContainText("The Quiet Harbor");
    // The blurred backdrop bleeds past the edges on purpose, so the sheet clips sideways and nothing can scroll.
    expect(await d.evaluate((el) => getComputedStyle(el).overflowX)).toBe("hidden");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test("phone: a bottom sheet that closes by dragging the handle down", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phone only");
    await enterSandbox(page);
    await open(page, "Salt & Static");
    const box = await dialog(page).boundingBox();
    const viewport = page.viewportSize()!;
    expect(box!.y + box!.height).toBeGreaterThanOrEqual(viewport.height - 2);
    expect(box!.y).toBeGreaterThan(viewport.height * 0.05);
    const handle = (await page.locator("[data-vaul-handle]").boundingBox())!;
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(handle.x + handle.width / 2, handle.y + i * 40);
    await page.mouse.up();
    await expect(dialog(page)).toBeHidden();
  });

  test("desktop: a centered dialog that traps focus and returns it", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop only");
    await enterSandbox(page);
    await open(page, "Salt & Static");
    const d = dialog(page);
    const box = (await d.boundingBox())!;
    const viewport = page.viewportSize()!;
    // The page keeps a stable scrollbar gutter, so the center sits up to a scrollbar's width off the viewport's.
    expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(16);
    for (let i = 0; i < 40; i++) await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(d).toBeHidden();
    await expect(page.locator("article", { hasText: "Salt & Static" }).getByRole("button", { name: /Salt & Static/ })).toBeFocused();
  });
});
