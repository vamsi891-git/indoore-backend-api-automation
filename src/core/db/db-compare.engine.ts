import { expect } from "@playwright/test";
import { appendEvent } from "../../observability/logger";
import type { ObsContext } from "../../observability/context";

export type DbCompareField = {
  label: string;
  apiValue: unknown;
  dbValue: unknown;
  /** When true, only checks both null/undefined or both present */
  optional?: boolean;
};

/** Observability context for DB cross-validation, with optional table/column tags. */
export type DbCompareObs = ObsContext & {
  table?: string;
  column?: string;
  mode?: string;
};

function emitDbEvent(
  obs: DbCompareObs | undefined,
  field: DbCompareField,
  outcome: "pass" | "fail" | "warn",
): void {
  if (!obs) {
    return;
  }
  appendEvent({
    kind: "db_cross_validation",
    runId: obs.runId,
    testId: obs.testId,
    module: obs.module,
    outcome,
    table: obs.table,
    column: obs.column,
    label: field.label,
    expected: field.dbValue,
    actual: field.apiValue,
    mode: obs.mode,
  });
}

/** How the summary table labels the pagination-total row. */
export type DbTotalCompareMode = "exact" | "lte" | "tolerance";

export type LogDbVsApiSectionOptions = {
  totalMode?: DbTotalCompareMode;
  /** Used when totalMode is tolerance (defaults to max(200, 0.1% of DB total)). */
  tolerance?: number;
};

function normalizeCompareValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return null;
    }
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
      return asNumber;
    }
    return trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return value;
}

function displayValueForTable(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? "-" : trimmed;
  }
  return String(value);
}

function padCell(value: string, width: number): string {
  if (value.length <= width) {
    return value.padEnd(width);
  }
  if (width <= 1) {
    return value.slice(0, width);
  }
  return `${value.slice(0, width - 1)}…`;
}

function buildAsciiTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((header, index) =>
    Math.max(
      header.length,
      ...rows.map((row) => (row[index] ?? "").length),
      3,
    ),
  );

  const border = `+${colWidths.map((w) => "-".repeat(w + 2)).join("+")}+`;
  const headerRow = `| ${headers.map((h, i) => padCell(h, colWidths[i])).join(" | ")} |`;
  const bodyRows = rows.map(
    (row) => `| ${row.map((cell, i) => padCell(cell ?? "", colWidths[i])).join(" | ")} |`,
  );

  return [border, headerRow, border, ...bodyRows, border].join("\n");
}

function printDbVsApiTable(title: string, headers: string[], rows: string[][]): void {
  console.log(`\n${title}`);
  console.log(buildAsciiTable(headers, rows));
}

function totalCompareStatus(
  apiTotal: number,
  dbTotal: number,
  mode: DbTotalCompareMode,
  tolerance: number,
): string {
  switch (mode) {
    case "exact":
      return apiTotal === dbTotal ? "MATCH" : "MISMATCH";
    case "lte":
      return apiTotal <= dbTotal ? "OK (API ≤ DB)" : "FAIL (API > DB)";
    case "tolerance": {
      const delta = Math.abs(apiTotal - dbTotal);
      return delta <= tolerance ? `OK (Δ ${delta})` : `FAIL (Δ ${delta})`;
    }
  }
}

/**
 * Compare API field values to DB query results and print a summary table.
 * Throws when any required field mismatches — test must fail.
 */
export function compareApiToDb(
  fields: DbCompareField[],
  title = "DB vs API — field comparison",
  obs?: DbCompareObs,
): void {
  const mismatches: string[] = [];
  const tableRows: string[][] = [];

  fields.forEach((field) => {
    const { label, apiValue, dbValue, optional } = field;
    const api = normalizeCompareValue(apiValue);
    const db = normalizeCompareValue(dbValue);

    if (optional && api === null && db === null) {
      tableRows.push([
        label,
        displayValueForTable(apiValue),
        displayValueForTable(dbValue),
        "SKIP",
      ]);
      emitDbEvent(obs, field, "warn");
      return;
    }

    const match = api === db;
    tableRows.push([
      label,
      displayValueForTable(apiValue),
      displayValueForTable(dbValue),
      match ? "MATCH" : "MISMATCH",
    ]);

    emitDbEvent(obs, field, match ? "pass" : "fail");

    if (!match) {
      mismatches.push(
        `${label}: API=${JSON.stringify(apiValue)} DB=${JSON.stringify(dbValue)}`,
      );
    }
  });

  printDbVsApiTable(title, ["Field", "API", "DB", "Status"], tableRows);

  if (mismatches.length > 0) {
    console.log(`\nDB vs API FAILED — ${mismatches.length} field(s) mismatched:`);
    mismatches.forEach((m) => console.log(`  • ${m}`));
  }

  expect(
    mismatches,
    mismatches.length
      ? `API vs DB mismatch:\n${mismatches.map((m) => `  - ${m}`).join("\n")}`
      : undefined,
  ).toEqual([]);
}

/** Log and assert a single scalar comparison (e.g. row counts). */
export function assertDbVsApiScalar(
  label: string,
  apiValue: unknown,
  dbValue: unknown,
  title = "DB vs API — scalar comparison",
  obs?: DbCompareObs,
): void {
  compareApiToDb([{ label, apiValue, dbValue }], title, obs);
}

/** Context table before field/scalar assertions — not a pass/fail on its own. */
export function logDbVsApiSection(
  entityName: string,
  api: { total: number; page: number; limit: number; rowCount: number },
  db: { total: number },
  options: LogDbVsApiSectionOptions = {},
): void {
  const totalMode = options.totalMode ?? "exact";
  const tolerance =
    options.tolerance ?? Math.max(200, Math.ceil(db.total * 0.001));

  printDbVsApiTable(
    `DB vs API — ${entityName} (summary)`,
    ["Metric", "API", "DB", "Status"],
    [
      [
        "Pagination total",
        String(api.total),
        String(db.total),
        totalCompareStatus(api.total, db.total, totalMode, tolerance),
      ],
      ["Page", String(api.page), "-", "-"],
      ["Limit", String(api.limit), "-", "-"],
      ["Rows on page", String(api.rowCount), "-", "page only"],
    ],
  );
}
