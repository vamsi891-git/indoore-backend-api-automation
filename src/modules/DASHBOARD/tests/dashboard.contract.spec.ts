/**
 * DASHBOARD contract snapshots — structural only (counts/series drift).
 *
 * First run / intentional shape change:
 *   UPDATE_CONTRACT_SNAPSHOTS=true npm run test:dashboard:contract
 */
import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { DashboardMetricsApi } from "../Api/dashboardmetrics.api";
import { DtrSummaryApi } from "../Api/dtrsummary.api";
import { DtrConsumptionApi } from "../Api/dtrconsumption.api";
import { DtrCommunicationApi } from "../Api/dtrcommunication.api";
import { DtrPowerStatusApi } from "../Api/dtrpowerstatus.api";
import { DtrLoadUnbalanceApi } from "../Api/dtrloadunbalance.api";
import { DtrVoltageUnbalanceApi } from "../Api/dtrvoltageunbalance.api";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

async function snapshotWidget(
  name: string,
  pathPattern: string,
  responseBody: unknown,
  itemSource?: unknown[],
): Promise<void> {
  const body = asRecord(responseBody);
  expect(body.success).toBe(true);
  const data = asRecord(body.data);
  const items = itemSource ?? [];
  const itemKeys =
    items.length > 0 ? Object.keys(asRecord(items[0])) : Object.keys(data);
  await assertContractSnapshot(
    name,
    buildLookupItemsContractSnapshot({
      pathPattern,
      dataKeys: Object.keys(data),
      itemKeys,
    }),
  );
}

test.describe("DASHBOARD — Contract Snapshots", () => {
  test.setTimeout(180_000);

  test(
    "Dashboard Metrics Contract Snapshot",
    { tag: ["@contract-snapshot", "@dashboard", "@metrics"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DashboardMetricsApi(
        authenticatedApi,
      ).getDashboardMetrics();
      await snapshotWidget(
        "dashboard/dashboard-metrics",
        "/indore/dashboard/metrics",
        responseBody,
      );
    },
  );

  test(
    "DTR Summary Contract Snapshot",
    { tag: ["@contract-snapshot", "@dashboard", "@dtr-summary"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DtrSummaryApi(
        authenticatedApi,
      ).getDtrSummary({ period: "daily" });
      await snapshotWidget(
        "dashboard/dtr-summary",
        "/indore/dashboard/dtr/summary",
        responseBody,
      );
    },
  );

  test(
    "DTR Consumption Contract Snapshot",
    { tag: ["@contract-snapshot", "@dashboard", "@dtr-consumption"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DtrConsumptionApi(
        authenticatedApi,
      ).getDtrConsumption({ period: "daily" });
      const points = asRecord(asRecord(responseBody).data).points;
      await snapshotWidget(
        "dashboard/dtr-consumption",
        "/indore/dashboard/dtr/consumption",
        responseBody,
        Array.isArray(points) ? points : [],
      );
    },
  );

  test(
    "DTR Communication Contract Snapshot",
    { tag: ["@contract-snapshot", "@dashboard", "@dtr-communication"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DtrCommunicationApi(
        authenticatedApi,
      ).getDtrCommunicationStatus({ period: "daily" });
      const points = asRecord(asRecord(responseBody).data).points;
      await snapshotWidget(
        "dashboard/dtr-communication",
        "/indore/dashboard/dtr/communication-status",
        responseBody,
        Array.isArray(points) ? points : [],
      );
    },
  );

  test(
    "DTR Power Status Contract Snapshot",
    { tag: ["@contract-snapshot", "@dashboard", "@dtr-power-status"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DtrPowerStatusApi(
        authenticatedApi,
      ).getDtrPowerStatus({ period: "daily" });
      const points = asRecord(asRecord(responseBody).data).points;
      await snapshotWidget(
        "dashboard/dtr-power-status",
        "/indore/dashboard/dtr/power-status",
        responseBody,
        Array.isArray(points) ? points : [],
      );
    },
  );

  test(
    "DTR Load Unbalance Contract Snapshot",
    { tag: ["@contract-snapshot", "@dashboard", "@dtr-load-unbalance"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DtrLoadUnbalanceApi(
        authenticatedApi,
      ).getDtrLoadUnbalance();
      const items = asRecord(asRecord(responseBody).data).items;
      await snapshotWidget(
        "dashboard/dtr-load-unbalance",
        "/indore/dashboard/dtr/load-unbalance",
        responseBody,
        Array.isArray(items) ? items : [],
      );
    },
  );

  test(
    "DTR Voltage Unbalance Contract Snapshot",
    { tag: ["@contract-snapshot", "@dashboard", "@dtr-voltage-unbalance"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DtrVoltageUnbalanceApi(
        authenticatedApi,
      ).getDtrVoltageUnbalance();
      const items = asRecord(asRecord(responseBody).data).items;
      await snapshotWidget(
        "dashboard/dtr-voltage-unbalance",
        "/indore/dashboard/dtr/voltage-unbalance",
        responseBody,
        Array.isArray(items) ? items : [],
      );
    },
  );
});
