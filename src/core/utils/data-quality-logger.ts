import { attachment, step } from "allure-js-commons";

export type DataQualityWarning = {
  code: string;
  message: string;
  rowId?: string;
  field?: string;
  actual?: unknown;
  expected?: unknown;
};

export type DataQualityReport = {
  warnings: DataQualityWarning[];
  counts: Record<string, number>;
};

/**
 * Soft (non-failing) Allure attachment for data-quality findings.
 * Domain collectors live in modules; this only publishes to the report.
 */
export async function attachDataQualityReport(
  report: DataQualityReport,
  title = "Data quality soft checks",
): Promise<void> {
  await step(`${title} (${report.warnings.length} warning(s))`, async () => {
    await attachment(
      "data-quality-report.json",
      JSON.stringify(report, null, 2),
      "application/json",
    );
  });
}
