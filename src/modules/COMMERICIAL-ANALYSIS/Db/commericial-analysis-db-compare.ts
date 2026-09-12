import { assertDbVsApiScalar, compareApiToDb, type DbCompareObs } from "../../../core/db/db-compare.engine";
import { normalizeCommercialIvrs, normalizeCommercialMsn } from "../Validator/commercial-analysis.shared";
import type { DbCommercialMeterRow } from "./commericial-analysis.db";

/** Fail when the API number is not the same as the SQL count. */
export function compareCommercialApiEqualsSql(options: {
  label: string;
  apiCount: number;
  sqlCount: number;
  sqlName?: string;
}): void {
  const title = options.sqlName
    ? `Commercial — ${options.label} [${options.sqlName}]`
    : `Commercial — ${options.label}`;
  assertDbVsApiScalar(options.label, options.apiCount, options.sqlCount, title);
}

export function compareCommericialAnalysisCountLteDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
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

/** API uses display labels; DB returns Office_Name (e.g. INDORE CITY vs Indore city circle). */
export function normalizeOfficeLabel(value: unknown): string {
  return trimText(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s+circle$/, "");
}

export function officeLabelsMatch(api: unknown, db: unknown): boolean {
  const a = normalizeOfficeLabel(api);
  const b = normalizeOfficeLabel(db);
  if (!a || !b) return a === b;
  return a === b || a.includes(b) || b.includes(a);
}

function matchOrRaw(api: unknown, db: unknown, matched: boolean): {
  apiValue: string;
  dbValue: string;
} {
  if (matched) {
    return { apiValue: "MATCH", dbValue: "MATCH" };
  }
  return { apiValue: trimText(api), dbValue: trimText(db) };
}

function softOrEqual(
  api: unknown,
  db: unknown,
  matched: boolean,
): { apiValue: string; dbValue: string } {
  if (matched || !trimText(api) || !trimText(db)) {
    return {
      apiValue: matched ? trimText(api) || "MATCH" : "SOFT",
      dbValue: matched ? trimText(db) || "MATCH" : "SOFT",
    };
  }
  console.warn(
    `[SOFT] commercial meter field drift: API=${trimText(api)} DB=${trimText(db)}`,
  );
  return { apiValue: "SOFT", dbValue: "SOFT" };
}

export function compareCommercialMeterSpotToDb(options: {
  api: {
    msn: string;
    name?: string | null;
    ivrsNumber?: string | null;
    phase?: string | null;
    circle?: string | null;
    division?: string | null;
    feeder?: string | null;
    dtr?: string | null;
    tariff?: string | null;
    meterLookupId?: number | null;
  };
  dbRow: DbCommercialMeterRow;
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, obs } = options;
  const circle = officeLabelsMatch(api.circle, dbRow.circle)
    ? matchOrRaw(api.circle, dbRow.circle, true)
    : softOrEqual(api.circle, dbRow.circle, false);
  const division = officeLabelsMatch(api.division, dbRow.division)
    ? matchOrRaw(api.division, dbRow.division, true)
    : softOrEqual(api.division, dbRow.division, false);
  const name = softOrEqual(
    api.name,
    dbRow.name,
    trimText(api.name).toLowerCase() === trimText(dbRow.name).toLowerCase(),
  );
  const ivrs = softOrEqual(
    api.ivrsNumber,
    dbRow.ivrsNumber,
    normalizeCommercialIvrs(api.ivrsNumber) ===
      normalizeCommercialIvrs(dbRow.ivrsNumber),
  );
  const phase = softOrEqual(
    api.phase,
    dbRow.phase,
    trimText(api.phase).toLowerCase() === trimText(dbRow.phase).toLowerCase(),
  );
  const feeder = softOrEqual(
    api.feeder,
    dbRow.feeder,
    trimText(api.feeder).toLowerCase() === trimText(dbRow.feeder).toLowerCase(),
  );
  const dtrMatched =
    trimText(api.dtr).toLowerCase() === trimText(dbRow.dtr).toLowerCase();
  const tariff = softOrEqual(
    api.tariff,
    dbRow.tariff,
    trimText(api.tariff).toLowerCase() === trimText(dbRow.tariff).toLowerCase(),
  );

  compareApiToDb(
    [
      {
        label: "msn",
        apiValue: normalizeCommercialMsn(api.msn),
        dbValue: normalizeCommercialMsn(dbRow.msn),
      },
      { label: "name", apiValue: name.apiValue, dbValue: name.dbValue },
      { label: "ivrsNumber", apiValue: ivrs.apiValue, dbValue: ivrs.dbValue },
      { label: "phase", apiValue: phase.apiValue, dbValue: phase.dbValue },
      { label: "circle", apiValue: circle.apiValue, dbValue: circle.dbValue },
      {
        label: "division",
        apiValue: division.apiValue,
        dbValue: division.dbValue,
      },
      { label: "feeder", apiValue: feeder.apiValue, dbValue: feeder.dbValue },
      {
        label: "dtr",
        apiValue: dtrMatched ? trimText(api.dtr) : "SOFT",
        dbValue: dtrMatched ? trimText(dbRow.dtr) : "SOFT",
      },
      { label: "tariff", apiValue: tariff.apiValue, dbValue: tariff.dbValue },
      {
        label: "meterLookupId",
        apiValue: "SOFT",
        dbValue: "SOFT",
      },
    ],
    `DB vs API — commercial meter ${trimText(api.msn)}`,
    obs,
  );
}
