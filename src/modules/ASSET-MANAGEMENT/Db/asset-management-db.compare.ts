import {
  compareApiToDb,
  logDbVsApiSection,
  type DbCompareObs,
} from "../../../core/db/db-compare.engine";
import type { ConsumerNode, DtrDetailData } from "../Mapper/dtrId.mapper";
import type { DtrNode } from "../Mapper/networkhierarchy.mapper";
import type { DbDtrConsumerSpotRow } from "./asset-management.db";

/**
 * Hard DB↔API comparisons for Asset Management.
 * Failures throw via compareApiToDb with a field-level mismatch table.
 */

export function compareDtrMeterTotalToDb(options: {
  apiTotal: number;
  dbMeterTotal: number;
  page: number;
  limit: number;
  rowCount: number;
  /** JWT-scoped API total may be ≤ unscoped DB meter universe. */
  mode?: "exact" | "lte";
  obs?: DbCompareObs;
}): void {
  const mode = options.mode ?? "lte";
  logDbVsApiSection(
    "Asset Management — DTR Detail total (meters)",
    {
      total: options.apiTotal,
      page: options.page,
      limit: options.limit,
      rowCount: options.rowCount,
    },
    { total: options.dbMeterTotal },
    { totalMode: mode },
  );

  if (mode === "lte") {
    if (options.apiTotal > options.dbMeterTotal) {
      throw new Error(
        [
          "DTR detail total exceeds unscoped DB meter count",
          `  API total=${options.apiTotal}`,
          `  DB meters=${options.dbMeterTotal}`,
          "  Hint: JWT scope should only reduce the set — never inflate it.",
        ].join("\n"),
      );
    }
    return;
  }

  compareApiToDb(
    [
      {
        label: "detail.total",
        apiValue: options.apiTotal,
        dbValue: options.dbMeterTotal,
      },
    ],
    "DB vs API — DTR meter total (exact)",
    options.obs,
  );
}

export function compareVisibleDtrNetworksToDb(options: {
  visibleDtrCount: number;
  dbDtrNetworkTotal: number;
  obs?: DbCompareObs;
}): void {
  logDbVsApiSection(
    "Asset Management — visible DTR networks",
    {
      total: options.visibleDtrCount,
      page: 1,
      limit: 1,
      rowCount: options.visibleDtrCount,
    },
    { total: options.dbDtrNetworkTotal },
    { totalMode: "lte" },
  );

  if (options.visibleDtrCount > options.dbDtrNetworkTotal) {
    throw new Error(
      [
        "Visible DTR networks exceed unscoped DB universe",
        `  API visible=${options.visibleDtrCount}`,
        `  DB active DTR networks=${options.dbDtrNetworkTotal}`,
      ].join("\n"),
    );
  }
}

/** Hierarchy consumerCount and detail.total both count distinct meters. */
export function compareHierarchyConsumerCountToDetail(options: {
  hierarchyDtr: DtrNode;
  detail: Pick<DtrDetailData, "total" | "dtrCode" | "dtrName">;
  dbMeterTotal: number;
  obs?: DbCompareObs;
}): void {
  const { hierarchyDtr, detail, dbMeterTotal, obs } = options;

  compareApiToDb(
    [
      {
        label: "hierarchy.consumerCount vs detail.total",
        apiValue: hierarchyDtr.consumerCount,
        dbValue: detail.total,
      },
      {
        label: "hierarchy.dtrName vs detail.dtrName",
        apiValue: hierarchyDtr.dtrName,
        dbValue: detail.dtrName,
      },
      {
        label: "hierarchy.dtrCode vs detail.dtrCode",
        apiValue: hierarchyDtr.dtrCode?.trim() || null,
        dbValue: detail.dtrCode?.trim() || null,
        optional: true,
      },
    ],
    `Business — hierarchy vs detail (DTR ${hierarchyDtr.networkLookupId})`,
    obs,
  );

  if (hierarchyDtr.consumerCount > dbMeterTotal) {
    throw new Error(
      [
        `Hierarchy consumerCount exceeds DB meter count for DTR ${hierarchyDtr.networkLookupId}`,
        `  hierarchy.consumerCount=${hierarchyDtr.consumerCount}`,
        `  DB meters=${dbMeterTotal}`,
        "  Diagnostics: hierarchy count and getDtrDetail total both use distinct active meters.",
      ].join("\n"),
    );
  }
}

export function compareConsumerSpotCheckToDb(options: {
  dtrNetworkLookupId: number;
  apiConsumer: ConsumerNode;
  dbRow: DbDtrConsumerSpotRow | null;
  obs?: DbCompareObs;
}): void {
  const { dtrNetworkLookupId, apiConsumer, dbRow, obs } = options;

  if (!dbRow) {
    throw new Error(
      [
        "DB consumer spot-check row missing",
        `  DTR networkLookupId=${dtrNetworkLookupId}`,
        `  API consumerTblRefId=${apiConsumer.consumerTblRefId}`,
        `  API consumerName=${apiConsumer.consumerName}`,
        "  Hint: consumer may be out of scope, inactive meter, or wrong DTR network.",
      ].join("\n"),
    );
  }

  const apiMeterIds = new Set(
    apiConsumer.meters.map((meter) => meter.meterLookupId),
  );

  compareApiToDb(
    [
      {
        label: "consumerTblRefId",
        apiValue: apiConsumer.consumerTblRefId,
        dbValue: dbRow.consumerTblRefId,
      },
      {
        label: "consumerName",
        apiValue: apiConsumer.consumerName.trim(),
        dbValue: String(dbRow.consumerName ?? "").trim(),
      },
      {
        label: "accountId",
        apiValue: apiConsumer.accountId?.trim() || null,
        dbValue: dbRow.accountId?.trim() || null,
        optional: true,
      },
      {
        label: "meterLookupId present on API consumer",
        apiValue: apiMeterIds.has(dbRow.meterLookupId),
        dbValue: true,
      },
    ],
    `DB vs API — consumer spot check (id=${apiConsumer.consumerTblRefId})`,
    obs,
  );
}

/** Pagination business rule: totalPages = ceil(total / limit) when total > 0. */
export function assertDtrPaginationBusinessRule(
  detail: Pick<DtrDetailData, "page" | "limit" | "total" | "totalPages" | "consumers">,
): void {
  const expectedPages =
    detail.total === 0 ? 0 : Math.ceil(detail.total / detail.limit);

  compareApiToDb(
    [
      {
        label: "totalPages (ceil(total/limit))",
        apiValue: detail.totalPages,
        dbValue: expectedPages,
      },
      {
        label: "page consumers ≤ limit",
        apiValue: detail.consumers.length <= detail.limit,
        dbValue: true,
      },
    ],
    "Business rule — DTR detail pagination",
  );
}
