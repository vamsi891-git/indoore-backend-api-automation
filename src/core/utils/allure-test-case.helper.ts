import { allureId, label } from "allure-js-commons";

/**
 * Attach a stable test-case ID (e.g. IND-RPT-001) for Allure filtering.
 * Shared across modules — keep module-specific IDs in Data/*.data.ts.
 */
export async function applyAllureTestCaseId(testCaseId: string): Promise<void> {
  await Promise.all([
    allureId(testCaseId),
    label("testCaseId", testCaseId),
    label("as_id", testCaseId),
  ]);
}
