import { expect, type Page } from "@playwright/test";

let counter = 0;

/** A new email for every call, so tests never meet each other's accounts. */
export const freshEmail = (): string => `e2e-${Date.now()}-${(counter += 1)}@example.test`;

export const PASSWORD = "correct horse";

/** Signs up a real account through the form and waits for the app, which opens on Home. Then goes to `to`. */
export async function signUp(page: Page, email = freshEmail(), nickname = "Ada", to = "/app/watching") {
  await page.goto("/signup");
  await page.getByLabel("Nickname").fill(nickname);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account", exact: true }).last().click();
  await expect(page).toHaveURL(/\/app$/);
  if (to !== "/app") await page.goto(to);
  return email;
}

/** Opens the app as a sandbox visitor, which lands on Home. Then goes to `to`. */
export async function enterSandbox(page: Page, to = "/app/watching") {
  await page.goto("/signin");
  await page.getByRole("button", { name: "Try without an account" }).click();
  await expect(page).toHaveURL(/\/app$/);
  if (to !== "/app") await page.goto(to);
}
