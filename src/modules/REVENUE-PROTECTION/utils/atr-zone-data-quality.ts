import {
  attachDataQualityReport,
  type DataQualityReport,
  type DataQualityWarning,
} from "../../../core/utils/data-quality-logger";
import { CANONICAL_ATRZONE_EVENTS } from "../Data/atr-zone.data";
import type { AtrZoneData } from "../Mapper/atr-zone.mapper";

function resolveRealisationMultiplier(): number {
  const raw = Number(process.env.RP_REALISATION_MULTIPLIER ?? "1");
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

function normalizeEventLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

const canonicalEventSet = new Set(
  CANONICAL_ATRZONE_EVENTS.map((e) => normalizeEventLabel(e)),
);

export function collectAtrZoneDataQualityFindings(data: AtrZoneData): DataQualityReport {
  const warnings: DataQualityWarning[] = [];
  const multiplier = resolveRealisationMultiplier();
  let unknownEvents = 0;
  let realisationOutliers = 0;
  let emptyEventCategory = 0;

  for (const row of data.rows) {
    const eventNorm = normalizeEventLabel(row.eventName);
    if (row.eventName.trim() && !canonicalEventSet.has(eventNorm)) {
      unknownEvents += 1;
      warnings.push({
        code: "UNKNOWN_EVENT",
        message: `eventName not in canonical list (possible typo/casing): "${row.eventName}"`,
        rowId: row.id,
        field: "eventName",
        actual: row.eventName,
        expected: [...CANONICAL_ATRZONE_EVENTS],
      });
    }

    const threshold = row.amountBilled * multiplier;
    if (row.amountRealised > threshold) {
      realisationOutliers += 1;
      warnings.push({
        code: "REALISATION_OUTLIER",
        message: `amountRealised (${row.amountRealised}) exceeds amountBilled × ${multiplier} (${threshold})`,
        rowId: row.id,
        field: "amountRealised",
        actual: row.amountRealised,
        expected: `<= ${threshold}`,
      });
    }

    if (!row.eventCategory.trim()) {
      emptyEventCategory += 1;
    }
  }

  // eventCategory is empty in 100% of the sample despite a real SQL
  // expression (atrZoneEventCategoryExpr) existing to populate it —
  // surface this as a standing warning, not per-row noise.
  if (data.rows.length > 0 && emptyEventCategory === data.rows.length) {
    warnings.push({
      code: "EVENT_CATEGORY_ALWAYS_EMPTY",
      message:
        "eventCategory is empty on every row this run despite a dedicated SQL expression populating it — confirm with backend whether this is expected or a broken join.",
      field: "eventCategory",
      actual: emptyEventCategory,
    });
  }

  return {
    warnings,
    counts: {
      rows: data.rows.length,
      unknownEvents,
      realisationOutliers,
      emptyEventCategory,
    },
  };
}

export async function logAtrZoneDataQualityFindings(
  data: AtrZoneData,
): Promise<DataQualityReport> {
  const report = collectAtrZoneDataQualityFindings(data);
  await attachDataQualityReport(report, "ATR Zone data quality soft checks");
  return report;
}