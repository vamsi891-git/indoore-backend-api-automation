import { test } from "../../../fixtures/api.fixture";
import { MeterCommunicationStatusApi } from "../Api/meter-communication-status.api";
import {
  masterDataDefaultQuery,
  masterDataPage2Query,
  masterDataSmallPageQuery,
} from "../Data/master-data.common.data";
import { meterCommunicationUnknownFilterQuery } from "../Data/meter-communication-status.data";
import { runMeterCommunicationValidation } from "./meter-communication-status.harness";

test.describe("Meter Communication Status API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(180_000);

  test(
    "Validate GET /indore/master-data/meter-communication-status — default page",
    { tag: ["@smoke", "@master-data", "@meter-communication"] },
    async ({ authenticatedApi }) => {
      const api = new MeterCommunicationStatusApi(authenticatedApi);
      await runMeterCommunicationValidation({
        api,
        query: { ...masterDataDefaultQuery },
        testLabel: "Meter Communication Status API",
      });
    },
  );

  test(
    "Validate pagination — page 2",
    { tag: ["@master-data", "@meter-communication"] },
    async ({ authenticatedApi }) => {
      const api = new MeterCommunicationStatusApi(authenticatedApi);
      await runMeterCommunicationValidation({
        api,
        query: { ...masterDataPage2Query },
        testLabel: "Meter Communication Status API — Page 2",
      });
    },
  );

  test(
    "Validate pagination — smaller page size",
    { tag: ["@master-data", "@meter-communication"] },
    async ({ authenticatedApi }) => {
      const api = new MeterCommunicationStatusApi(authenticatedApi);
      await runMeterCommunicationValidation({
        api,
        query: { ...masterDataSmallPageQuery },
        testLabel: "Meter Communication Status API — Limit 10",
      });
    },
  );

  test(
    "Validate communicationStatus filter — unknown",
    { tag: ["@master-data", "@meter-communication"] },
    async ({ authenticatedApi }) => {
      const api = new MeterCommunicationStatusApi(authenticatedApi);
      await runMeterCommunicationValidation({
        api,
        query: { ...meterCommunicationUnknownFilterQuery },
        testLabel: "Meter Communication Status API — Filter Unknown",
        communicationStatusFilter: "unknown",
      });
    },
  );

  test(
    "Validate search q — meter serial partial match",
    { tag: ["@master-data", "@meter-communication"] },
    async ({ authenticatedApi }) => {
      const api = new MeterCommunicationStatusApi(authenticatedApi);
      const probe = await api.getMeterCommunicationStatus({
        ...masterDataDefaultQuery,
      });
      const firstNonNullSerial = (probe.responseBody.data?.rows ?? []).find(
        (row) => row.meterSerialNumber?.trim(),
      )?.meterSerialNumber;

      if (!firstNonNullSerial) {
        test.skip(true, "No meter serial on page 1 to run search validation");
        return;
      }

      const searchTerm = firstNonNullSerial.slice(0, 6);
      await runMeterCommunicationValidation({
        api,
        query: { ...masterDataDefaultQuery, q: searchTerm },
        testLabel: "Meter Communication Status API — Search",
        searchTerm,
        skipCommunicatingTimestampCheck: true,
      });
    },
  );

  test(
    "Validate organisationLookupId filter when MDM_METER_COMM_ORG_LOOKUP_ID is set",
    { tag: ["@master-data", "@meter-communication"] },
    async ({ authenticatedApi }) => {
      const orgId = Number(process.env.MDM_METER_COMM_ORG_LOOKUP_ID);
      test.skip(
        !orgId || Number.isNaN(orgId),
        "Set MDM_METER_COMM_ORG_LOOKUP_ID to run org-scoped validation",
      );

      const api = new MeterCommunicationStatusApi(authenticatedApi);
      await runMeterCommunicationValidation({
        api,
        query: { ...masterDataDefaultQuery, organisationLookupId: orgId },
        testLabel: "Meter Communication Status API — Organisation Filter",
        skipCommunicatingTimestampCheck: true,
      });
    },
  );

  test(
    "Validate networkLookupId filter when MDM_METER_COMM_NETWORK_LOOKUP_ID is set",
    { tag: ["@master-data", "@meter-communication"] },
    async ({ authenticatedApi }) => {
      const networkId = Number(process.env.MDM_METER_COMM_NETWORK_LOOKUP_ID);
      test.skip(
        !networkId || Number.isNaN(networkId),
        "Set MDM_METER_COMM_NETWORK_LOOKUP_ID to run network-scoped validation",
      );

      const api = new MeterCommunicationStatusApi(authenticatedApi);
      await runMeterCommunicationValidation({
        api,
        query: { ...masterDataDefaultQuery, networkLookupId: networkId },
        testLabel: "Meter Communication Status API — Network Filter",
        skipCommunicatingTimestampCheck: true,
      });
    },
  );
});
