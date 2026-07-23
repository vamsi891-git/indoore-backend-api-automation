import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { DtrDetailApi } from "../Api/DtrId.api";
import { NetworkHierarchyApi } from "../Api/networkhierarchy.api";
import { OrganisationHierarchyApi } from "../Api/organizationhierarchy.api";
import {
  AssetDtrLookupId,
  DtrDetailPaginationQueries,
} from "../Data/asset-management.common.data";
import { DtrDetailMapper } from "../Mapper/dtrId.mapper";
import { NetworkHierarchyMapper } from "../Mapper/networkhierarchy.mapper";
import { OrganisationHierarchyMapper } from "../Mapper/organizationhierarchy.mapper";
import {
  countActiveDtrNetworks,
  countDtrMeterConnections,
  getDtrConsumerSpotCheck,
} from "../Db/asset-management.db";
import {
  assertDtrPaginationBusinessRule,
  compareConsumerSpotCheckToDb,
  compareDtrMeterTotalToDb,
  compareHierarchyConsumerCountToDetail,
  compareVisibleDtrNetworksToDb,
} from "../Db/asset-management-db.compare";
import {
  AssetManagementDbValidator,
  logDtrDetailDataQualityFindings,
  logNetworkHierarchyDataQualityFindings,
  logOrganisationHierarchyDataQualityFindings,
} from "../Db/asset-management-db.validator";
import {
  findDtrById,
  findDtrWithHighestConsumerCount,
} from "../utils/asset-management.helper";

/**
 * Part 4 — DB cross-validation + data-quality soft checks.
 * Hard failures: field/business mismatches via compare helpers.
 * Soft findings: empty/suspicious fields attached to Allure (non-failing).
 */
export async function runAssetManagementDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ValidationEngine();
  const networkApi = new NetworkHierarchyApi(authenticatedApi);
  const orgApi = new OrganisationHierarchyApi(authenticatedApi);
  const dtrApi = new DtrDetailApi(authenticatedApi);

  const networkResponse = await networkApi.getNetworkHierarchy();
  const hierarchy = NetworkHierarchyMapper.mapData(
    networkResponse.responseBody.data,
  ).hierarchy;

  const orgResponse = await orgApi.getOrganisationHierarchy();
  const orgHierarchy = OrganisationHierarchyMapper.mapData(
    orgResponse.responseBody.data,
  ).hierarchy;

  await logNetworkHierarchyDataQualityFindings(hierarchy);
  await logOrganisationHierarchyDataQualityFindings(orgHierarchy);

  const dtrId =
    process.env.ASSET_DTR_LOOKUP_ID != null
      ? AssetDtrLookupId
      : (findDtrWithHighestConsumerCount(hierarchy)?.networkLookupId ??
        AssetDtrLookupId);
  const hierarchyDtr = findDtrById(hierarchy, dtrId);

  const detailResponse = await dtrApi.getDtrDetails(
    dtrId,
    DtrDetailPaginationQueries.default.page,
    DtrDetailPaginationQueries.default.limit,
  );
  const detail = DtrDetailMapper.mapData(detailResponse.responseBody.data);
  await logDtrDetailDataQualityFindings(detail);

  const dbMeterTotal = await countDtrMeterConnections(db, dtrId);
  const dbDtrNetworkTotal = await countActiveDtrNetworks(db);

  validation.execute("DTR detail total within DB meter universe", () => {
    compareDtrMeterTotalToDb({
      apiTotal: detail.total,
      dbMeterTotal,
      page: detail.page,
      limit: detail.limit,
      rowCount: detail.consumers.length,
      mode: "lte",
    });
  });

  validation.execute("DTR pagination business rule", () => {
    assertDtrPaginationBusinessRule(detail);
  });

  if (hierarchyDtr) {
    validation.execute("Hierarchy vs detail business fields", () => {
      compareHierarchyConsumerCountToDetail({
        hierarchyDtr,
        detail,
        dbMeterTotal,
      });
    });
  }

  validation.execute("Visible DTR networks within DB universe", () => {
    const visibleDtrCount = collectVisibleDtrIds(hierarchy).size;
    compareVisibleDtrNetworksToDb({
      visibleDtrCount,
      dbDtrNetworkTotal,
    });
    AssetManagementDbValidator.assertApiTotalWithinDbUniverse(
      "visible DTR networks",
      visibleDtrCount,
      dbDtrNetworkTotal,
    );
  });

  const spotConsumers = detail.consumers.slice(
    0,
    resolveAssetDbSampleSize(),
  );
  for (const spotConsumer of spotConsumers) {
    const dbRow = await getDtrConsumerSpotCheck(
      db,
      dtrId,
      spotConsumer.consumerTblRefId,
    );
    validation.execute(
      `Consumer spot check id=${spotConsumer.consumerTblRefId}`,
      () => {
        compareConsumerSpotCheckToDb({
          dtrNetworkLookupId: dtrId,
          apiConsumer: spotConsumer,
          dbRow,
        });
      },
    );
  }

  validation.printSummary("Asset Management DB Coverage", 0);
}

function collectVisibleDtrIds(
  hierarchy: ReturnType<typeof NetworkHierarchyMapper.mapData>["hierarchy"],
): Set<number> {
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

function resolveAssetDbSampleSize(): number {
  const raw = Number(process.env.ASSET_DB_SAMPLE_SIZE ?? "3");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 3;
}
