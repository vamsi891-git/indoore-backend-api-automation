import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { CommandsHistoryApi } from "../Api/commands-history.api";
import { commandsHistoryData } from "../Data/commands-history.data";
import { CommandsHistoryMapper } from "../Mapper/commands-history.mapper";
import {
  countHesCommandLogs,
  getHesCommandLogSpot,
} from "../Db/hes-commands.db";
import {
  compareHesHistoryRowSpotToDb,
  compareHesHistoryTotalToDb,
} from "../Db/hes-commands-db-compare";
import { logHesCommandsDataQualityFindings } from "../Db/hes-commands-db.validator";
import { parseSelectedMeterTokens } from "../Validator/commands-history.validator";

/**
 * Part 4 — history total + spot row vs general.hes_command_logs
 * (CommandsRepository.getCommandsHistory).
 */
export async function runHesCommandsDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ValidationEngine();
  const api = new CommandsHistoryApi(authenticatedApi);
  const query = {
    page: commandsHistoryData.defaultPage,
    limit: commandsHistoryData.defaultLimit,
  };

  const { rawResponse, responseBody } = await api.getHistory(query);
  expect(rawResponse.status()).toBe(200);
  const data = CommandsHistoryMapper.mapResponse(responseBody);
  await logHesCommandsDataQualityFindings("history", {
    rows: data.rows,
    total: data.pagination.totalRecords,
  });

  const dbTotal = await countHesCommandLogs(db);
  validation.execute("History totalRecords equals DB hes_command_logs COUNT", () => {
    compareHesHistoryTotalToDb({
      apiTotal: data.pagination.totalRecords,
      dbTotal,
      page: data.pagination.currentPage,
      limit: data.pagination.limit,
      rowCount: data.rows.length,
    });
  });

  const spot = data.rows[0];
  if (spot) {
    const primaryMeter =
      parseSelectedMeterTokens(spot.selectedMeter)[0] ?? spot.selectedMeter;
    const dbRow = await getHesCommandLogSpot(db, spot.requestId, primaryMeter);
    validation.execute(
      `History spot requestId=${spot.requestId} vs hes_command_logs`,
      () => {
        compareHesHistoryRowSpotToDb({ apiRow: spot, dbRow });
      },
    );
  }

  validation.printSummary("HES-COMMANDS DB Coverage", 0);
}
