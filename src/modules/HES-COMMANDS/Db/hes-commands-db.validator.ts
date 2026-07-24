import {
  attachDataQualityReport,
  type DataQualityReport,
  type DataQualityWarning,
} from "../../../core/utils/data-quality-logger";

function isBlank(value: unknown): boolean {
  return value == null || String(value).trim() === "";
}

export function collectHesCommandsDataQualityFindings(
  kind: string,
  data: Record<string, unknown> | null | undefined,
): DataQualityReport {
  const warnings: DataQualityWarning[] = [];
  let emptyName = 0;
  if (data == null) return { warnings, counts: { emptyName } };

  const lists = ["items", "modules", "roles", "users", "notifications", "logs", "rows"]
    .map((k) => data[k])
    .filter(Array.isArray) as unknown[][];

  for (const list of lists) {
    for (const row of list) {
      const r = row as Record<string, unknown>;
      const name = r.name ?? r.title ?? r.consumerName ?? r.actorFullName;
      if (name !== undefined && isBlank(name)) {
        emptyName += 1;
        warnings.push({
          code: "EMPTY_NAME",
          message: `${kind} name/title empty`,
          field: "name",
        });
      }
    }
  }

  return { warnings, counts: { emptyName } };
}

export async function logHesCommandsDataQualityFindings(
  kind: string,
  data: Record<string, unknown> | null | undefined,
): Promise<DataQualityReport> {
  const report = collectHesCommandsDataQualityFindings(kind, data);
  await attachDataQualityReport(report, `HES-COMMANDS ${kind} DQ`);
  return report;
}
