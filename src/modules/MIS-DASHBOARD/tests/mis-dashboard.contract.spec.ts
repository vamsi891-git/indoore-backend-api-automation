import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { CommStatsApi } from "../Api/communication.api";
import { commStatsQuery } from "../Data/communication.data";
import { CommunicationOverviewApi } from "../Api/communication-overview.api";
import { communicationOverviewQuery } from "../Data/communication-overview.data";
import { CommunicationTrendApi } from "../Api/communication-trend.api";
import { communicationTrendQuery } from "../Data/communication-trend.data";
import { CommunicationCategoryApi } from "../Api/communication-category.api";
import { communicationCategoryQuery } from "../Data/communication-category.data";
import { CommStatsApi as MeterCountApi } from "../Api/communicationstats.api";
import { commStatsQuery as meterCountQuery } from "../Data/communicationstats.data";
import { PriorityOverviewApi } from "../Api/priority-overview.api";
import { priorityOverviewQuery } from "../Data/priority-overview.data";
import { EventClassificationApi } from "../Api/event-classification.api";
import { eventClassificationQuery } from "../Data/event-classification.data";
import { EventDataVoltageApi } from "../Api/eventdatavoltage.api";
import { eventVoltageQuery } from "../Data/eventdatavoltage.data";
import { EventCurrentApi } from "../Api/eventdatacurrent.api";
import { eventCurrentQuery } from "../Data/eventdatacurrent.data";
import { EventPowerApi } from "../Api/eventdatapower.api";
import { eventPowerQuery } from "../Data/eventdatapower.data";
import { EventTransactionApi } from "../Api/eventdatatransaction.api";
import { eventTransactionQuery } from "../Data/eventdatatransaction.data";
import { EventOtherApi } from "../Api/eventdataother.api";
import { eventOtherQuery } from "../Data/eventdataother.data";
import { EventNonRolloverApi } from "../Api/eventdatanonrollover.api";
import { eventNonRolloverQuery } from "../Data/eventdatanonrollover.data";
import { EventPriorityOverviewApi } from "../Api/eventpriorityoverview.api";
import { eventPriorityOverviewQuery } from "../Data/eventpriorityoverview.data";
import { EventDataApi } from "../Api/eventdata.api";
import { eventDataQuery } from "../Data/eventdata.data";
import { EventPriorityApi } from "../Api/eventpriority.api";
import {
  eventPriorityLevels,
  eventPriorityQuery,
  eventPrioritySlug,
  eventPriorityTitle,
} from "../Data/eventpriority.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("Saved screen shape", () => {
  test.setTimeout(180_000);

  test(
    "How meters are talking — saved screen shape",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new CommStatsApi(authenticatedApi).getCommStats({
        ...commStatsQuery,
      });
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/communication",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/communication",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );

  test(
    "Talking vs not talking overview — saved screen shape",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new CommunicationOverviewApi(authenticatedApi).getOverview(
        { ...communicationOverviewQuery },
      );
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/communication-overview",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/communication-overview",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );

  test(
    "Daily talking chart — saved screen shape",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new CommunicationTrendApi(authenticatedApi).getTrend({
        ...communicationTrendQuery,
      });
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/communication-trend",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/communication-trend",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );

  test(
    "Talking meters by category — saved screen shape",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new CommunicationCategoryApi(authenticatedApi).getCategories(
        { ...communicationCategoryQuery },
      );
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/communication-category",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/communication-category",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );

  test(
    "How many meters we have — saved screen shape",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new MeterCountApi(authenticatedApi).getCommStats({
        ...meterCountQuery,
      });
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/comm-stats",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/comm-stats",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );

  test(
    "How many events by urgency — saved screen shape",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new PriorityOverviewApi(authenticatedApi).getPriorityOverview(
        { ...priorityOverviewQuery },
      );
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/priority-overview",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/priority-overview",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );

  test(
    "What kinds of events happened — saved screen shape",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new EventClassificationApi(authenticatedApi).getEventClassification(
        { ...eventClassificationQuery },
      );
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/event-data-classification",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/event-data/classification",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );

  test(
    "Voltage problems — saved screen shape",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new EventDataVoltageApi(authenticatedApi).getVoltageData({
        ...eventVoltageQuery,
      });
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/event-data-voltage",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/event-data/voltage",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );

  test(
    "Current problems — saved screen shape",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new EventCurrentApi(authenticatedApi).getCurrentData({
        ...eventCurrentQuery,
      });
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/event-data-current",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/event-data/current",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );

  test(
    "Power problems — saved screen shape",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new EventPowerApi(authenticatedApi).getPowerData({
        ...eventPowerQuery,
      });
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/event-data-power",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/event-data/power",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );

  test(
    "Meter transaction events — saved screen shape",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new EventTransactionApi(authenticatedApi).getTransactionData({
        ...eventTransactionQuery,
      });
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/event-data-transaction",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/event-data/transaction",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );

  test(
    "Other events — saved screen shape",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new EventOtherApi(authenticatedApi).getOtherData({
        ...eventOtherQuery,
      });
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/event-data-other",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/event-data/other",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );

  test(
    "Events that did not roll over — saved screen shape",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new EventNonRolloverApi(
        authenticatedApi,
      ).getNonRolloverData({
        ...eventNonRolloverQuery,
      });
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/event-data-non-rollover",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/event-data/non-rollover-control",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );

  test(
    "Urgency today versus yesterday — saved screen shape",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new EventPriorityOverviewApi(
        authenticatedApi,
      ).getPriorityOverview({
        ...eventPriorityOverviewQuery,
      });
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/event-data-priority-wise",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/event-data/priority-wise",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );

  test(
    "Event summary — saved screen shape",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new EventDataApi(authenticatedApi).getEventData({
        ...eventDataQuery,
      });
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/event-data",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/event-data",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );

  for (const level of eventPriorityLevels) {
    test(
      `${eventPriorityTitle(level)} — saved screen shape`,
      { tag: ["@contract-snapshot", "@mis-dashboard"] },
      async ({ authenticatedApi }) => {
        const slug = eventPrioritySlug(level);
        const result = await new EventPriorityApi(
          authenticatedApi,
        ).getPriorityData(slug, { ...eventPriorityQuery });
        expect(result.rawResponse.status()).toBe(200);
        const body = asRecord(result.responseBody);
        expect(body.success).toBe(true);
        const data = asRecord(body.data);
        await assertContractSnapshot(
          `mis-dashboard/event-data-priority-${level}`,
          buildLookupItemsContractSnapshot({
            pathPattern: `/indore/mis-dashboard/event-data/priority-wise/${slug}`,
            dataKeys: Object.keys(data).sort(),
            itemKeys: Object.keys(data).sort(),
          }),
        );
      },
    );
  }
});

