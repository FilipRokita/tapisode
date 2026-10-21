import { expect, test } from "./fixtures";
import { enterSandbox, freshEmail, PASSWORD, signUp } from "./helpers";

test.describe("auth", () => {
  test("an empty sign-up shows the three messages and focuses the nickname", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Create account", exact: true }).last().click();
    await expect(page.getByText("Pick a nickname.")).toBeVisible();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
    await expect(page.getByLabel("Nickname")).toBeFocused();
  });

  test("an invalid email and a short password show their messages and clear when edited", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel("Email").fill("nope");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
    await page.getByLabel("Email").fill("ada@example.test");
    await expect(page.getByText("Enter a valid email address.")).toBeHidden();
    await page.getByLabel("Password").fill("long enough");
    await expect(page.getByText("Use at least 8 characters.")).toBeHidden();
  });

  test("switching tabs changes the heading and the extra fields, and the URL follows", async ({ page }) => {
    await page.goto("/signin");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel("Nickname")).toBeHidden();
    await page.getByRole("tab", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByLabel("Nickname")).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
    await page.getByRole("tab", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page).toHaveURL(/\/signin$/);
  });

  test("a valid sign-up lands in the app, and signing out and in again works", async ({ page }) => {
    const email = await signUp(page);
    await page.goto("/app/settings");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/signin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
    await expect(page).toHaveURL(/\/app\/watching/);
  });

  test("a wrong password shows the form-level message", async ({ page }) => {
    const email = await signUp(page);
    await page.goto("/app/settings");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/signin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("not the password");
    await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
    await expect(page.getByText("Wrong email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/signin/);
  });

  test("an unknown email cannot sign in", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel("Email").fill(freshEmail());
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
    await expect(page.getByText("Wrong email or password.")).toBeVisible();
  });

  test("Try without an account lands in the app as a demo visitor", async ({ page, isMobile }) => {
    await enterSandbox(page);
    if (!isMobile) await expect(page.getByRole("link", { name: /Demo visitor/ })).toBeVisible();
  });

  test("a signed-in account is sent away from the sign-in page, a demo visitor is not", async ({ page }) => {
    await enterSandbox(page);
    await page.goto("/signin");
    await expect(page).toHaveURL(/\/signin$/);
    await page.context().clearCookies();
    await signUp(page);
    await page.goto("/signin");
    await expect(page).toHaveURL(/\/app\/watching/);
  });
});
