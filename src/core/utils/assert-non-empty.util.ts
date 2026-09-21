import { expect } from "@playwright/test";

/**
 * Smoke rule: primary list/table must have at least one row.
 * Regression stays empty-valid — only call when `nonEmptyExpected` is true.
 */
export function assertNonEmpty(rows: readonly unknown[] | null | undefined, label: string): void {
  const list = rows ?? [];
  expect(
    list.length,
    `Expected non-empty ${label} for smoke (got ${list.length}). ` +
      "Empty is valid in regression; smoke needs live data for this screen.",
  ).toBeGreaterThan(0);
}
