import type { TestInfo } from "@playwright/test";
import {
  epic,
  feature,
  label,
  parentSuite,
  story,
  subSuite,
  suite,
} from "allure-js-commons";

const MODULE_PATH_RE = /[\\/]modules[\\/]([^\\/]+)[\\/]/i;

/** e.g. AUTH, MIS DASHBOARDIES, REPORTS */
export function resolveModuleNameFromPath(filePath: string): string {
  const match = filePath.match(MODULE_PATH_RE);
  return match?.[1] ?? "OTHER";
}

function resolveSpecFileLabel(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const fileName = normalized.split("/").pop() ?? "unknown";
  return fileName.replace(/\.spec\.(ts|js)x?$/i, "");
}

/**
 * Group Allure report by API module so Suites/Behaviors are not mixed file paths.
 *
 * Suites:  Module → spec/describe group → test case
 * Behaviors: Module (epic) → describe (feature) → test (story)
 */
export function applyModuleAllureLabels(testInfo: TestInfo): void {
  const moduleName = resolveModuleNameFromPath(testInfo.file);
  const specFile = resolveSpecFileLabel(testInfo.file);

  const describeTitles = testInfo.titlePath.slice(0, -1);
  const suiteName = describeTitles[0] ?? specFile;
  const nestedPath =
    describeTitles.length > 1
      ? describeTitles.slice(1).join(" › ")
      : undefined;
  const testName = testInfo.title;

  parentSuite(moduleName);
  suite(suiteName);
  subSuite(nestedPath ? `${nestedPath} › ${testName}` : testName);

  epic(moduleName);
  feature(suiteName);
  story(nestedPath ? `${nestedPath} › ${testName}` : testName);

  label("module", moduleName);
  label("package", moduleName);
  label("spec", specFile);
}
