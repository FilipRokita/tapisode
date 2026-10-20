import { expect, type Page } from "@playwright/test";

let counter = 0;

/** A new email for every call, so tests never meet each other's accounts. */
export const freshEmail = (): string => `e2e-${Date.now()}-${(counter += 1)}@example.test`;

export const PASSWORD = "correct horse";

/** Signs up a real account through the form and waits for the app. */
export async function signUp(page: Page, email = freshEmail(), nickname = "Ada") {
  await page.goto("/signup");
  await page.getByLabel("Nickname").fill(nickname);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account", exact: true }).last().click();
  await expect(page).toHaveURL(/\/app\/watching/);
  return email;
}

/** Opens the app as a sandbox visitor. */
export async function enterSandbox(page: Page) {
  await page.goto("/signin");
  await page.getByRole("button", { name: "Try without an account" }).click();
  await expect(page).toHaveURL(/\/app\/watching/);
}
