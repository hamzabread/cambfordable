import { expect, test } from "@playwright/test";
import { ADMIN, logIn, NEWCOMER } from "./accounts";

const RECEIPT = { name: "receipt.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n% test receipt\n") };

test("a student uploads payment proof and an admin approves it", async ({ browser }) => {
  const student = await browser.newPage();
  await logIn(student, NEWCOMER);
  await student.goto("/courses");
  await student.getByRole("tab", { name: /available/i }).or(student.getByRole("button", { name: /available/i })).first().click();
  const course = student.locator("article").filter({ hasText: "E2E Chemistry" });
  await course.getByRole("button", { name: /request enrollment/i }).click();

  const dialog = student.getByRole("dialog");
  await dialog.locator("#payment-proof").setInputFiles(RECEIPT);
  await dialog.getByRole("button", { name: /submit for review/i }).click();
  await expect(dialog).toBeHidden();
  await expect(student.locator("article").filter({ hasText: "E2E Chemistry" }).getByText(/awaiting approval|being reviewed|pending/i).first()).toBeVisible();

  const admin = await browser.newPage();
  await logIn(admin, ADMIN);
  await admin.getByRole("button", { name: /payments/i }).first().click();
  await admin.getByRole("button", { name: /E2E Chemistry/ }).click();
  const row = admin.locator("div.px-4.py-3").filter({ hasText: NEWCOMER });
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(row.getByRole("button", { name: "Approve" })).toHaveCount(0);

  await student.goto("/courses");
  await student.getByRole("tab", { name: /enrolled/i }).or(student.getByRole("button", { name: /enrolled/i })).first().click();
  await expect(student.locator("article").filter({ hasText: "E2E Chemistry" })).toBeVisible();
});
