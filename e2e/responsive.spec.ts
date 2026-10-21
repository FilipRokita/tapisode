import { expect, test } from "./fixtures";
import { enterSandbox } from "./helpers";

const WIDTHS = [320, 360, 390, 768, 1024, 1440, 1894];
const PUBLIC = ["/", "/signin", "/signup", "/privacy", "/terms"];
const APP = ["/app/watching", "/app/watchlist", "/app/complete", "/app/stats", "/app/settings"];

test.describe("responsive", () => {
  test("no page scrolls sideways at any width", async ({ page }) => {
    test.setTimeout(180_000);
    await enterSandbox(page);
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of [...PUBLIC.filter((p) => p !== "/signin" && p !== "/signup"), ...APP]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
      }
    }
    await page.context().clearCookies();
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of ["/signin", "/signup"]) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
      }
    }
  });

  test("phone: every button, link and chip in the app is at least 44px high", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phone only");
    await enterSandbox(page);
    for (const path of APP) {
      await page.goto(path);
      await page.waitForTimeout(800);
      const small = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("main button, main a, main select, nav a, header a, header button")]
          .filter((el) => el.offsetParent !== null && !el.closest("[data-sonner-toast]") && !el.className.toString().includes("after:absolute"))
          .map((el) => ({ name: (el.textContent?.trim() || el.getAttribute("aria-label") || el.tagName).slice(0, 30), height: Math.round(el.getBoundingClientRect().height) }))
          .filter((x) => x.height < 44),
      );
      expect(small, `${path} has targets under 44px`).toEqual([]);
    }
  });
});
