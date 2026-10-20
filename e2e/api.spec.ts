import { expect, test } from "@playwright/test";

// The API is the same on every device, so it runs once.
test.skip(({ isMobile }) => isMobile, "API checks run on the desktop project only");

const origin = "http://localhost:3210";

test.describe("api", () => {
  test("a signed-in user can search, open a title and export, and a stranger cannot", async ({ request }) => {
    const email = `api-${Date.now()}@example.test`;
    const signUp = await request.post("/api/auth/sign-up/email", {
      headers: { origin, "x-forwarded-for": "10.50.0.1", "x-vercel-ip-country": "PL" },
      data: { email, password: "correct horse", name: "Api" },
    });
    expect(signUp.status()).toBe(200);
    const headers = { "x-forwarded-for": "10.50.0.1" };

    const search = await request.get("/api/search?q=harbor", { headers });
    expect(search.status()).toBe(200);
    expect((await search.json()).rows.map((r: { title: string }) => r.title)).toContain("The Quiet Harbor");
    expect((await request.get("/api/search?q=h", { headers })).status()).toBe(400);

    const popular = await request.get("/api/popular", { headers });
    expect((await popular.json()).rows.length).toBeGreaterThan(0);

    const title = await request.get("/api/title?provider=fake&type=tv&id=harbor", { headers });
    expect(await title.json()).toMatchObject({ title: "The Quiet Harbor", services: ["netflix"], facts: { state: "ongoing" } });
    expect((await request.get("/api/title?provider=fake&type=tv&id=nope", { headers })).status()).toBe(404);

    const exported = await request.get("/api/export", { headers });
    expect(await exported.json()).toMatchObject({ version: 1, account: { country: "PL" } });
    expect(exported.headers()["content-disposition"]).toContain("attachment");
  });

  test("a stranger gets 401", async ({ playwright }) => {
    const stranger = await playwright.request.newContext({ baseURL: origin });
    expect((await stranger.get("/api/search?q=harbor")).status()).toBe(401);
    expect((await stranger.get("/api/export")).status()).toBe(401);
  });

  test("the cron route needs its secret", async ({ request }) => {
    expect((await request.get("/api/cron/maintenance")).status()).toBe(401);
  });

  test("security headers are set", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["strict-transport-security"]).toContain("max-age");
  });
});
