import { Page, expect } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
    await page.goto("/");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("Login")');
    await expect(page.getByText(/role:/i)).toBeVisible();
}
