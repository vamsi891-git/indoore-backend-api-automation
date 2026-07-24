/**
 * OVERALL-DASHBOARD contract snapshots — structural only.
 * UPDATE_CONTRACT_SNAPSHOTS=true npm run test:overall-dashboard:contract
 */
import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { DashboardMetricsApi } from "../Api/dashboardmetrics.api";
import { DtrCommunicationApi } from "../Api/dtrcommunication.api";
import { dtrCommunicationQuery } from "../Data/dtrcommunication.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("OVERALL-DASHBOARD — Contract Snapshots", () => {
  test.setTimeout(180_000);

  test(
    "Dashboard Metrics Contract Snapshot",
    { tag: ["@contract-snapshot", "@overall-dashboard", "@metrics"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DashboardMetricsApi(
        authenticatedApi,
      ).getDashboardMetrics();
      expect(responseBody.success).toBe(true);
      const data = asRecord(responseBody.data);
      await assertContractSnapshot(
        "overall-dashboard/dashboard-metrics",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/dashboard/metrics",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(asRecord(data.networkDetails)).sort(),
        }),
      );
    },
  );

  test(
    "DTR Communication Contract Snapshot",
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
});
