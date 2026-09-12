import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { RevenueSubsidyPfApi } from "../Api/revenuesubsidypf.api";
import {
  revenueSubsidyPfMaxResponseTimeMs,
  revenueSubsidyPfSuccessMessage,
  revenueSubsidyPfTestCases,
  resolveRevenueSubsidyPfContractBody,
  resolveRevenueSubsidyPfQuery,
  resolveRevenueSubsidyPfSaveRequest,
} from "../Data/revenuesubsidypf.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceAuthNegativeCases,
  dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import {
  RevenueSubsidyPfMapper,
  type RevenueSubsidyPfErrorResponse,
} from "../Mapper/revenuesubsidypf.mapper";
import { RevenueSubsidyPfValidator } from "../Validator/revenuesubsidypf.validator";

const REVENUE_SUBSIDY_PF_PATH = "/indore/dashboard/revenue-subsidy-pf";

test.describe("Dashboard — revenue subsidy (power factor)", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of revenueSubsidyPfTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const method = testCase.method ?? "GET";
        const validator = new RevenueSubsidyPfValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const saveRequest = resolveRevenueSubsidyPfSaveRequest(
          testCase.scenario,
        );

        if (testCase.isContractFixture) {
          const fixtureBody = resolveRevenueSubsidyPfContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(true, "Missing revenue-subsidy-pf contract body");
            return;
          }

          const mapped = RevenueSubsidyPfMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(
              mapped,
              testCase.scenario,
              saveRequest,
            ),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        if (method === "POST") {
          test.skip(true, "POST save is off. Dashboard writes stay skipped.");
          return;
        }

        const api = new RevenueSubsidyPfApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.getRevenueSubsidyPf(
            resolveRevenueSubsidyPfQuery(testCase.scenario),
          );

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(
            rawResponse,
            expectedStatus,
            responseBody,
          ),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            revenueSubsidyPfMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (testCase.scenario === "dev_reject_unknown_query") {
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(responseBody, ["success", "error"]),
          );
          validation.execute("Unknown Query Validation", () =>
            validator.validateUnknownQueryValidationError(
              responseBody as RevenueSubsidyPfErrorResponse,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = RevenueSubsidyPfMapper.map(responseBody);
        validation.execute("Response Envelope", () =>
          validator.validateResponseEnvelope(
            responseBody,
            revenueSubsidyPfSuccessMessage,
          ),
        );
        validation.execute("Revenue Subsidy PF Scenario", () =>
          validator.validateScenario(
            mapped,
            testCase.scenario,
            saveRequest,
          ),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});

authTest.describe("Revenue subsidy (power factor) — cannot open without a valid login", () => {
  authTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const authCase of dtrUnbalanceAuthNegativeCases) {
    authTest(
      `${authCase.testName}`,
      {
        tag: [...authCase.tags, "@revenue-subsidy-pf"],
      },
      async ({ unauthenticatedApi }) => {
        const validator = new RevenueSubsidyPfValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const started = Date.now();

        const rawResponse = await unauthenticatedApi.get(
          REVENUE_SUBSIDY_PF_PATH,
          { headers: authCase.headers },
        );
        if (
          BackendResponse.shouldSkipRateLimit(
            rawResponse.status(),
            `Revenue subsidy PF ${authCase.testName}`,
          )
        ) {
          authTest.skip(
            true,
            `Rate limited (429) on ${REVENUE_SUBSIDY_PF_PATH} — retry later`,
          );
          return;
        }
        const responseBody = await rawResponse.json().catch(() => ({}));
        const responseTime = Date.now() - started;

        await PerformanceTracker.track(
          rawResponse,
          `Revenue subsidy PF ${authCase.expectedErrorCode}`,
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
          if (
            authCase.expectedErrorCode === dtrUnbalanceAccessTokenInvalidCode
          ) {
            validator.validateAccessTokenInvalidError(
              responseBody as RevenueSubsidyPfErrorResponse,
            );
          } else if (
            authCase.expectedErrorCode === dtrUnbalanceUnauthorizedCode
          ) {
            validator.validateUnauthorizedError(
              responseBody as RevenueSubsidyPfErrorResponse,
            );
          }
        });

        validation.printSummary(
          `Revenue subsidy PF ${authCase.testName}`,
          responseTime,
        );
      },
    );
  }
});
