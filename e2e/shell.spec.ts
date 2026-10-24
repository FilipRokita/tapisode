import { expect, test } from "./fixtures";
import { enterSandbox, PASSWORD, signUp } from "./helpers";

test.describe("shell", () => {
  test("a signed-out visit to the app redirects to sign in", async ({ page }) => {
    await page.goto("/app/watching");
    await expect(page).toHaveURL(/\/signin/);
  });

  test("an unknown URL shows the not-found page", async ({ page }) => {
    await page.goto("/nowhere");
    await expect(page.getByRole("heading", { name: "This page could not be found." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Tapisode" })).toBeVisible();
  });

  test("the navigation has four items and shows the sandbox counts", async ({ page, isMobile }) => {
    await enterSandbox(page);
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link")).toHaveCount(4);
    await expect(nav.getByRole("link", { name: /Watching/ })).toHaveAttribute("aria-current", "page");
    if (!isMobile) {
      await expect(nav.getByRole("link", { name: /Watching/ })).toContainText("4");
      await expect(nav.getByRole("link", { name: /Watchlist/ })).toContainText("6");
      await expect(nav.getByRole("link", { name: /Complete/ })).toContainText("4");
    }
    await nav.getByRole("link", { name: /Stats/ }).click();
    await expect(page).toHaveURL(/\/app\/stats/);
    await expect(nav.getByRole("link", { name: /Stats/ })).toHaveAttribute("aria-current", "page");
  });

  test("the avatar opens Settings, which has the country, export and delete", async ({ page, isMobile }) => {
    await enterSandbox(page);
    await page.getByRole("link", { name: isMobile ? "Account and settings" : /Demo visitor/ }).click();
    await expect(page).toHaveURL(/\/app\/settings/);
    await expect(page.getByLabel("Country")).toBeVisible();
    await expect(page.getByRole("link", { name: "Export" })).toHaveAttribute("href", "/api/export");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByRole("alertdialog")).toContainText("This removes your account and all your lists. It cannot be undone.");
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("alertdialog")).toBeHidden();
  });

  test("changing the country shows the toast", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/settings");
    const select = page.getByLabel("Country");
    const target = await select.locator("option").evaluateAll((o) => (o as HTMLOptionElement[]).map((x) => x.value).find((v) => v === "DE") ?? (o as HTMLOptionElement[])[1]!.value);
    await select.selectOption(target);
    await expect(page.getByText(`Country set to ${target}. Availability is loading.`)).toBeVisible();
  });

  test("a sandbox visitor sees Create account and no password row", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/app/settings");
    await expect(page.getByText("Keep your lists. Takes a minute.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Change password" })).toHaveCount(0);
  });

  test("changing the password: wrong current fails, the right one works, the new password signs in", async ({ page }) => {
    const email = await signUp(page);
    await page.goto("/app/settings");
    await page.getByRole("button", { name: "Change password" }).click();
    await page.getByLabel("Current password").fill("not the password");
    await page.getByLabel("New password").fill("a brand new one");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Current password is wrong.")).toBeVisible();
    await page.getByLabel("Current password").fill(PASSWORD);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Password updated")).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/signin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
    await expect(page.getByText("Wrong email or password.")).toBeVisible();
    await page.getByLabel("Password").fill("a brand new one");
    await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
    await expect(page).toHaveURL(/\/app\/watching/);
  });
});
