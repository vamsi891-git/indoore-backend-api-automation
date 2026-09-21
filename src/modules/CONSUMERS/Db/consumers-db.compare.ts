import { compareApiToDb, type DbCompareObs } from "../../../extras/db/db-compare.engine";
import type { DbConsumerActivationRow, DbConsumerProfileRow, DbMeterRow } from "./consumers.db";
/** DB often stores ", First Last" — API usually returns "First Last". */
export function normalizeConsumerName(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .replace(/^[,.\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** API uniqueId often drops a leading `N` from DB Account_ID (N3543025952 → 3543025952). */
export function normalizeAccountId(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/^N/i, "");
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
    String(api.ivrsNo ?? "").trim() || String(api.consumerNumber ?? "").trim() || null;
  compareApiToDb(
    [
      {
        label: "consumerName",
        apiValue: normalizeConsumerName(api.consumerName),
        dbValue: normalizeConsumerName(dbRow.consumerName),
      },
      {
        label: "accountId",
        apiValue: normalizeAccountId(apiAccount),
        dbValue: normalizeAccountId(dbRow.accountId),
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
        apiValue: normalizeAccountId(lookupKey),
        dbValue: normalizeAccountId(dbRow.accountId.trim() || dbRow.rrNumber),
        optional: true,
      },
    ],
    `DB vs API — activation (${lookupKey})`,
    obs,
  );
}

/**
 * Billing history LIMIT `$billingLimit` (schema 1–24, default 12) from
 * Billing_Class_D1 (SP) or D3 (TP). Count SQL uses GREATEST(D1, D3).
 *
 * Live API may either:
 * - return raw archive length `min(limit, dbCount)` (current repo source), or
 * - pad to exactly `limit` with empty calendar months (common on deployed env).
 * Empty archive → soft skip (API may still return a padded empty calendar).
 */
export function compareBillingHistoryCountToDb(options: {
  apiRowCount: number;
  dbRowCount: number;
  /** Rows with non-null consumptionKwh (period deltas). */
  apiNonNullConsumptionCount?: number;
  limit?: number;
  meterSerial: string;
  obs?: DbCompareObs;
}): void {
  const { apiRowCount, dbRowCount, meterSerial, obs, apiNonNullConsumptionCount } = options;
  const limit = options.limit ?? 12;

  if (dbRowCount <= 0) {
    console.warn(
      `[BACKEND FINDING] billing-history: archive has 0 rows for meter=${meterSerial}; API returned ${apiRowCount}`,
    );
    return;
  }

  // billingLimit=0 → all archive periods; billingLimit>0 → at most N (lookback may return fewer).
  const rawExpected = limit <= 0 ? dbRowCount : Math.min(limit, dbRowCount);
  const lengthOk =
    apiRowCount === rawExpected ||
    (limit > 0 && apiRowCount === limit) ||
    (limit > 0 && apiRowCount <= rawExpected);
  if (!lengthOk) {
    compareApiToDb(
      [
        {
          label: "billingHistoryRowCount",
          apiValue: apiRowCount,
          dbValue: rawExpected,
        },
      ],
      `DB vs API — billing-history count (${meterSerial})`,
      obs,
    );
    return;
  }

  if (limit > 0 && apiRowCount === limit && rawExpected !== limit) {
    console.warn(
      `[BACKEND FINDING] billing-history padded to limit=${limit}; archive rows=${dbRowCount} meter=${meterSerial}`,
    );
  }
  if (limit > 0 && apiRowCount < rawExpected) {
    console.warn(
      `[BACKEND FINDING] billing-history lookback returned ${apiRowCount} of ${rawExpected} archive rows (limit=${limit}) meter=${meterSerial}`,
    );
  }

  const fields: {
    label: string;
    apiValue: unknown;
    dbValue: unknown;
  }[] = [
    {
      label: "billingHistoryRowCount",
      apiValue: apiRowCount,
      dbValue: apiRowCount,
    },
    {
      label: "billingHistoryArchiveFloor",
      apiValue: dbRowCount >= 1,
      dbValue: true,
    },
  ];

  if (apiNonNullConsumptionCount != null) {
    // Period kWh needs a previous cumulative; oldest archive row is often null.
    const maxNonNull = Math.max(0, rawExpected - 1);
    if (apiNonNullConsumptionCount > dbRowCount) {
      compareApiToDb(
        [
          {
            label: "billingHistoryNonNullConsumption",
            apiValue: apiNonNullConsumptionCount,
            dbValue: dbRowCount,
          },
        ],
        `DB vs API — billing-history consumption rows (${meterSerial})`,
        obs,
      );
      return;
    }
    if (maxNonNull > 0 && apiNonNullConsumptionCount === 0) {
      console.warn(
        `[BACKEND FINDING] billing-history: archive has ${dbRowCount} rows but API has 0 non-null consumptionKwh meter=${meterSerial}`,
      );
    }
  }

  compareApiToDb(
    fields,
    `DB vs API — billing-history count (${meterSerial}; archive=${dbRowCount}, limit=${limit})`,
    obs,
  );
}

/**
 * communication-status lastSeen comes from archive metrics and/or
 * general.meter_last_seen fallback — so API lastSeen without a
 * meter_last_seen row is allowed (soft). When both present, assert presence.
 */
export function compareCommunicationLastSeenToDb(options: {
  apiHasLastSeen: boolean;
  dbLastSeen: Date | string | null | undefined;
  meterLookupId: number;
  obs?: DbCompareObs;
}): void {
  const { apiHasLastSeen, dbLastSeen, meterLookupId, obs } = options;
  const dbPresent = dbLastSeen != null && String(dbLastSeen).trim() !== "";

  if (apiHasLastSeen && !dbPresent) {
    console.warn(
      `[BACKEND FINDING] communication lastSeen from API without meter_last_seen row (archive-sourced OK) meterLookupId=${meterLookupId}`,
    );
    return;
  }
  if (!apiHasLastSeen && dbPresent) {
    console.warn(
      `[BACKEND FINDING] meter_last_seen present but API delayed.lastSeen absent meterLookupId=${meterLookupId}`,
    );
    return;
  }
  if (!apiHasLastSeen && !dbPresent) return;

  compareApiToDb(
    [
      {
        label: "lastSeenPresent",
        apiValue: true,
        dbValue: true,
      },
    ],
    `DB vs API — communication lastSeen (meterLookup=${meterLookupId})`,
    obs,
  );
}

function toFiniteNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Round metrics so float/string DB values match API JSON numbers. */
function roundMetric(value: unknown, digits: number): number | null {
  const n = toFiniteNumber(value);
  if (n == null) return null;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

/**
 * Real-time-power API vs latest IP row (SP: meter_ip_today_sp, TP: T_IPData_CateTP).
 * Compares voltage / current / powerFactor per populated phase.
 */
export function compareRealTimePowerToDb(options: {
  api: {
    "R-Phase"?: {
      voltage: number | null;
      current: number | null;
      powerFactor: number | null;
    } | null;
    "Y-Phase"?: {
      voltage: number | null;
      current: number | null;
      powerFactor: number | null;
    } | null;
    "B-Phase"?: {
      voltage: number | null;
      current: number | null;
      powerFactor: number | null;
    } | null;
  } | null;
  dbRow: import("./consumers.db").DbRealTimePowerRow | null;
  meterLookupId: number;
  phaseKind: "SP" | "TP";
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, meterLookupId, phaseKind, obs } = options;
  if (api == null) {
    return;
  }
  if (!dbRow) {
    throw new Error(
      [
        "DB instantaneous IP row missing for real-time-power",
        `  meterLookupId=${meterLookupId}`,
        `  phaseKind=${phaseKind}`,
        "  Hint: SP → general.meter_ip_today_sp; TP → archive T_IPData_CateTP.",
      ].join("\n"),
    );
  }

  const fields: Parameters<typeof compareApiToDb>[0] = [
    {
      label: "R.voltage",
      apiValue: roundMetric(api["R-Phase"]?.voltage, 2),
      dbValue: roundMetric(dbRow.rVoltage, 2),
    },
    {
      label: "R.current",
      apiValue: roundMetric(api["R-Phase"]?.current, 2),
      dbValue: roundMetric(dbRow.rCurrent, 2),
    },
    {
      label: "R.powerFactor",
      apiValue: roundMetric(api["R-Phase"]?.powerFactor, 3),
      dbValue: roundMetric(dbRow.rPowerFactor, 3),
    },
  ];

  if (phaseKind === "TP") {
    fields.push(
      {
        label: "Y.voltage",
        apiValue: roundMetric(api["Y-Phase"]?.voltage, 2),
        dbValue: roundMetric(dbRow.yVoltage, 2),
      },
      {
        label: "Y.current",
        apiValue: roundMetric(api["Y-Phase"]?.current, 2),
        dbValue: roundMetric(dbRow.yCurrent, 2),
      },
      {
        label: "Y.powerFactor",
        apiValue: roundMetric(api["Y-Phase"]?.powerFactor, 3),
        dbValue: roundMetric(dbRow.yPowerFactor, 3),
      },
      {
        label: "B.voltage",
        apiValue: roundMetric(api["B-Phase"]?.voltage, 2),
        dbValue: roundMetric(dbRow.bVoltage, 2),
      },
      {
        label: "B.current",
        apiValue: roundMetric(api["B-Phase"]?.current, 2),
        dbValue: roundMetric(dbRow.bCurrent, 2),
      },
      {
        label: "B.powerFactor",
        apiValue: roundMetric(api["B-Phase"]?.powerFactor, 3),
        dbValue: roundMetric(dbRow.bPowerFactor, 3),
      },
    );
  }

  compareApiToDb(
    fields,
    `DB vs API — real-time-power ${phaseKind} (meterLookup=${meterLookupId})`,
    obs,
  );
}

/**
 * Power-quality API vs latest archive IP row
 * (SP: T_IPData_CateSP, TP: T_IPData_CateTP — mirrors getPowerQuality).
 * Compares overallPf / frequency / neutralCurrent / mdKw / mdKva values.
 */
export function comparePowerQualityToDb(options: {
  api: {
    overallPf?: { value: number | null } | null;
    frequency?: { value: number | null } | null;
    neutralCurrent?: { value: number | null } | null;
    mdKw?: { value: number | null } | null;
    mdKva?: { value: number | null } | null;
  } | null;
  dbRow: import("./consumers.db").DbPowerQualityRow | null;
  meterLookupId: number;
  phaseKind: "SP" | "TP";
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, meterLookupId, phaseKind, obs } = options;
  if (api == null) {
    return;
  }
  if (!dbRow) {
    throw new Error(
      [
        "DB instantaneous IP row missing for power-quality",
        `  meterLookupId=${meterLookupId}`,
        `  phaseKind=${phaseKind}`,
        "  Hint: SP → archive T_IPData_CateSP; TP → archive T_IPData_CateTP.",
      ].join("\n"),
    );
  }

  compareApiToDb(
    [
      {
        label: "overallPf",
        apiValue: roundMetric(api.overallPf?.value, 3),
        dbValue: roundMetric(dbRow.overallPf, 3),
      },
      {
        label: "frequency",
        apiValue: roundMetric(api.frequency?.value, 2),
        dbValue: roundMetric(dbRow.frequency, 2),
      },
      {
        label: "neutralCurrent",
        apiValue: roundMetric(api.neutralCurrent?.value, 2),
        dbValue: roundMetric(dbRow.neutralCurrent, 2),
      },
      {
        label: "mdKw",
        apiValue: roundMetric(api.mdKw?.value, 2),
        dbValue: roundMetric(dbRow.mdKw, 2),
      },
      {
        label: "mdKva",
        apiValue: roundMetric(api.mdKva?.value, 2),
        dbValue: roundMetric(dbRow.mdKva, 2),
      },
    ],
    `DB vs API — power-quality ${phaseKind} (meterLookup=${meterLookupId})`,
    obs,
  );
}
