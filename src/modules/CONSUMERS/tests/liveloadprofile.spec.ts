import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { LiveLoadProfileApi } from "../Api/liveloadprofile.api";
import {
  liveLoadProfileMaxResponseTimeMs,
  liveLoadProfileTestCases,
  resolveLiveLoadProfileContractBody,
  resolveLiveLoadProfileQuery,
  resolveLiveLoadProfileRef,
} from "../Data/liveloadprofile.data";
import {
  LiveLoadProfileMapper,
  type LiveLoadProfileErrorResponse,
} from "../Mapper/liveloadprofile.mapper";
import { LiveLoadProfileValidator } from "../Validator/liveloadprofile.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Live load", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of liveLoadProfileTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const expectedStatus = testCase.expectedStatus ?? 200;
      const validator = new LiveLoadProfileValidator();
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      if (testCase.isContractFixture) {
        const fixtureBody = resolveLiveLoadProfileContractBody(testCase.scenario);
        if (!fixtureBody) {
          test.skip(true, "Missing live-load-profile contract fixture body");
          return;
        }

        const mapped = LiveLoadProfileMapper.map(fixtureBody);
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(fixtureBody, ["success", "data"]),
        );
        validation.execute("Contract Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );
        validation.printSummary(testCase.testName, 0);
        return;
      }

      const api = new LiveLoadProfileApi(authenticatedApi);
      const consumerRef = resolveLiveLoadProfileRef(testCase.scenario);

      if (!consumerRef) {
        test.skip(true, "Could not resolve live-load-profile route ref");
        return;
      }

      const query = resolveLiveLoadProfileQuery(testCase.scenario);
      const { rawResponse, responseBody, responseTime } = await api.getLiveLoadProfile(
        consumerRef,
        query,
      );

      await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime,
      );

      validation.execute("Status Validation", () => {
        if (testCase.scenario === "meter_not_found" || testCase.scenario === "consumer_not_found") {
          expect([200, 404]).toContain(rawResponse.status());
          return;
        }
        assert.validateStatusCode(rawResponse, expectedStatus, responseBody);
      });
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, liveLoadProfileMaxResponseTimeMs),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      if (expectedStatus === 404) {
        validation.execute("Not Found Error", () =>
          validator.validateNotFoundError(responseBody as LiveLoadProfileErrorResponse),
        );
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      if (testCase.scenario === "meter_not_found" && rawResponse.status() === 404) {
        validation.execute("Not Found Error", () =>
          validator.validateNotFoundError(responseBody as LiveLoadProfileErrorResponse),
        );
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      if (testCase.scenario === "consumer_not_found" && rawResponse.status() === 404) {
        validation.execute("Not Found Error", () =>
          validator.validateNotFoundError(responseBody as LiveLoadProfileErrorResponse),
        );
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      if (expectedStatus === 400) {
        validation.execute("Blank Ref Validation Error", () =>
          validator.validateBlankRefError(responseBody as LiveLoadProfileErrorResponse),
        );
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );

      const mapped = LiveLoadProfileMapper.map(responseBody);
      if (mapped.data) {
        validation.execute("No Duplicate Metric Titles", () =>
          validator.validateUniqueMetricTitles(mapped.data!),
        );
      }
      validation.execute("Live Load Profile Scenario", () =>
        validator.validateScenario(mapped, testCase.scenario),
      );

      validation.printSummary(testCase.testName, responseTime);
    });
  }
});
