/**
 * Soft data-quality for Meter Replacement responses — never throws.
 */
import {
  attachDataQualityReport,
  type DataQualityReport,
  type DataQualityWarning,
} from "../../../core/utils/data-quality-logger";

function isBlank(value: unknown): boolean {
  return value == null || String(value).trim() === "";
}

export type MeterReplacementDqKind =
  | "dashboard-summary"
  | "progress"
  | "consumer-search"
  | "consumer-detail"
  | "meter-validation"
  | "submission-history"
  | "submission-detail"
  | "create-submission"
  | "bulk-validate";

export function collectMeterReplacementDataQualityFindings(
  kind: MeterReplacementDqKind,
  data: Record<string, unknown> | null | undefined,
): DataQualityReport {
  const warnings: DataQualityWarning[] = [];
  let emptyConsumerName = 0;
  let emptyMeterSerial = 0;
  let emptyAccountId = 0;

  if (data == null) {
    return {
      warnings,
      counts: { emptyConsumerName, emptyMeterSerial, emptyAccountId },
    };
  }

  if (kind === "consumer-detail") {
    if (isBlank(data.consumer) && isBlank(data.consumerName)) {
      emptyConsumerName += 1;
      warnings.push({
        code: "EMPTY_CONSUMER_NAME",
        message: "consumer name is empty",
        field: "consumer",
      });
    }
    if (isBlank(data.oldMeterSerial)) {
      emptyMeterSerial += 1;
      warnings.push({
        code: "EMPTY_OLD_METER_SERIAL",
        message: "oldMeterSerial is empty",
        field: "oldMeterSerial",
      });
    }
    if (isBlank(data.accountId)) {
      emptyAccountId += 1;
      warnings.push({
        code: "EMPTY_ACCOUNT_ID",
        message: "accountId is empty",
        field: "accountId",
      });
    }
  }

  if (kind === "meter-validation" && isBlank(data.meterSerial)) {
    emptyMeterSerial += 1;
    warnings.push({
      code: "EMPTY_METER_SERIAL",
      message: "meterSerial is empty",
      field: "meterSerial",
    });
  }

  if (kind === "consumer-search" && Array.isArray(data)) {
    for (const row of data) {
      const r = row as Record<string, unknown>;
      if (isBlank(r.consumerName)) {
        emptyConsumerName += 1;
        warnings.push({
          code: "EMPTY_SEARCH_CONSUMER_NAME",
          message: "search hit consumerName is empty",
          field: "consumerName",
        });
      }
    }
  }

  if (kind === "submission-history" && Array.isArray(data.items)) {
    for (const row of data.items) {
      const r = row as Record<string, unknown>;
      if (isBlank(r.oldMeterSerial)) {
        emptyMeterSerial += 1;
        warnings.push({
          code: "EMPTY_HISTORY_OLD_METER",
          message: "history item oldMeterSerial is empty",
          field: "oldMeterSerial",
        });
      }
    }
  }

  if (kind === "submission-detail") {
    const consumer = data.consumer as Record<string, unknown> | undefined;
    if (consumer && isBlank(consumer.consumerName)) {
      emptyConsumerName += 1;
      warnings.push({
        code: "EMPTY_DETAIL_CONSUMER_NAME",
        message: "submission detail consumerName is empty",
        field: "consumer.consumerName",
      });
    }
  }

  return {
    warnings,
    counts: { emptyConsumerName, emptyMeterSerial, emptyAccountId },
  };
}

export async function logMeterReplacementDataQualityFindings(
  kind: MeterReplacementDqKind,
  data: Record<string, unknown> | null | undefined,
): Promise<DataQualityReport> {
  const report = collectMeterReplacementDataQualityFindings(kind, data);
  await attachDataQualityReport(
    report,
    `Meter Replacement ${kind} data quality soft checks`,
  );
  return report;
}

export class MeterReplacementDbValidator {
  static assertApiLteDb(label: string, apiValue: number, dbValue: number): void {
    if (apiValue > dbValue) {
      throw new Error(
        `${label}: API ${apiValue} exceeds DB ${dbValue}\n  Diagnostics: JWT scope / stale cache.`,
      );
    }
  }
}
