import { test, expect } from "@playwright/test";

test("search + sort works", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "admin123");
    await page.click('button:has-text("Login")');
    await expect(page.getByText("role: admin")).toBeVisible();

    await page.fill('input[placeholder="Search name…"]', "Item 1");
    await expect(page.getByText(/Item 1/i)).toBeVisible();

    await page.getByRole("columnheader", { name: "Name" }).click();
    await page.getByRole("columnheader", { name: "Name ▲" }).click();
    await expect(page.getByText(/Items/)).toBeVisible();
});

test("401 -> refresh -> retry", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "admin123");
    await page.click('button:has-text("Login")');
    await expect(page.getByText("role: admin")).toBeVisible();

    // break access token; refresh cookie should repair on next request
    await page.evaluate(() => (window as any).__debugSetAccess("bogus"));
    await page.reload();
    await expect(page.getByText("Items")).toBeVisible();
});
