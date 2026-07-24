import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { DashboardMetricsApi } from "../Api/dashboardmetrics.api";
import { DashboardMetricsMapper } from "../Mapper/dashboardmetrics.mapper";
import {
  countOdActiveDtrs,
  countOdActiveFeeders,
  countOdActiveMeters,
  countOdActiveSubstations,
} from "../Db/overall-dashboard.db";
import { compareOdCountLteDb } from "../Db/overall-dashboard-db-compare";
import { logOverallDashboardDataQualityFindings } from "../Db/overall-dashboard-db.validator";

function metricCount(section: Record<string, { count?: number }>, key: string): number {
  return Number(section?.[key]?.count ?? 0);
}

export async function runOverallDashboardDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ValidationEngine();
  const { responseBody } = await new DashboardMetricsApi(authenticatedApi).getDashboardMetrics();
  const metrics = DashboardMetricsMapper.mapData(
    responseBody.data as unknown as Record<string, unknown>,
  );
  await logOverallDashboardDataQualityFindings(
    "metrics",
    responseBody.data as unknown as Record<string, unknown>,
  );

  const [dbDtrs, dbFeeders, dbSubs, dbMeters] = await Promise.all([
    countOdActiveDtrs(db),
    countOdActiveFeeders(db),
    countOdActiveSubstations(db),
    countOdActiveMeters(db),
  ]);

  validation.execute("networkDetails.dtrs ≤ DB", () => {
    compareOdCountLteDb({
      label: "networkDetails.dtrs",
      apiCount: metricCount(metrics.networkDetails, "dtrs"),
      dbCount: dbDtrs,
    });
  });
  validation.execute("networkDetails.feeders ≤ DB", () => {
    compareOdCountLteDb({
      label: "networkDetails.feeders",
      apiCount: metricCount(metrics.networkDetails, "feeders"),
      dbCount: dbFeeders,
    });
  });
  validation.execute("networkDetails.substations ≤ DB", () => {
    compareOdCountLteDb({
      label: "networkDetails.substations",
      apiCount: metricCount(metrics.networkDetails, "substations"),
      dbCount: dbSubs,
    });
  });
  if (Number(metrics.totalMeterCount ?? 0) > 0) {
    validation.execute("totalMeterCount ≤ DB", () => {
      compareOdCountLteDb({
        label: "totalMeterCount",
        apiCount: Number(metrics.totalMeterCount ?? 0),
        dbCount: dbMeters,
      });
    });
  }
  validation.printSummary("Overall Dashboard DB Coverage", 0);
}
