/**
 * Soft data-quality for Feeder responses — never throws.
 */
import {
  attachDataQualityReport,
  type DataQualityReport,
  type DataQualityWarning,
} from "../../../core/utils/data-quality-logger";

function isBlank(value: unknown): boolean {
  return value == null || String(value).trim() === "";
}

export function collectFeederDataQualityFindings(
  kind: "profile" | "alerts" | "electrical" | "daily-consumption",
  data: Record<string, unknown> | null | undefined,
): DataQualityReport {
  const warnings: DataQualityWarning[] = [];
  let emptyFeederCode = 0;
  let emptyMeterSerial = 0;
  let emptyAlertMeter = 0;

  if (data == null) {
    return {
      warnings,
      counts: { emptyFeederCode, emptyMeterSerial, emptyAlertMeter },
    };
  }

  if (kind === "profile") {
    if (isBlank(data.feederCode)) {
      emptyFeederCode += 1;
      warnings.push({
        code: "EMPTY_FEEDER_CODE",
        message: "feederCode is empty",
        field: "feederCode",
      });
    }
  }

  if (kind === "electrical" && isBlank(data.meterSerialNumber)) {
    emptyMeterSerial += 1;
    warnings.push({
      code: "EMPTY_METER_SERIAL",
      message: "meterSerialNumber is empty",
      field: "meterSerialNumber",
    });
  }

  if (kind === "alerts" && Array.isArray(data.rows)) {
    for (const row of data.rows) {
      const r = row as Record<string, unknown>;
      if (isBlank(r.meterNumber)) {
        emptyAlertMeter += 1;
        warnings.push({
          code: "EMPTY_ALERT_METER",
          message: "alert row meterNumber is empty",
          field: "meterNumber",
        });
      }
    }
  }

  return {
    warnings,
    counts: { emptyFeederCode, emptyMeterSerial, emptyAlertMeter },
  };
}

export async function logFeederDataQualityFindings(
  kind: "profile" | "alerts" | "electrical" | "daily-consumption",
  data: Record<string, unknown> | null | undefined,
): Promise<DataQualityReport> {
  const report = collectFeederDataQualityFindings(kind, data);
  await attachDataQualityReport(report, `Feeder ${kind} data quality soft checks`);
  return report;
}

export class FeederDbValidator {
  static assertApiLteDb(label: string, apiValue: number, dbValue: number): void {
    if (apiValue > dbValue) {
      throw new Error(
        `${label}: API ${apiValue} exceeds DB ${dbValue}\n  Diagnostics: JWT scope / stale cache.`,
      );
    }
  }
}
