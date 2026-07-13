import { test } from "../../../fixtures/api.fixture";
import { MeterCommunicationStatusApi } from "../Api/meter-communication-status.api";
import {
  masterDataDefaultQuery,
  masterDataPage2Query,
  masterDataSmallPageQuery,
} from "../Data/master-data.common.data";
import {
  meterCommunicationCommunicatingFilterQuery,
  meterCommunicationNonCommunicatingFilterQuery,
  meterCommunicationUnknownFilterQuery,
} from "../Data/meter-communication-status.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import { MasterDataErrorResponseSchema } from "../schemas/master-data.schemas";
import { runMeterCommunicationValidation } from "./meter-communication-status.harness";

test.describe("Meter Communication Status API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(180_000);

  test(
    "Validate meter communication status — default page",
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
    "Validate communicationStatus filter — communicating",
    { tag: ["@master-data", "@meter-communication"] },
    async ({ authenticatedApi }) => {
      const api = new MeterCommunicationStatusApi(authenticatedApi);
      await runMeterCommunicationValidation({
        api,
        query: { ...meterCommunicationCommunicatingFilterQuery },
        testLabel: "Meter Communication Status API — Filter Communicating",
        communicationStatusFilter: "communicating",
        skipCommunicatingTimestampCheck: true,
      });
    },
  );

  test(
    "Validate communicationStatus filter — non-communicating",
    { tag: ["@master-data", "@meter-communication"] },
    async ({ authenticatedApi }) => {
      const api = new MeterCommunicationStatusApi(authenticatedApi);
      await runMeterCommunicationValidation({
        api,
        query: { ...meterCommunicationNonCommunicatingFilterQuery },
        testLabel: "Meter Communication Status API — Filter Non-Communicating",
        communicationStatusFilter: "non-communicating",
      });
    },
  );

  test(
    "Reject communicationStatus filter — unknown query param returns 400",
    { tag: ["@master-data", "@meter-communication"] },
    async ({ authenticatedApi }) => {
      const api = new MeterCommunicationStatusApi(authenticatedApi);
      const { rawResponse, responseBody } = await api.getMeterCommunicationStatus(
        meterCommunicationUnknownFilterQuery,
      );

      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Zod Error Schema", () =>
        MasterDataCommonValidator.validateZodResponseSchema(
          responseBody,
          MasterDataErrorResponseSchema,
        ),
      );
      validation.execute("Security Validation", () =>
        assert.validateSensitiveData(responseBody),
      );
      validation.printSummary(
        "Meter Communication Status API — Unknown Filter Rejected",
        0,
      );
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

  const orgLookupId = Number(process.env.MDM_METER_COMM_ORG_LOOKUP_ID);
  if (orgLookupId && !Number.isNaN(orgLookupId)) {
    test(
      "Validate organisationLookupId filter when MDM_METER_COMM_ORG_LOOKUP_ID is set",
      { tag: ["@master-data", "@meter-communication"] },
      async ({ authenticatedApi }) => {
        const api = new MeterCommunicationStatusApi(authenticatedApi);
        await runMeterCommunicationValidation({
          api,
          query: { ...masterDataDefaultQuery, organisationLookupId: orgLookupId },
          testLabel: "Meter Communication Status API — Organisation Filter",
          skipCommunicatingTimestampCheck: true,
        });
      },
    );
  }

  const networkLookupId = Number(process.env.MDM_METER_COMM_NETWORK_LOOKUP_ID);
  if (networkLookupId && !Number.isNaN(networkLookupId)) {
    test(
      "Validate networkLookupId filter when MDM_METER_COMM_NETWORK_LOOKUP_ID is set",
      { tag: ["@master-data", "@meter-communication"] },
      async ({ authenticatedApi }) => {
        const api = new MeterCommunicationStatusApi(authenticatedApi);
        await runMeterCommunicationValidation({
          api,
          query: { ...masterDataDefaultQuery, networkLookupId: networkLookupId },
          testLabel: "Meter Communication Status API — Network Filter",
          skipCommunicatingTimestampCheck: true,
        });
      },
    );
  }
});
