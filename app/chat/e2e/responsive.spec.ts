import { test, expect } from "@playwright/test";
import { mockApi } from "./fixtures/mock-api";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test.describe("Responsive - Desktop", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("chat page desktop screenshot", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=/Good (morning|afternoon|evening)/")).toBeVisible();
    await expect(page).toHaveScreenshot("chat-desktop.png", {
      fullPage: true,
    });
  });

  test("notes page desktop screenshot", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector("[data-testid='note-card']");
    await expect(page).toHaveScreenshot("notes-desktop.png", {
      fullPage: true,
    });
  });

  test("note form desktop screenshot", async ({ page }) => {
    await page.goto("/notes/new");
    await expect(page.locator("#note-title")).toBeVisible();
    await expect(page).toHaveScreenshot("form-desktop.png", {
      fullPage: true,
    });
  });
});

test.describe("Responsive - Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("chat page mobile screenshot", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=/Good (morning|afternoon|evening)/")).toBeVisible();
    await expect(page).toHaveScreenshot("chat-mobile.png", {
      fullPage: true,
    });
  });

  test("notes page mobile screenshot", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector("[data-testid='note-card']");
    await expect(page).toHaveScreenshot("notes-mobile.png", {
      fullPage: true,
    });
  });

  test("note form mobile screenshot", async ({ page }) => {
    await page.goto("/notes/new");
    await expect(page.locator("#note-title")).toBeVisible();
    await expect(page).toHaveScreenshot("form-mobile.png", {
      fullPage: true,
    });
  });

  test("delete button is visible on mobile without hover", async ({
    page,
  }) => {
    await page.goto("/notes");
    await page.waitForSelector("[data-testid='note-card']");
    const deleteBtn = page
      .locator("[data-testid='delete-button']")
      .first();
    await expect(deleteBtn).toBeVisible();
  });

  test("theme toggle visible on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Theme/ })).toBeVisible();
  });
});
