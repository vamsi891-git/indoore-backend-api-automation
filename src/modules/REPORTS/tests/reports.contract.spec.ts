import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { EventReportApi } from "../Api/eventreport.api";
import { DtrBillingApi } from "../Api/dtrbilling.api";
import { EventDetailApi } from "../Api/eventdetail.api";
import { DtrEventApi } from "../Api/dtrevent.api";
import {
  eventReportDefaultFromDate,
  eventReportDefaultToDate,
  eventReportDefaultPage,
  eventReportDefaultLimit,
} from "../Data/eventreport.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

async function snapshotGrid(
  name: string,
  pathPattern: string,
  responseBody: unknown,
): Promise<void> {
  const body = asRecord(responseBody);
  expect(body.success).toBe(true);
  const data = asRecord(body.data);
  const rows = Array.isArray(data.rows) ? data.rows : [];
  await assertContractSnapshot(
    name,
    buildLookupItemsContractSnapshot({
      pathPattern,
      dataKeys: Object.keys(data).sort(),
      itemKeys: rows.length > 0 ? Object.keys(asRecord(rows[0])).sort() : [],
    }),
  );
}

const dateQuery = {
  fromDate: eventReportDefaultFromDate,
  toDate: eventReportDefaultToDate,
  page: eventReportDefaultPage,
  limit: eventReportDefaultLimit,
};

test.describe("REPORTS — Contract Snapshots", () => {
  test.setTimeout(180_000);

  test(
    "Event Report Contract Snapshot",
    { tag: ["@contract-snapshot", "@reports", "@event-report"] },
    async ({ authenticatedApi }) => {
      const result = await new EventReportApi(authenticatedApi).getEventReport(
        dateQuery,
      );
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/event-report",
        "/indore/reports/event-report",
        result.responseBody,
      );
    },
  );

  test(
    "Event Detail Contract Snapshot",
    { tag: ["@contract-snapshot", "@reports", "@event-detail"] },
    async ({ authenticatedApi }) => {
      const result = await new EventDetailApi(authenticatedApi).getEventDetail(
        dateQuery,
      );
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/event-detail",
        "/indore/reports/event-detail",
        result.responseBody,
      );
    },
  );

  test(
    "DTR Billing Contract Snapshot",
    { tag: ["@contract-snapshot", "@reports", "@dtr-billing"] },
    async ({ authenticatedApi }) => {
      const result = await new DtrBillingApi(authenticatedApi).getDtrBilling({
        ...dateQuery,
        includeTotal: true,
      });
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/dtr-billing",
        "/indore/reports/dtr-billing",
        result.responseBody,
      );
    },
  );

  test(
    "DTR Event Contract Snapshot",
    { tag: ["@contract-snapshot", "@reports", "@dtr-event"] },
    async ({ authenticatedApi }) => {
      const result = await new DtrEventApi(authenticatedApi).getDtrEvent(dateQuery);
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/dtr-event",
        "/indore/reports/dtr-event",
        result.responseBody,
      );
    },
  );
});
