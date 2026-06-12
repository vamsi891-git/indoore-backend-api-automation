import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
import { DEFAULT_TEST_TIMEOUT_MS } from "./src/core/constants/api-timeouts";

dotenv.config();

export default defineConfig({
  globalSetup: require.resolve("./src/global.setup.ts"),
  testDir: "./src",
  fullyParallel: true,
  workers: 1,
  timeout: DEFAULT_TEST_TIMEOUT_MS,
  retries: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "reports/playwright-results.json" }],
    [
      "allure-playwright",
      {
        detail: true,
        outputFolder: "allure-results",
        suiteTitle: true,
      },
    ],
  ],
  use: {
    baseURL: process.env.BASE_URL
  }
});
