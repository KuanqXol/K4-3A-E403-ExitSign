import { test, expect } from "@playwright/test";

test("desktop and mobile layouts stay within the viewport", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("SlideAlive").first()).toBeVisible();
  
  // Desktop layout verification
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);

  // Mobile layout verification
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("slide navigation and interactive widgets", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Kiến trúc Tổng quan Transformer" })).toBeVisible();

  // Navigate to slide 2
  await page.getByRole("button", { name: "Sang slide tiếp" }).click();
  await expect(page.getByRole("heading", { name: /Self-Attention/i })).toBeVisible();

  // Test fill blank widget interaction
  const fillInput = page.getByPlaceholder("gõ từ khuyết...");
  await expect(fillInput).toBeVisible();
  await fillInput.fill("attention");
  await page.getByRole("button", { name: "Kiểm tra" }).click();
  await expect(fillInput).toHaveValue("attention");
});

test("ai tutor chat panel and interaction buttons", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Trợ lý Socratic AI" })).toBeVisible();
  const chatInput = page.getByPlaceholder("Hỏi AI về slide này hoặc gõ câu trả lời/phản biện...");
  await expect(chatInput).toBeVisible();

  // Enter learner message
  await chatInput.fill("Tokenization là gì?");
  await expect(chatInput).toHaveValue("Tokenization là gì?");
  await expect(page.getByRole("button", { name: "Gửi câu hỏi cho AI" })).toBeVisible();
});
