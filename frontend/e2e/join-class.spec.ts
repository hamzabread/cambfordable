import { expect, test } from "@playwright/test";
import { blockZoom, logIn, NEWCOMER, STUDENT } from "./accounts";

test("an enrolled student joins a live class", async ({ page, context }) => {
  await blockZoom(page);
  await logIn(page, STUDENT);
  await page.goto("/schedule");
  await expect(page.getByText("E2E Live optics")).toBeVisible();

  // The join button opens the classroom in a new tab.
  const classroomOpened = context.waitForEvent("page");
  await page.getByRole("button", { name: /join live lecture/i }).click();
  const classroom = await classroomOpened;
  await blockZoom(classroom);

  const signature = classroom.waitForResponse((response) => /\/live-classes\/\d+\/zoom-sdk$/.test(response.url()));
  const claim = classroom.waitForResponse((response) => /\/session\/claim$/.test(response.url()));
  expect((await signature).status()).toBe(200);
  expect((await claim).status()).toBe(200);
  await expect(classroom).toHaveURL(/\/meeting\/\d+$/);
});

test("a student who isn't enrolled can't open the classroom", async ({ page }) => {
  await blockZoom(page);
  await logIn(page, NEWCOMER);
  // The seeded live class is the first class in the database.
  await page.goto("/meeting/1");
  // (Next.js adds its own empty role=alert route announcer, so match the text.)
  await expect(page.getByText(/not enrolled/i)).toBeVisible();
});
