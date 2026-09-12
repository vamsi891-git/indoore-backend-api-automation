import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { DtrLoadApi } from "../Api/dtrload.api";
import {
  dtrLoadTestCases,
  resolveDtrLoadFixture,
  resolveDtrLoadQuery,
  resolveDtrLoadType,
  type DtrLoadType,
} from "../Data/dtrload.data";
import { DtrLoadMapper, type DtrLoadPayload } from "../Mapper/dtrload.mapper";
import { DtrLoadValidator } from "../Validator/dtrload.validator";
import {
  DtrLoadResponseSchema,
  type ParsedDtrLoadResponse,
} from "../schemas/dtrload.schemas";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import {
  DTR_LOAD_MAX_RESPONSE_TIME_MS,
  DTR_LOAD_TEST_TIMEOUT_MS,
} from "../../../core/constants/api-timeouts";
import { skipIfDtrLoadInternalError } from "../utils/dtr-load-env.helper";

function runFilledPageRules(
  validator: DtrLoadValidator,
  validation: ValidationEngine,
  mapped: DtrLoadPayload,
  type: DtrLoadType,
  query?: { fromDate?: string; toDate?: string },
): void {
  validation.execute("Rows", () => validator.validateRowsPresent(mapped));
  validation.execute("Unique meters", () =>
    validator.validateUniqueMeters(mapped),
  );
  validation.execute("Shared feeder allowed", () =>
    validator.validateSharedKeysAllowed(mapped),
  );
  validation.execute("MSN matches serial", () =>
    validator.validateMsnMatchesSerial(mapped),
  );
  if (
    type === "hourly_actual_load" ||
    type === "hourly_load_percentage" ||
    type === "consumption"
  ) {
    validation.execute("Hourly values", () =>
      validator.validateHourlyNonNegative(mapped),
    );
  }
  if (type === "hourly_actual_load") {
    validation.execute("Hourly totals", () =>
      validator.validateHourlyTotals(mapped),
    );
  }
  if (type === "loading") {
    validation.execute("Load percent", () =>
      validator.validateLoadingPercent(mapped),
    );
  }
  if (type === "unbalance_loading") {
    validation.execute("Phase currents", () =>
      validator.validateUnbalancePhases(mapped),
    );
  }
  if (type === "load_summary") {
    validation.execute("Summary loads", () =>
      validator.validateSummaryLoads(mapped),
    );
  }
  if (type === "consumption") {
    validation.execute("Consumption unit", () =>
      validator.validateConsumptionUnit(mapped, query),
    );
  }
}

test.describe("Transformer load reports", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(DTR_LOAD_TEST_TIMEOUT_MS);

  for (const testCase of dtrLoadTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new DtrLoadValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          const fixtureBody = resolveDtrLoadFixture(testCase.scenario);
          const parsed = DtrLoadResponseSchema.parse(fixtureBody);
          const mapped = DtrLoadMapper.map(parsed.data);
          const type =
            testCase.scenario === "contract_consumption"
              ? "consumption"
              : "hourly_actual_load";
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Columns", () =>
            validator.validateColumns(mapped.columns, type),
          );
          runFilledPageRules(validator, validation, mapped, type);
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new DtrLoadApi(authenticatedApi);
        const query = resolveDtrLoadQuery(testCase.scenario);
        const { rawResponse, responseBody, responseTime } =
          await api.getDtrLoad(query);
        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        skipIfDtrLoadInternalError(
          rawResponse.status(),
          responseBody,
          "/indore/dtr-load",
        );

        validation.execute("Status Code", () =>
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(responseTime, DTR_LOAD_MAX_RESPONSE_TIME_MS),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus !== 200) {
          expect(
            (responseBody as { success?: boolean }).success,
          ).toBeFalsy();
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        let parsed!: ParsedDtrLoadResponse;
        validation.execute("Zod Response Schema", () => {
          const result = DtrLoadResponseSchema.safeParse(responseBody);
          expect(
            result.success,
            result.success
              ? "Zod validation passed"
              : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
          ).toBe(true);
          parsed = result.data!;
        });

        const mapped = DtrLoadMapper.map(parsed.data);
        const type = resolveDtrLoadType(query);

        validation.execute("Columns", () =>
          validator.validateColumns(mapped.columns, type),
        );
        validation.execute("Pagination", () =>
          validator.validatePagination(mapped),
        );

        if (mapped.rows.length > 0) {
          runFilledPageRules(validator, validation, mapped, type, query);
        }
        validation.execute("No Data Scenario", () =>
          validator.validateNoData(mapped),
        );

        if (testCase.scenario === "live_hourly_actual") {
          console.info(
            JSON.stringify(
              {
                msg: "dtr_load_live_response",
                query,
                pagination: {
                  page: mapped.page,
                  limit: mapped.limit,
                  total: mapped.total,
                  totalPages: mapped.totalPages,
                },
                rowCount: mapped.rows.length,
                note: "live totals are not pinned",
                sampleDtr: mapped.rows[0]?.dtrName ?? null,
              },
              null,
              2,
            ),
          );
        }

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
