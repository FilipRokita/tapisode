import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { enterSandbox } from "./helpers";

const upNext = (page: Page) => page.locator("section:not([aria-hidden=true])", { hasText: "Up next" });
const card = (page: Page, title: string) => page.locator("article:not([aria-hidden=true])", { hasText: title });
const plus = (scope: ReturnType<Page["locator"]>) => scope.getByRole("button", { name: /\+1 Episode/ });
const sidebarCount = async (page: Page, name: string) => (await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: new RegExp(name) }).textContent())?.replace(/\D/g, "");

test.describe("watching", () => {
  test("shows the four titles with Up next on top", async ({ page }) => {
    await enterSandbox(page);
    await expect(page.getByText("4 in progress")).toBeVisible();
    const hero = upNext(page);
    await expect(hero.getByRole("heading", { name: /The Quiet Harbor/ })).toBeVisible();
    await expect(hero).toContainText("S02E04");
    await expect(plus(hero)).toContainText("→ S02E05");
    for (const title of ["Salt & Static", "Paper Kingdoms", "Glass Orchard"]) await expect(card(page, title)).toBeVisible();
  });

  test("+1 marks the next episode, and Undo takes it back", async ({ page }) => {
    await enterSandbox(page);
    const hero = upNext(page);
    await plus(hero).click();
    await expect(hero).toContainText("S02E05");
    await expect(page.getByText("Marked S02E05")).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByText("Undone")).toBeVisible();
    await expect(hero).toContainText("S02E04");
  });

  test("finishing a series fires the confetti, moves it to Complete and says so", async ({ page, isMobile }) => {
    await enterSandbox(page);
    await plus(card(page, "Salt & Static")).click();
    await expect.poll(() =>
      page.evaluate(() => {
        const canvas = document.getElementById("confetti-canvas") as HTMLCanvasElement;
        const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) return true;
        return false;
      }),
    ).toBe(true);
    await expect(page.getByText("Salt & Static finished. Moved to Complete.")).toBeVisible();
    await expect(page.getByText("3 in progress")).toBeVisible();
    await expect(card(page, "Salt & Static")).toHaveCount(0);
    if (!isMobile) {
      await expect.poll(() => sidebarCount(page, "Watching")).toBe("3");
      await expect.poll(() => sidebarCount(page, "Complete")).toBe("5");
    }
  });

  test("a caught-up series cannot be advanced", async ({ page }) => {
    await enterSandbox(page);
    const button = card(page, "Paper Kingdoms").getByRole("button", { name: /Caught up/ });
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await button.click({ force: true });
    await expect(page.getByText("Marked")).toHaveCount(0);
  });

  test("+1 on a series that is not started begins at S01E01 and promotes it to Up next", async ({ page }) => {
    await enterSandbox(page);
    await plus(card(page, "Glass Orchard")).click();
    const hero = upNext(page);
    await expect(hero.getByRole("heading", { name: /Glass Orchard/ })).toBeVisible();
    await expect(hero).toContainText("S01E01");
    await expect(page.getByText("Marked S01E01")).toBeVisible();
  });

  test("a stale tap shows the conflict and ends on the other device's state", async ({ page, browser, context }) => {
    await enterSandbox(page);
    const second = await browser.newContext({ storageState: await context.storageState(), extraHTTPHeaders: { "x-forwarded-for": "10.77.7.7" } });
    const other = await second.newPage();
    await other.goto("/app/watching");
    await expect(upNext(other)).toContainText("S02E04");
    await plus(upNext(page)).click();
    await expect(upNext(page)).toContainText("S02E05");
    await plus(upNext(other)).click();
    await expect(other.getByText("This changed on another device. Showing the latest.")).toBeVisible();
    await expect(upNext(other)).toContainText("S02E05");
    await second.close();
  });

  test("offline: the bar shows, +1 refuses and nothing changes", async ({ page, context }) => {
    await enterSandbox(page);
    await context.setOffline(true);
    await expect(page.getByRole("status").filter({ hasText: "You're offline. Changes can't be saved right now." })).toBeVisible();
    await plus(upNext(page)).click({ force: true });
    await expect(page.getByText("You're offline. Changes can't be saved right now.").last()).toBeVisible();
    await expect(upNext(page)).toContainText("S02E04");
    await context.setOffline(false);
    await expect(page.getByRole("status").filter({ hasText: "You're offline" })).toHaveCount(0);
  });

  test("the + key marks the next episode of Up next", async ({ page }) => {
    await enterSandbox(page);
    await page.keyboard.press("+");
    await expect(upNext(page)).toContainText("S02E05");
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("nothing animates and the result is the same", async ({ page }) => {
      await enterSandbox(page);
      await plus(card(page, "Salt & Static")).click();
      await expect(page.getByText("Salt & Static finished. Moved to Complete.")).toBeVisible();
      await expect(page.locator("body > article")).toHaveCount(0);
      await expect(card(page, "Salt & Static")).toHaveCount(0);
    });
  });

  test("phone: every tap target is at least 44 px", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phone only");
    await enterSandbox(page);
    const heights = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("nav a, button, header a")]
        .filter((el) => el.offsetParent !== null && !el.closest("[data-sonner-toast]") && !el.querySelector("span.sr-only") && !el.className.includes("after:absolute"))
        .map((el) => ({ name: el.textContent?.trim() || el.getAttribute("aria-label"), height: el.getBoundingClientRect().height })),
    );
    expect(heights.length).toBeGreaterThan(5);
    for (const { name, height } of heights) expect(height, `${name} is ${height}px high`).toBeGreaterThanOrEqual(43.5);
  });
});
