import { test, expect, Page } from "@playwright/test";

async function login(page: Page, email: string, password: string) {
    await page.goto("/");
    await page.fill('input[placeholder="email"]', email).catch(async () => {
        await page.fill('input[type="text"]', email);
    });
    await page.fill('input[placeholder="password"]', password).catch(async () => {
        await page.fill('input[type="password"]', password);
    });
    await page.getByRole("button", { name: /login/i }).click();
}

test("admin login & CRUD & sort/search", async ({ page }) => {
    await login(page, "admin@example.com", "admin123");
    await expect(page.getByText(/role:\s*admin/i)).toBeVisible();


    await page.fill('input[placeholder="Search name…"]', "Item 1");
    await page.getByRole("button", { name: /search/i }).click();
    await expect(page.getByRole("table")).toBeVisible();


    await page.getByRole("columnheader", { name: "Name" }).click();
    await page.getByRole("columnheader", { name: "Name" }).click();


    await page.fill('input[placeholder="Name"]', "e2e item");
    await page.fill('input[placeholder="Price"]', "12.34");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("e2e item")).toBeVisible();

    await page.getByRole("button", { name: "Edit" }).first().click();
    await page.keyboard.type(" updated");
    await page.getByRole("button", { name: "Save" }).first().click();
    await expect(page.getByText(/updated/)).toBeVisible();

    await page.getByRole("button", { name: "Delete" }).first().click();
});

test("user login hides Delete", async ({ page }) => {
    await login(page, "user@example.com", "user123");
    await expect(page.getByText(/role:\s*user/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
});
