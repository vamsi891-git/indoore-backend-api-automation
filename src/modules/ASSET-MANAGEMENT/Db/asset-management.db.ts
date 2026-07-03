import type pg from "pg";
import { queryReadOnly, queryScalar } from "../../../core/db/postgres.client";
import {
  ACTIVE_DTR_NETWORK_COUNT_SQL,
  DTR_CONSUMER_SPOT_CHECK_SQL,
  DTR_METER_COUNT_SQL,
} from "./asset-management-sql";

export type DbDtrConsumerSpotRow = {
  consumerTblRefId: number;
  consumerName: string;
  accountId: string | null;
  meterLookupId: number;
};

/** Distinct active meters on a DTR network — matches getDtrDetail count query. */
export async function countDtrMeterConnections(
  pool: pg.Pool,
  dtrNetworkLookupId: number,
): Promise<number> {
  return (await queryScalar<number>(pool, DTR_METER_COUNT_SQL, [dtrNetworkLookupId])) ?? 0;
}

/** Active DTR network nodes — unscoped DB universe for JWT lte checks. */
export async function countActiveDtrNetworks(pool: pg.Pool): Promise<number> {
  return (await queryScalar<number>(pool, ACTIVE_DTR_NETWORK_COUNT_SQL)) ?? 0;
}

export async function getDtrConsumerSpotCheck(
  pool: pg.Pool,
  dtrNetworkLookupId: number,
  consumerTblRefId: number,
): Promise<DbDtrConsumerSpotRow | null> {
  const rows = await queryReadOnly<DbDtrConsumerSpotRow>(
    pool,
    DTR_CONSUMER_SPOT_CHECK_SQL,
    [dtrNetworkLookupId, consumerTblRefId],
  );
  return rows[0] ?? null;
}
