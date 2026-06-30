import { test, expect } from "@playwright/test";
import { mockApi } from "./fixtures/mock-api";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test.describe("Navigation", () => {
  test("renders navbar with branding and links", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    await expect(nav).toContainText("Second Brain");
    await expect(nav.getByRole("link", { name: "Chat" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Notes" })).toBeVisible();
  });

  test("has brain icon", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav svg").first()).toBeVisible();
  });

  test("has theme toggle button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Theme/ })).toBeVisible();
  });

  test("chat link is active on home page", async ({ page }) => {
    await page.goto("/");
    const chatLink = page.getByRole("link", { name: "Chat" });
    await expect(chatLink).toHaveAttribute("aria-current", "page");
  });

  test("notes link is active on notes page", async ({ page }) => {
    // Navigate via client-side link to ensure pathname is set correctly
    await page.goto("/");
    await page.getByRole("link", { name: "Notes" }).click();
    await page.waitForURL("/notes");
    const notesLink = page.getByRole("link", { name: "Notes" });
    await expect(notesLink).toHaveAttribute("aria-current", "page");
  });

  test("navigates between pages", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Notes" }).click();
    await expect(page).toHaveURL("/notes");
    await page.getByRole("link", { name: "Chat" }).click();
    await expect(page).toHaveURL("/");
  });

  test("navbar is sticky", async ({ page }) => {
    await page.goto("/notes");
    const nav = page.locator("nav");
    const navBox = await nav.boundingBox();
    expect(navBox?.y).toBe(0);
  });

  test("navbar screenshot", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toHaveScreenshot("navbar.png");
  });
});
