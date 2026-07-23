import { compareApiToDb, type DbCompareObs } from "../../../core/db/db-compare.engine";
import type { DbFeederMeterRow, DbFeederRow } from "./feeder.db";

export function compareFeederProfileToDb(options: {
  api: {
    feederCode?: string | null;
    feederName?: string | null;
    status?: string | null;
  };
  dbRow: DbFeederRow | null;
  lookupKey: string;
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, lookupKey, obs } = options;
  if (!dbRow) {
    throw new Error(
      [
        "DB feeder row missing",
        `  lookup=${lookupKey}`,
        `  API feederCode=${api.feederCode ?? ""}`,
        "  Hint: confirm Network_Code vs L_Network_Lookup (hierarchy=Feeder).",
      ].join("\n"),
    );
  }

  const apiStatus = String(api.status ?? "").trim().toLowerCase();
  const dbStatus = dbRow.isActive ? "active" : "inactive";

  compareApiToDb(
    [
      {
        label: "feederCode",
        apiValue: String(api.feederCode ?? "").trim(),
        dbValue: dbRow.feederCode.trim(),
      },
      {
        label: "feederName",
        apiValue: String(api.feederName ?? "").trim() || null,
        dbValue: dbRow.feederName.trim() || null,
        optional: true,
      },
      {
        label: "status",
        apiValue: apiStatus || null,
        dbValue: dbStatus,
        optional: true,
      },
    ],
    `DB vs API — feeder profile (${lookupKey})`,
    obs,
  );
}

export function compareFeederMeterExists(options: {
  apiSerial: string | null | undefined;
  dbRow: DbFeederMeterRow | null;
  obs?: DbCompareObs;
}): void {
  const serial = String(options.apiSerial ?? "").trim();
  if (!serial) {
    return;
  }
  if (!options.dbRow) {
    throw new Error(
      [
        "DB meter row missing for feeder electrical meterSerialNumber",
        `  serial=${serial}`,
        "  Hint: confirm L_Meter_Lookup.Meter_Serial_Number.",
      ].join("\n"),
    );
  }
  compareApiToDb(
    [
      {
        label: "meterSerialNumber",
        apiValue: serial,
        dbValue: options.dbRow.meterSerialNumber.trim(),
      },
    ],
    `DB vs API — feeder meter (${serial})`,
    options.obs,
  );
}
