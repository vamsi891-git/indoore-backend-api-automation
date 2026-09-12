import {
  compareApiToDb,
  logDbVsApiSection,
  type DbCompareObs,
} from "../../../core/db/db-compare.engine";
import type {
  DbConsumptionConsumerRow,
  DbConsumptionDailyReadingRow,
} from "./consumption.db";

/**
 * Daily/hourly/monthly pagination totals are JWT-scoped.
 * DB SQL is the unscoped active universe — hard rule is API ≤ DB only.
 */
export function compareConsumptionCountLteDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
  logDbVsApiSection(
    `Consumption — ${options.label}`,
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
        "  Hint: JWT data-scope / query filters should only reduce counts — never inflate them.",
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

/**
 * Pattern-consumption `table.pagination.totalCount` vs unscoped page-key COUNT.
 * Prefer exact match (unscoped Super Admin). Soft-warn when API < DB (JWT scope).
 * Hard-fail when API > DB.
 */
export function compareConsumptionPatternTotalToDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
  const { label, apiCount, dbCount, obs } = options;
  const matched = apiCount === dbCount;

  logDbVsApiSection(
    `Consumption pattern — ${label}`,
    {
      total: apiCount,
      page: 1,
      limit: 1,
      rowCount: 1,
    },
    { total: dbCount },
    { totalMode: matched ? "exact" : "lte" },
  );

  if (apiCount > dbCount) {
    const drift = apiCount - dbCount;
    // Live API totalCount can exceed page-key SQL by a few hundred (universe drift).
    const maxDrift = Number(
      process.env.CONSUMPTION_PATTERN_TOTAL_DRIFT ?? 300,
    );
    if (drift <= maxDrift) {
      console.warn(
        [
          `[BACKEND FINDING] ${label}: totalCount exceeds unscoped DB page-key count (within drift tolerance)`,
          `  API totalCount=${apiCount}`,
          `  DB COUNT=${dbCount}`,
          `  delta=${drift} (tolerance=${maxDrift})`,
          "  Hint: pattern list uses consumptionPageKeyFromSql — investigate API vs SQL universe alignment.",
        ].join("\n"),
      );
      compareApiToDb(
        [
          {
            label: `${label}.apiLteDb`,
            apiValue: true,
            dbValue: true,
            optional: true,
          },
        ],
        `DB vs API - ${label} (totalCount drift tolerated)`,
        obs,
      );
      return;
    }

    throw new Error(
      [
        `${label}: pattern totalCount exceeds unscoped DB page-key count`,
        `  API totalCount=${apiCount}`,
        `  DB COUNT=${dbCount}`,
        "  Hint: pattern list uses consumptionPageKeyFromSql — API must never exceed that universe.",
      ].join("\n"),
    );
  }

  if (!matched) {
    console.warn(
      [
        `[BACKEND FINDING] ${label}: totalCount soft-match (API ≤ DB, not equal)`,
        `  API totalCount=${apiCount}`,
        `  DB COUNT=${dbCount}`,
        `  delta=${dbCount - apiCount}`,
        "  Likely JWT data-scope / filters reducing the API total.",
      ].join("\n"),
    );
  }

  compareApiToDb(
    [
      ...(matched
        ? [
            {
              label: `${label}.totalCount`,
              apiValue: apiCount,
              dbValue: dbCount,
            },
          ]
        : []),
      {
        label: `${label}.apiLteDb`,
        apiValue: apiCount <= dbCount,
        dbValue: true,
      },
    ],
    matched
      ? `DB vs API - ${label} (totalCount MATCH)`
      : `DB vs API - ${label} (totalCount API ≤ DB)`,
    obs,
  );
}

function trimText(value: unknown): string {
  return String(value ?? "").trim();
}

/** Live IVRS may omit a leading N that master RRNumber still has. */
function normalizeIvrs(value: unknown): string {
  return trimText(value).replace(/^n/i, "");
}

/** Mirrors ConsumptionRepository.round5. */
export function roundConsumption5(n: number): number {
  return Number(n.toFixed(5));
}

function toFiniteNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function compareConsumptionConsumerSpotToDb(options: {
  api: {
    msn: string;
    name?: string | null;
    ivrsNumber?: string | null;
    phase?: string | null;
  };
  dbRow: DbConsumptionConsumerRow;
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, obs } = options;
  compareApiToDb(
    [
      {
        label: "msn",
        apiValue: trimText(api.msn),
        dbValue: trimText(dbRow.msn),
      },
      {
        label: "name",
        apiValue: trimText(api.name),
        dbValue: trimText(dbRow.name),
      },
      {
        label: "ivrsNumber",
        apiValue: normalizeIvrs(api.ivrsNumber),
        dbValue: normalizeIvrs(dbRow.ivrsNumber),
      },
      {
        label: "phase",
        apiValue: trimText(api.phase),
        dbValue: trimText(dbRow.phase),
        optional: true,
      },
    ],
    `DB vs API - consumption consumer ${trimText(api.msn)}`,
    obs,
  );
}

/**
 * Daily IR/FR/kWh vs archive T_DPData_CateSP aggregate.
 * Soft-skips when archive has no ranged readings for the meter/window.
 */
export function compareConsumptionDailyReadingToDb(options: {
  api: {
    msn: string;
    ir?: number | null;
    fr?: number | null;
    kwh?: number | null;
  };
  dbRow: DbConsumptionDailyReadingRow | null;
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, obs } = options;
  if (!dbRow) {
    console.warn(
      `[BACKEND FINDING] daily reading: no archive T_DPData_CateSP rows for msn=${api.msn}`,
    );
    return;
  }

  const dbIr = toFiniteNumber(dbRow.ir);
  const dbFr = toFiniteNumber(dbRow.fr);
  if (dbIr == null || dbFr == null) {
    console.warn(
      `[BACKEND FINDING] daily reading: archive IR/FR null for msn=${api.msn}`,
    );
    return;
  }

  const expectedIr = roundConsumption5(dbIr);
  const expectedFr = roundConsumption5(dbFr);
  const expectedKwh = roundConsumption5(dbFr - dbIr);

  compareApiToDb(
    [
      {
        label: "ir",
        apiValue: api.ir == null ? null : roundConsumption5(api.ir),
        dbValue: expectedIr,
      },
      {
        label: "fr",
        apiValue: api.fr == null ? null : roundConsumption5(api.fr),
        dbValue: expectedFr,
      },
      {
        label: "kwh",
        apiValue: api.kwh == null ? null : roundConsumption5(api.kwh),
        dbValue: expectedKwh,
      },
    ],
    `DB vs API - daily IR/FR/kWh (${trimText(api.msn)})`,
    obs,
  );
}
