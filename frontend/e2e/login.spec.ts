import { expect, test } from "@playwright/test";
import { logIn, STUDENT } from "./accounts";

test("a wrong password is refused without leaving the page", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username or email").fill(STUDENT);
  await page.getByLabel("Password", { exact: true }).fill("not-the-password");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page.getByText(/invalid/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("a student logs in and reaches the dashboard", async ({ page }) => {
  await logIn(page, STUDENT);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => Boolean(localStorage.getItem("access_token")))).toBe(true);
});

test("pages behind login send a signed-out visitor to log in", async ({ page }) => {
  await page.goto("/quizzes");
  await expect(page).toHaveURL(/\/login/);
});
