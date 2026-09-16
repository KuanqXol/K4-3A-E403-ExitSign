import { test, expect } from "@playwright/test";

test("desktop and mobile layouts stay within the viewport", async ({
  page,
}) => {
  await page.goto("/");
  await page.screenshot({
    path: "test-results/library-desktop.png",
    caret: "initial",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Use Demo Lesson" }).click();
  await page.screenshot({
    path: "test-results/player-desktop.png",
    caret: "initial",
    fullPage: true,
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(1440);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/player-mobile.png",
    caret: "initial",
    fullPage: true,
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("two learners receive different adaptive interactions", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Use Demo Lesson" }).click();
  await page.getByRole("button", { name: "Fast Learner", exact: true }).click();
  await page.getByRole("button", { name: "Simulate answer" }).click();
  await expect(page.getByText("65% → 80%")).toBeVisible();
  await expect(page.getByText("Next: Medium")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Why does Binary Search require a sorted array?",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Simulate answer" }).click();
  await expect(page.getByText("Next: Hard")).toBeVisible();
  await page
    .getByRole("button", { name: "Needs Support", exact: true })
    .click();
  await page.getByRole("button", { name: "Simulate answer" }).click();
  await expect(page.getByText("50% → 35%")).toBeVisible();
  await expect(page.getByText("Hint used: Yes")).toBeVisible();
  await page.getByRole("button", { name: "Try an easier question" }).click();
  await expect(
    page.getByRole("heading", {
      name: "The target is 5 and the middle value is 12. Where should we search next?",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Finish session" }).click();
  await expect(
    page.getByRole("heading", { name: "Lesson complete." }),
  ).toBeVisible();
  await expect(
    page.getByText("1 questions answered · 0 correct"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Practice weak concepts" }).click();
  await expect(
    page.getByRole("heading", { name: "Why O(log n)?" }),
  ).toBeVisible();
});

test("manual answers, hint, explanation and upload boundaries", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("input[type=file]").setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("test"),
  });
  await expect(page.getByRole("status")).toContainText(
    "Please choose a PDF file",
  );
  await page.locator("input[type=file]").setInputFiles({
    name: "notes.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 demo"),
  });
  await expect(page.getByRole("status")).toContainText(
    "PDF processing is not connected",
  );
  await page.getByRole("button", { name: "Use Demo Lesson" }).click();
  await expect(
    page.getByRole("button", { name: "Submit answer" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(page.getByText("A little nudge")).toBeVisible();
  await page
    .getByRole("button", { name: "Explain this slide", exact: true })
    .click();
  await expect(page.getByText("Find the middle value.")).toBeVisible();
  await page.getByRole("button", { name: "Close explanation" }).click();
  await page
    .getByRole("radio", { name: "B To determine which half can be eliminated" })
    .click();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByText("0% → 6%")).toBeVisible();
  await page.getByRole("button", { name: "My progress", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("Questions answered"),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
