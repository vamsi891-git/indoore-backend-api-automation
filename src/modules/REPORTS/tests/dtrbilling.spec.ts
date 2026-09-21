import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrBillingApi } from "../Api/dtrbilling.api";
import {
  dtrBillingMaxResponseTimeMs,
  dtrBillingTestCases,
  resolveDtrBillingContractBody,
  resolveDtrBillingQuery,
} from "../Data/dtrbilling.data";
import {
  DtrBillingMapper,
  type DtrBillingErrorBody,
} from "../Mapper/dtrbilling.mapper";
import { DtrBillingValidator } from "../Validator/dtrbilling.validator";
import { skipIfReportsInternalError } from "../utils/reports-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("DTR billing report", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dtrBillingTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new DtrBillingValidator();
        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveDtrBillingContractBody(testCase.scenario);
          if (!fixtureBody) {
            test.skip(true, "Missing dtr-billing contract body");
            return;
          }
          const mapped = DtrBillingMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new DtrBillingApi(authenticatedApi);
        const query = resolveDtrBillingQuery(testCase.scenario);
        const queryString = new URLSearchParams(
          Object.entries(query).reduce<Record<string, string>>(
            (acc, [key, value]) => {
              if (value === undefined) return acc;
              if (Array.isArray(value)) {
                acc[key] = value.join(",");
              } else {
                acc[key] = String(value);
              }
              return acc;
            },
            {},
          ),
        ).toString();

        const { rawResponse, responseBody, responseTime } =
          await api.getDtrBilling(query);
        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        skipIfReportsInternalError(
          rawResponse.status(),
          responseBody,
          "/indore/reports/dtr-billing",
        );

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            dtrBillingMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus !== 200) {
          validation.execute("Validation Error", () =>
            validator.validateValidationError(
              responseBody as DtrBillingErrorBody,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );
        const mapped = DtrBillingMapper.map(responseBody);
        if (
          testCase.scenario === "dev_live_without_total" ||
          testCase.scenario === "dev_live_include_total"
        ) {
          console.info(
            JSON.stringify(
              {
                msg: "dtr_billing_live_response",
                scenario: testCase.scenario,
                query: {
                  fromDate: query.fromDate,
                  toDate: query.toDate,
                  page: query.page,
                  limit: query.limit,
                  includeTotal: query.includeTotal,
                },
                queryString,
                pagination: mapped.data.pagination,
                columnKeys: mapped.data.columns.map((c) => c.key),
                rowCount: mapped.data.rows.length,
                note:
                  mapped.data.pagination.total === null &&
                  mapped.data.rows.length > 0
                    ? "includeTotal=false: null total with rows is valid"
                    : undefined,
                sampleRow: mapped.data.rows[0] ?? null,
              },
              null,
              2,
            ),
          );
        }
        validation.execute("Response Envelope", () =>
          validator.validateResponseEnvelope(responseBody),
        );
        validation.execute("DTR Billing Scenario", () =>
          validator.validateScenario(
            mapped,
            testCase.scenario,
            query.page,
            query.limit,
          ),
        );

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
