import {
  compareApiToDb,
  logDbVsApiSection,
  type DbCompareObs,
} from "../../../extras/db/db-compare.engine";

/**
 * Comm-stats live cards are JWT-scoped.
 * DB SQL is the unscoped meter universe — hard rule is API ≤ DB only.
 */
export function compareMisDashboardCountLteDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
  logDbVsApiSection(
    `MIS — ${options.label}`,
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
        "  Hint: JWT scope / widget filters should only reduce counts — never inflate them.",
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
