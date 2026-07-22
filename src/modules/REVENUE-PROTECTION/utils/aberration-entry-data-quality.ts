import {attachDataQualityReport,type DataQualityReport,type DataQualityWarning,} from "../../../core/utils/data-quality-logger";
import { CANONICAL_ABERRATION_EVENTS } from "../Data/aberration-entry.data";
import type { AberrationEntryData } from "../Mapper/aberration-entry.mapper";
function resolveRealisationMultiplier(): number {
  const raw = Number(process.env.RP_REALISATION_MULTIPLIER ?? "1");
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}
function normalizeEventLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
const canonicalEventSet = new Set(
  CANONICAL_ABERRATION_EVENTS.map((e) => normalizeEventLabel(e)),
);
export function collectAberrationEntryDataQualityFindings(data: AberrationEntryData,): DataQualityReport {
  const warnings: DataQualityWarning[] = [];
  const multiplier = resolveRealisationMultiplier();
  let unknownEvents = 0;
  let realisationOutliers = 0;
  let emptyFieldOfficer = 0;
  let emptyRemarks = 0;
  for (const row of data.rows) {
    const eventNorm = normalizeEventLabel(row.eventName);
    if (row.eventName.trim() && !canonicalEventSet.has(eventNorm)) {
      unknownEvents++;
      warnings.push({
        code: "UNKNOWN_EVENT",
        message: `eventName not found in canonical list: "${row.eventName}"`,
        rowId: row.id,
        field: "eventName",
        actual: row.eventName,
        expected: [...CANONICAL_ABERRATION_EVENTS],
      });
    }

    const threshold = row.amountBilled * multiplier;

    if (row.amountRealised > threshold) {
      realisationOutliers++;

      warnings.push({
        code: "REALISATION_OUTLIER",
        message: `amountRealised (${row.amountRealised}) exceeds amountBilled × ${multiplier} (${threshold})`,
        rowId: row.id,
        field: "amountRealised",
        actual: row.amountRealised,
        expected: `<= ${threshold}`,
      });
    }

    if (!row.fieldOfficerName.trim()) {
      emptyFieldOfficer++;
    }

    if (!row.remarks.trim()) {
      emptyRemarks++;
    }
  }

  /**
   * Soft warnings only.
   * Repository allows these fields to be NULL.
   */

  if (data.rows.length > 0 && emptyFieldOfficer === data.rows.length) {
    warnings.push({
      code: "FIELD_OFFICER_ALWAYS_EMPTY",
      message:
        "fieldOfficerName is empty on every returned row. Verify whether investigation details have not yet been entered or backend mapping is incomplete.",
      field: "fieldOfficerName",
      actual: emptyFieldOfficer,
    });
  }

  if (data.rows.length > 0 && emptyRemarks === data.rows.length) {
    warnings.push({
      code: "REMARKS_ALWAYS_EMPTY",
      message:
        "remarks is empty on every returned row. Confirm whether this is expected for current dataset.",
      field: "remarks",
      actual: emptyRemarks,
    });
  }

  return {
    warnings,
    counts: {
      rows: data.rows.length,
      unknownEvents,
      realisationOutliers,
      emptyFieldOfficer,
      emptyRemarks,
    },
  };
}

export async function logAberrationEntryDataQualityFindings(
  data: AberrationEntryData,
): Promise<DataQualityReport> {
  const report = collectAberrationEntryDataQualityFindings(data);

  await attachDataQualityReport(
    report,
    "Aberration Entry data quality soft checks",
  );

  return report;
}