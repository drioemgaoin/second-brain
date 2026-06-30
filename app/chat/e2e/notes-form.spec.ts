import { test, expect } from "@playwright/test";
import { mockApi } from "./fixtures/mock-api";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test.describe("Note Form", () => {
  test("renders all form fields", async ({ page }) => {
    await page.goto("/notes/new");
    await expect(page.locator("#note-title")).toBeVisible();
    await expect(page.locator("#note-area")).toBeVisible();
    await expect(page.locator("#note-tags")).toBeVisible();
    await expect(page.locator("#note-content")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Publish" })
    ).toBeVisible();
  });

  test("write/preview tab switching", async ({ page }) => {
    await page.goto("/notes/new");
    const contentArea = page.locator("#note-content");
    await contentArea.fill("# Hello World\n\nSome **bold** text.");

    // Switch to preview
    await page.getByRole("button", { name: "Preview" }).click();
    await expect(page.locator("h1:has-text('Hello World')")).toBeVisible();
    await expect(contentArea).not.toBeVisible();

    // Switch back to write
    await page.getByRole("button", { name: "Write" }).click();
    await expect(contentArea).toBeVisible();
  });

  test("character count updates", async ({ page }) => {
    await page.goto("/notes/new");
    const contentArea = page.locator("#note-content");
    await contentArea.fill("Hello World");
    await expect(page.getByText("11 characters")).toBeVisible();
  });

  test("shows validation error when submitting without title", async ({
    page,
  }) => {
    await page.goto("/notes/new");
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(
      page.getByText("Title and area are required")
    ).toBeVisible();
  });

  test("cancel button navigates back to notes", async ({ page }) => {
    await page.goto("/notes/new");
    await page.getByRole("link", { name: "Cancel" }).click();
    await expect(page).toHaveURL("/notes");
  });

  test("new note form screenshot", async ({ page }) => {
    await page.goto("/notes/new");
    await expect(page).toHaveScreenshot("notes-form-new.png", {
      fullPage: true,
    });
  });

  test("edit note form loads data", async ({ page }) => {
    await page.goto("/notes/edit?slug=ai-learning%2Frag-evaluation");
    await expect(page.locator("#note-title")).toHaveValue(
      "RAG Evaluation Basics"
    );
  });
});
