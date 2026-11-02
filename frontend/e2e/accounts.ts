import { expect, type Page } from "@playwright/test";

// Seeded by backend/tests/e2e_server.py into a throwaway database; these
// accounts exist nowhere else.
export const PASSWORD = "E2e-only-password-1";
export const ADMIN = "e2e_admin";
export const STUDENT = "e2e_student";
export const NEWCOMER = "e2e_newcomer";

export async function logIn(page: Page, username: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Username or email").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

/** Zoom is never contacted in tests: the classroom loads without it. */
export async function blockZoom(page: Page) {
  await page.route(/https:\/\/([a-z0-9-]+\.)*zoom\.(us|com)\//, (route) => route.abort());
}
