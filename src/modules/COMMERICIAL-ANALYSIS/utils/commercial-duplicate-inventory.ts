import fs from "fs";
import path from "path";
import {
  normalizeCommercialDtr,
  normalizeCommercialMsn,
} from "../Validator/commercial-analysis.shared";

const ARTIFACT_PATH = path.join(
  process.cwd(),
  "artifacts",
  "commercial-analysis-duplicates-live.json",
);

type InventoryRow = {
  msn?: string;
  dtr?: string;
  meterLookupId?: number;
  name?: string;
};

export type CommercialDuplicateGroup = {
  msn: string;
  times: number;
  dtrs: string[];
  sameValue: boolean;
  values: string[];
};

export function collectCommercialDuplicateGroups<T extends InventoryRow>(
  rows: T[],
  metric: (row: T) => string,
): CommercialDuplicateGroup[] {
  const byMsn = new Map<string, T[]>();
  for (const row of rows) {
    const msn = normalizeCommercialMsn(row.msn);
    if (!msn) continue;
    const list = byMsn.get(msn) ?? [];
    list.push(row);
    byMsn.set(msn, list);
  }

  const groups: CommercialDuplicateGroup[] = [];
  for (const [msn, list] of byMsn) {
    if (list.length < 2) continue;
    const values = [...new Set(list.map((row) => metric(row)))];
    const dtrs = [
      ...new Set(list.map((row) => normalizeCommercialDtr(row.dtr) || "(blank)")),
    ];
    groups.push({
      msn,
      times: list.length,
      dtrs,
      sameValue: values.length === 1,
      values,
    });
  }
  return groups.sort((a, b) => b.times - a.times || a.msn.localeCompare(b.msn));
}

export function writeCommercialDuplicateSnapshot(
  reportName: string,
  rows: InventoryRow[],
  metric: (row: InventoryRow) => string,
): void {
  const groups = collectCommercialDuplicateGroups(rows, metric);
  const sameDtrSameValue = groups.filter(
    (group) => group.sameValue && group.dtrs.length === 1,
  );
  const sameMsnDifferentDtr = groups.filter((group) => group.dtrs.length > 1);
  const payload = {
    updatedAt: new Date().toISOString(),
    window: { month: 10, year: 2025 },
    reportName,
    totalRows: rows.length,
    uniqueMsn: new Set(
      rows.map((row) => normalizeCommercialMsn(row.msn)).filter(Boolean),
    ).size,
    repeatedMsnCount: groups.length,
    extraRows: groups.reduce((sum, group) => sum + (group.times - 1), 0),
    sameMeterSameDtrSameValue: sameDtrSameValue,
    sameMeterOnMoreThanOneDtr: sameMsnDifferentDtr.map((group) => ({
      msn: group.msn,
      times: group.times,
      dtrs: group.dtrs,
      values: group.values,
    })),
  };

  let existing: Record<string, unknown> = {};
  if (fs.existsSync(ARTIFACT_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8")) as Record<
        string,
        unknown
      >;
    } catch {
      existing = {};
    }
  }
  const reports = {
    ...((existing.reports as Record<string, unknown>) ?? {}),
    [reportName]: payload,
  };
  fs.mkdirSync(path.dirname(ARTIFACT_PATH), { recursive: true });
  fs.writeFileSync(
    ARTIFACT_PATH,
    JSON.stringify({ updatedAt: payload.updatedAt, reports }, null, 2),
  );
}
