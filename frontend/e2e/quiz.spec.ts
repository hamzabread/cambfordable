import { expect, test } from "@playwright/test";
import { logIn, STUDENT } from "./accounts";

test("a student takes and submits a quiz", async ({ page }) => {
  await logIn(page, STUDENT);
  await page.goto("/quizzes");
  const card = page.locator("article").filter({ hasText: "E2E Waves quiz" });
  await card.getByRole("link", { name: /start quiz/i }).click();

  await expect(page).toHaveURL(/\/quiz\/\d+$/);
  await page.getByRole("button", { name: /start the quiz/i }).click();
  await expect(page.getByText("What is the unit of frequency?")).toBeVisible();

  await page.getByLabel("Hertz").check();
  await page.getByRole("button", { name: /submit quiz/i }).click();
  await expect(page.getByText(/submitted/i).first()).toBeVisible();

  // Back on the list, the quiz can't be started again.
  await page.goto("/quizzes");
  await expect(page.getByText("E2E Waves quiz")).toBeVisible();
  await expect(page.getByRole("link", { name: /start quiz/i })).toHaveCount(0);
});
