import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { DaywiseBillingApi } from "../Api/daywisebilling.api";
import {
  daywiseBillingTestCases,
  daywiseKnownMeter,
  daywiseOct2025Fixture,
  daywiseSameFeederPlateauFixture,
  resolveDaywiseQuery,
  type DaywiseBillingQueryParams,
  type DaywiseBillingScenario,
} from "../Data/daywisebilling.data";
import {
  DaywiseBillingMapper,
  type DaywiseBillingData,
} from "../Mapper/daywisebilling.mapper";
import { DaywiseBillingValidator } from "../Validator/daywisebilling.validator";
import {
  DaywiseBillingResponseSchema,
  isDaywiseGridPayload,
  type ParsedDaywiseBillingResponse,
} from "../schemas/billing.schemas";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import {
  BILLING_MAX_RESPONSE_TIME_MS,
  BILLING_TEST_TIMEOUT_MS,
} from "../../../core/constants/api-timeouts";
import { skipIfBillingInternalError } from "../utils/billing-env.helper";

function runFilledPageRules(
  validator: DaywiseBillingValidator,
  validation: ValidationEngine,
  mapped: DaywiseBillingData,
  query: DaywiseBillingQueryParams,
  scenario: DaywiseBillingScenario,
): void {
  validation.execute("Meter details", () =>
    validator.validateMeterDetails(mapped),
  );
  validation.execute("Consumer", () => validator.validateConsumerData(mapped));
  validation.execute("Daily kWh", () =>
    validator.validateDailyKwhValues(mapped),
  );
  validation.execute("Daily reading trend", () =>
    validator.validateDailyReadingTrend(mapped),
  );
  validation.execute("Days in month", () =>
    validator.validateDaysInMonth(mapped),
  );
  validation.execute("Unique readings", () =>
    validator.validateUniqueReadings(mapped),
  );
  validation.execute("Shared keys allowed", () =>
    validator.validateSharedKeysAllowed(mapped),
  );
  validation.execute("Null-safe hierarchy", () =>
    validator.validateNullSafeFields(mapped),
  );
  if (scenario === "dev_page_two" || scenario === "dev_live_without_total") {
    validation.execute("Page serials", () =>
      validator.validatePageSerials(mapped),
    );
  }
  if (scenario === "dev_meter_filter" && query.meterNumber) {
    validation.execute("Meter filter", () =>
      validator.validateMeterFilter(mapped, query.meterNumber!),
    );
  }
}

test.describe("Day-by-day billing list", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(BILLING_TEST_TIMEOUT_MS);

  for (const testCase of daywiseBillingTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new DaywiseBillingValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          const fixtureBody =
            testCase.scenario === "contract_same_feeder_plateau"
              ? daywiseSameFeederPlateauFixture
              : daywiseOct2025Fixture;
          const parsed = DaywiseBillingResponseSchema.parse(fixtureBody);
          const mapped = DaywiseBillingMapper.mapData(parsed.data, {
            month: 10,
            year: 2025,
            page: 1,
            limit: 10,
          });
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(fixtureBody, ["success", "data"]),
          );
          validation.execute("Columns", () =>
            validator.validateColumns(fixtureBody.data.columns),
          );
          validation.execute("Has more", () =>
            validator.validateHasMoreFlag(mapped),
          );
          runFilledPageRules(
            validator,
            validation,
            mapped,
            { month: 10, year: 2025, page: 1, limit: 10 },
            testCase.scenario,
          );
          if (testCase.scenario === "contract_live_oct_2025") {
            expect(mapped.items[0]?.meterNumber).toBe(daywiseKnownMeter);
            expect(mapped.items[0]?.id).toBe("row-1-85080223");
            expect(mapped.hasMore).toBe(true);
            expect(mapped.totalExact).toBe(false);
          }
          if (testCase.scenario === "contract_same_feeder_plateau") {
            expect(mapped.items[0]?.feeder).toBe(mapped.items[1]?.feeder);
            expect(mapped.items[0]?.dtr).toBe(mapped.items[1]?.dtr);
            expect(mapped.items[0]?.meterNumber).not.toBe(
              mapped.items[1]?.meterNumber,
            );
            expect(mapped.items[1]?.d25Kwh).toBe(mapped.items[1]?.d26Kwh);
            expect(mapped.items[1]?.d26Kwh).toBe(mapped.items[1]?.d27Kwh);
            expect(mapped.items[1]?.d27Kwh).toBe(mapped.items[1]?.d28Kwh);
          }
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new DaywiseBillingApi(authenticatedApi);
        const query = resolveDaywiseQuery(testCase.scenario);
        const { rawResponse, responseBody, responseTime } =
          await api.getDaywiseBillingData(query);
        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        skipIfBillingInternalError(
          rawResponse.status(),
          responseBody,
          "/indore/billing/daywise-billing-data",
        );

        validation.execute("Status Code", () =>
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(responseTime, BILLING_MAX_RESPONSE_TIME_MS),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus !== 200) {
          expect(responseBody.success).toBeFalsy();
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        let parsed!: ParsedDaywiseBillingResponse;
        validation.execute("Zod Response Schema", () => {
          const result = DaywiseBillingResponseSchema.safeParse(responseBody);
          expect(
            result.success,
            result.success
              ? "Zod validation passed"
              : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
          ).toBe(true);
          parsed = result.data!;
        });

        const includeTotal = query.includeTotal === true;
        const mapped = DaywiseBillingMapper.mapData(parsed.data, {
          month: query.month ?? 10,
          year: query.year ?? 2025,
          page: query.page ?? 1,
          limit: query.limit ?? 10,
        });

        if (isDaywiseGridPayload(parsed.data)) {
          const columns = parsed.data.columns ?? [];
          validation.execute("Columns", () =>
            validator.validateColumns(columns),
          );
        }
        validation.execute("Data exists", () =>
          validator.validateDataExists(mapped),
        );
        validation.execute("Pagination", () =>
          validator.validatePagination(mapped, includeTotal),
        );
        validation.execute("Month year", () =>
          validator.validateMonthYear(
            mapped,
            query.month ?? 10,
            query.year ?? 2025,
          ),
        );
        validation.execute("Has more", () =>
          validator.validateHasMoreFlag(mapped),
        );

        if (
          testCase.scenario === "dev_meter_filter" &&
          mapped.items.length === 0
        ) {
          test.skip(
            true,
            `No matching meter ${daywiseKnownMeter} in Oct 2025 daywise billing`,
          );
        }

        if (mapped.items.length > 0) {
          runFilledPageRules(
            validator,
            validation,
            mapped,
            query,
            testCase.scenario,
          );
        }
        validation.execute("No Data Scenario", () =>
          validator.validateNoDataScenario(mapped, includeTotal),
        );

        if (testCase.scenario === "dev_unknown_meter") {
          expect(mapped.items.length).toBe(0);
        }

        if (testCase.scenario === "dev_live_without_total") {
          console.info(
            JSON.stringify(
              {
                msg: "daywise_billing_live_response",
                query,
                pagination: {
                  page: mapped.page,
                  limit: mapped.limit,
                  total: mapped.total,
                  totalPages: mapped.totalPages,
                  hasMore: mapped.hasMore,
                  totalExact: mapped.totalExact,
                },
                rowCount: mapped.items.length,
                note: "live totals are not pinned",
                sampleMeter: mapped.items[0]?.meterNumber ?? null,
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
