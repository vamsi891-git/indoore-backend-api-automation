/**
 * Soft data-quality for Technical Analysis — never throws.
 */
import {
  attachDataQualityReport,
  type DataQualityReport,
  type DataQualityWarning,
} from "../../../core/utils/data-quality-logger";

function isBlank(value: unknown): boolean {
  return value == null || String(value).trim() === "";
}

export function collectTechnicalAnalysisDataQualityFindings(
  kind: "summary" | "report",
  data: Record<string, unknown> | null | undefined,
): DataQualityReport {
  const warnings: DataQualityWarning[] = [];
  let emptyIvrs = 0;
  let emptyMsn = 0;
  let emptyAnalysisType = 0;

  if (data == null) {
    return { warnings, counts: { emptyIvrs, emptyMsn, emptyAnalysisType } };
  }

  if (kind === "summary" && Array.isArray(data.reports)) {
    for (const row of data.reports) {
      const r = row as Record<string, unknown>;
      if (isBlank(r.analysisType)) {
        emptyAnalysisType += 1;
        warnings.push({
          code: "EMPTY_ANALYSIS_TYPE",
          message: "summary report analysisType is empty",
          field: "analysisType",
        });
      }
    }
  }

  if (kind === "report" && Array.isArray(data.rows)) {
    for (const row of data.rows) {
      const r = row as Record<string, unknown>;
      if (isBlank(r.ivrsNumber)) {
        emptyIvrs += 1;
        warnings.push({
          code: "EMPTY_IVRS",
          message: "report row ivrsNumber is empty",
          field: "ivrsNumber",
        });
      }
      if (isBlank(r.msn)) {
        emptyMsn += 1;
        warnings.push({
          code: "EMPTY_MSN",
          message: "report row msn is empty",
          field: "msn",
        });
      }
    }
  }

  return {
    warnings,
    counts: { emptyIvrs, emptyMsn, emptyAnalysisType },
  };
}

export async function logTechnicalAnalysisDataQualityFindings(
  kind: "summary" | "report",
  data: Record<string, unknown> | null | undefined,
): Promise<DataQualityReport> {
  const report = collectTechnicalAnalysisDataQualityFindings(kind, data);
  await attachDataQualityReport(
    report,
    `Technical Analysis ${kind} data quality soft checks`,
  );
  return report;
}

export class TechnicalAnalysisDbValidator {
  static assertApiLteDb(label: string, apiValue: number, dbValue: number): void {
    if (apiValue > dbValue) {
      throw new Error(
        `${label}: API ${apiValue} exceeds DB ${dbValue}\n  Diagnostics: JWT scope / stale cache.`,
      );
    }
  }
}
