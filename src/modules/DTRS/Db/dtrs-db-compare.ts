import { compareApiToDb, type DbCompareObs } from "../../../extras/db/db-compare.engine";
import type { DbDtrBaseRow } from "./dtrs.db";

export function compareDtrsCountLteDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
  // Exact match: API pagination total must equal DB count when records are compared.
  compareApiToDb(
    [
      {
        label: options.label,
        apiValue: options.apiCount,
        dbValue: options.dbCount,
      },
    ],
    `DB vs API - ${options.label}`,
    options.obs,
  );
}

function trimText(value: unknown): string {
  return String(value ?? "").trim();
}

function nullIfEmpty(value: unknown): string | null {
  const t = trimText(value);
  return t.length > 0 ? t : null;
}

export function compareDtrProfileSpotToDb(options: {
  api: {
    dtrNo: string | null;
    dtrName: string | null;
    circle: string | null;
    division: string | null;
    zone: string | null;
    subStation: string | null;
    feeder: string | null;
    meterSerial: string | null;
    mf: string | null;
  };
  dbRow: DbDtrBaseRow;
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, obs } = options;
  compareApiToDb(
    [
      {
        label: "DTR No",
        apiValue: nullIfEmpty(api.dtrNo),
        dbValue: nullIfEmpty(dbRow.networkCode),
      },
      {
        label: "DTR Name",
        apiValue: nullIfEmpty(api.dtrName),
        dbValue: nullIfEmpty(dbRow.networkName),
      },
      {
        label: "Circle",
        apiValue: nullIfEmpty(api.circle),
        dbValue: nullIfEmpty(dbRow.circle),
      },
      {
        label: "Division",
        apiValue: nullIfEmpty(api.division),
        dbValue: nullIfEmpty(dbRow.division),
      },
      {
        label: "Zone",
        apiValue: nullIfEmpty(api.zone),
        dbValue: nullIfEmpty(dbRow.zone),
      },
      {
        label: "Sub Station",
        apiValue: nullIfEmpty(api.subStation),
        dbValue: nullIfEmpty(dbRow.subStation),
      },
      {
        label: "Feeder",
        apiValue: nullIfEmpty(api.feeder),
        dbValue: nullIfEmpty(dbRow.feeder),
      },
      {
        label: "Meter SL No",
        apiValue: nullIfEmpty(api.meterSerial),
        dbValue: nullIfEmpty(dbRow.meterSerialNumber),
      },
      {
        label: "MF",
        apiValue: nullIfEmpty(api.mf),
        dbValue: nullIfEmpty(dbRow.mf),
        optional: true,
      },
    ],
    `DB vs API â€” DTR profile ${nullIfEmpty(api.dtrNo) ?? ""}`,
    obs,
  );
}
