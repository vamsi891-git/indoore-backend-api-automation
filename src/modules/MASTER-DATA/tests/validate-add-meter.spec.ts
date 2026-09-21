import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { ValidateAddMeterApi } from "../Api/validate-add-meter.api";
import {
  resolveValidateAddMeterSerial,
  validateAddMeterMaxResponseTimeMs,
  validateAddMeterNegativeCases,
  validateAddMeterTestCases,
} from "../Data/validate-add-meter.data";
import { ValidateAddMeterMapper } from "../Mapper/validate-add-meter.mapper";
import { ValidateAddMeterValidator } from "../Validator/validate-add-meter.validator";
import { MasterDataCommonValidator } from "../Validator/master-data-common.validator";
import { ValidateAddMeterSuccessResponseSchema } from "../schemas/master-data.schemas";
import { ensureValidateMeterRuntimeContext } from "../utils/validate-meter-runtime.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Master data — can this meter serial be added?", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test.beforeAll(async ({ authenticatedApi }) => {
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    await ensureValidateMeterRuntimeContext(authenticatedApi);
  });

  for (const testCase of validateAddMeterTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const meterSerialNumber = resolveValidateAddMeterSerial(testCase.scenario);
      if (!meterSerialNumber) {
        test.skip(
          true,
          `Could not resolve ${testCase.envKey} at runtime (provision or set .env override)`,
        );
        return;
      }

      const api = new ValidateAddMeterApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.validateAddMeter({
        meterSerialNumber,
      });

      await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime,
      );

      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new ValidateAddMeterValidator();
      const mapped = ValidateAddMeterMapper.map(responseBody);

      validation.execute("Status Validation", () => assert.validateStatusCode(rawResponse, 200));
      validation.execute("Content Validation", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, validateAddMeterMaxResponseTimeMs),
      );
      validation.execute("Security Validation", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );
      validation.execute("Zod Response Schema", () =>
        MasterDataCommonValidator.validateZodResponseSchema(
          responseBody,
          ValidateAddMeterSuccessResponseSchema,
        ),
      );
      validation.execute("Response", () => validator.validateResponse(mapped));
      validation.execute("Root Structure", () => validator.validateRootStructure(mapped.data));
      validation.execute("Reason Type", () => validator.validateReasonType(mapped.data));
      validation.execute("Message Type", () => validator.validateMessageType(mapped.data));
      validation.execute("Valid Reason Consistency", () =>
        validator.validateValidReasonConsistency(mapped.data),
      );
      validation.execute("Scenario Outcome", () =>
        validator.validateScenario(mapped, testCase.scenario),
      );

      validation.printSummary(testCase.testName, responseTime);
    });
  }

  for (const testCase of validateAddMeterNegativeCases) {
    test(testCase.testName, { tag: [...testCase.tags] }, async ({ authenticatedApi }) => {
      const start = Date.now();
      const api = new ValidateAddMeterApi(authenticatedApi);
      const validator = new ValidateAddMeterValidator();
      const validation = new ApiValidationHelper();

      let status: number;
      let body: {
        success?: boolean;
        error?: { code?: string; message?: string };
      };
      let responseTime: number;
      let url: string;

      if (testCase.meterSerialNumber == null) {
        const raw = await getWithAutoRefresh(
          authenticatedApi,
          "/indore/master-data/validate-add-meter",
        );
        status = raw.status();
        body = (await raw.json()) as typeof body;
        responseTime = Date.now() - start;
        url = raw.url();
        await PerformanceTracker.track(raw, testCase.testName, url, responseTime);
      } else {
        const {
          rawResponse,
          responseBody,
          responseTime: rt,
        } = await api.validateAddMeter({
          meterSerialNumber: testCase.meterSerialNumber,
        });
        status = rawResponse.status();
        body = responseBody as typeof body;
        responseTime = rt;
        url = rawResponse.url();
        await PerformanceTracker.track(rawResponse, testCase.testName, url, responseTime);
      }

      validation.execute("Validation Error Envelope", () =>
        validator.validateValidationError(status, body),
      );
      validation.printSummary(testCase.testName, responseTime);
    });
  }
});
