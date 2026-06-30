import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mockApi } from "./fixtures/mock-api";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test.describe("Accessibility", () => {
  test("chat page has no critical a11y violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical).toEqual([]);
  });

  test("notes page has no critical a11y violations", async ({ page }) => {
    await page.goto("/notes");
    await page.waitForTimeout(300);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical).toEqual([]);
  });

  test("note form has no critical a11y violations", async ({ page }) => {
    await page.goto("/notes/new");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical).toEqual([]);
  });

  test("theme toggle is keyboard accessible", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /Theme/ });
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Enter");
    // Should still be accessible after toggle
    await expect(page.getByRole("button", { name: /Theme/ })).toBeVisible();
  });
});
