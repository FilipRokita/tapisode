import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { enterSandbox, signUp } from "./helpers";

const hero = (page: Page) => page.locator("section:not([aria-hidden=true])", { hasText: "Up next" });
const section = (page: Page, name: string) => page.getByRole("region", { name });
/** The episodes still to catch up on, from the first big number of the panel. */
const numbers = async (page: Page) => (await section(page, "Your numbers").locator("b > span.sr-only").first().textContent())?.replace(/\D/g, "");

test.describe("home", () => {
  test("the demo opens on Home, with Up next on top and the user's own sections", async ({ page }) => {
    await enterSandbox(page, "/app");
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Good (morning|afternoon|evening|night)|Welcome back/);
    await expect(hero(page).getByRole("heading", { name: /The Quiet Harbor/ })).toBeVisible();
    await expect(hero(page)).toContainText("S02E04");
    await expect(section(page, "Coming up")).toBeVisible();
    await expect(section(page, "Your numbers")).toBeVisible();
  });

  test("Coming up lists the series that air in the next seven days, and a tap opens the title", async ({ page }) => {
    await enterSandbox(page, "/app");
    const week = section(page, "Coming up");
    await expect(week.getByRole("button", { name: /The Quiet Harbor/ })).toBeVisible();
    await expect(week.getByRole("button", { name: /Paper Kingdoms/ })).toBeVisible();
    await expect(week.getByText("Today")).toBeVisible();
    await week.getByRole("button", { name: /The Quiet Harbor/ }).click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "The Quiet Harbor" })).toBeVisible();
  });

  test("+1 on Up next moves the stamp and the numbers, and Undo takes it back", async ({ page }) => {
    await enterSandbox(page, "/app");
    await expect.poll(() => numbers(page)).toBe("11");
    await hero(page).getByRole("button", { name: /\+1 Episode/ }).click();
    await expect(hero(page)).toContainText("S02E05");
    await expect.poll(() => numbers(page)).toBe("10");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(hero(page)).toContainText("S02E04");
    await expect.poll(() => numbers(page)).toBe("11");
  });

  test("the lists show the titles on offer, and a tap opens one where it can be added", async ({ page }) => {
    await enterSandbox(page, "/app");
    const trending = section(page, "Trending this week");
    await expect(trending.getByRole("button")).toHaveCount(4);
    await expect(section(page, "Coming soon").getByRole("button", { name: /Copper Sky/ })).toBeVisible();
    await expect(section(page, "In cinemas now").getByRole("button", { name: /Neon Vesper/ })).toBeVisible();
    await trending.getByRole("button", { name: /Harbor Lights/ }).click();
    await expect(page.getByRole("dialog").getByRole("button", { name: /Add to Watchlist/ })).toBeVisible();
  });

  test("a new account sees a welcome and the lists, with no empty boxes", async ({ page }) => {
    await signUp(page, undefined, undefined, "/app");
    await expect(page.getByRole("heading", { name: "Your Home is waiting" })).toBeVisible();
    await expect(section(page, "Coming up")).toHaveCount(0);
    await expect(section(page, "Your numbers")).toHaveCount(0);
    await expect(section(page, "Trending this week")).toBeVisible();
  });

  test("Home is the first of five tabs and the current one", async ({ page }) => {
    await enterSandbox(page, "/app");
    const links = page.getByRole("navigation", { name: "Main" }).getByRole("link");
    await expect(links).toHaveCount(5);
    await expect(links.first()).toHaveAttribute("aria-current", "page");
    await expect(links.first()).toContainText("Home");
  });

  test("phone: the rails scroll sideways and the page does not", async ({ page, isMobile }) => {
    test.skip(!isMobile, "the rails scroll on a phone only");
    await enterSandbox(page, "/app");
    const week = section(page, "Coming up").locator("xpath=.//div[contains(@class,'overflow-x-auto')]");
    expect(await week.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    // A row's hidden text must not widen the page: the layout viewport would grow and fixed bars with it.
    expect(await page.evaluate(() => window.innerWidth === document.documentElement.clientWidth && document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
