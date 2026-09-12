import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { expect } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DashboardMetricsApi } from "../Api/dashboardmetrics.api";
import {
  dashboardMetricsMaxResponseTimeMs,
  dashboardMetricsTestCases,
  OVERALL_METRICS_PATH,
  resolveOverallMetricsContractBody,
} from "../Data/dashboardmetrics.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceAccessTokenInvalidMessage,
  dtrUnbalanceAuthNegativeCases,
  dtrUnbalanceUnauthorizedCode,
  dtrUnbalanceUnauthorizedMessage,
} from "../../DASHBOARD/Data/dtr-unbalance-auth.data";
import { DashboardMetricsMapper } from "../Mapper/dashboardmetrics.mapper";
import { DashboardMetricsValidator } from "../Validator/dashboardmetrics.validator";

test.describe("Home dashboard", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dashboardMetricsTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const validator = new DashboardMetricsValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveOverallMetricsContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(true, "Missing overall metrics contract body");
            return;
          }

          const mapped = DashboardMetricsMapper.map(
            fixtureBody,
            testCase.scenario,
          );
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new DashboardMetricsApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.getDashboardMetrics();

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, 200, responseBody),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            dashboardMetricsMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = DashboardMetricsMapper.map(
          responseBody,
          testCase.scenario,
        );
        validation.execute("Response Envelope", () =>
          validator.validateResponseEnvelope(responseBody),
        );
        validation.execute("Overall Metrics Scenario", () =>
          validator.validateScenario(mapped, testCase.scenario),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});

authTest.describe("Home dashboard — cannot open without a valid login", () => {
  authTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const authCase of dtrUnbalanceAuthNegativeCases) {
    authTest(
      `Home dashboard — ${authCase.testName}`,
      { tag: [...authCase.tags, "@overall-metrics"] },
      async ({ unauthenticatedApi }) => {
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const started = Date.now();

        const rawResponse = await unauthenticatedApi.get(OVERALL_METRICS_PATH, {
          headers: authCase.headers,
        });
        if (
          BackendResponse.shouldSkipRateLimit(
            rawResponse.status(),
            `Overall metrics ${authCase.testName}`,
          )
        ) {
          authTest.skip(
            true,
            `Rate limited (429) on ${OVERALL_METRICS_PATH} — retry later`,
          );
          return;
        }
        const responseBody = await rawResponse.json().catch(() => ({}));
        const responseTime = Date.now() - started;

        await PerformanceTracker.track(
          rawResponse,
          `Overall metrics ${authCase.expectedErrorCode}`,
          rawResponse.url(),
          responseTime,
        );

        validation.execute("Status (auth negative)", () =>
          assert.validateStatusCode(
            rawResponse,
            authCase.expectedStatus,
            responseBody,
          ),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Auth Error Envelope", () => {
          const body = responseBody as {
            success?: boolean;
            error?: { code?: string; message?: string };
          };
          expect(body.success).toBeFalsy();
          expect(body.error?.code).toBe(authCase.expectedErrorCode);
          const expectedMessage =
            authCase.expectedErrorCode === dtrUnbalanceAccessTokenInvalidCode
              ? dtrUnbalanceAccessTokenInvalidMessage
              : authCase.expectedErrorCode === dtrUnbalanceUnauthorizedCode
                ? dtrUnbalanceUnauthorizedMessage
                : authCase.expectedMessage;
          expect(String(body.error?.message ?? "").toLowerCase()).toContain(
            expectedMessage.toLowerCase(),
          );
        });

        validation.printSummary(
          `Home dashboard — ${authCase.expectedErrorCode}`,
          responseTime,
        );
      },
    );
  }
});
