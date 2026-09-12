import { compareApiToDb } from "../../../core/db/db-compare.engine";
import { getBillingMeterHeaderBySerial } from "../Db/billing.db";
import { coerceBillingNumeric } from "../utils/billing-item.helper";
import type pg from "pg";

export type BillingRowWithMeter = {
  meterNumber?: string;
  ivrsNumber?: string | null;
  consumerName?: string | null;
  mf?: number | null;
  phase?: string | null;
  /** Live API may return decimal strings; compare after coerce. */
  sanctionedLoadKw?: string | number | null;
};

export function firstBillingRowWithMeter<T extends BillingRowWithMeter>(
  rows: T[],
): T | undefined {
  return rows.find((row) => row.meterNumber?.trim());
}

export async function assertBillingMeterHeaderMatchesDb(
  pool: pg.Pool,
  apiRow: BillingRowWithMeter,
): Promise<void> {
  const serial = apiRow.meterNumber?.trim();
  if (!serial) {
    return;
  }

  const dbRow = await getBillingMeterHeaderBySerial(pool, serial);
  if (!dbRow) {
    throw new Error(`DB header not found for meter serial ${serial}`);
  }

  compareApiToDb(
    [
      {
        label: "meterNumber",
        apiValue: serial,
        dbValue: dbRow.meterNumber?.trim(),
      },
      {
        label: "ivrsNumber",
        apiValue: apiRow.ivrsNumber?.trim() ?? null,
        dbValue: dbRow.ivrsNumber?.trim() ?? null,
      },
      {
        label: "consumerName",
        apiValue: apiRow.consumerName?.trim() ?? null,
        dbValue: dbRow.consumerName?.trim() ?? null,
      },
      {
        label: "mf",
        apiValue: apiRow.mf ?? null,
        dbValue: dbRow.mf ?? null,
      },
      {
        label: "phase",
        apiValue: apiRow.phase?.trim() ?? null,
        dbValue: dbRow.phase?.trim() ?? null,
      },
      {
        label: "sanctionedLoadKw",
        apiValue: coerceBillingNumeric(apiRow.sanctionedLoadKw),
        dbValue: coerceBillingNumeric(dbRow.sanctionedLoadKw),
        optional: true,
      },
    ],
    "DB vs API — billing meter header",
  );
}
