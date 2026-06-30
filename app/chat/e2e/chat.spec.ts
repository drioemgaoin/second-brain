import { test, expect } from "@playwright/test";
import { mockApi } from "./fixtures/mock-api";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test.describe("Chat Page", () => {
  test("shows empty state with greeting and suggestion cards", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.locator("text=/Good (morning|afternoon|evening)/")
    ).toBeVisible();
    await expect(
      page.getByText("Ask anything about your knowledge base")
    ).toBeVisible();
    const chips = page.locator("[data-testid='suggestion-chip']");
    await expect(chips).toHaveCount(4);
  });

  test("chat input has placeholder and disabled send button", async ({
    page,
  }) => {
    await page.goto("/");
    const textarea = page.locator("textarea[aria-label='Chat message']");
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute(
      "placeholder",
      "Ask anything about your knowledge base..."
    );
    // Send button is icon-only, disabled when empty
    const sendButton = page.locator("button[type='submit']");
    await expect(sendButton).toBeDisabled();
  });

  test("send button enables when text is entered", async ({ page }) => {
    await page.goto("/");
    const textarea = page.locator("textarea[aria-label='Chat message']");
    await textarea.fill("Hello");
    const sendButton = page.locator("button[type='submit']");
    await expect(sendButton).toBeEnabled();
  });

  test("keyboard hint appears on focus", async ({ page }) => {
    await page.goto("/");
    const textarea = page.locator("textarea[aria-label='Chat message']");
    await textarea.focus();
    await expect(page.getByText("Enter to send")).toBeVisible();
  });

  test("clicking suggestion card sends message", async ({ page }) => {
    await page.goto("/");
    const chip = page.locator("[data-testid='suggestion-chip']").first();
    await chip.click();
    await expect(
      page.locator("text=/Good (morning|afternoon|evening)/")
    ).not.toBeVisible();
  });

  test("textarea auto-focuses on page load", async ({ page }) => {
    await page.goto("/");
    const textarea = page.locator("textarea[aria-label='Chat message']");
    await expect(textarea).toBeFocused();
  });

  test("follow-up chips appear after AI response", async ({ page }) => {
    await page.goto("/");
    const textarea = page.locator("textarea[aria-label='Chat message']");
    await textarea.fill("Hello");
    await page.locator("button[type='submit']").click();
    await expect(
      page.getByText("This is a response from the knowledge base")
    ).toBeVisible();
    await expect(page.getByText("Tell me more about that")).toBeVisible();
  });

  test("copy button appears on hover over assistant message", async ({
    page,
  }) => {
    await page.goto("/");
    const textarea = page.locator("textarea[aria-label='Chat message']");
    await textarea.fill("Hello");
    await page.locator("button[type='submit']").click();
    await expect(
      page.getByText("This is a response from the knowledge base")
    ).toBeVisible();
    const copyBtn = page.getByRole("button", { name: "Copy message" });
    await expect(copyBtn).toBeAttached();
  });

  test("empty state screenshot", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveScreenshot("chat-empty.png", {
      fullPage: true,
    });
  });
});
