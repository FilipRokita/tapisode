import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { enterSandbox } from "./helpers";

const palette = (page: Page) => page.getByRole("dialog", { name: "Search titles" });
const input = (page: Page) => palette(page).getByRole("combobox");
const options = (page: Page) => palette(page).getByRole("option");

test.describe("search", () => {
  test("Ctrl+K and / open it, Escape closes it, and focus is in the input", async ({ page }) => {
    await enterSandbox(page);
    await page.keyboard.press("Control+k");
    await expect(palette(page)).toBeVisible();
    await expect(input(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(palette(page)).toBeHidden();
    await page.keyboard.press("/");
    await expect(palette(page)).toBeVisible();
    await expect(input(page)).toBeFocused();
  });

  test("the empty state lists the popular titles, none of them on a list, with no buttons", async ({ page }) => {
    await enterSandbox(page);
    await page.keyboard.press("Control+k");
    await expect(palette(page).getByText("Popular right now")).toBeVisible();
    await expect(options(page)).toHaveCount(4);
    await expect(palette(page).getByRole("listbox").getByRole("button")).toHaveCount(0);
    for (const tag of await options(page).allTextContents()) expect(tag).not.toMatch(/In (Watching|Watchlist|Complete)/);
  });

  test("typing finds titles and tags the ones already on a list; one character does nothing; nonsense finds nothing", async ({ page }) => {
    await enterSandbox(page);
    await page.keyboard.press("Control+k");
    await input(page).fill("harbor");
    await expect(options(page).filter({ hasText: "The Quiet Harbor" })).toContainText("In Watching");
    await expect(options(page).filter({ hasText: "Harbor Lights" })).toBeVisible();
    await expect(options(page).filter({ hasText: "The Harbor Job" })).toBeVisible();
    await input(page).fill("h");
    await expect(palette(page).getByText("Popular right now")).toBeVisible();
    await input(page).fill("zzzzqqq");
    await expect(palette(page).getByText("No matches")).toBeVisible();
  });

  test("Enter opens the title with no list chosen, and Add to Watchlist adds it", async ({ page, isMobile }) => {
    await enterSandbox(page);
    await page.keyboard.press("Control+k");
    await input(page).fill("harbor lights");
    await expect(options(page).first()).toContainText("Harbor Lights");
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog").filter({ hasText: "Harbor Lights" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Add to Watchlist" })).toHaveCSS("opacity", "1");
    await dialog.getByRole("button", { name: "Add to Watchlist" }).click();
    await expect(dialog.getByRole("button", { name: "Watchlist", exact: true })).toHaveAttribute("aria-pressed", "true");
    if (!isMobile) {
      await page.keyboard.press("Escape");
      await expect.poll(async () => (await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /Watchlist/ }).textContent())?.replace(/\D/g, "")).toBe("7");
    }
  });

  test("the arrow keys move the selection", async ({ page }) => {
    await enterSandbox(page);
    await page.keyboard.press("Control+k");
    await expect(options(page).first()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    await expect(options(page).nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowUp");
    await expect(options(page).first()).toHaveAttribute("aria-selected", "true");
  });

  test("too many searches end in a limit message", async ({ page }) => {
    await enterSandbox(page);
    let limited = false;
    for (let i = 0; i < 100 && !limited; i++) limited = (await page.request.get(`/api/search?q=harbor${i}`)).status() === 429;
    expect(limited).toBe(true);
    await page.keyboard.press("Control+k");
    await input(page).fill("harbor");
    await expect(palette(page).getByRole("alert")).toContainText("Too many searches. Try again in a minute.");
  });

  test("phone: the palette fits at 320px, rows do not overflow, and the esc hint is hidden on touch", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phone only");
    await page.setViewportSize({ width: 320, height: 640 });
    await enterSandbox(page);
    await page.getByRole("button", { name: "Search" }).click();
    const box = (await palette(page).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    await input(page).fill("harbor");
    await expect(options(page).first()).toBeVisible();
    expect(await palette(page).evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
    await expect(palette(page).getByText("esc", { exact: true })).toBeHidden();
  });
});
