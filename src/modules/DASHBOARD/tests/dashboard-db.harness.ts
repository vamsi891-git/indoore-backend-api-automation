import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { DashboardMetricsApi } from "../Api/dashboardmetrics.api";
import { DtrSummaryApi } from "../Api/dtrsummary.api";
import { DashboardMetricsMapper } from "../Mapper/dashboardmetrics.mapper";
import { DtrSummaryMapper } from "../Mapper/dtrsummary.mapper";
import {
  countActiveDtrs,
  countActiveFeeders,
  countActiveMeters,
  countActiveSubstations,
} from "../Db/dashboard.db";
import { compareNetworkCountLteDb } from "../Db/dashboard-db-compare";
import { logDashboardDataQualityFindings } from "../Db/dashboard-db.validator";

function metricCount(
  section: Record<string, { count?: number }>,
  key: string,
): number {
  return Number(section?.[key]?.count ?? 0);
}

/**
 * Part 4 harness — metrics/network + DTR summary counts ≤ DB universe.
 */
export async function runDashboardDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ValidationEngine();

  const metricsBody = await new DashboardMetricsApi(
    authenticatedApi,
  ).getDashboardMetrics();
  const metrics = DashboardMetricsMapper.map(metricsBody.responseBody);
  await logDashboardDataQualityFindings(
    "metrics",
    metricsBody.responseBody.data as unknown as Record<string, unknown>,
  );

  const [dbDtrs, dbFeeders, dbSubs, dbMeters] = await Promise.all([
    countActiveDtrs(db),
    countActiveFeeders(db),
    countActiveSubstations(db),
    countActiveMeters(db),
  ]);

  validation.execute("networkDetails.dtrs ≤ DB active DTRs", () => {
    compareNetworkCountLteDb({
      label: "networkDetails.dtrs",
      apiCount: metricCount(metrics.networkDetails, "dtrs"),
      dbCount: dbDtrs,
    });
  });

  validation.execute("networkDetails.feeders ≤ DB active feeders", () => {
    compareNetworkCountLteDb({
      label: "networkDetails.feeders",
      apiCount: metricCount(metrics.networkDetails, "feeders"),
      dbCount: dbFeeders,
    });
  });

  validation.execute(
    "networkDetails.substations ≤ DB active substations",
    () => {
      compareNetworkCountLteDb({
        label: "networkDetails.substations",
        apiCount: metricCount(metrics.networkDetails, "substations"),
        dbCount: dbSubs,
      });
    },
  );

  const apiMeters = Number(metrics.totalMeterCount ?? 0);
  if (apiMeters > 0) {
    validation.execute("totalMeterCount ≤ DB active meters", () => {
      compareNetworkCountLteDb({
        label: "totalMeterCount",
        apiCount: apiMeters,
        dbCount: dbMeters,
      });
    });
  }

  const summaryBody = await new DtrSummaryApi(authenticatedApi).getDtrSummary({
    period: "daily",
  });
  const summary = DtrSummaryMapper.map(summaryBody.responseBody);
  validation.execute("dtr-summary.totalDtrs ≤ DB active DTRs", () => {
    compareNetworkCountLteDb({
      label: "dtr-summary.totalDtrs",
      apiCount: Number(summary.totalDtrs?.count ?? 0),
      dbCount: dbDtrs,
    });
  });

  validation.printSummary("Dashboard DB Coverage", 0);
}
