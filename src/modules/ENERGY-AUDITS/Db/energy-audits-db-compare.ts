import { compareApiToDb, type DbCompareObs } from "../../../extras/db/db-compare.engine";
import type { DbEnergyAuditDtrRow } from "./energy-audits.db";

export function compareEnergyAuditsCountLteDb(options: {
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

export function compareEnergyAuditDtrSpotToDb(options: {
  api: {
    dtrName: string;
    consumerCount: number;
  };
  dbRow: DbEnergyAuditDtrRow;
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, obs } = options;
  compareApiToDb(
    [
      {
        label: "dtrName",
        apiValue: trimText(api.dtrName),
        dbValue: trimText(dbRow.dtr_name),
      },
      {
        label: "consumerCount",
        apiValue: Number(api.consumerCount),
        dbValue: Number(dbRow.consumer_count),
      },
    ],
    `DB vs API â€” energy-audit DTR ${trimText(api.dtrName)}`,
    obs,
  );
}
