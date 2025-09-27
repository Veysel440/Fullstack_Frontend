import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./tests",
    fullyParallel: true,
    retries: 0,
    reporter: [["list"], ["html", { open: "never" }]],
    use: { baseURL: "http://localhost:5173", trace: "on-first-retry" },
    webServer: {
        command: "npm run dev",
        port: 5173,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
