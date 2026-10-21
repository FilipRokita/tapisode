import { expect, test } from "./fixtures";
import { enterSandbox, freshEmail, PASSWORD, signUp } from "./helpers";

test.describe("account lifecycle", () => {
  test("the export holds the account and its titles, and nothing from the catalog", async ({ page }) => {
    await enterSandbox(page);
    const response = await page.request.get("/api/export");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ version: 1, account: { country: "US" } });
    expect(body.titles).toHaveLength(14);
    expect(Object.keys(body.titles[0]).sort()).toEqual(["addedAt", "completedAt", "episode", "externalId", "imdbId", "provider", "season", "startedAt", "status", "type"]);
    expect(JSON.stringify(body)).not.toContain("Salt & Static");
  });

  test("deleting the account signs out and the credentials stop working", async ({ page }) => {
    const email = await signUp(page);
    await page.goto("/app/settings");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete account" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/app/watching");
    await expect(page).toHaveURL(/\/signin/);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
    await expect(page.getByText("Wrong email or password.")).toBeVisible();
  });

  test("two accounts never see each other's titles", async ({ page, browser }) => {
    await signUp(page);
    await page.goto("/app/stats");
    await expect(page.getByText("Titles tracked")).toBeVisible();
    const other = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "10.88.8.8" } });
    const second = await other.newPage();
    await enterSandbox(second);
    const mine = (await (await page.request.get("/api/export")).json()).titles;
    const theirs = (await (await second.request.get("/api/export")).json()).titles;
    expect(mine).toHaveLength(0);
    expect(theirs).toHaveLength(14);
    await other.close();
  });

  test("a demo visitor who creates an account keeps the list", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/settings");
    await page.getByRole("link", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await page.getByLabel("Nickname").fill("Grace");
    await page.getByLabel("Email").fill(freshEmail());
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account", exact: true }).last().click();
    await expect(page).toHaveURL(/\/app\/watching/);
    expect((await (await page.request.get("/api/export")).json()).titles).toHaveLength(14);
    await page.goto("/app/settings");
    await expect(page.getByRole("button", { name: "Change password" })).toBeVisible();
  });
});
