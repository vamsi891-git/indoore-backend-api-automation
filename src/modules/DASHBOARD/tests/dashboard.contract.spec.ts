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
import { DtrLoadUnbalanceDetailsApi } from "../Api/dtrloadunbalancedetails.api";
import { DtrVoltageUnbalanceApi } from "../Api/dtrvoltageunbalance.api";
import { DtrVoltageUnbalanceDetailsApi } from "../Api/dtrvoltageunbalancedetails.api";
import { DtrPowerStatusDetailsApi } from "../Api/dtrpowerstatusdetails.api";
import { DtrCommunicationDetailsApi } from "../Api/dtrcommunicationdetails.api";
import { DtrConsumptionDetailsApi } from "../Api/dtrconsumptiondetails.api";
import { DtrPercentageLoadingDetailsApi } from "../Api/dtrpercentageloadingdetails.api";
import { ConsumerConnectionStatusApi } from "../Api/consumerconnectionstatus.api";
import { ConsumerCategoryDistributionApi } from "../Api/consumercategorydistribution.api";
import { ConsumerPhaseDistributionApi } from "../Api/consumerphasedistribution.api";
import { ConsumerOemDistributionApi } from "../Api/consumeroemdistribution.api";
import { RevenueSubsidyPfApi } from "../Api/revenuesubsidypf.api";

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
  const columnsRaw = Array.isArray(data.columns) ? data.columns : [];
  const hasColumnsGrid = columnsRaw.length > 0;
  const items = itemSource ?? (hasColumnsGrid ? columnsRaw : []);
  const itemKeys =
    items.length > 0 ? Object.keys(asRecord(items[0])) : Object.keys(data);
  const columns = hasColumnsGrid
    ? columnsRaw.map((column) => {
        const row = asRecord(column);
        return {
          key: String(row.key ?? ""),
          header: String(row.header ?? ""),
        };
      })
    : undefined;
  await assertContractSnapshot(
    name,
    buildLookupItemsContractSnapshot({
      pathPattern,
      dataKeys: Object.keys(data),
      itemKeys,
      hasColumnsGrid,
      columns,
    }),
  );
}

test.describe("Dashboard — response shape", () => {
  test.setTimeout(180_000);

  test(
    "Dashboard overview — response shape stays the same",
    { tag: ["@contract-snapshot", "@dashboard", "@metrics"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DashboardMetricsApi(
        authenticatedApi,
      ).getDashboardMetrics();
      await snapshotWidget(
        "dashboard/dashboard-metrics",
        "/indore/dashboard/consumer/metrics",
        responseBody,
      );
    },
  );

  test(
    "DTR summary cards — response shape stays the same",
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
    "DTR consumption chart — response shape stays the same",
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
    "DTR communication chart — response shape stays the same",
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
    "DTR power on/off chart — response shape stays the same",
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
    "DTR load unbalance — response shape stays the same",
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
    "DTR voltage unbalance — response shape stays the same",
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

  test(
    "DTR load unbalance list — response shape stays the same",
    {
      tag: [
        "@contract-snapshot",
        "@dashboard",
        "@dtr-load-unbalance-details",
      ],
    },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DtrLoadUnbalanceDetailsApi(
        authenticatedApi,
      ).getDtrLoadUnbalanceDetails({
        severity: "severe",
        page: 1,
        limit: 10,
      });
      const data = asRecord(asRecord(responseBody).data);
      const columns = Array.isArray(data.columns) ? data.columns : [];
      await snapshotWidget(
        "dashboard/dtr-load-unbalance-details",
        "/indore/dashboard/dtr/load-unbalance-details",
        responseBody,
        columns,
      );
    },
  );

  test(
    "DTR voltage unbalance list — response shape stays the same",
    {
      tag: [
        "@contract-snapshot",
        "@dashboard",
        "@dtr-voltage-unbalance-details",
      ],
    },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DtrVoltageUnbalanceDetailsApi(
        authenticatedApi,
      ).getDtrVoltageUnbalanceDetails({
        severity: "balanced",
        page: 1,
        limit: 10,
      });
      const data = asRecord(asRecord(responseBody).data);
      const columns = Array.isArray(data.columns) ? data.columns : [];
      await snapshotWidget(
        "dashboard/dtr-voltage-unbalance-details",
        "/indore/dashboard/dtr/voltage-unbalance-details",
        responseBody,
        columns,
      );
    },
  );

  test(
    "DTR power on/off list — response shape stays the same",
    {
      tag: [
        "@contract-snapshot",
        "@dashboard",
        "@dtr-power-status-details",
      ],
    },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DtrPowerStatusDetailsApi(
        authenticatedApi,
      ).getDtrPowerStatusDetails({
        status: "on",
        page: 1,
        limit: 10,
      });
      const data = asRecord(asRecord(responseBody).data);
      const columns = Array.isArray(data.columns) ? data.columns : [];
      await snapshotWidget(
        "dashboard/dtr-power-status-details",
        "/indore/dashboard/dtr/power-status-details",
        responseBody,
        columns,
      );
    },
  );

  test(
    "DTR communication list — response shape stays the same",
    {
      tag: [
        "@contract-snapshot",
        "@dashboard",
        "@dtr-communication-details",
      ],
    },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DtrCommunicationDetailsApi(
        authenticatedApi,
      ).getDtrCommunicationDetails({
        status: "non-communicated",
        page: 1,
        limit: 10,
      });
      const data = asRecord(asRecord(responseBody).data);
      const columns = Array.isArray(data.columns) ? data.columns : [];
      await snapshotWidget(
        "dashboard/dtr-communication-details",
        "/indore/dashboard/dtr/communication-details",
        responseBody,
        columns,
      );
    },
  );

  test(
    "DTR consumption list — response shape stays the same",
    {
      tag: [
        "@contract-snapshot",
        "@dashboard",
        "@dtr-consumption-details",
      ],
    },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DtrConsumptionDetailsApi(
        authenticatedApi,
      ).getDtrConsumptionDetails({
        kind: "kwh",
        page: 1,
        limit: 10,
      });
      const data = asRecord(asRecord(responseBody).data);
      const columns = Array.isArray(data.columns) ? data.columns : [];
      await snapshotWidget(
        "dashboard/dtr-consumption-details",
        "/indore/dashboard/dtr/consumption-details",
        responseBody,
        columns,
      );
    },
  );

  test(
    "DTR loading list — response shape stays the same",
    {
      tag: [
        "@contract-snapshot",
        "@dashboard",
        "@dtr-percentage-loading-details",
      ],
    },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DtrPercentageLoadingDetailsApi(
        authenticatedApi,
      ).getDtrPercentageLoadingDetails({
        band: "critical",
        page: 1,
        limit: 10,
      });
      const data = asRecord(asRecord(responseBody).data);
      const columns = Array.isArray(data.columns) ? data.columns : [];
      await snapshotWidget(
        "dashboard/dtr-percentage-loading-details",
        "/indore/dashboard/dtr/percentage-loading-details",
        responseBody,
        columns,
      );
    },
  );

  test(
    "Consumers by connection status — response shape stays the same",
    {
      tag: [
        "@contract-snapshot",
        "@dashboard",
        "@consumer-connection-status",
      ],
    },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new ConsumerConnectionStatusApi(
        authenticatedApi,
      ).getConsumerConnectionStatus({
        status: "connected",
        page: 1,
        limit: 20,
      });
      const data = asRecord(asRecord(responseBody).data);
      const columns = Array.isArray(data.columns) ? data.columns : [];
      await snapshotWidget(
        "dashboard/consumer-connection-status",
        "/indore/dashboard/consumer/connection-status",
        responseBody,
        columns,
      );
    },
  );

  test(
    "Consumers by category — response shape stays the same",
    {
      tag: [
        "@contract-snapshot",
        "@dashboard",
        "@consumer-category-distribution",
      ],
    },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new ConsumerCategoryDistributionApi(
        authenticatedApi,
      ).getConsumerCategoryDistribution({
        category: "Residential",
        page: 1,
        limit: 20,
      });
      const data = asRecord(asRecord(responseBody).data);
      const columns = Array.isArray(data.columns) ? data.columns : [];
      await snapshotWidget(
        "dashboard/consumer-category-distribution",
        "/indore/dashboard/consumer/category-distribution",
        responseBody,
        columns,
      );
    },
  );

  test(
    "Consumers by meter phase — response shape stays the same",
    {
      tag: [
        "@contract-snapshot",
        "@dashboard",
        "@consumer-phase-distribution",
      ],
    },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new ConsumerPhaseDistributionApi(
        authenticatedApi,
      ).getConsumerPhaseDistribution({
        phase: "1 PH",
        page: 1,
        limit: 20,
      });
      const data = asRecord(asRecord(responseBody).data);
      const columns = Array.isArray(data.columns) ? data.columns : [];
      await snapshotWidget(
        "dashboard/consumer-phase-distribution",
        "/indore/dashboard/consumer/phase-distribution",
        responseBody,
        columns,
      );
    },
  );

  test(
    "Consumers by meter make — response shape stays the same",
    {
      tag: [
        "@contract-snapshot",
        "@dashboard",
        "@consumer-oem-distribution",
      ],
    },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new ConsumerOemDistributionApi(
        authenticatedApi,
      ).getConsumerOemDistribution({
        oem: "L&T",
        page: 1,
        limit: 20,
      });
      const data = asRecord(asRecord(responseBody).data);
      const columns = Array.isArray(data.columns) ? data.columns : [];
      await snapshotWidget(
        "dashboard/consumer-oem-distribution",
        "/indore/dashboard/consumer/oem-distribution",
        responseBody,
        columns,
      );
    },
  );

  test(
    "Revenue subsidy (power factor) — response shape stays the same",
    {
      tag: ["@contract-snapshot", "@dashboard", "@revenue-subsidy-pf"],
    },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new RevenueSubsidyPfApi(
        authenticatedApi,
      ).getRevenueSubsidyPf();
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      // No saved period → data is null. Keep the filled-record snapshot.
      if (body.data == null) {
        return;
      }
      await snapshotWidget(
        "dashboard/revenue-subsidy-pf",
        "/indore/dashboard/revenue-subsidy-pf",
        responseBody,
      );
    },
  );
});
