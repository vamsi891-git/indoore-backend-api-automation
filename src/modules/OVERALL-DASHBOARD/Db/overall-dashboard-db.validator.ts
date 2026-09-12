/** Soft DQ — never throws. */
import {
  attachDataQualityReport,
  type DataQualityReport,
  type DataQualityWarning,
} from "../../../core/utils/data-quality-logger";

function isBlank(value: unknown): boolean {
  return value == null || String(value).trim() === "";
}

export function collectOverallDashboardDataQualityFindings(
  kind: "metrics" | "dtr-communication",
  data: Record<string, unknown> | null | undefined,
): DataQualityReport {
  const warnings: DataQualityWarning[] = [];
  let emptyLabel = 0;
  if (data == null) return { warnings, counts: { emptyLabel } };

  if (kind === "metrics") {
    const summary = data.installationSummary;
    if (Array.isArray(summary)) {
      for (const [index, item] of summary.entries()) {
        const row = item as Record<string, unknown>;
        if (row && typeof row === "object" && isBlank(row.label)) {
          emptyLabel += 1;
          warnings.push({
            code: "EMPTY_INSTALLATION_LABEL",
            message: `installationSummary[${index}].label empty`,
            field: `installationSummary[${index}].label`,
          });
        }
      }
    }

    const donuts = [
      ["billingEfficiencyDonut", data.billingEfficiencyDonut],
      ["benefitsAtrCasesDonut", data.benefitsAtrCasesDonut],
    ] as const;
    for (const [section, payload] of donuts) {
      if (!Array.isArray(payload)) continue;
      for (const [index, item] of payload.entries()) {
        const row = item as Record<string, unknown>;
        if (row && typeof row === "object" && isBlank(row.label)) {
          emptyLabel += 1;
          warnings.push({
            code: "EMPTY_DONUT_LABEL",
            message: `${section}[${index}].label empty`,
            field: `${section}[${index}].label`,
          });
        }
      }
    }
  }

  if (kind === "dtr-communication" && Array.isArray(data.points)) {
    for (const p of data.points) {
      if (isBlank((p as Record<string, unknown>).label)) {
        emptyLabel += 1;
        warnings.push({
          code: "EMPTY_POINT_LABEL",
          message: "point label empty",
          field: "label",
        });
      }
    }
  }

  return { warnings, counts: { emptyLabel } };
}

export async function logOverallDashboardDataQualityFindings(
  kind: "metrics" | "dtr-communication",
  data: Record<string, unknown> | null | undefined,
): Promise<DataQualityReport> {
  const report = collectOverallDashboardDataQualityFindings(kind, data);
  await attachDataQualityReport(report, `Overall Dashboard ${kind} DQ`);
  return report;
}

export class OverallDashboardDbValidator {
  static assertApiLteDb(label: string, apiValue: number, dbValue: number): void {
    if (apiValue > dbValue) {
      throw new Error(`${label}: API ${apiValue} exceeds DB ${dbValue}`);
    }
  }
}
