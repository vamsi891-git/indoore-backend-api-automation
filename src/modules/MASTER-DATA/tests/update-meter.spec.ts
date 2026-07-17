import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { CreateMeterApi } from "../Api/create-meter.api";
import { UpdateMeterApi } from "../Api/update-meter.api";
import { buildCreateMeterRequest } from "../Data/create-meter.data";
import {
  updateMeterMaxResponseTimeMs,
  updateMeterTestCases,
} from "../Data/update-meter.data";
import { UpdateMeterMapper } from "../Mapper/update-meter.mapper";
import { UpdateMeterValidator } from "../Validator/update-meter.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import { UpdateMeterSuccessResponseSchema } from "../schemas/master-data.schemas";
import { ensureMeterManufacturerContext } from "../utils/meter-manufacturer.helper";
import { assertNegativeMasterDataHttpStatus } from "../utils/master-data-negative-outcome.helper";

const SUCCESS_SCENARIOS = new Set(["success", "success_toggle_inactive"]);

test.describe("Update Meter API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureMeterManufacturerContext(authenticatedApi);
  });

  test.afterEach(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
  });

  for (const testCase of updateMeterTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        let meterLookupTblRefId = testCase.meterLookupTblRefId ?? 0;
        let baseCreatePayload = buildCreateMeterRequest();

        if (testCase.provisionMeter) {
          const createApi = new CreateMeterApi(authenticatedApi);
          const created = await createApi.createMeter(baseCreatePayload);
          expect(
            created.rawResponse.status(),
            `Create meter failed: ${JSON.stringify(created.responseBody)}`,
          ).toBe(201);
          expect(created.responseBody.data?.meterLookupTblRefId).toBeTruthy();
          meterLookupTblRefId =
            created.responseBody.data!.meterLookupTblRefId;
        }

        const requestBody = testCase.buildPayload(baseCreatePayload);
        const api = new UpdateMeterApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.updateMeter(meterLookupTblRefId, requestBody);

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new UpdateMeterValidator();
        const mapped = UpdateMeterMapper.map(responseBody);

        validation.execute("Status Validation", () => {
          if (SUCCESS_SCENARIOS.has(testCase.scenario)) {
            expect(rawResponse.status()).toBe(testCase.expectedStatus);
            return;
          }
          assertNegativeMasterDataHttpStatus(
            rawResponse,
            testCase.expectedStatus,
          );
        });
        validation.execute("Content Validation", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            updateMeterMaxResponseTimeMs,
          ),
        );
        validation.execute("Security Validation", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (SUCCESS_SCENARIOS.has(testCase.scenario)) {
          validation.execute("Zod Response Schema", () =>
            MasterDataCommonValidator.validateZodResponseSchema(
              responseBody,
              UpdateMeterSuccessResponseSchema,
            ),
          );
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(responseBody, [
              "success",
              "message",
              "data",
            ]),
          );
        } else {
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(responseBody, ["success", "error"]),
          );
        }

        validation.execute("Response", () => validator.validateResponse(mapped));
        validation.execute("Scenario Outcome", () =>
          validator.validateScenario(
            mapped,
            testCase.scenario,
            requestBody,
            meterLookupTblRefId,
            testCase.validationField,
          ),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
