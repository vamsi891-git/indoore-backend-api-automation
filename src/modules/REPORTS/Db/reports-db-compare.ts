import {
  compareApiToDb,
  logDbVsApiSection,
  type DbCompareObs,
} from "../../../core/db/db-compare.engine";
import type { DbReportsEventRow } from "./reports.db";

/**
 * Report list totals / catalog sizes are JWT- or filter-scoped.
 * DB SQL is the unscoped universe — hard rule is API ≤ DB only.
 */
export function compareReportsCountLteDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
  logDbVsApiSection(
    `Reports — ${options.label}`,
    {
      total: options.apiCount,
      page: 1,
      limit: 1,
      rowCount: 1,
    },
    { total: options.dbCount },
    { totalMode: "lte" },
  );

  if (options.apiCount > options.dbCount) {
    throw new Error(
      [
        `${options.label}: API exceeds unscoped DB universe`,
        `  API=${options.apiCount}`,
        `  DB=${options.dbCount}`,
        "  Hint: JWT scope / query filters should only reduce counts — never inflate them.",
      ].join("\n"),
    );
  }

  compareApiToDb(
    [
      {
        label: `${options.label}.apiLteDb`,
        apiValue: options.apiCount <= options.dbCount,
        dbValue: true,
      },
    ],
    `DB vs API - ${options.label} (API ≤ DB)`,
    options.obs,
  );
}

function trimText(value: unknown): string {
  return String(value ?? "").trim();
}

export function compareReportsEventNameToDb(options: {
  api: { eventId: number; eventName?: string | null };
  dbRow: DbReportsEventRow | null;
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, obs } = options;
  if (!dbRow) {
    throw new Error(
      [
        "DB M_Event row missing",
        `  eventId=${api.eventId}`,
        "  Hint: confirm Event_TblRefID exists in public.M_Event.",
      ].join("\n"),
    );
  }

  compareApiToDb(
    [
      {
        label: "eventId",
        apiValue: api.eventId,
        dbValue: dbRow.eventId,
      },
      {
        label: "eventName",
        apiValue: trimText(api.eventName),
        dbValue: trimText(dbRow.eventName),
      },
    ],
    `DB vs API — event-report name (${api.eventId})`,
    obs,
  );
}
