import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const demoCard = (page: Page, title: string) => page.locator("article", { hasText: title });

test.describe("landing", () => {
  test("shows the headline, both calls to action and the demo", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Know where you are.");
    await expect(page.getByRole("button", { name: "Try it without an account" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Create account" }).nth(1)).toBeVisible();
    await expect(demoCard(page, "Salt & Static")).toBeVisible();
    await expect(demoCard(page, "Paper Kingdoms")).toBeVisible();
  });

  test("Try it without an account lands in the app, and Create account goes to sign-up", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Create account" }).nth(1).click();
    await expect(page).toHaveURL(/\/signup$/);
    await page.goto("/");
    await page.getByRole("button", { name: "Try it without an account" }).first().click();
    await expect(page).toHaveURL(/\/app\/watching/);
    await page.goto("/");
    // Everywhere the page offered a demo or an account, a signed-in visitor gets a way into the app.
    await expect(page.getByRole("link", { name: "Open the app" })).toHaveCount(4);
    await expect(page.getByRole("button", { name: "Try it without an account" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Create account|Sign in/ })).toHaveCount(0);
  });

  test("the demo finishes a series with confetti, deals it again, and never touches real data", async ({ page }) => {
    await page.goto("/");
    const salt = demoCard(page, "Salt & Static");
    await expect(salt).toContainText("S01E07");
    await expect(salt).toContainText("88%");
    await salt.getByRole("button", { name: "+1 Episode" }).click();
    await expect(salt).toContainText("S01E08");
    await expect(salt).toContainText("100%");
    await expect.poll(() =>
      page.evaluate(() => {
        const canvas = document.getElementById("confetti-canvas") as HTMLCanvasElement;
        const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) return true;
        return false;
      }),
    ).toBe(true);
    await expect(salt.getByRole("button", { name: "Finished" })).toBeVisible();
    await expect(salt).toContainText("S01E07", { timeout: 8000 });
    await expect(salt).toContainText("88%");
    // Real data is untouched: a new demo visitor still finds Salt & Static at S01E07.
    await page.getByRole("button", { name: "Try it without an account" }).first().click();
    await expect(page).toHaveURL(/\/app\/watching/);
    await expect(page.locator("article", { hasText: "Salt & Static" })).toContainText("S01E07");
  });

  test("a caught-up demo card cannot be advanced", async ({ page }) => {
    await page.goto("/");
    const kingdoms = demoCard(page, "Paper Kingdoms");
    await expect(kingdoms.getByRole("button", { name: "Caught up" })).toHaveAttribute("aria-disabled", "true");
  });

  test("a demo card tilts under the cursor on desktop and not on a phone", async ({ page, isMobile }) => {
    await page.goto("/");
    const card = demoCard(page, "Salt & Static");
    const box = (await card.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2);
    await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.25);
    const transform = await card.locator("xpath=..").evaluate((el) => (el as HTMLElement).style.transform);
    if (isMobile) expect(transform).toBe("");
    else expect(transform).toContain("rotateY");
  });

  test("sections reveal on scroll, and with reduced motion they are all visible at once", async ({ page, isMobile }) => {
    test.skip(isMobile, "the same on both");
    await page.goto("/");
    const heading = page.getByRole("heading", { name: "How it works" });
    await expect(heading.locator("xpath=..")).toHaveClass(/rv/);
    await heading.scrollIntoViewIfNeeded();
    await expect.poll(() => heading.locator("xpath=..").evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("nothing is hidden", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(".rv")).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
    });
  });

  test("the page is static", async ({ request }) => {
    const response = await request.get("/");
    expect(response.headers()["x-nextjs-prerender"]).toContain("1");
  });

  test("at 320px the nav fits, the buttons span the container, and nothing scrolls sideways", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/");
    const create = page.getByRole("navigation", { name: "Account" }).getByRole("link", { name: "Create account" });
    const box = (await create.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    const cta = (await page.getByRole("button", { name: "Try it without an account" }).first().boundingBox())!;
    expect(cta.width).toBeGreaterThan(320 - 60);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
