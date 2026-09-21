/**
 * OVERALL-DASHBOARD contract snapshots — structural only.
 * UPDATE_CONTRACT_SNAPSHOTS=true npm run test:overall-dashboard:contract
 */
import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../extras/contract/contract-snapshot.helper";
import { DashboardMetricsApi } from "../Api/dashboardmetrics.api";
import { DtrCommunicationApi } from "../Api/dtrcommunication.api";
import { InstallationSummaryApi } from "../Api/installationsummary.api";
import { DisconnectionDetailsApi } from "../Api/disconnectiondetails.api";
import { dtrCommunicationQuery } from "../Data/dtrcommunication.data";
import { INSTALLATION_SUMMARY_PATH } from "../Data/installationsummary.data";
import { DISCONNECTION_DETAILS_PATH } from "../Data/disconnectiondetails.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

test.describe("Home dashboard — saved field lists", () => {
  test.setTimeout(180_000);

  test(
    "Home dashboard — the field list still matches what we saved",
    { tag: ["@contract-snapshot", "@overall-dashboard", "@metrics"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DashboardMetricsApi(
        authenticatedApi,
      ).getDashboardMetrics();
      expect(responseBody.success).toBe(true);
      const data = asRecord(responseBody.data);
      const installation = Array.isArray(data.installationSummary) ? data.installationSummary : [];
      const firstInstall = installation.length > 0 ? asRecord(installation[0]) : {};
      await assertContractSnapshot(
        "overall-dashboard/dashboard-metrics",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/dashboard/overall-metrics",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(firstInstall).sort(),
        }),
      );
    },
  );

  test(
    "DTR talking to the system — the field list still matches what we saved",
    { tag: ["@contract-snapshot", "@overall-dashboard", "@dtr-communication"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DtrCommunicationApi(
        authenticatedApi,
      ).getDtrCommunicationStatus({
        ...dtrCommunicationQuery,
        period: "daily",
      });
      expect(responseBody.success).toBe(true);
      const data = asRecord(responseBody.data);
      const points = Array.isArray(data.points) ? data.points : [];
      await assertContractSnapshot(
        "overall-dashboard/dtr-communication",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/dashboard/dtr/communication-status",
          dataKeys: Object.keys(data).sort(),
          itemKeys: points.length > 0 ? Object.keys(asRecord(points[0])).sort() : [],
        }),
      );
    },
  );

  test(
    "Mapped vs unmapped meters — the field list still matches what we saved",
    {
      tag: ["@contract-snapshot", "@overall-dashboard", "@installation-summary"],
    },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new InstallationSummaryApi(
        authenticatedApi,
      ).getInstallationSummary();
      expect(responseBody.success).toBe(true);
      const data = asRecord(responseBody.data);
      const installed = asRecord(data.installedMeters);
      await assertContractSnapshot(
        "overall-dashboard/installation-summary",
        buildLookupItemsContractSnapshot({
          pathPattern: INSTALLATION_SUMMARY_PATH,
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(installed).sort(),
        }),
      );
    },
  );

  test(
    "Connect and disconnect by month — the field list still matches what we saved",
    {
      tag: ["@contract-snapshot", "@overall-dashboard", "@disconnection-details"],
    },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DisconnectionDetailsApi(
        authenticatedApi,
      ).getDisconnectionDetails();
      expect(responseBody.success).toBe(true);
      const data = asRecord(responseBody.data);
      const months = Array.isArray(data.months) ? data.months : [];
      await assertContractSnapshot(
        "overall-dashboard/disconnection-details",
        buildLookupItemsContractSnapshot({
          pathPattern: DISCONNECTION_DETAILS_PATH,
          dataKeys: Object.keys(data).sort(),
          itemKeys: months.length > 0 ? Object.keys(asRecord(months[0])).sort() : [],
        }),
      );
    },
  );
});
