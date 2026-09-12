import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  HES_COMMAND_LOGS_COUNT_SQL,
  HES_COMMAND_LOG_SPOT_SQL,
} from "./hes-commands-sql";

export function isHesCommandsDbSqlReady(): boolean {
  return process.env.HES_COMMANDS_DB_SQL_READY?.trim().toLowerCase() === "true";
}

export type DbHesCommandLogSpot = {
  id: number;
  request_id: string;
  command_name: string;
  selected: string;
  selection_type: string;
  status: string;
  error_message: string | null;
};

export async function countHesCommandLogs(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, HES_COMMAND_LOGS_COUNT_SQL)) ?? 0;
}

export async function getHesCommandLogSpot(
  pool: pg.Pool,
  requestId: string,
  selectedMeter: string,
): Promise<DbHesCommandLogSpot | null> {
  const rows = await queryReadOnly<DbHesCommandLogSpot>(
    pool,
    HES_COMMAND_LOG_SPOT_SQL,
    [requestId, selectedMeter],
  );
  return rows[0] ?? null;
}
