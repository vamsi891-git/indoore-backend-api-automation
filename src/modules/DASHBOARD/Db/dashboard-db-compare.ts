import { compareApiToDb, type DbCompareObs } from "../../../core/db/db-compare.engine";
import { DashboardDbValidator } from "./dashboard-db.validator";

export function compareNetworkCountLteDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
  DashboardDbValidator.assertApiLteDb(
    options.label,
    options.apiCount,
    options.dbCount,
  );
  // Soft equality table for observability when counts match exactly.
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

export function compareDashboardMetricMissingRow(): never {
  throw new Error(
    "DB dashboard metric row missing\n  Hint: confirm L_Network_Lookup / L_Meter_Lookup universe SQL.",
  );
}
