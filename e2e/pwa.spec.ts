import { expect, test } from "./fixtures";
import { enterSandbox } from "./helpers";

const IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

test.describe("installable app", () => {
  test("the manifest and its icons are right", async ({ page, request, isMobile }) => {
    test.skip(isMobile, "the files are the same on every device");
    await page.goto("/");
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest).toMatchObject({ display: "standalone", start_url: "/app", background_color: "#09090b", theme_color: "#09090b" });
    const wanted = [
      { src: "/icon-192.png", size: 192 },
      { src: "/icon-512.png", size: 512 },
      { src: "/icon-maskable-512.png", size: 512, purpose: "maskable" },
    ];
    for (const { src, size, purpose } of wanted) {
      const icon = manifest.icons.find((i: { src: string }) => i.src === src);
      expect(icon, src).toBeTruthy();
      if (purpose) expect(icon.purpose).toBe(purpose);
      const response = await request.get(src);
      expect(response.status()).toBe(200);
      const bytes = await response.body();
      expect(bytes.readUInt32BE(16)).toBe(size);
      expect(bytes.readUInt32BE(20)).toBe(size);
    }
  });

  test("it is installable, the worker takes over, and offline shows the fallback page", async ({ page, context, isMobile }) => {
    test.skip(isMobile, "one browser is enough to prove it");
    await page.goto("/");
    const cdp = await context.newCDPSession(page);
    expect((await cdp.send("Page.getInstallabilityErrors")).installabilityErrors).toEqual([]);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
    await context.setOffline(true);
    await page.goto("/app/watching").catch(() => undefined);
    await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  test("in the app, going offline shows the bar and disables +1, and coming back removes both", async ({ page, context }) => {
    await enterSandbox(page);
    const plus = page.locator("section", { hasText: "Up next" }).getByRole("button", { name: /\+1 Episode/ });
    await expect(plus).toBeVisible();
    await context.setOffline(true);
    await expect(page.getByRole("status").filter({ hasText: "You're offline" })).toBeVisible();
    await expect.poll(() => plus.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
    await context.setOffline(false);
    await expect(page.getByRole("status").filter({ hasText: "You're offline" })).toHaveCount(0);
    await expect.poll(() => plus.evaluate((el) => getComputedStyle(el).pointerEvents)).not.toBe("none");
  });

  test("the iOS hint shows on Safari for iPhone, stays dismissed after a reload, and is absent on desktop", async ({ browser, page }) => {
    const ios = await browser.newContext({ userAgent: IOS, viewport: { width: 390, height: 844 }, extraHTTPHeaders: { "x-forwarded-for": "10.99.1.1" } });
    const phone = await ios.newPage();
    await enterSandbox(phone);
    const hint = phone.getByText("Install Tapisode: tap Share, then Add to Home Screen.");
    await expect(hint).toBeVisible();
    await phone.getByRole("button", { name: "Dismiss" }).click();
    await expect(hint).toBeHidden();
    await phone.reload();
    await expect(phone.getByRole("heading", { level: 1, name: "Watching" })).toBeVisible();
    await expect(hint).toHaveCount(0);
    await ios.close();
    await enterSandbox(page);
    await expect(page.getByText("Install Tapisode: tap Share, then Add to Home Screen.")).toHaveCount(0);
  });

  test("the theme color is the background", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#09090b");
  });
});
