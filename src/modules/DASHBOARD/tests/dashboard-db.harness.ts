import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { DashboardMetricsApi } from "../Api/dashboardmetrics.api";
import { ConsumerConnectionStatusApi } from "../Api/consumerconnectionstatus.api";
import { ConsumerCategoryDistributionApi } from "../Api/consumercategorydistribution.api";
import { ConsumerPhaseDistributionApi } from "../Api/consumerphasedistribution.api";
import { ConsumerOemDistributionApi } from "../Api/consumeroemdistribution.api";
import { DashboardMetricsMapper } from "../Mapper/dashboardmetrics.mapper";
import { ConsumerConnectionStatusMapper } from "../Mapper/consumerconnectionstatus.mapper";
import type { ConsumerConnectionStatus } from "../Mapper/consumerconnectionstatus.mapper";
import { ConsumerCategoryDistributionMapper } from "../Mapper/consumercategorydistribution.mapper";
import { ConsumerPhaseDistributionMapper } from "../Mapper/consumerphasedistribution.mapper";
import type { ConsumerPhase } from "../Mapper/consumerphasedistribution.mapper";
import { ConsumerOemDistributionMapper } from "../Mapper/consumeroemdistribution.mapper";
import { DtrSummaryApi } from "../Api/dtrsummary.api";
import { DtrSummaryMapper } from "../Mapper/dtrsummary.mapper";
import { DtrConsumptionApi } from "../Api/dtrconsumption.api";
import { DtrConsumptionMapper } from "../Mapper/dtrconsumption.mapper";
import { ConsumerMeterStatusApi } from "../Api/consumermeterstatus.api";
import { ConsumerMeterStatusMapper } from "../Mapper/consumermeterstatus.mapper";
import { CONSUMER_CONNECTION_STATUS_METRICS_KEY } from "../Data/consumerconnectionstatus.data";
import { CONSUMER_CATEGORY_DISTRIBUTION_METRICS_KEY } from "../Data/consumercategorydistribution.data";
import { CONSUMER_PHASE_DISTRIBUTION_METRICS_KEY } from "../Data/consumerphasedistribution.data";
import {
  CONSUMER_OEM_DISTRIBUTION_METRICS_KEY,
  CONSUMER_OEM_DISTRIBUTION_OEMS,
} from "../Data/consumeroemdistribution.data";
import {
  countActiveDtrs,
  countActiveFeeders,
  countActiveSubstations,
  countDtrFleetTotal,
  getCategoryWiseCounts,
  getConnectionStatusCounts,
  getConsumerMeterStatusCounts,
  getDtrConsumptionDailySqlPoints,
  getOemWiseCounts,
  getPhaseWiseCounts,
  type DashboardKeyedCount,
} from "../Db/dashboard.db";
import { compareApiEqualsSql } from "../Db/dashboard-db-compare";
import { logDashboardDataQualityFindings } from "../Db/dashboard-db.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

function metricCount(section: Record<string, { count?: number }>, key: string): number {
  return Number(section?.[key]?.count ?? 0);
}

function assertSame(label: string, left: number, right: number): void {
  if (left !== right) {
    throw new Error(`${label}: ${left} ≠ ${right}`);
  }
}

function normalizeCountKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function sqlCountFor(rows: DashboardKeyedCount[], want: string): number {
  const wantKey = normalizeCountKey(want);
  const row = rows.find((item) => normalizeCountKey(item.key) === wantKey);
  return Number(row?.count ?? 0);
}

/**
 * DashboardConsumerMetricsRepository only:
 * getConnectionStatusCounts / getCategoryWiseCounts / getPhaseWiseCounts /
 * getOemWiseCounts / getNetworkDetails.
 */
export async function runDashboardDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ApiValidationHelper();

  const metricsBody = await new DashboardMetricsApi(authenticatedApi).getDashboardMetrics();
  const metrics = DashboardMetricsMapper.map(metricsBody.responseBody);
  await logDashboardDataQualityFindings(
    "metrics",
    metricsBody.responseBody.data as unknown as Record<string, unknown>,
  );

  const [
    sqlDtrs,
    sqlFeeders,
    sqlSubs,
    sqlStatus,
    sqlCategories,
    sqlPhases,
    sqlOems,
    sqlDtrFleet,
    sqlDtrConsumption,
    sqlConsumerMeterStatus,
  ] = await Promise.all([
    countActiveDtrs(db),
    countActiveFeeders(db),
    countActiveSubstations(db),
    getConnectionStatusCounts(db),
    getCategoryWiseCounts(db),
    getPhaseWiseCounts(db),
    getOemWiseCounts(db),
    countDtrFleetTotal(db),
    getDtrConsumptionDailySqlPoints(db),
    getConsumerMeterStatusCounts(db),
  ]);

  validation.execute("metrics.dtrs === SQL dtrMasterCatalog", () => {
    compareApiEqualsSql({
      label: "networkDetails.dtrs",
      apiCount: metricCount(metrics.networkDetails, "dtrs"),
      sqlCount: sqlDtrs,
      sqlName: "dtrMasterCatalogSql",
    });
  });
  validation.execute("metrics.feeders === SQL feeder catalog", () => {
    compareApiEqualsSql({
      label: "networkDetails.feeders",
      apiCount: metricCount(metrics.networkDetails, "feeders"),
      sqlCount: sqlFeeders,
      sqlName: "feederSubstationCatalogSql Feeder",
    });
  });
  validation.execute("metrics.substations === SQL Sub Station catalog", () => {
    compareApiEqualsSql({
      label: "networkDetails.substations",
      apiCount: metricCount(metrics.networkDetails, "substations"),
      sqlCount: sqlSubs,
      sqlName: "feederSubstationCatalogSql Sub Station",
    });
  });
  validation.execute("metrics.totalMeterCount === SQL distinct IVRS", () => {
    compareApiEqualsSql({
      label: "totalMeterCount",
      apiCount: Number(metrics.totalMeterCount ?? 0),
      sqlCount: sqlStatus.totalMeterCount,
      sqlName: "meterBasedConsumerSubquerySql distinct RRNumber",
    });
  });
  const networkConsumers = metricCount(metrics.networkDetails, "consumers");
  if (networkConsumers > 0 || sqlStatus.totalMeterCount > 0) {
    validation.execute("metrics.networkDetails.consumers === SQL distinct IVRS", () => {
      compareApiEqualsSql({
        label: "networkDetails.consumers",
        apiCount: networkConsumers,
        sqlCount: sqlStatus.totalMeterCount,
        sqlName: "meterBasedConsumerSubquerySql distinct RRNumber",
      });
    });
  }
  for (const statusKey of ["cd", "td", "pd"] as const) {
    validation.execute(`metrics.${statusKey} === SQL connection status`, () => {
      compareApiEqualsSql({
        label: `connectionStatus.${statusKey}`,
        apiCount: metricCount(metrics.connectionStatus, statusKey),
        sqlCount: sqlStatus[statusKey],
        sqlName: `M_Connection_Status shortName=${statusKey} distinct RRNumber`,
      });
    });
  }

  const connectionStatusApi = new ConsumerConnectionStatusApi(authenticatedApi);
  const connectionStatuses: ConsumerConnectionStatus[] = [
    "connected",
    "disconnected",
    "permanently-disconnected",
  ];
  for (const status of connectionStatuses) {
    const details = ConsumerConnectionStatusMapper.map(
      (
        await connectionStatusApi.getConsumerConnectionStatus({
          status,
          page: 1,
          limit: 20,
        })
      ).responseBody,
    );
    const metricsKey = CONSUMER_CONNECTION_STATUS_METRICS_KEY[status];
    validation.execute(`connection-status(${status}) === metrics.${metricsKey}`, () => {
      assertSame(
        `connection-status(${status})`,
        details.pagination.total,
        metricCount(metrics.connectionStatus, metricsKey),
      );
    });
    validation.execute(`connection-status(${status}) === SQL ${metricsKey}`, () => {
      compareApiEqualsSql({
        label: `connection-status(${status}).total`,
        apiCount: details.pagination.total,
        sqlCount: sqlStatus[metricsKey as "cd" | "td" | "pd"],
        sqlName: `M_Connection_Status shortName=${metricsKey} distinct RRNumber`,
      });
    });
  }

  const categoryApi = new ConsumerCategoryDistributionApi(authenticatedApi);
  for (const category of Object.keys(CONSUMER_CATEGORY_DISTRIBUTION_METRICS_KEY)) {
    const details = ConsumerCategoryDistributionMapper.map(
      (
        await categoryApi.getConsumerCategoryDistribution({
          category,
          page: 1,
          limit: 20,
        })
      ).responseBody,
    );
    const metricsKey = CONSUMER_CATEGORY_DISTRIBUTION_METRICS_KEY[category];
    validation.execute(`category(${category}) === metrics.${metricsKey}`, () => {
      assertSame(
        `category(${category})`,
        details.pagination.total,
        metricCount(metrics.categoryWiseConsumer, metricsKey),
      );
    });
    validation.execute(`category(${category}) === SQL CategoryName`, () => {
      compareApiEqualsSql({
        label: `category(${category})`,
        apiCount: details.pagination.total,
        sqlCount: sqlCountFor(sqlCategories, category),
        sqlName: "M_Category.CategoryName distinct RRNumber",
      });
    });
  }

  const phaseApi = new ConsumerPhaseDistributionApi(authenticatedApi);
  const phases: ConsumerPhase[] = ["1 PH", "3 PH WC", "3 PH 4 CT", "HT"];
  for (const phase of phases) {
    const details = ConsumerPhaseDistributionMapper.map(
      (
        await phaseApi.getConsumerPhaseDistribution({
          phase,
          page: 1,
          limit: 20,
        })
      ).responseBody,
    );
    const metricsKey = CONSUMER_PHASE_DISTRIBUTION_METRICS_KEY[phase];
    validation.execute(`phase(${phase}) === metrics.${metricsKey}`, () => {
      assertSame(
        `phase(${phase})`,
        details.pagination.total,
        metricCount(metrics.phaseWiseConsumer, metricsKey),
      );
    });
    validation.execute(`phase(${phase}) === SQL ShortName`, () => {
      compareApiEqualsSql({
        label: `phase(${phase})`,
        apiCount: details.pagination.total,
        sqlCount: sqlCountFor(sqlPhases, phase),
        sqlName: "M_ServicePoint_MeterPhase.ShortName distinct RRNumber",
      });
    });
  }

  const oemApi = new ConsumerOemDistributionApi(authenticatedApi);
  for (const oem of CONSUMER_OEM_DISTRIBUTION_OEMS) {
    const details = ConsumerOemDistributionMapper.map(
      (
        await oemApi.getConsumerOemDistribution({
          oem,
          page: 1,
          limit: 20,
        })
      ).responseBody,
    );
    const metricsKey = CONSUMER_OEM_DISTRIBUTION_METRICS_KEY[oem];
    validation.execute(`oem(${oem}) === metrics.${metricsKey}`, () => {
      assertSame(
        `oem(${oem})`,
        details.pagination.total,
        metricCount(metrics.oemWiseConsumer, metricsKey),
      );
    });
    validation.execute(`oem(${oem}) === SQL Manufacturer_Name`, () => {
      compareApiEqualsSql({
        label: `oem(${oem})`,
        apiCount: details.pagination.total,
        sqlCount: sqlCountFor(sqlOems, metricsKey),
        sqlName: "M_Device_Manufacturer distinct RRNumber",
      });
    });
  }

  const summary = DtrSummaryMapper.map(
    (
      await new DtrSummaryApi(authenticatedApi).getDtrSummary({
        period: "daily",
      })
    ).responseBody,
  );
  validation.execute("dtr-summary.totalDtrs === SQL DTR-master catalog count", () => {
    compareApiEqualsSql({
      label: "dtr-summary.totalDtrs",
      apiCount: Number(summary.totalDtrs?.count ?? 0),
      sqlCount: sqlDtrFleet,
      sqlName: "dtrMasterCatalogCountSubquerySql (active DTR × Type-2 meter)",
    });
  });

  const consumption = DtrConsumptionMapper.map(
    (
      await new DtrConsumptionApi(authenticatedApi).getDtrConsumption({
        period: "daily",
      })
    ).responseBody,
  );
  const sqlByLabel = new Map(sqlDtrConsumption.points.map((p) => [p.label, p]));
  for (const point of consumption.points) {
    const sqlPoint = sqlByLabel.get(point.label) ??
      sqlDtrConsumption.points[consumption.points.indexOf(point)] ?? {
        label: point.label,
        kwh: 0,
        kvah: 0,
        kvarh: 0,
      };
    for (const field of ["kwh", "kvah", "kvarh"] as const) {
      validation.execute(
        `dtr-consumption(${point.label}).${field} === SQL ${sqlDtrConsumption.source}`,
        () => {
          compareApiEqualsSql({
            label: `dtr-consumption(${point.label}).${field}`,
            apiCount: Number(point[field] ?? 0),
            sqlCount: Number(sqlPoint[field] ?? 0),
            sqlName: sqlDtrConsumption.source,
          });
        },
      );
    }
  }

  const meterStatus = ConsumerMeterStatusMapper.map(
    (await new ConsumerMeterStatusApi(authenticatedApi).getConsumerMeterStatus()).responseBody,
  );
  validation.execute("consumer meter-status.total === SQL distinct IVRS", () => {
    compareApiEqualsSql({
      label: "consumer.meter-status.total",
      apiCount: meterStatus.totalConsumerMeters,
      sqlCount: sqlConsumerMeterStatus.totalConsumerMeters,
      sqlName: "getConsumerMeterStatus distinct RRNumber",
    });
  });
  validation.execute("consumer meter-status.communicated === SQL last_seen 1h", () => {
    compareApiEqualsSql({
      label: "consumer.meter-status.communicated",
      apiCount: meterStatus.communicatedConsumerMeters,
      sqlCount: sqlConsumerMeterStatus.communicatedConsumerMeters,
      sqlName: "meter_last_seen last 1 IST hour",
    });
  });
  validation.execute("consumer meter-status.nonCommunicated === SQL last_seen 1h", () => {
    compareApiEqualsSql({
      label: "consumer.meter-status.nonCommunicated",
      apiCount: meterStatus.nonCommunicatedConsumerMeters,
      sqlCount: sqlConsumerMeterStatus.nonCommunicatedConsumerMeters,
      sqlName: "getConsumerMeterStatus not communicating",
    });
  });

  validation.finalize("DASHBOARD consumer metrics vs DashboardConsumerMetricsRepository SQL", 0);
}
