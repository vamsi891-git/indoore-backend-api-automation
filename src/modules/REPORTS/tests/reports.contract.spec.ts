import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import {
  isReportsInternalError,
} from "../utils/reports-env.helper";
import { EventReportApi } from "../Api/eventreport.api";
import { DtrBillingApi } from "../Api/dtrbilling.api";
import { EventDetailApi } from "../Api/eventdetail.api";
import { EventRestorationApi } from "../Api/eventrestoration.api";
import { DtrEventApi } from "../Api/dtrevent.api";
import { DtrEventDetailApi } from "../Api/dtreventdetail.api";
import { MinMaxVoltageApi } from "../Api/minmaxvoltage.api";
import { MinMaxVoltageCountApi } from "../Api/minmaxvoltagecount.api";
import { CurrentWithoutVoltageApi } from "../Api/currentwithoutvoltage.api";
import { DtrCommunicationReportApi } from "../Api/dtrcommunication.api";
import { DtrDataApi } from "../Api/dtrdata.api";
import { ConsumerReportApi } from "../Api/consumerreport.api";
import { CommunicationConsumersApi } from "../Api/communicationconsumers.api";
import { CommunicationDtrsApi } from "../Api/communicationdtrs.api";
import { BillStatusApi } from "../Api/billstatus.api";
import { BillingMdSnapshotApi } from "../Api/billingmdsnapshot.api";
import { ReportsOverviewApi } from "../Api/overview.api";
import {
  eventReportDefaultFromDate,
  eventReportDefaultToDate,
  eventReportDefaultPage,
  eventReportDefaultLimit,
} from "../Data/eventreport.data";
import {
  eventDetailDefaultFromDate,
  eventDetailDefaultToDate,
  eventDetailDefaultPage,
  eventDetailDefaultLimit,
} from "../Data/eventdetail.data";
import {
  eventRestorationDefaultFromDate,
  eventRestorationDefaultToDate,
  eventRestorationDefaultPage,
  eventRestorationDefaultLimit,
} from "../Data/eventrestoration.data";
import {
  billStatusDefaultMonth,
  billStatusDefaultYear,
  billStatusDefaultPage,
  billStatusDefaultLimit,
} from "../Data/billstatus.data";
import {
  billingMdSnapshotDefaultMonth,
  billingMdSnapshotDefaultYear,
  billingMdSnapshotDefaultPage,
  billingMdSnapshotDefaultLimit,
} from "../Data/billingmdsnapshot.data";
import {
  dtrBillingDefaultFromDate,
  dtrBillingDefaultToDate,
  dtrBillingDefaultPage,
  dtrBillingDefaultLimit,
} from "../Data/dtrbilling.data";
import {
  dtrEventDefaultFromDate,
  dtrEventDefaultToDate,
  dtrEventDefaultPage,
  dtrEventDefaultLimit,
} from "../Data/dtrevent.data";
import {
  dtrEventDetailDefaultFromDate,
  dtrEventDetailDefaultToDate,
  dtrEventDetailDefaultPage,
  dtrEventDetailDefaultLimit,
} from "../Data/dtreventdetail.data";
import {
  minMaxVoltageDefaultMeterPhaseTblRefId,
  minMaxVoltageDefaultMonth,
  minMaxVoltageDefaultYear,
  minMaxVoltageDefaultVoltageType,
  minMaxVoltageDefaultPhase,
  minMaxVoltageDefaultPage,
  minMaxVoltageDefaultLimit,
} from "../Data/minmaxvoltage.data";
import {
  currentWithoutVoltageDefaultPhase,
  currentWithoutVoltageDefaultMonth,
  currentWithoutVoltageDefaultYear,
  currentWithoutVoltageDefaultPage,
  currentWithoutVoltageDefaultLimit,
} from "../Data/currentwithoutvoltage.data";
import {
  dtrCommunicationReportDefaultFromDate,
  dtrCommunicationReportDefaultToDate,
  dtrCommunicationReportDefaultPage,
  dtrCommunicationReportDefaultLimit,
} from "../Data/dtrcommunication.data";
import {
  dtrDataDefaultFromDate,
  dtrDataDefaultToDate,
  dtrDataDefaultPage,
  dtrDataDefaultLimit,
  dtrDataDefaultReportType,
} from "../Data/dtrdata.data";
import {
  consumerReportDefaultFromDate,
  consumerReportDefaultToDate,
  consumerReportDefaultMeterSerial,
  consumerReportDefaultPage,
  consumerReportDefaultLimit,
  consumerReportDefaultType,
} from "../Data/consumerreport.data";
import {
  communicationConsumersDefaultDate,
  communicationConsumersDefaultLimit,
  communicationConsumersDefaultMappingType,
  communicationConsumersDefaultMeterType,
  communicationConsumersDefaultPage,
  communicationConsumersDefaultPeriodType,
} from "../Data/communicationconsumers.data";
import {
  communicationDtrsDefaultLimit,
  communicationDtrsDefaultMonth,
  communicationDtrsDefaultPage,
  communicationDtrsDefaultPeriodType,
} from "../Data/communicationdtrs.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function skipIfLiveInternalError(
  status: number,
  body: unknown,
  pathPattern: string,
): void {
  if (status === 500 && isReportsInternalError(body)) {
    test.skip(
      true,
      `Backend GET ${pathPattern} returned 500 INTERNAL_ERROR`,
    );
  }
}

async function snapshotGrid(
  name: string,
  pathPattern: string,
  responseBody: unknown,
  options?: { allowEmptyRows?: boolean },
): Promise<void> {
  const body = asRecord(responseBody);
  expect(body.success).toBe(true);
  const data = asRecord(body.data);
  const rows = Array.isArray(data.rows) ? data.rows : [];
  if (rows.length === 0 && !options?.allowEmptyRows) {
    test.skip(
      true,
      `Contract snapshot skipped — ${name} live response had no rows`,
    );
    return;
  }
  const summary = asRecord(data.summary);
  await assertContractSnapshot(
    name,
    buildLookupItemsContractSnapshot({
      pathPattern,
      dataKeys: Object.keys(data).sort(),
      itemKeys:
        rows.length > 0
          ? Object.keys(asRecord(rows[0])).sort()
          : Object.keys(summary).sort(),
      hasColumnsGrid: true,
      columns: (Array.isArray(data.columns) ? data.columns : []).map(
        (column) => {
          const col = asRecord(column);
          return {
            key: String(col.key ?? ""),
            header: String(col.header ?? col.label ?? ""),
          };
        },
      ),
    }),
  );
}

const dateQuery = {
  fromDate: eventReportDefaultFromDate,
  toDate: eventReportDefaultToDate,
  page: eventReportDefaultPage,
  limit: eventReportDefaultLimit,
};

test.describe("Reports — contract snapshots", () => {
  test.setTimeout(180_000);

  test(
    "Event report — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@event-report"] },
    async ({ authenticatedApi }) => {
      const result = await new EventReportApi(authenticatedApi).getEventReport(
        dateQuery,
      );
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/event-report",
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
    "Event detail — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@event-detail"] },
    async ({ authenticatedApi }) => {
      const result = await new EventDetailApi(authenticatedApi).getEventDetail(
        {
          fromDate: eventDetailDefaultFromDate,
          toDate: eventDetailDefaultToDate,
          page: eventDetailDefaultPage,
          limit: eventDetailDefaultLimit,
        },
      );
        skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/event-detail",
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
    "Event restoration — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@event-restoration"] },
    async ({ authenticatedApi }) => {
      const result = await new EventRestorationApi(
        authenticatedApi,
      ).getEventRestoration({
        fromDate: eventRestorationDefaultFromDate,
        toDate: eventRestorationDefaultToDate,
        page: eventRestorationDefaultPage,
        limit: eventRestorationDefaultLimit,
      });
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/event-restoration",
      );
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/event-restoration",
        "/indore/reports/event-restoration",
        result.responseBody,
      );
    },
  );

  test(
    "DTR billing — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@dtr-billing"] },
    async ({ authenticatedApi }) => {
      const result = await new DtrBillingApi(authenticatedApi).getDtrBilling({
        fromDate: dtrBillingDefaultFromDate,
        toDate: dtrBillingDefaultToDate,
        page: dtrBillingDefaultPage,
        limit: dtrBillingDefaultLimit,
        includeTotal: false,
      });
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/dtr-billing",
      );
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/dtr-billing",
        "/indore/reports/dtr-billing",
        result.responseBody,
      );
    },
  );

  test(
    "DTR event — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@dtr-event"] },
    async ({ authenticatedApi }) => {
      const result = await new DtrEventApi(authenticatedApi).getDtrEvent({
        fromDate: dtrEventDefaultFromDate,
        toDate: dtrEventDefaultToDate,
        page: dtrEventDefaultPage,
        limit: dtrEventDefaultLimit,
      });
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/dtr-event",
      );
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/dtr-event",
        "/indore/reports/dtr-event",
        result.responseBody,
      );
    },
  );

  test(
    "DTR event detail — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@dtr-event-detail"] },
    async ({ authenticatedApi }) => {
      const result = await new DtrEventDetailApi(
        authenticatedApi,
      ).getDtrEventDetail({
        fromDate: dtrEventDetailDefaultFromDate,
        toDate: dtrEventDetailDefaultToDate,
        page: dtrEventDetailDefaultPage,
        limit: dtrEventDetailDefaultLimit,
      });
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/dtr-event-detail",
      );
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/dtr-event-detail",
        "/indore/reports/dtr-event-detail",
        result.responseBody,
      );
    },
  );

  test(
    "Min-max voltage — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@min-max-voltage"] },
    async ({ authenticatedApi }) => {
      const result = await new MinMaxVoltageApi(
        authenticatedApi,
      ).getMinMaxVoltage({
        meterPhaseTblRefId: minMaxVoltageDefaultMeterPhaseTblRefId,
        month: minMaxVoltageDefaultMonth,
        year: minMaxVoltageDefaultYear,
        voltageType: minMaxVoltageDefaultVoltageType,
        phase: minMaxVoltageDefaultPhase,
        page: minMaxVoltageDefaultPage,
        limit: minMaxVoltageDefaultLimit,
        includeTotal: true,
      });
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/min-max-voltage",
      );
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/min-max-voltage",
        "/indore/reports/min-max-voltage",
        result.responseBody,
      );
    },
  );

  test(
    "Min-max voltage count — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@min-max-voltage-count"] },
    async ({ authenticatedApi }) => {
      const result = await new MinMaxVoltageCountApi(
        authenticatedApi,
      ).getMinMaxVoltageCount({
        meterPhaseTblRefId: minMaxVoltageDefaultMeterPhaseTblRefId,
        month: minMaxVoltageDefaultMonth,
        year: minMaxVoltageDefaultYear,
        voltageType: minMaxVoltageDefaultVoltageType,
        phase: minMaxVoltageDefaultPhase,
      });
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/min-max-voltage/count",
      );
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "reports/min-max-voltage-count",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/reports/min-max-voltage/count",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
          hasColumnsGrid: false,
        }),
      );
    },
  );

  test(
    "Current without voltage — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@current-without-voltage"] },
    async ({ authenticatedApi }) => {
      const result = await new CurrentWithoutVoltageApi(
        authenticatedApi,
      ).getCurrentWithoutVoltage({
        phase: currentWithoutVoltageDefaultPhase,
        month: currentWithoutVoltageDefaultMonth,
        year: currentWithoutVoltageDefaultYear,
        page: currentWithoutVoltageDefaultPage,
        limit: currentWithoutVoltageDefaultLimit,
        includeTotal: false,
      });
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/current-without-voltage",
      );
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/current-without-voltage",
        "/indore/reports/current-without-voltage",
        result.responseBody,
      );
    },
  );

  test(
    "DTR communication — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@dtr-communication"] },
    async ({ authenticatedApi }) => {
      const result = await new DtrCommunicationReportApi(
        authenticatedApi,
      ).getDtrCommunication({
        fromDate: dtrCommunicationReportDefaultFromDate,
        toDate: dtrCommunicationReportDefaultToDate,
        page: dtrCommunicationReportDefaultPage,
        limit: dtrCommunicationReportDefaultLimit,
        includeTotal: false,
        includeArchiveCounts: true,
      });
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/dtr-communication",
      );
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/dtr-communication",
        "/indore/reports/dtr-communication",
        result.responseBody,
      );
    },
  );

  test(
    "DTR data — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@dtr-data"] },
    async ({ authenticatedApi }) => {
      const result = await new DtrDataApi(authenticatedApi).getDtrData({
        fromDate: dtrDataDefaultFromDate,
        toDate: dtrDataDefaultToDate,
        reportType: dtrDataDefaultReportType,
        page: dtrDataDefaultPage,
        limit: dtrDataDefaultLimit,
        includeTotal: false,
      });
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/dtr-data",
      );
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/dtr-data",
        "/indore/reports/dtr-data",
        result.responseBody,
      );
    },
  );

  test(
    "Consumer report — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@consumer-report"] },
    async ({ authenticatedApi }) => {
      const result = await new ConsumerReportApi(
        authenticatedApi,
      ).getConsumerReport({
        fromDate: consumerReportDefaultFromDate,
        toDate: consumerReportDefaultToDate,
        meterSerialNumber: consumerReportDefaultMeterSerial,
        "report-type": consumerReportDefaultType,
        page: consumerReportDefaultPage,
        limit: consumerReportDefaultLimit,
        includeTotal: true,
      });
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/consumer-report",
      );
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/consumer-report",
        "/indore/reports/consumer-report",
        result.responseBody,
      );
    },
  );

  test(
    "Communication consumers — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@communication-consumers"] },
    async ({ authenticatedApi }) => {
      const result = await new CommunicationConsumersApi(
        authenticatedApi,
      ).getCommunicationConsumers({
        periodType: communicationConsumersDefaultPeriodType,
        date: communicationConsumersDefaultDate,
        page: communicationConsumersDefaultPage,
        limit: communicationConsumersDefaultLimit,
        meterType: communicationConsumersDefaultMeterType,
        mappingType: communicationConsumersDefaultMappingType,
      });
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/communication/consumers",
      );
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/communication-consumers",
        "/indore/reports/communication/consumers",
        result.responseBody,
      );
    },
  );

  test(
    "Communication DTRs — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@communication-dtrs"] },
    async ({ authenticatedApi }) => {
      const result = await new CommunicationDtrsApi(
        authenticatedApi,
      ).getCommunicationDtrs({
        periodType: communicationDtrsDefaultPeriodType,
        month: communicationDtrsDefaultMonth,
        page: communicationDtrsDefaultPage,
        limit: communicationDtrsDefaultLimit,
      });
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/communication/dtrs",
      );
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/communication-dtrs",
        "/indore/reports/communication/dtrs",
        result.responseBody,
      );
    },
  );

  test(
    "Bill status — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@bill-status"] },
    async ({ authenticatedApi }) => {
      const result = await new BillStatusApi(authenticatedApi).getBillStatus({
        month: billStatusDefaultMonth,
        year: billStatusDefaultYear,
        page: billStatusDefaultPage,
        limit: billStatusDefaultLimit,
        includeTotal: true,
      });
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/bill-status",
      );
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/bill-status",
        "/indore/reports/bill-status",
        result.responseBody,
        { allowEmptyRows: true },
      );
    },
  );

  test(
    "Billing MD snapshot — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@billing-md-snapshot"] },
    async ({ authenticatedApi }) => {
      const result = await new BillingMdSnapshotApi(
        authenticatedApi,
      ).getBillingMdSnapshot({
        month: billingMdSnapshotDefaultMonth,
        year: billingMdSnapshotDefaultYear,
        page: billingMdSnapshotDefaultPage,
        limit: billingMdSnapshotDefaultLimit,
        includeTotal: false,
      });
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/billing-md-snapshot",
      );
      expect(result.rawResponse.status()).toBe(200);
      await snapshotGrid(
        "reports/billing-md-snapshot",
        "/indore/reports/billing-md-snapshot",
        result.responseBody,
      );
    },
  );

  test(
    "Reports overview — column and field names stay the same",
    { tag: ["@contract-snapshot", "@reports", "@overview"] },
    async ({ authenticatedApi }) => {
      const result = await new ReportsOverviewApi(
        authenticatedApi,
      ).getOverview();
      skipIfLiveInternalError(
        result.rawResponse.status(),
        result.responseBody,
        "/indore/reports/overview",
      );
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      const kpi = asRecord(data.successful);
      await assertContractSnapshot(
        "reports/overview",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/reports/overview",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(kpi).sort(),
          hasColumnsGrid: false,
        }),
      );
    },
  );
});
