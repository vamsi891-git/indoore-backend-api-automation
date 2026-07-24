import { compareApiToDb, type DbCompareObs } from "../../../core/db/db-compare.engine";
import { OverallDashboardDbValidator } from "./overall-dashboard-db.validator";

export function compareOdCountLteDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
  OverallDashboardDbValidator.assertApiLteDb(options.label, options.apiCount, options.dbCount);
  if (options.apiCount === options.dbCount) {
    compareApiToDb(
      [{ label: options.label, apiValue: options.apiCount, dbValue: options.dbCount }],
      `DB vs API — ${options.label}`,
      options.obs,
    );
  }
}
