import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { DtrLoadRatingOptionsApi } from "../Api/dtrloadratingoptions.api";
import {
  dtrLoadRatingOptionsFixture,
  dtrLoadRatingOptionsTestCases,
  resolveDtrLoadRatingOptionsQuery,
} from "../Data/dtrloadratingoptions.data";
import { DtrLoadRatingOptionsMapper } from "../Mapper/dtrloadratingoptions.mapper";
import { DtrLoadRatingOptionsValidator } from "../Validator/dtrloadratingoptions.validator";
import {
  DtrLoadRatingOptionsResponseSchema,
  type ParsedDtrLoadRatingOptionsResponse,
} from "../schemas/dtrloadratingoptions.schemas";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import {
  DTR_LOAD_MAX_RESPONSE_TIME_MS,
  DTR_LOAD_TEST_TIMEOUT_MS,
} from "../../../core/constants/api-timeouts";
import { skipIfDtrLoadInternalError } from "../utils/dtr-load-env.helper";

function runItemRules(
  validator: DtrLoadRatingOptionsValidator,
  validation: ValidationEngine,
  mapped: ReturnType<typeof DtrLoadRatingOptionsMapper.map>,
  requireItems: boolean,
): void {
  if (requireItems || mapped.items.length > 0) {
    validation.execute("Items", () => validator.validateItemsPresent(mapped));
  }
  if (mapped.items.length === 0) {
    return;
  }
  validation.execute("Fields", () => validator.validateFields(mapped));
  validation.execute("Unique ids", () => validator.validateUniqueIds(mapped));
  validation.execute("Unique values", () =>
    validator.validateUniqueValues(mapped),
  );
  validation.execute("Ascending order", () =>
    validator.validateAscendingOrder(mapped),
  );
}

test.describe("Transformer size list", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(DTR_LOAD_TEST_TIMEOUT_MS);

  for (const testCase of dtrLoadRatingOptionsTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new DtrLoadRatingOptionsValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        if (testCase.isContractFixture) {
          let parsed!: ParsedDtrLoadRatingOptionsResponse;
          validation.execute("Zod Response Schema", () => {
            const result = DtrLoadRatingOptionsResponseSchema.safeParse(
              dtrLoadRatingOptionsFixture,
            );
            expect(
              result.success,
              result.success
                ? "Zod validation passed"
                : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
            ).toBe(true);
            parsed = result.data!;
          });
          const mapped = DtrLoadRatingOptionsMapper.map(parsed.data);
          validation.execute("Required Fields", () =>
            assert.validateRequiredFields(dtrLoadRatingOptionsFixture, [
              "success",
              "data",
            ]),
          );
          runItemRules(validator, validation, mapped, true);
          validation.printSummary(testCase.testName, 0);
          return;
        }

        const api = new DtrLoadRatingOptionsApi(authenticatedApi);
        const query = resolveDtrLoadRatingOptionsQuery(testCase.scenario);
        const { rawResponse, responseBody, responseTime } =
          await api.getRatingOptions(query);
        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        skipIfDtrLoadInternalError(
          rawResponse.status(),
          responseBody,
          "/indore/dtr-load/rating-options",
        );

        validation.execute("Status Code", () =>
          assert.validateStatusCode(rawResponse, expectedStatus, responseBody),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            DTR_LOAD_MAX_RESPONSE_TIME_MS,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus !== 200) {
          expect((responseBody as { success?: boolean }).success).toBeFalsy();
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        let parsed!: ParsedDtrLoadRatingOptionsResponse;
        validation.execute("Zod Response Schema", () => {
          const result =
            DtrLoadRatingOptionsResponseSchema.safeParse(responseBody);
          expect(
            result.success,
            result.success
              ? "Zod validation passed"
              : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
          ).toBe(true);
          parsed = result.data!;
        });

        const mapped = DtrLoadRatingOptionsMapper.map(parsed.data);
        runItemRules(
          validator,
          validation,
          mapped,
          testCase.scenario === "live_oct" ||
            testCase.scenario === "live_unknown_query",
        );

        if (testCase.scenario === "live_oct") {
          console.info(
            JSON.stringify(
              {
                msg: "dtr_load_rating_options_live_response",
                query,
                itemCount: mapped.items.length,
                note: "live rating lists are not pinned",
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
