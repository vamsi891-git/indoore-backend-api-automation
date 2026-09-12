import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { DashboardMetricsApi } from "../Api/dashboardmetrics.api";
import { InstallationSummaryApi } from "../Api/installationsummary.api";
import { DisconnectionDetailsApi } from "../Api/disconnectiondetails.api";
import { DashboardMetricsMapper } from "../Mapper/dashboardmetrics.mapper";
import { InstallationSummaryMapper } from "../Mapper/installationsummary.mapper";
import { DisconnectionDetailsMapper } from "../Mapper/disconnectiondetails.mapper";
import { InstallationSummaryValidator } from "../Validator/installationsummary.validator";
import { DisconnectionDetailsValidator } from "../Validator/disconnectiondetails.validator";
import { logOverallDashboardDataQualityFindings } from "../Db/overall-dashboard-db.validator";
import { skipIfOverallDashboardInternalError } from "../utils/overall-dashboard-env.helper";
import { INSTALLATION_SUMMARY_PATH } from "../Data/installationsummary.data";
import { DISCONNECTION_DETAILS_PATH } from "../Data/disconnectiondetails.data";

/**
 * Tier 3 — API soft coverage only (no SQL).
 * Overall-metrics KPI SQL was never pasted; do not treat `@db` green here as
 * DB cross-validation. Keep gate off for CI until real SQL lands, or run this
 * as intentional API-only soft checks.
 */
export async function runOverallDashboardDbCoverage(
  authenticatedApi: APIRequestContext,
  _db: pg.Pool,
): Promise<void> {
  void _db;
  const validation = new ValidationEngine();
  const { responseBody } = await new DashboardMetricsApi(
    authenticatedApi,
  ).getDashboardMetrics();
  const metrics = DashboardMetricsMapper.mapData(
    responseBody.data as unknown as Record<string, unknown>,
  );
  await logOverallDashboardDataQualityFindings(
    "metrics",
    responseBody.data as unknown as Record<string, unknown>,
  );

  validation.execute("installationSummary present", () => {
    expect(metrics.installationSummary.length).toBeGreaterThan(0);
  });
  validation.execute("installationSummary values ≥ 0", () => {
    for (const row of metrics.installationSummary) {
      expect(row.value).toBeGreaterThanOrEqual(0);
      expect(row.percent).toBeGreaterThanOrEqual(0);
    }
  });
  validation.execute("installationSummary percent ≈ 100", () => {
    const sum = metrics.installationSummary.reduce(
      (acc, row) => acc + row.percent,
      0,
    );
    expect(Math.abs(100 - sum)).toBeLessThanOrEqual(1);
  });

  const installApi = new InstallationSummaryApi(authenticatedApi);
  const installResult = await installApi.getInstallationSummary();
  skipIfOverallDashboardInternalError(
    installResult.rawResponse.status(),
    installResult.responseBody,
    INSTALLATION_SUMMARY_PATH,
  );
  if (installResult.rawResponse.status() === 200) {
    const installMapped = InstallationSummaryMapper.map(
      installResult.responseBody,
    );
    const installValidator = new InstallationSummaryValidator();
    validation.execute("installation-summary mapped + unmapped = total", () =>
      installValidator.validateCounts(installMapped),
    );
    validation.execute("installation-summary share percents", () =>
      installValidator.validateSharePercents(installMapped),
    );
  }

  const disconnectResult = await new DisconnectionDetailsApi(
    authenticatedApi,
  ).getDisconnectionDetails();
  skipIfOverallDashboardInternalError(
    disconnectResult.rawResponse.status(),
    disconnectResult.responseBody,
    DISCONNECTION_DETAILS_PATH,
  );
  if (disconnectResult.rawResponse.status() === 200) {
    const disconnectMapped = DisconnectionDetailsMapper.map(
      disconnectResult.responseBody,
    );
    validation.execute("disconnection-details six unique months", () =>
      new DisconnectionDetailsValidator().validateMonthSeries(disconnectMapped),
    );
  }

  validation.printSummary(
    "Overall Dashboard API soft coverage (no SQL — Tier 3)",
    0,
  );
}
