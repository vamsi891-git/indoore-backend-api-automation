import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrFeedersApi } from "../Api/dtrfeeders.api";
import {
  dtrFeedersMaxResponseTimeMs,
  dtrFeedersTestCases,
  resolveDtrFeedersCode,
  resolveDtrFeedersContractBody,
  resolveDtrFeedersQuery,
} from "../Data/dtrfeeders.data";
import {
  DtrFeedersMapper,
  type DtrFeedersErrorResponse,
} from "../Mapper/dtrfeeders.mapper";
import { DtrFeedersValidator } from "../Validator/dtrfeeders.validator";

test.describe("DTR Feeders API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dtrFeedersTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new DtrFeedersValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveDtrFeedersContractBody(testCase.scenario);
          if (!fixtureBody) {
            test.skip(true, "Missing DTR feeders contract fixture body");
            return;
          }

          const mapped = DtrFeedersMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new DtrFeedersApi(authenticatedApi);
        const dtrCode = resolveDtrFeedersCode(testCase.scenario);

        if (!dtrCode) {
          test.skip(true, "Could not resolve DTR feeders code");
          return;
        }

        const query = resolveDtrFeedersQuery(testCase.scenario);
        const queryString = new URLSearchParams(
          Object.entries(query).reduce<Record<string, string>>(
            (acc, [key, value]) => {
              if (value !== undefined) {
                acc[key] = String(value);
              }
              return acc;
            },
            {},
          ),
        ).toString();
        const endpoint = `/indore/dtr/${encodeURIComponent(dtrCode)}/feeders${
          queryString ? `?${queryString}` : ""
        }`;

        const { rawResponse, responseBody, responseTime } =
          await api.getFeeders(dtrCode, query);

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}${endpoint}`,
          responseTime,
        );

        validation.execute("Status Validation", () => {
          if (testCase.scenario === "dtr_not_found") {
            expect([200, 404]).toContain(rawResponse.status());
            return;
          }
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody);
        });
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            dtrFeedersMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as DtrFeedersErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (
          testCase.scenario === "dtr_not_found" &&
          rawResponse.status() === 404
        ) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as DtrFeedersErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (expectedStatus === 400) {
          validation.execute("Blank DTR Code Validation Error", () =>
            validator.validateBlankCodeError(
              responseBody as DtrFeedersErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = DtrFeedersMapper.map(responseBody);
        validation.execute("DTR Feeders Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
