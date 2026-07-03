import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import {
  compareApiToDb,
  logDbVsApiSection,
} from "../../../core/db/db-compare.engine";
import { DtrDetailApi } from "../Api/DtrId.api";
import { NetworkHierarchyApi } from "../Api/networkhierarchy.api";
import {
  AssetDtrLookupId,
  DtrDetailPaginationQueries,
} from "../Data/asset-management.common.data";
import { DtrDetailMapper } from "../Mapper/dtrId.mapper";
import { NetworkHierarchyMapper } from "../Mapper/networkhierarchy.mapper";
import {
  countActiveDtrNetworks,
  countDtrMeterConnections,
  getDtrConsumerSpotCheck,
} from "../Db/asset-management.db";
import { AssetManagementCoverageValidator } from "../Validator/asset-management-coverage.validator";
import {
  findDtrById,
  findDtrWithHighestConsumerCount,
} from "../utils/asset-management.helper";

export async function runAssetManagementDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ValidationEngine();
  const networkApi = new NetworkHierarchyApi(authenticatedApi);
  const dtrApi = new DtrDetailApi(authenticatedApi);

  const networkResponse = await networkApi.getNetworkHierarchy();
  const hierarchy = NetworkHierarchyMapper.mapData(networkResponse.responseBody.data).hierarchy;
  const dtrId =
    process.env.ASSET_DTR_LOOKUP_ID != null
      ? AssetDtrLookupId
      : (findDtrWithHighestConsumerCount(hierarchy)?.networkLookupId ?? AssetDtrLookupId);
  const hierarchyDtr = findDtrById(hierarchy, dtrId);

  const detailResponse = await dtrApi.getDtrDetails(
    dtrId,
    DtrDetailPaginationQueries.default.page,
    DtrDetailPaginationQueries.default.limit,
  );
  const detail = DtrDetailMapper.mapData(detailResponse.responseBody.data);
  const dbMeterTotal = await countDtrMeterConnections(db, dtrId);
  const dbDtrNetworkTotal = await countActiveDtrNetworks(db);

  logDbVsApiSection(
    "Asset Management — DTR Detail total (meters)",
    {
      total: detail.total,
      page: detail.page,
      limit: detail.limit,
      rowCount: detail.consumers.length,
    },
    { total: dbMeterTotal },
    { totalMode: "lte" },
  );

  validation.execute("DTR Detail total within DB meter count", () => {
    expectApiLteDb(detail.total, dbMeterTotal, "DTR detail total");
  });

  if (hierarchyDtr) {
    validation.execute("Hierarchy consumerCount within DB meter count", () => {
      expectApiLteDb(
        hierarchyDtr.consumerCount,
        dbMeterTotal,
        "hierarchy consumerCount",
      );
    });

    validation.execute("Hierarchy consumerCount matches detail total", () => {
      AssetManagementCoverageValidator.validateHierarchyCountMatchesDetailTotal(
        hierarchyDtr,
        detail,
      );
    });
  }

  validation.execute("Visible DTR networks within DB universe", () => {
    const visibleDtrCount = collectVisibleDtrIds(hierarchy).size;
    logDbVsApiSection(
      "Asset Management — visible DTR networks",
      { total: visibleDtrCount, page: 1, limit: 1, rowCount: visibleDtrCount },
      { total: dbDtrNetworkTotal },
      { totalMode: "lte" },
    );
    expectApiLteDb(visibleDtrCount, dbDtrNetworkTotal, "visible DTR network count");
  });

  const spotConsumer = detail.consumers[0];
  if (spotConsumer) {
    const dbRow = await getDtrConsumerSpotCheck(
      db,
      dtrId,
      spotConsumer.consumerTblRefId,
    );
    validation.execute("DTR consumer spot check matches DB", () => {
      if (!dbRow) {
        throw new Error(
          `No DB row for consumer ${spotConsumer.consumerTblRefId} on DTR ${dtrId}`,
        );
      }
      compareApiToDb(
        [
          {
            label: "consumerTblRefId",
            apiValue: spotConsumer.consumerTblRefId,
            dbValue: dbRow.consumerTblRefId,
          },
          {
            label: "accountId",
            apiValue: spotConsumer.accountId?.trim() || null,
            dbValue: dbRow.accountId?.trim() || null,
            optional: true,
          },
        ],
        "DB vs API — DTR consumer spot check",
      );
    });
  }

  validation.printSummary("Asset Management DB Coverage", 0);
}

function collectVisibleDtrIds(hierarchy: ReturnType<typeof NetworkHierarchyMapper.mapData>["hierarchy"]): Set<number> {
  const ids = new Set<number>();
  const walk = (nodes: typeof hierarchy) => {
    nodes.forEach((node) => {
      node.dtrs.forEach((dtr) => ids.add(dtr.networkLookupId));
      walk(node.children);
    });
  };
  walk(hierarchy);
  return ids;
}

function expectApiLteDb(apiValue: number, dbValue: number, label: string): void {
  if (apiValue > dbValue) {
    throw new Error(`${label}: API ${apiValue} exceeds unscoped DB ${dbValue}`);
  }
}
