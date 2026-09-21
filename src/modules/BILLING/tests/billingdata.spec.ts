import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { BillingDataApi } from "../Api/billingdata.api";
import {
  billingDataKnownMeter,
  billingDataOct2025Fixture,
  billingDataSparseSentinelFixture,
  billingDataTestCases,
  resolveBillingDataQuery,
  type BillingDataQuery,
  type BillingDataScenario,
} from "../Data/billingdata.data";
import { BillingDataMapper, type BillingData } from "../Mapper/billingdata.mapper";
import { BillingDataValidator } from "../Validator/billingdata.validator";
import {
  BillingDataResponseSchema,
  isBillingGridPayload,
  type ParsedBillingDataResponse,
} from "../schemas/billing.schemas";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import {
  BILLING_MAX_RESPONSE_TIME_MS,
  BILLING_TEST_TIMEOUT_MS,
} from "../../../core/constants/api-timeouts";
import { skipIfBillingInternalError } from "../utils/billing-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

function runFilledPageRules(
  validator: BillingDataValidator,
  validation: ApiValidationHelper,
  mapped: BillingData,
  query: BillingDataQuery,
  scenario: BillingDataScenario,
): void {
  validation.execute("Billing Items", () => validator.validateBillingItems(mapped));
  validation.execute("Sparse hierarchy", () => validator.validateSparseHierarchyAllowed(mapped));
  validation.execute("Power Factor", () => validator.validatePowerFactor(mapped));
  validation.execute("Energy Calculation", () => validator.validateEnergyCalculation(mapped));
  validation.execute("KVAH Calculation", () => validator.validateKvahCalculation(mapped));
  validation.execute("Electrical Business Rules", () =>
    validator.validateElectricalBusinessRules(mapped),
  );
  validation.execute("Export Energy", () => validator.validateExportEnergy(mapped));
  validation.execute("MD occurrence time", () => validator.validateMdOccurrenceTimes(mapped));
  validation.execute("Billing Month Year", () =>
    validator.validateBillingMonthYear(mapped, query.month ?? 10, query.year ?? 2025),
  );
  validation.execute("Unique readings", () => validator.validateUniqueReadings(mapped));
  validation.execute("Shared keys allowed", () => validator.validateSharedKeysAllowed(mapped));
  validation.execute("NaN", () => validator.validateNaNValues(mapped));
  if (scenario === "dev_page_two" || scenario === "dev_live_include_total") {
    validation.execute("Page serials", () => validator.validatePageSerials(mapped));
  }
  if (scenario === "dev_meter_filter" && query.meterNumber) {
    validation.execute("Meter filter", () =>
      validator.validateMeterFilter(mapped, query.meterNumber!),
    );
  }
}

test.describe("Monthly billing list", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(BILLING_TEST_TIMEOUT_MS);

  for (const testCase of billingDataTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const expectedStatus = testCase.expectedStatus ?? 200;
      const validator = new BillingDataValidator();
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      if (testCase.isContractFixture) {
        const fixtureBody =
          testCase.scenario === "contract_sparse_and_sentinel"
            ? billingDataSparseSentinelFixture
            : billingDataOct2025Fixture;
        const parsed = BillingDataResponseSchema.parse(fixtureBody);
        const mapped = BillingDataMapper.mapData(parsed.data, {
          month: 10,
          year: 2025,
          page: 1,
          limit: 10,
        });
        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(fixtureBody, ["success", "data"]),
        );
        validation.execute("Columns", () => validator.validateColumns(fixtureBody.data.columns));
        validation.execute("Grid meta", () => validator.validateGridMeta(mapped));
        runFilledPageRules(
          validator,
          validation,
          mapped,
          { month: 10, year: 2025, page: 1, limit: 10 },
          testCase.scenario,
        );
        if (testCase.scenario === "contract_live_oct_2025") {
          expect(mapped.items[0]?.meterNumber).toBe(billingDataKnownMeter);
          expect(mapped.items[0]?.mdKw).toBe(1.834);
          expect(mapped.billingClass).toBe("d1");
          expect(mapped.mappingProfile).toBe("all");
        }
        if (testCase.scenario === "contract_sparse_and_sentinel") {
          expect(mapped.items[0]?.pf).toBe(0);
          expect(mapped.items[0]?.mdKw).toBe(0);
          expect(mapped.items[0]?.mdKwOt).toMatch(/^1900-01-01/);
          expect(mapped.items[1]?.circle).toBeNull();
          expect(mapped.items[1]?.mf).toBeNull();
          expect(mapped.items[0]?.rank).toBe(mapped.items[1]?.rank);
          expect(mapped.items[0]?.meterNumber).not.toBe(mapped.items[1]?.meterNumber);
        }
        validation.printSummary(testCase.testName, 0);
        return;
      }

      const api = new BillingDataApi(authenticatedApi);
      const query = resolveBillingDataQuery(testCase.scenario);
      const { rawResponse, responseBody, responseTime } = await api.getBillingData(query);
      await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime,
      );

      skipIfBillingInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/billing/billing-data",
      );

      validation.execute("Status Code", () =>
        assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
      );
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, BILLING_MAX_RESPONSE_TIME_MS),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      if (expectedStatus !== 200) {
        expect(responseBody.success).toBeFalsy();
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      let parsed!: ParsedBillingDataResponse;
      validation.execute("Zod Response Schema", () => {
        const result = BillingDataResponseSchema.safeParse(responseBody);
        expect(
          result.success,
          result.success
            ? "Zod validation passed"
            : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
        ).toBe(true);
        parsed = result.data!;
      });

      const includeTotal = query.includeTotal !== false;
      const mapped = BillingDataMapper.mapData(parsed.data, {
        month: query.month ?? 10,
        year: query.year ?? 2025,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
      });

      if (isBillingGridPayload(parsed.data)) {
        const columns = parsed.data.columns ?? [];
        validation.execute("Columns", () => validator.validateColumns(columns));
      }
      validation.execute("Billing Data Exists", () => validator.validateBillingDataExists(mapped));
      validation.execute("Pagination", () => validator.validatePagination(mapped, includeTotal));
      validation.execute("Grid meta", () => validator.validateGridMeta(mapped));

      if (testCase.scenario === "dev_meter_filter" && mapped.items.length === 0) {
        test.skip(true, `No matching meter ${billingDataKnownMeter} in Oct 2025 billing data`);
      }

      if (mapped.items.length > 0) {
        runFilledPageRules(validator, validation, mapped, query, testCase.scenario);
      }
      validation.execute("No Data Scenario", () =>
        validator.validateNoDataScenario(mapped, includeTotal),
      );

      if (testCase.scenario === "dev_unknown_meter") {
        expect(mapped.items.length).toBe(0);
      }

      if (testCase.scenario === "dev_live_include_total") {
        console.info(
          JSON.stringify(
            {
              msg: "billing_data_live_response",
              query,
              pagination: {
                page: mapped.page,
                limit: mapped.limit,
                total: mapped.total,
                totalPages: mapped.totalPages,
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
    });
  }
});
