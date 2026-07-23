import { compareApiToDb, type DbCompareObs } from "../../../core/db/db-compare.engine";
import type { DbTechnicalConsumerRow } from "./technical-analysis.db";

/** DB often stores ", First Last" — API usually returns "First Last". */
export function normalizeConsumerName(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .replace(/^[,.\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function compareTechnicalReportRowToDb(options: {
  api: {
    ivrsNumber?: string | null;
    msn?: string | null;
    meterLookupId?: number | null;
    name?: string | null;
  };
  dbRow: DbTechnicalConsumerRow | null;
  lookupKey: string;
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, lookupKey, obs } = options;
  if (!dbRow) {
    throw new Error(
      [
        "DB consumer row missing for technical report spot-check",
        `  lookup=${lookupKey}`,
        `  API ivrs=${api.ivrsNumber ?? ""} msn=${api.msn ?? ""}`,
        "  Hint: confirm RRNumber / Meter_Serial_Number vs V_Consumerdetails.",
      ].join("\n"),
    );
  }

  compareApiToDb(
    [
      {
        label: "ivrsNumber",
        apiValue: String(api.ivrsNumber ?? "").trim() || null,
        dbValue: dbRow.rrNumber.trim() || null,
        optional: true,
      },
      {
        label: "msn",
        apiValue: String(api.msn ?? "").trim() || null,
        dbValue: dbRow.meterSerialNumber.trim() || null,
        optional: true,
      },
      {
        label: "meterLookupId",
        apiValue: api.meterLookupId ?? null,
        dbValue: dbRow.meterLookupTblRefId,
        optional: true,
      },
      {
        label: "consumerName",
        apiValue: normalizeConsumerName(api.name),
        dbValue: normalizeConsumerName(dbRow.consumerName),
        optional: true,
      },
    ],
    `DB vs API — technical report row (${lookupKey})`,
    obs,
  );
}

export function compareSummaryTotalToReportTotal(options: {
  summaryTotal: number;
  reportPaginationTotal: number;
  analysisType: string;
  obs?: DbCompareObs;
}): void {
  compareApiToDb(
    [
      {
        label: `${options.analysisType}.total`,
        apiValue: options.summaryTotal,
        dbValue: options.reportPaginationTotal,
      },
    ],
    `Summary vs report total — ${options.analysisType}`,
    options.obs,
  );
}
