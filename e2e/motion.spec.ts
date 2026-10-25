import { expect, test } from "./fixtures";
import { enterSandbox } from "./helpers";

test.use({ reducedMotion: "reduce" });

test.describe("reduced motion", () => {
  test("the landing shows everything at once and the demo does not paint confetti", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".rv")).toHaveCount(0);
    const salt = page.locator("article", { hasText: "Salt & Static" });
    await salt.getByRole("button", { name: "+1 Episode" }).click();
    await expect(salt.getByRole("button", { name: "Finished" })).toBeVisible();
    const painted = await page.evaluate(() => {
      const canvas = document.getElementById("demo-confetti") as HTMLCanvasElement;
      return canvas.width === 0 ? false : canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data.some((v, i) => i % 4 === 3 && v > 0);
    });
    expect(painted).toBe(false);
    const box = (await salt.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2);
    await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.25);
    expect(await salt.locator("xpath=..").evaluate((el) => (el as HTMLElement).style.transform)).toBe("");
  });

  test("the app leaves no ghosts and no tilt", async ({ page, isMobile }) => {
    await enterSandbox(page);
    await page.locator("article", { hasText: "Glass Orchard" }).getByRole("button", { name: /\+1 Episode/ }).click();
    await expect(page.getByText("Marked S01E01")).toBeVisible();
    await expect(page.locator("body > article, body > section[aria-hidden=true]")).toHaveCount(0);
    if (!isMobile) {
      await page.goto("/app/watchlist");
      const tile = page.locator("[data-flip$='|tile']").first();
      const box = (await tile.boundingBox())!;
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2);
      await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.25);
      expect(await tile.locator("[data-poster]").evaluate((el) => (el as HTMLElement).style.transform)).toBe("");
    }
  });

  test("Home shows its final numbers at once and its backdrop does not drift", async ({ page }) => {
    await enterSandbox(page, "/app");
    const tile = page.getByRole("region", { name: "Your numbers" }).getByText("To catch up").locator("xpath=following-sibling::b[1]");
    await expect(tile.locator("[aria-hidden=true]")).toHaveText("11");
    const drift = await page.locator("[class*='animate-[drift']").evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName));
    expect(drift.every((name) => name === "none")).toBe(true);
  });
});
