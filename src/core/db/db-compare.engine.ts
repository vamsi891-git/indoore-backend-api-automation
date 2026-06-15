import { expect } from "@playwright/test";

export type DbCompareField = {
  label: string;
  apiValue: unknown;
  dbValue: unknown;
  /** When true, only checks both null/undefined or both present */
  optional?: boolean;
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

function displayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "(empty)";
  }
  if (typeof value === "string") {
    return `"${value}"`;
  }
  return String(value);
}

const LOG_PREFIX = "[DB vs API]";

/**
 * Compare API field values to DB query results and print each value in console.
 * Throws when any required field mismatches — test must fail.
 */
export function compareApiToDb(fields: DbCompareField[]): void {
  const mismatches: string[] = [];

  fields.forEach(({ label, apiValue, dbValue, optional }) => {
    const api = normalizeCompareValue(apiValue);
    const db = normalizeCompareValue(dbValue);

    if (optional && api === null && db === null) {
      console.log(
        `${LOG_PREFIX} ${label} | API: (empty) | DB: (empty) | SKIP (optional)`,
      );
      return;
    }

    const match = api === db;
    const status = match ? "MATCH" : "MISMATCH";

    console.log(
      `${LOG_PREFIX} ${label} | API: ${displayValue(apiValue)} | DB: ${displayValue(dbValue)} | ${status}`,
    );

    if (!match) {
      mismatches.push(
        `${label}: API=${JSON.stringify(apiValue)} DB=${JSON.stringify(dbValue)}`,
      );
    }
  });

  if (mismatches.length > 0) {
    console.log(`\n${LOG_PREFIX} FAILED — ${mismatches.length} field(s) mismatched:`);
    mismatches.forEach((m) => console.log(`  - ${m}`));
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
): void {
  compareApiToDb([{ label, apiValue, dbValue }]);
}

export function logDbVsApiSection(
  entityName: string,
  api: { total: number; page: number; limit: number; rowCount: number },
  db: { total: number; rowCount: number },
): void {
  const divider = "=".repeat(50);
  console.log(`\n${divider}`);
  console.log(`DB vs API VALIDATION — ${entityName}`);
  console.log(divider);
  console.log(`API total     : ${api.total}`);
  console.log(`DB total      : ${db.total}`);
  console.log(`API page      : ${api.page}`);
  console.log(`API limit     : ${api.limit}`);
  console.log(`API row count : ${api.rowCount}`);
  console.log(`DB row count  : ${db.rowCount}`);
  console.log(divider);
}
