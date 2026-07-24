import { compareApiToDb, type DbCompareObs } from "../../../core/db/db-compare.engine";
import type {
  DbConsumerRow,
  DbDtrRow,
  DbFeederRow,
  DbMeterRow,
  DbSubstationRow,
} from "./master-data.db";

export function compareMasterDataCountLteDb(options: {
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

export function compareMeterMasterSpotToDb(options: {
  api: {
    meterLookupTblRefId: number;
    mf: number;
    meterSerialNumber: string | null | undefined;
  };
  dbRow: DbMeterRow;
  obs?: DbCompareObs;
}): void {
  compareApiToDb(
    [
      {
        label: "meterLookupTblRefId",
        apiValue: options.api.meterLookupTblRefId,
        dbValue: options.dbRow.meterLookupTblRefId,
      },
      {
        label: "mf",
        apiValue: options.api.mf,
        dbValue: options.dbRow.mf,
      },
      {
        label: "meterSerialNumber",
        apiValue: options.api.meterSerialNumber?.trim() ?? null,
        dbValue: options.dbRow.meterSerialNumber?.trim() ?? null,
      },
    ],
    "DB vs API — Meter Master spot check",
    options.obs,
  );
}

export function compareDtrMasterSpotToDb(options: {
  api: {
    meterLookupTblRefId: number;
    dtr: string | null | undefined;
    feeder: string | null | undefined;
    meterSerialNumber: string | null | undefined;
    mf: string | null | undefined;
  };
  dbRow: DbDtrRow;
  obs?: DbCompareObs;
}): void {
  compareApiToDb(
    [
      {
        label: "meterLookupTblRefId",
        apiValue: options.api.meterLookupTblRefId,
        dbValue: options.dbRow.meterLookupTblRefId,
      },
      {
        label: "dtr",
        apiValue: options.api.dtr?.trim() ?? null,
        dbValue: options.dbRow.dtr?.trim() ?? null,
      },
      {
        label: "feeder",
        apiValue: options.api.feeder?.trim() ?? null,
        dbValue: options.dbRow.feeder?.trim() ?? null,
        optional: true,
      },
      {
        label: "meterSerialNumber",
        apiValue: options.api.meterSerialNumber?.trim() ?? null,
        dbValue: options.dbRow.meterSerialNumber?.trim() ?? null,
      },
      {
        label: "mf",
        apiValue: String(options.api.mf ?? "").trim(),
        dbValue: String(options.dbRow.mf ?? "").trim(),
        optional: true,
      },
    ],
    "DB vs API — DTR Master spot check",
    options.obs,
  );
}

export function compareConsumerMasterSpotToDb(options: {
  api: {
    meterLookupTblRefId: number;
    meterSerialNumber: string | null | undefined;
    ivrsNo: string | null | undefined;
  };
  dbRow: DbConsumerRow;
  obs?: DbCompareObs;
}): void {
  compareApiToDb(
    [
      {
        label: "meterLookupTblRefId",
        apiValue: options.api.meterLookupTblRefId,
        dbValue: options.dbRow.meterLookupTblRefId,
      },
      {
        label: "meterSerialNumber",
        apiValue: options.api.meterSerialNumber?.trim() ?? null,
        dbValue: options.dbRow.meterSerialNumber?.trim() ?? null,
      },
      {
        label: "ivrsNo",
        apiValue: options.api.ivrsNo?.trim() ?? null,
        dbValue: options.dbRow.ivrsNo?.trim() ?? null,
        optional: true,
      },
    ],
    "DB vs API — Consumer Master spot check",
    options.obs,
  );
}

export function compareFeederMasterSpotToDb(options: {
  api: {
    feederName: string;
    dtrCount: number;
    consumerCount: number;
  };
  dbRow: DbFeederRow;
  obs?: DbCompareObs;
}): void {
  compareApiToDb(
    [
      {
        label: "feederName",
        apiValue: options.api.feederName.trim(),
        dbValue: options.dbRow.feederName.trim(),
      },
      {
        label: "dtrCount",
        apiValue: options.api.dtrCount,
        dbValue: options.dbRow.dtrCount,
      },
      {
        label: "consumerCount",
        apiValue: options.api.consumerCount,
        dbValue: options.dbRow.consumerCount,
      },
    ],
    "DB vs API — Feeder Master spot check",
    options.obs,
  );
}

export function compareSubstationMasterSpotToDb(options: {
  api: {
    substationCode: string;
    dtrCount: number;
    consumerCount: number;
  };
  dbRow: DbSubstationRow;
  obs?: DbCompareObs;
}): void {
  compareApiToDb(
    [
      {
        label: "substationCode",
        apiValue: options.api.substationCode.trim(),
        dbValue: (options.dbRow.substationCode ?? "").trim(),
      },
      {
        label: "dtrCount",
        apiValue: options.api.dtrCount,
        dbValue: options.dbRow.dtrCount,
      },
      {
        label: "consumerCount",
        apiValue: options.api.consumerCount,
        dbValue: options.dbRow.consumerCount,
      },
    ],
    "DB vs API — Substation Master spot check",
    options.obs,
  );
}
