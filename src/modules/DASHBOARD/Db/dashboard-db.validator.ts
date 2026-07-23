/**
 * Soft data-quality for Dashboard — never throws.
 */
import {
  attachDataQualityReport,
  type DataQualityReport,
  type DataQualityWarning,
} from "../../../core/utils/data-quality-logger";

function isBlank(value: unknown): boolean {
  return value == null || String(value).trim() === "";
}

export function collectDashboardDataQualityFindings(
  kind: string,
  data: Record<string, unknown> | null | undefined,
): DataQualityReport {
  const warnings: DataQualityWarning[] = [];
  let emptyNetworkLabel = 0;
  let emptyUnbalanceLabel = 0;

  if (data == null) {
    return { warnings, counts: { emptyNetworkLabel, emptyUnbalanceLabel } };
  }

  if (kind === "metrics" && data.networkDetails && typeof data.networkDetails === "object") {
    for (const [key, value] of Object.entries(
      data.networkDetails as Record<string, unknown>,
    )) {
      const item = value as Record<string, unknown>;
      if (item && typeof item === "object" && isBlank(item.label)) {
        emptyNetworkLabel += 1;
        warnings.push({
          code: "EMPTY_NETWORK_LABEL",
          message: `networkDetails.${key}.label is empty`,
          field: `networkDetails.${key}.label`,
        });
      }
    }
  }

  if (
    (kind === "load-unbalance" || kind === "voltage-unbalance") &&
    Array.isArray(data.items)
  ) {
    for (const row of data.items) {
      const r = row as Record<string, unknown>;
      if (isBlank(r.label)) {
        emptyUnbalanceLabel += 1;
        warnings.push({
          code: "EMPTY_UNBALANCE_LABEL",
          message: "unbalance item label is empty",
          field: "label",
        });
      }
    }
  }

  return {
    warnings,
    counts: { emptyNetworkLabel, emptyUnbalanceLabel },
  };
}

export async function logDashboardDataQualityFindings(
  kind: string,
  data: Record<string, unknown> | null | undefined,
): Promise<DataQualityReport> {
  const report = collectDashboardDataQualityFindings(kind, data);
  await attachDataQualityReport(
    report,
    `Dashboard ${kind} data quality soft checks`,
  );
  return report;
}

export class DashboardDbValidator {
  static assertApiLteDb(label: string, apiValue: number, dbValue: number): void {
    if (apiValue > dbValue) {
      throw new Error(
        `${label}: API ${apiValue} exceeds DB ${dbValue}\n  Diagnostics: JWT scope / stale cache.`,
      );
    }
  }
}
