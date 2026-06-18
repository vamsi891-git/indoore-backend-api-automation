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
import { moduleNameToSlug } from "./module-slug.util";

const MODULE_PATH_RE = /[\\/]modules[\\/]([^\\/]+)[\\/]/i;

/** e.g. AUTH, MIS DASHBOARDIES, HES-COMMANDS */
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
 * Group Allure report by API module.
 *
 * Suites:   hes-commands → describe group → test case
 * Behaviors: hes-commands (epic) → describe (feature) → test (story)
 */
export async function applyModuleAllureLabels(
  testInfo: TestInfo,
): Promise<void> {
  const moduleFolder = resolveModuleNameFromPath(testInfo.file);
  const moduleSlug = moduleNameToSlug(moduleFolder);
  const specFile = resolveSpecFileLabel(testInfo.file);

  const describeTitles = testInfo.titlePath.slice(0, -1);
  const suiteName = describeTitles[0] ?? specFile;
  const nestedPath =
    describeTitles.length > 1
      ? describeTitles.slice(1).join(" › ")
      : undefined;
  const testName = testInfo.title;
  const subSuiteName = nestedPath ? `${nestedPath} › ${testName}` : testName;

  await Promise.all([
    parentSuite(moduleSlug),
    suite(suiteName),
    subSuite(subSuiteName),
    epic(moduleSlug),
    feature(suiteName),
    story(subSuiteName),
    label("module", moduleSlug),
    label("package", moduleSlug),
    label("spec", specFile),
  ]);
}
