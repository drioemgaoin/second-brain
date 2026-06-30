import { test, expect } from "@playwright/test";
import { mockApi, MOCK_NOTES } from "./fixtures/mock-api";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test.describe("Notes Page", () => {
  test("renders heading and note count", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector("[data-testid='note-card']");
    await expect(page.getByRole("heading", { name: "Notes", exact: true })).toBeVisible();
    await expect(
      page.getByText(`${MOCK_NOTES.length} notes`)
    ).toBeVisible();
  });

  test("renders area filter buttons", async ({ page }) => {
    await page.goto("/notes");
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
    for (const area of ["ai-learning", "quantum-physics", "hiring", "others"]) {
      await expect(
        page.getByRole("button", { name: area })
      ).toBeVisible();
    }
  });

  test("renders note cards with titles and area badges", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector("[data-testid='note-card']");
    for (const note of MOCK_NOTES) {
      await expect(page.getByText(note.title)).toBeVisible();
    }
  });

  test("area filter works", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector("[data-testid='note-card']");
    await page.getByRole("button", { name: "hiring" }).click();
    await expect(page.getByText("Interview Rubric Template")).toBeVisible();
    await page.waitForTimeout(300);
    await expect(
      page.getByText("RAG Evaluation Basics")
    ).not.toBeVisible();
  });

  test("shows loading skeletons initially", async ({ page }) => {
    await page.route("http://localhost:3001/notes", async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.fulfill({ json: MOCK_NOTES });
    });
    await page.goto("/notes");
    const skeletons = page.locator("[data-testid='skeleton-card']");
    await expect(skeletons.first()).toBeVisible();
  });

  test("delete modal appears on delete click", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector("[data-testid='note-card']");
    const firstCard = page.locator("[data-testid='note-card']").first();
    await firstCard.locator("[data-testid='delete-button']").click();
    await expect(page.getByText("Delete this note?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    const modalDeleteBtn = page.locator(
      ".fixed button:has-text('Delete'):not([data-testid='delete-button'])"
    );
    await expect(modalDeleteBtn).toBeVisible();
  });

  test("notes page screenshot", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForSelector("[data-testid='note-card']");
    await expect(page).toHaveScreenshot("notes-page.png", {
      fullPage: true,
    });
  });
});
