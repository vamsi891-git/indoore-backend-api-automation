import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrEventDetailApi } from "../Api/dtreventdetail.api";
import {
  dtrEventDetailMaxResponseTimeMs,
  dtrEventDetailTestCases,
  resolveDtrEventDetailContractBody,
  resolveDtrEventDetailQuery,
} from "../Data/dtreventdetail.data";
import {
  DtrEventDetailMapper,
  type DtrEventDetailErrorBody,
} from "../Mapper/dtreventdetail.mapper";
import { DtrEventDetailValidator } from "../Validator/dtreventdetail.validator";
import { skipIfReportsInternalError } from "../utils/reports-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("DTR event detail report", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dtrEventDetailTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new DtrEventDetailValidator();
        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveDtrEventDetailContractBody(
            testCase.scenario,
          );
          if (!fixtureBody) {
            test.skip(true, "Missing dtr-event-detail contract body");
            return;
          }
          const mapped = DtrEventDetailMapper.map(fixtureBody);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Contract Scenario", () =>
            validator.validateScenario(mapped, testCase.scenario),
          );
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new DtrEventDetailApi(authenticatedApi);
        const query = resolveDtrEventDetailQuery(testCase.scenario);
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

        const { rawResponse, responseBody, responseTime } =
          await api.getDtrEventDetail(query);
        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        skipIfReportsInternalError(
          rawResponse.status(),
          responseBody,
          "/indore/reports/dtr-event-detail",
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
            dtrEventDetailMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus !== 200) {
          validation.execute("Validation Error", () =>
            validator.validateValidationError(
              responseBody as DtrEventDetailErrorBody,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );
        const mapped = DtrEventDetailMapper.map(responseBody);
        if (
          testCase.scenario === "dev_live_primary" ||
          testCase.scenario === "dev_live_page2"
        ) {
          console.info(
            JSON.stringify(
              {
                msg: "dtr_event_detail_live_response",
                scenario: testCase.scenario,
                query,
                queryString,
                pagination: mapped.pagination,
                columnKeys: mapped.columns.map((c) => c.key),
                rowCount: mapped.rows.length,
                sampleRow: mapped.rows[0] ?? null,
              },
              null,
              2,
            ),
          );
        }
        validation.execute("Response Envelope", () =>
          validator.validateResponseEnvelope(responseBody),
        );
        validation.execute("DTR Event Detail Scenario", () =>
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
