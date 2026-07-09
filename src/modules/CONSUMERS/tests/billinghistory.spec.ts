import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { BillingHistoryApi } from "../Api/billinghistory.api";
import {
  billingHistoryMaxResponseTimeMs,
  billingHistoryTestCases,
  resolveBillingHistoryContractBody,
  resolveBillingHistoryExpectedLimit,
  resolveBillingHistoryQuery,
  resolveBillingHistoryRef,
} from "../Data/billinghistory.data";
import {
  BillingHistoryMapper,
  type BillingHistoryErrorResponse,
} from "../Mapper/billinghistory.mapper";
import { BillingHistoryValidator } from "../Validator/billinghistory.validator";

test.describe("Billing History API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of billingHistoryTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new BillingHistoryValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const billingLimit = resolveBillingHistoryExpectedLimit(testCase.scenario);

        if (testCase.isContractFixture) {
          const fixtureBody = resolveBillingHistoryContractBody(testCase.scenario);
          if (!fixtureBody) {
            test.skip(true, "Missing billing-history contract fixture body");
            return;
          }

          const mapped = BillingHistoryMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario, billingLimit),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new BillingHistoryApi(authenticatedApi);
        const consumerRef = resolveBillingHistoryRef(testCase.scenario);

        if (!consumerRef) {
          test.skip(true, "Could not resolve billing-history route ref");
          return;
        }

        const query = resolveBillingHistoryQuery(testCase.scenario);
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
        const endpoint = `/indore/consumers/${consumerRef}/billing-history${
          queryString ? `?${queryString}` : ""
        }`;

        const { rawResponse, responseBody, responseTime } =
          await api.getBillingHistory(consumerRef, query);

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          `${process.env.BASE_URL}${endpoint}`,
          responseTime,
        );

        validation.execute("Status Validation", () => {
          if (
            testCase.scenario === "meter_not_found" ||
            testCase.scenario === "consumer_not_found"
          ) {
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
            billingHistoryMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as BillingHistoryErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (testCase.scenario === "meter_not_found" && rawResponse.status() === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as BillingHistoryErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (testCase.scenario === "consumer_not_found" && rawResponse.status() === 404) {
          validation.execute("Not Found Error", () =>
            validator.validateNotFoundError(
              responseBody as BillingHistoryErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        if (expectedStatus === 400) {
          if (testCase.scenario === "invalid_billing_limit") {
            validation.execute("Invalid Billing Limit Error", () =>
              validator.validateInvalidBillingLimitError(
                responseBody as BillingHistoryErrorResponse,
              ),
            );
          } else {
            validation.execute("Blank Ref Validation Error", () =>
              validator.validateBlankRefError(
                responseBody as BillingHistoryErrorResponse,
              ),
            );
          }
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = BillingHistoryMapper.map(responseBody);
        validation.execute("Billing History Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario, billingLimit),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
