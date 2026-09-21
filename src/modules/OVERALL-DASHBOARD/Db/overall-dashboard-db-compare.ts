import { compareApiToDb, type DbCompareObs } from "../../../extras/db/db-compare.engine";

export function compareOdCountLteDb(options: {
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
