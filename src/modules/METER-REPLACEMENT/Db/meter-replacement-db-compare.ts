import { compareApiToDb, type DbCompareObs } from "../../../core/db/db-compare.engine";
import type {
  DbMrConsumerRow,
  DbMrDashboardOverall,
  DbMrMeterRow,
  DbMrMyWorkRow,
  DbMrSubmissionRow,
} from "./meter-replacement.db";
import { MeterReplacementDbValidator } from "./meter-replacement-db.validator";

export function compareMrConsumerDetailToDb(options: {
  api: {
    consumerId?: number | null;
    consumer?: string | null;
    accountId?: string | null;
    rrNumber?: string | null;
    ivrs?: string | null;
    oldMeterSerial?: string | null;
    oldMeterLookupId?: number | null;
    servicePointId?: string | null;
  };
  dbRow: DbMrConsumerRow | null;
  lookupKey: number | string;
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, lookupKey, obs } = options;
  if (!dbRow) {
    throw new Error(
      [
        "DB consumer row missing for meter-replacement consumer detail",
        `  lookup=${lookupKey}`,
        `  API consumerId=${api.consumerId ?? ""}`,
        "  Hint: confirm Consumer_TblRefID vs meterReplacementMasterConsumerFromSql.",
      ].join("\n"),
    );
  }

  const apiRr = String(api.rrNumber ?? api.ivrs ?? "").trim();
  compareApiToDb(
    [
      {
        label: "consumerId",
        apiValue: Number(api.consumerId ?? 0),
        dbValue: dbRow.consumerId,
      },
      {
        label: "consumerName",
        apiValue: String(api.consumer ?? "").trim() || null,
        dbValue: dbRow.consumerName.trim() || null,
        optional: true,
      },
      {
        label: "accountId",
        apiValue: String(api.accountId ?? "").trim() || null,
        dbValue: dbRow.accountId.trim() || null,
        optional: true,
      },
      {
        label: "rrNumber",
        apiValue: apiRr || null,
        dbValue: dbRow.rrNumber.trim() || null,
        optional: true,
      },
      {
        label: "servicePointId",
        apiValue: String(api.servicePointId ?? "").trim() || null,
        dbValue: dbRow.servicePointId.trim() || null,
        optional: true,
      },
    ],
    `DB vs API — MR consumer detail (${lookupKey})`,
    obs,
  );

  const apiSerial = String(api.oldMeterSerial ?? "").trim();
  if (apiSerial && dbRow.oldMeterSerial.trim()) {
    compareApiToDb(
      [
        {
          label: "oldMeterSerial",
          apiValue: apiSerial,
          dbValue: dbRow.oldMeterSerial.trim(),
        },
      ],
      `DB vs API — MR consumer old meter (${lookupKey})`,
      obs,
    );
  }

  if (
    api.oldMeterLookupId != null &&
    Number(api.oldMeterLookupId) > 0 &&
    dbRow.oldMeterLookupId != null
  ) {
    compareApiToDb(
      [
        {
          label: "oldMeterLookupId",
          apiValue: Number(api.oldMeterLookupId),
          dbValue: dbRow.oldMeterLookupId,
        },
      ],
      `DB vs API — MR old meter lookup (${lookupKey})`,
      obs,
    );
  }
}

export function compareMrMeterValidationToDb(options: {
  api: {
    meterSerial?: string | null;
    meterLookupId?: number | null;
    valid?: boolean | null;
  };
  dbRow: DbMrMeterRow | null;
  obs?: DbCompareObs;
}): void {
  const serial = String(options.api.meterSerial ?? "").trim();
  if (!serial) {
    return;
  }
  if (!options.dbRow) {
    throw new Error(
      [
        "DB meter row missing for meter-replacement validate",
        `  serial=${serial}`,
        "  Hint: confirm findMeterForValidation / L_Meter_Lookup.",
      ].join("\n"),
    );
  }

  compareApiToDb(
    [
      {
        label: "meterSerial",
        apiValue: serial,
        dbValue: options.dbRow.meterSerialNumber.trim(),
      },
      {
        label: "meterLookupId",
        apiValue: Number(options.api.meterLookupId ?? 0) || null,
        dbValue: options.dbRow.meterLookupTblRefId,
        optional: true,
      },
    ],
    `DB vs API — MR meter validate (${serial})`,
    options.obs,
  );
}

export function compareMrDashboardOverallToDb(options: {
  api: {
    totalMetersRequested: number;
    totalMetersReplaced: number;
    totalPendingMeters: number;
    totalUnmappedMeters: number;
  };
  dbRow: DbMrDashboardOverall;
  obs?: DbCompareObs;
}): void {
  compareApiToDb(
    [
      {
        label: "totalMetersRequested",
        apiValue: options.api.totalMetersRequested,
        dbValue: options.dbRow.totalMetersRequested,
      },
      {
        label: "totalMetersReplaced",
        apiValue: options.api.totalMetersReplaced,
        dbValue: options.dbRow.totalMetersReplaced,
      },
      {
        label: "totalPendingMeters",
        apiValue: options.api.totalPendingMeters,
        dbValue: options.dbRow.totalPendingMeters,
      },
      {
        label: "totalUnmappedMeters",
        apiValue: options.api.totalUnmappedMeters,
        dbValue: options.dbRow.totalUnmappedMeters,
      },
    ],
    "DB vs API — MR dashboard overall (general.meter_replacement)",
    options.obs,
  );
}

export function compareMrSubmissionDetailToDb(options: {
  api: {
    id?: number | null;
    status?: string | null;
    consumerId?: number | null;
    oldMeterSerial?: string | null;
    newMeterSerial?: string | null;
  };
  dbRow: DbMrSubmissionRow | null;
  lookupKey: number | string;
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, lookupKey, obs } = options;
  if (!dbRow) {
    throw new Error(
      [
        "DB submission row missing",
        `  lookup=${lookupKey}`,
        "  Hint: confirm general.meter_replacement.id.",
      ].join("\n"),
    );
  }

  compareApiToDb(
    [
      {
        label: "id",
        apiValue: Number(api.id ?? 0),
        dbValue: dbRow.id,
      },
      {
        label: "status",
        apiValue: String(api.status ?? "").trim().toUpperCase() || null,
        dbValue: dbRow.status.trim().toUpperCase() || null,
      },
      {
        label: "consumerId",
        apiValue: Number(api.consumerId ?? 0),
        dbValue: dbRow.consumerId,
      },
      {
        label: "oldMeterSerial",
        apiValue: String(api.oldMeterSerial ?? "").trim() || null,
        dbValue: dbRow.oldMeterSerial.trim() || null,
      },
      {
        label: "newMeterSerial",
        apiValue: String(api.newMeterSerial ?? "").trim() || null,
        dbValue: dbRow.newMeterSerial.trim() || null,
        optional: true,
      },
    ],
    `DB vs API — MR submission detail (${lookupKey})`,
    obs,
  );
}

export function compareMrMyWorkToDb(options: {
  api: {
    completedToday: number;
    completedThisMonth: number;
    totalCompleted: number;
  };
  dbRow: DbMrMyWorkRow;
  obs?: DbCompareObs;
}): void {
  compareApiToDb(
    [
      {
        label: "completedToday",
        apiValue: options.api.completedToday,
        dbValue: options.dbRow.completedToday,
      },
      {
        label: "completedThisMonth",
        apiValue: options.api.completedThisMonth,
        dbValue: options.dbRow.completedThisMonth,
      },
      {
        label: "totalCompleted",
        apiValue: options.api.totalCompleted,
        dbValue: options.dbRow.totalCompleted,
      },
    ],
    "DB vs API — MR dashboard myWork",
    options.obs,
  );
}

export function compareMrCountLteDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
  MeterReplacementDbValidator.assertApiLteDb(
    options.label,
    options.apiCount,
    options.dbCount,
  );
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

export function compareMrConsumerMissingRow(): never {
  throw new Error(
    "DB meter-replacement consumer row missing\n  Hint: confirm M_Consumer.Consumer_TblRefID.",
  );
}
