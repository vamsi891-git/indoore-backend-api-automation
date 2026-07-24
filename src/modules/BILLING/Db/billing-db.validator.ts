/**
 * Soft data-quality for Billing — never throws.
 */
import {
  attachDataQualityReport,
  type DataQualityReport,
  type DataQualityWarning,
} from "../../../core/utils/data-quality-logger";

function isBlank(value: unknown): boolean {
  return value == null || String(value).trim() === "";
}

export function collectBillingDataQualityFindings(
  kind: "billing-data" | "daywise-billing",
  data: Record<string, unknown> | null | undefined,
): DataQualityReport {
  const warnings: DataQualityWarning[] = [];
  let emptyMeterNumber = 0;

  if (data == null) {
    return { warnings, counts: { emptyMeterNumber } };
  }

  const rows = Array.isArray(data.rows)
    ? data.rows
    : Array.isArray(data.items)
      ? data.items
      : [];

  for (const row of rows) {
    const r = row as Record<string, unknown>;
    if (isBlank(r.meterNumber)) {
      emptyMeterNumber += 1;
      warnings.push({
        code: "EMPTY_METER_NUMBER",
        message: `${kind} row meterNumber is empty`,
        field: "meterNumber",
      });
    }
  }

  return { warnings, counts: { emptyMeterNumber } };
}

export async function logBillingDataQualityFindings(
  kind: "billing-data" | "daywise-billing",
  data: Record<string, unknown> | null | undefined,
): Promise<DataQualityReport> {
  const report = collectBillingDataQualityFindings(kind, data);
  await attachDataQualityReport(report, `Billing ${kind} data quality soft checks`);
  return report;
}
