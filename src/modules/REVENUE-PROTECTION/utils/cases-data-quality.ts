import { attachDataQualityReport, type DataQualityReport, type DataQualityWarning,} from "../../../core/utils/data-quality-logger";
import { CANONICAL_CASE_EVENTS } from "../Data/cases.data";
import type { CasesData } from "../Mapper/cases.mapper";
function resolveRealisationMultiplier(): number {
  const raw = Number(process.env.RP_REALISATION_MULTIPLIER ?? "1");
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}
function resolveEmptyFieldThresholdPct(): number {
  const raw = Number(process.env.RP_EMPTY_FIELD_THRESHOLD_PCT ?? "25");
  return Number.isFinite(raw) && raw >= 0 ? raw : 25;
}
function normalizeEventLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
const canonicalEventSet = new Set(
  CANONICAL_CASE_EVENTS.map((event) => normalizeEventLabel(event)),
);
/**
 * Revenue-protection cases soft checks.
 * Realisation outliers use RP_REALISATION_MULTIPLIER (default 1.0).
 * Never throws — warnings go to Allure via core attachDataQualityReport.
 */
export function collectCasesDataQualityFindings(
  data: CasesData,
): DataQualityReport {
  const warnings: DataQualityWarning[] = [];
  const multiplier = resolveRealisationMultiplier();
  let emptyConsumerName = 0;
  let emptyAddress = 0;
  let emptyMsn = 0;
  let unknownEvents = 0;
  let realisationOutliers = 0;
  for (const row of data.rows) {
    const eventNorm = normalizeEventLabel(row.event);
    if (row.event.trim() && !canonicalEventSet.has(eventNorm)) {
      unknownEvents += 1;
      warnings.push({
        code: "UNKNOWN_EVENT",
        message: `Event value is not in the canonical list (possible typo/casing): "${row.event}"`,
        rowId: row.id,
        field: "event",
        actual: row.event,
        expected: [...CANONICAL_CASE_EVENTS],
      });
    }
    if (!row.consumerName.trim()) {
      emptyConsumerName += 1;
    }
    if (!row.address.trim()) {
      emptyAddress += 1;
    }
    if (!row.msn.trim()) {
      emptyMsn += 1;
    }
    const threshold = row.amountBilled * multiplier;
    if (row.amountRealisation > threshold) {
      realisationOutliers += 1;
      warnings.push({
        code: "REALISATION_OUTLIER",
        message: `amountRealisation (${row.amountRealisation}) exceeds amountBilled × ${multiplier} (${threshold})`,
        rowId: row.id,
        field: "amountRealisation",
        actual: row.amountRealisation,
        expected: `<= ${threshold}`,
      });
    }
  }
  const rowCount = data.rows.length || 1;
  const thresholdPct = resolveEmptyFieldThresholdPct();
  const pct = (count: number) => (count / rowCount) * 100;
  if (pct(emptyConsumerName) > thresholdPct) {
    warnings.push({
      code: "EMPTY_CONSUMER_NAME_THRESHOLD",
      message: `${pct(emptyConsumerName).toFixed(1)}% rows have empty consumerName (threshold ${thresholdPct}%)`,
      field: "consumerName",
      actual: emptyConsumerName,
    });
  }
  if (pct(emptyAddress) > thresholdPct) {
    warnings.push({
      code: "EMPTY_ADDRESS_THRESHOLD",
      message: `${pct(emptyAddress).toFixed(1)}% rows have empty address (threshold ${thresholdPct}%)`,
      field: "address",
      actual: emptyAddress,
    });
  }
  if (pct(emptyMsn) > thresholdPct) {
    warnings.push({
      code: "EMPTY_MSN_THRESHOLD",
      message: `${pct(emptyMsn).toFixed(1)}% rows have empty msn (threshold ${thresholdPct}%)`,
      field: "msn",
      actual: emptyMsn,
    });
  }
  return {
    warnings,
    counts: {
      rows: data.rows.length,
      unknownEvents,
      emptyConsumerName,
      emptyAddress,
      emptyMsn,
      realisationOutliers,
    },
  };
}
export async function logCasesDataQualityFindings(
  data: CasesData,
): Promise<DataQualityReport> {
  const report = collectCasesDataQualityFindings(data);
  await attachDataQualityReport(report, "Cases data quality soft checks");
  return report;
}
