import {
  attachDataQualityReport,
  type DataQualityReport,
  type DataQualityWarning,
} from "../../../core/utils/data-quality-logger";

function isBlank(value: unknown): boolean {
  return value == null || String(value).trim() === "";
}

/** Soft data-quality for Consumers responses — never throws. */
export function collectConsumersDataQualityFindings(
  kind: string,
  data: Record<string, unknown> | unknown[] | null | undefined,
): DataQualityReport {
  const warnings: DataQualityWarning[] = [];
  let emptyMeterSerial = 0;
  let emptyAccountId = 0;
  let emptyName = 0;

  if (data == null) {
    return { warnings, counts: { emptyMeterSerial, emptyAccountId, emptyName } };
  }

  if (Array.isArray(data)) {
    for (const row of data) {
      const r = row as Record<string, unknown>;
      if (isBlank(r.periodLabel)) {
        warnings.push({
          code: "EMPTY_PERIOD_LABEL",
          message: "Billing row periodLabel is empty",
          field: "periodLabel",
        });
      }
    }
  } else {
    if ("consumerName" in data && isBlank(data.consumerName)) {
      emptyName += 1;
      warnings.push({
        code: "EMPTY_CONSUMER_NAME",
        message: "consumerName is empty",
        field: "consumerName",
      });
    }
    if ("meterSerialNumber" in data && isBlank(data.meterSerialNumber)) {
      emptyMeterSerial += 1;
      warnings.push({
        code: "EMPTY_METER_SERIAL",
        message: "meterSerialNumber is empty",
        field: "meterSerialNumber",
      });
    }
    if ("accountId" in data && isBlank(data.accountId)) {
      emptyAccountId += 1;
    }
    if (kind === "nearest" && Array.isArray(data.nearestAccountIds)) {
      const ids = (data.nearestAccountIds as Array<{ accountId?: string }>).map(
        (x) => x.accountId,
      );
      if (new Set(ids).size !== ids.length) {
        warnings.push({
          code: "DUPLICATE_NEAREST_ACCOUNT",
          message: "nearestAccountIds contains duplicate accountId values",
          field: "nearestAccountIds",
        });
      }
    }
  }

  return {
    warnings,
    counts: { emptyMeterSerial, emptyAccountId, emptyName },
  };
}

export async function logConsumersDataQualityFindings(
  kind: string,
  data: Record<string, unknown> | unknown[] | null | undefined,
): Promise<DataQualityReport> {
  const report = collectConsumersDataQualityFindings(kind, data);
  await attachDataQualityReport(report, `Consumers ${kind} data quality soft checks`);
  return report;
}

export class ConsumersDbValidator {
  static assertApiLteDb(label: string, apiValue: number, dbValue: number): void {
    if (apiValue > dbValue) {
      throw new Error(
        `${label}: API ${apiValue} exceeds DB ${dbValue}\n  Diagnostics: check JWT scope / stale cache.`,
      );
    }
  }
}
