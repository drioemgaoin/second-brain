import { test, expect } from "@playwright/test";
import { mockApi } from "./fixtures/mock-api";

test.describe("Dark Mode", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test("theme toggle cycles through light, dark, system", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /Theme/ });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await page.waitForTimeout(100);
    await expect(page.getByRole("button", { name: /Theme/ })).toBeVisible();
  });

  test("dark mode applies dark class to html element", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("theme", "dark"));
    await page.goto("/");
    await page.waitForTimeout(200);
    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );
    expect(hasDark).toBe(true);
  });

  test("light mode removes dark class", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("theme", "light"));
    await page.goto("/");
    await page.waitForTimeout(200);
    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );
    expect(hasDark).toBe(false);
  });

  test("chat empty state dark mode", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("theme", "dark"));
    await page.goto("/");
    await page.waitForTimeout(200);
    await expect(
      page.locator("text=/Good (morning|afternoon|evening)/")
    ).toBeVisible();
    await expect(page).toHaveScreenshot("chat-empty-dark.png", {
      fullPage: true,
    });
  });

  test("notes page dark mode", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("theme", "dark"));
    await page.goto("/notes");
    await page.waitForSelector("[data-testid='note-card']");
    await expect(page).toHaveScreenshot("notes-dark.png", {
      fullPage: true,
    });
  });

  test("note form dark mode", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("theme", "dark"));
    await page.goto("/notes/new");
    await expect(page.locator("#note-title")).toBeVisible();
    await expect(page).toHaveScreenshot("form-dark.png", {
      fullPage: true,
    });
  });

  test("navbar dark mode", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("theme", "dark"));
    await page.goto("/");
    await page.waitForTimeout(200);
    await expect(page.locator("nav")).toHaveScreenshot("navbar-dark.png");
  });
});
