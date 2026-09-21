import { test } from "../../../fixtures/api.fixture";
import { MeterCommunicationStatusApi } from "../Api/meter-communication-status.api";
import {
  meterCommunicationDefaultQuery,
  meterCommunicationTestCases,
  meterCommunicationUnknownFilterQuery,
} from "../Data/meter-communication-status.data";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import { MasterDataErrorResponseSchema } from "../schemas/master-data.schemas";
import { runMeterCommunicationValidation } from "./meter-communication-status.harness";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Master data — meter communication", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(180_000);

  for (const testCase of meterCommunicationTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new MeterCommunicationStatusApi(authenticatedApi);
      await runMeterCommunicationValidation({
        api,
        query: { ...testCase.query },
        testLabel: testCase.testName,
        searchTerm: testCase.searchTerm,
        communicationStatusFilter: testCase.communicationStatusFilter,
        skipCommunicatingTimestampCheck: testCase.skipCommunicatingTimestampCheck === true,
      });
    });
  }

  test(
    "Meter communication — an unknown filter is rejected",
    { tag: ["@master-data", "@meter-communication"] },
    async ({ authenticatedApi }) => {
      const api = new MeterCommunicationStatusApi(authenticatedApi);
      const { rawResponse, responseBody } = await api.getMeterCommunicationStatus(
        meterCommunicationUnknownFilterQuery,
      );

      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Zod Error Schema", () =>
        MasterDataCommonValidator.validateZodResponseSchema(
          responseBody,
          MasterDataErrorResponseSchema,
        ),
      );
      validation.execute("Security Validation", () => assert.validateSensitiveData(responseBody));
      validation.printSummary("Meter Communication Status API — Unknown Filter Rejected", 0);
    },
  );

  const orgLookupId = Number(process.env.MDM_METER_COMM_ORG_LOOKUP_ID);
  if (orgLookupId && !Number.isNaN(orgLookupId)) {
    test(
      "Meter communication — organisation filter works when it is set",
      { tag: ["@master-data", "@meter-communication"] },
      async ({ authenticatedApi }) => {
        const api = new MeterCommunicationStatusApi(authenticatedApi);
        await runMeterCommunicationValidation({
          api,
          query: { ...meterCommunicationDefaultQuery, organisationLookupId: orgLookupId },
          testLabel: "Meter Communication Status API — Organisation Filter",
          skipCommunicatingTimestampCheck: true,
        });
      },
    );
  }

  const networkLookupId = Number(process.env.MDM_METER_COMM_NETWORK_LOOKUP_ID);
  if (networkLookupId && !Number.isNaN(networkLookupId)) {
    test(
      "Meter communication — network filter works when it is set",
      { tag: ["@master-data", "@meter-communication"] },
      async ({ authenticatedApi }) => {
        const api = new MeterCommunicationStatusApi(authenticatedApi);
        await runMeterCommunicationValidation({
          api,
          query: { ...meterCommunicationDefaultQuery, networkLookupId: networkLookupId },
          testLabel: "Meter Communication Status API — Network Filter",
          skipCommunicatingTimestampCheck: true,
        });
      },
    );
  }
});
