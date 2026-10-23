import { expect, test } from "./fixtures";
import { enterSandbox } from "./helpers";

const NOTICE = "This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability data by JustWatch.";

test.describe("legal pages and metadata", () => {
  for (const [path, heading] of [["/privacy", "Privacy policy"], ["/terms", "Terms"]] as const) {
    test(`${path} renders with its required content`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expect(page.getByText("Last updated")).toBeVisible();
      await expect(page.getByRole("link", { name: "Tapisode home" })).toBeVisible();
      const text = await page.locator("main").innerText();
      if (path === "/privacy") {
        expect(text).toMatch(/Contact: \S+@\S+\.\S+/); // the deployer's details come from the environment
        expect(text).toContain("TMDB can see your IP address");
      } else {
        expect(text).toContain("at least 16");
        expect(text).toContain(NOTICE);
      }
    });
  }

  test("the footer on the landing and Settings carry the exact TMDB notice", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(NOTICE)).toBeVisible();
    const logo = page.getByRole("img", { name: "TMDB" });
    await expect(logo).toBeVisible();
    expect(await logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    await enterSandbox(page);
    await page.goto("/app/settings");
    await expect(page.getByText(NOTICE)).toBeVisible();
    await expect(page.getByRole("img", { name: "TMDB" })).toBeVisible();
  });

  test("the app and the auth screens are not indexed, the landing and legal pages are", async ({ page }) => {
    const robots = async (path: string) => page.goto(path).then(() => page.locator('meta[name="robots"]').getAttribute("content"));
    expect(await robots("/signin")).toContain("noindex");
    expect(await robots("/signup")).toContain("noindex");
    await enterSandbox(page);
    expect(await robots("/app/watching")).toContain("noindex");
    expect(await robots("/app/settings")).toContain("noindex");
    await page.goto("/");
    expect(await page.locator('meta[name="robots"]').count()).toBe(0);
    await page.goto("/privacy");
    expect(await page.locator('meta[name="robots"]').count()).toBe(0);
  });

  test("the landing has an Open Graph image that returns a PNG", async ({ page, request }) => {
    await page.goto("/");
    const image = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(image).toBeTruthy();
    const response = await request.get(new URL(image!).pathname);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
    expect(await page.locator('meta[name="twitter:card"]').getAttribute("content")).toBe("summary_large_image");
  });

  test("no public page contains an em dash", async ({ page }) => {
    for (const path of ["/", "/privacy", "/terms", "/signin", "/signup"]) {
      await page.goto(path);
      expect(await page.locator("body").innerText(), path).not.toContain("—");
    }
  });
});
