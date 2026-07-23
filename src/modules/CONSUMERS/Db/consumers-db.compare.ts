import { compareApiToDb, type DbCompareObs } from "../../../core/db/db-compare.engine";
import type {
  DbConsumerActivationRow,
  DbConsumerProfileRow,
  DbMeterRow,
} from "./consumers.db";

/** DB often stores ", First Last" — API usually returns "First Last". */
export function normalizeConsumerName(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .replace(/^[,.\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function compareConsumerProfileSpotCheck(options: {
  api: {
    consumerName?: string | null;
    consumerNumber?: string | null;
    uniqueId?: string | null;
    meterSerialNumber?: string | null;
    ivrsNo?: string | null;
    consumerEmail?: string | null;
  };
  dbRow: DbConsumerProfileRow | null;
  lookupKey: string;
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, lookupKey, obs } = options;
  if (!dbRow) {
    throw new Error(
      [
        "DB consumer profile row missing",
        `  lookup=${lookupKey}`,
        `  API consumerName=${api.consumerName ?? ""}`,
        "  Hint: confirm Account_ID / RRNumber mapping vs V_Consumerdetails.",
      ].join("\n"),
    );
  }

  const apiAccount = String(api.uniqueId ?? "").trim() || null;
  const apiIvrs =
    String(api.ivrsNo ?? "").trim() ||
    String(api.consumerNumber ?? "").trim() ||
    null;

  compareApiToDb(
    [
      {
        label: "consumerName",
        apiValue: normalizeConsumerName(api.consumerName),
        dbValue: normalizeConsumerName(dbRow.consumerName),
      },
      {
        label: "accountId",
        apiValue: apiAccount,
        dbValue: dbRow.accountId.trim() || null,
        // Backend profile often puts Account_ID on uniqueId (consumerNumber = IVRS).
        optional: true,
      },
      {
        label: "rrNumber/ivrs",
        apiValue: apiIvrs,
        dbValue: dbRow.rrNumber.trim() || null,
      },
      {
        label: "meterSerialNumber",
        apiValue: String(api.meterSerialNumber ?? "").trim() || null,
        dbValue: dbRow.meterSerialNumber.trim() || null,
        optional: true,
      },
      {
        label: "consumerEmail",
        apiValue: String(api.consumerEmail ?? "").trim() || null,
        dbValue: dbRow.consumerEmail.trim() || null,
        optional: true,
      },
    ],
    `DB vs API — consumer profile (${lookupKey})`,
    obs,
  );
}

export function compareMeterSerialExists(options: {
  apiSerial: string | null | undefined;
  dbRow: DbMeterRow | null;
  obs?: DbCompareObs;
}): void {
  const serial = String(options.apiSerial ?? "").trim();
  if (!serial) {
    return;
  }
  if (!options.dbRow) {
    throw new Error(
      [
        "DB meter row missing for profile meterSerialNumber",
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
    `DB vs API — meter serial (${serial})`,
    options.obs,
  );
}

/**
 * Mirrors ConsumersService.validateMeter outcomes vs L_Meter_Lookup + service point.
 */
export function compareValidateMeterToDb(options: {
  api: {
    valid: boolean;
    meterExists?: boolean;
    reason?: string | null;
    meterSerialNumber?: string | null;
    meterLookupId?: number | null;
  };
  dbRow: DbMeterRow | null;
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, obs } = options;
  const serial = String(api.meterSerialNumber ?? "").trim();

  if (dbRow == null) {
    if (api.meterExists === false && api.valid === true) {
      compareApiToDb(
        [
          {
            label: "meterExists",
            apiValue: false,
            dbValue: false,
          },
        ],
        `DB vs API — validate-meter not in system (${serial || "?"})`,
        obs,
      );
      return;
    }
    throw new Error(
      [
        "DB meter missing but API did not return meterExists=false",
        `  serial=${serial}`,
        `  API valid=${api.valid} meterExists=${api.meterExists} reason=${api.reason ?? ""}`,
      ].join("\n"),
    );
  }

  if (!dbRow.isActive) {
    compareApiToDb(
      [
        {
          label: "reason",
          apiValue: String(api.reason ?? ""),
          dbValue: "METER_INACTIVE",
        },
        {
          label: "valid",
          apiValue: api.valid,
          dbValue: false,
        },
      ],
      `DB vs API — validate-meter inactive (${serial})`,
      obs,
    );
    return;
  }

  if (dbRow.isAssigned) {
    compareApiToDb(
      [
        {
          label: "reason",
          apiValue: String(api.reason ?? ""),
          dbValue: "METER_ALREADY_ASSIGNED",
        },
        {
          label: "valid",
          apiValue: api.valid,
          dbValue: false,
        },
        {
          label: "meterLookupId",
          apiValue: api.meterLookupId ?? null,
          dbValue: dbRow.meterLookupTblRefId,
          optional: true,
        },
      ],
      `DB vs API — validate-meter assigned (${serial})`,
      obs,
    );
    return;
  }

  compareApiToDb(
    [
      {
        label: "valid",
        apiValue: api.valid,
        dbValue: true,
      },
      {
        label: "meterExists",
        apiValue: api.meterExists ?? true,
        dbValue: true,
      },
      {
        label: "meterLookupId",
        apiValue: api.meterLookupId ?? null,
        dbValue: dbRow.meterLookupTblRefId,
        optional: true,
      },
    ],
    `DB vs API — validate-meter assignable (${serial})`,
    obs,
  );
}

/** Mirrors isActiveToConsumerActivation. */
export function compareActivationStatusToDb(options: {
  apiStatus: string | null | undefined;
  dbRow: DbConsumerActivationRow | null;
  lookupKey: string;
  obs?: DbCompareObs;
}): void {
  const { apiStatus, dbRow, lookupKey, obs } = options;
  if (!dbRow) {
    throw new Error(
      [
        "DB consumer activation row missing",
        `  lookup=${lookupKey}`,
        "  Hint: confirm M_Consumer.IsActiveStatus via Account_ID / RRNumber.",
      ].join("\n"),
    );
  }

  const expectedStatus = dbRow.isActive ? "active" : "inactive";
  compareApiToDb(
    [
      {
        label: "activationStatus",
        apiValue: String(apiStatus ?? "").trim(),
        dbValue: expectedStatus,
      },
      {
        label: "accountId",
        apiValue: lookupKey,
        dbValue: dbRow.accountId.trim() || dbRow.rrNumber.trim() || null,
        optional: true,
      },
    ],
    `DB vs API — activation (${lookupKey})`,
    obs,
  );
}
