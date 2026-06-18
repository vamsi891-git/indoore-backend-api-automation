import { test as playwrightTest } from "@playwright/test";
import { applyModuleAllureLabels } from "../core/utils/allure-module.labels";

export const test = playwrightTest;

test.beforeEach(async ({}, testInfo) => {
  await applyModuleAllureLabels(testInfo);
});

export { expect, request } from "@playwright/test";
export type { APIRequestContext } from "@playwright/test";
