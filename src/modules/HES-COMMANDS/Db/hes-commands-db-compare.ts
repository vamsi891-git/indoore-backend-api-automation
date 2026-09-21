import {
  compareApiToDb,
  logDbVsApiSection,
  type DbCompareObs,
} from "../../../extras/db/db-compare.engine";
import type { CommandsHistoryRow } from "../Mapper/commands-history.mapper";
import { parseSelectedMeterTokens } from "../Validator/commands-history.validator";
import type { DbHesCommandLogSpot } from "./hes-commands.db";

/** Unscoped history total — API totalRecords must equal DB COUNT(*). */
export function compareHesHistoryTotalToDb(options: {
  apiTotal: number;
  dbTotal: number;
  page: number;
  limit: number;
  rowCount: number;
  obs?: DbCompareObs;
}): void {
  logDbVsApiSection(
    "HES Commands — history total",
    {
      total: options.apiTotal,
      page: options.page,
      limit: options.limit,
      rowCount: options.rowCount,
    },
    { total: options.dbTotal },
    { totalMode: "exact" },
  );

  compareApiToDb(
    [
      {
        label: "history.totalRecords",
        apiValue: options.apiTotal,
        dbValue: options.dbTotal,
      },
    ],
    "DB vs API — HES history total",
    options.obs,
  );
}

export function compareHesHistoryRowSpotToDb(options: {
  apiRow: CommandsHistoryRow;
  dbRow: DbHesCommandLogSpot | null;
  obs?: DbCompareObs;
}): void {
  const { apiRow, dbRow, obs } = options;
  if (!dbRow) {
    throw new Error(
      [
        "DB hes_command_logs spot row missing",
        `  requestId=${apiRow.requestId}`,
        `  selectedMeter=${apiRow.selectedMeter}`,
        "  Hint: request_id/selected mismatch or row purged.",
      ].join("\n"),
    );
  }

  const primaryMeter = parseSelectedMeterTokens(apiRow.selectedMeter)[0] ?? apiRow.selectedMeter;

  compareApiToDb(
    [
      {
        label: "requestId",
        apiValue: apiRow.requestId,
        dbValue: dbRow.request_id,
      },
      {
        label: "commandName",
        apiValue: apiRow.commandName.trim(),
        dbValue: dbRow.command_name.trim(),
      },
      {
        label: "selectedMeter (primary)",
        apiValue: primaryMeter,
        dbValue: dbRow.selected.trim(),
      },
      {
        label: "selectionType",
        apiValue: apiRow.selectionType.trim(),
        dbValue: dbRow.selection_type.trim(),
      },
      {
        label: "status",
        apiValue: apiRow.status.trim().toUpperCase(),
        dbValue: dbRow.status.trim().toUpperCase(),
      },
    ],
    `DB vs API — HES history spot (requestId=${apiRow.requestId})`,
    obs,
  );
}

/** @deprecated Prefer compareHesHistoryTotalToDb — kept for mutation fixtures. */
export function compareHesCommandsCountLteDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
  compareApiToDb(
    [
      {
        label: options.label,
        apiValue: options.apiCount,
        dbValue: options.dbCount,
      },
    ],
    `DB vs API - ${options.label}`,
    options.obs,
  );
}
