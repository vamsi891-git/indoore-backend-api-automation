import { compareApiToDb, type DbCompareObs } from "../../../core/db/db-compare.engine";

export function compareDtrsCountLteDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
  if (options.apiCount > options.dbCount) {
    throw new Error(
      `${options.label}: API ${options.apiCount} exceeds DB ${options.dbCount}`,
    );
  }
  if (options.apiCount === options.dbCount) {
    compareApiToDb(
      [
        {
          label: options.label,
          apiValue: options.apiCount,
          dbValue: options.dbCount,
        },
      ],
      `DB vs API — ${options.label}`,
      options.obs,
    );
  }
}
