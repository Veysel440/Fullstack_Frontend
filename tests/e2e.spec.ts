import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("admin login & CRUD", async ({ page }) => {
    await login(page, "admin@example.com", "admin123");

    await page.fill('input[placeholder="Name"]', "e2e item");
    await page.fill('input[placeholder="Price"]', "12.34");
    await page.click('button:has-text("Add")');
    await expect(page.getByText("e2e item")).toBeVisible();

    await page.getByRole("button", { name: "Edit" }).first().click();
    await page.keyboard.type(" updated");
    await page.getByRole("button", { name: "Save" }).first().click();
    await expect(page.getByText(/updated/)).toBeVisible();

    await page.getByRole("button", { name: "Delete" }).first().click();
});

test("user login hides Delete", async ({ page }) => {
    await login(page, "user@example.com", "user123");
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
});

test("search & sort + refresh retry", async ({ page }) => {
    await login(page, "admin@example.com", "admin123");
    await page.fill('input[placeholder="Search name…"]', "Item 1");
    await page.click('button:has-text("Search")');
    await expect(page.getByText(/Item 1/i)).toBeVisible();

    await page.getByRole("columnheader", { name: /Name/ }).click();
    await page.getByRole("columnheader", { name: /Name/ }).click();

    await page.evaluate(() => (window as any).__debugSetAccess && (window as any).__debugSetAccess("bogus"));
    await page.click('button:has-text("Search")');
    await expect(page.getByText(/Items/)).toBeVisible();
});
