import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { enterSandbox } from "./helpers";

/** Fails with a readable list when a page has an accessibility violation. */
async function check(page: Page, name: string) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const report = violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n   ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join("\n   ")}`);
  expect(report, `${name} has accessibility violations`).toEqual([]);
}

test.describe("accessibility", () => {
  for (const path of ["/", "/signin", "/signup", "/privacy", "/terms"]) {
    test(`${path} has no violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(700);
      await check(page, path);
    });
  }

  test("the app pages have no violations", async ({ page }) => {
    await enterSandbox(page);
    for (const path of ["/app", "/app/watching", "/app/watchlist", "/app/complete", "/app/stats", "/app/settings"]) {
      await page.goto(path);
      await page.waitForTimeout(1200);
      await check(page, path);
    }
  });

  test("the title drawer has no violations", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/watching?t=fake:tv:salt");
    await expect(page.getByRole("dialog")).toContainText("Salt & Static");
    await page.waitForTimeout(1300);
    await check(page, "drawer");
  });

  test("the search palette has no violations", async ({ page }) => {
    await enterSandbox(page);
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("option").first()).toBeVisible();
    await page.waitForTimeout(500);
    await check(page, "palette");
  });

  test("the share card has no violations", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/stats");
    await page.getByRole("button", { name: "Create share card" }).click();
    await expect(page.getByRole("img", { name: "Your Tapisode stats card" })).toBeVisible();
    await page.waitForTimeout(600);
    await check(page, "share card");
  });

  test("the delete dialog has no violations", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/settings");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.waitForTimeout(400);
    await check(page, "delete dialog");
  });
});
