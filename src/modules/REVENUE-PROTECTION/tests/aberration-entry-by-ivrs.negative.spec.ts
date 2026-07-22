import { test } from "../../../fixtures/observability.fixture";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { ApiErrorResponseSchema } from "../../../core/schemas/api-response.schemas";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { AberrationEntryApi } from "../Api/aberration-entry.api";
import { aberrationEntryByIvrsNegativeCases } from "../Data/aberration-entry-by-ivrs-negative.data";
import type { AberrationEntryUpdatePayload } from "../Mapper/aberration-entry-by-ivrs.mapper";
import {
  RevenueCommonValidator,
  type RevenueErrorBody,
} from "../Validator/revenue-common.validator";
import { resolveAberrationEntryIvrsForUpdate } from "../utils/aberration-entry-by-ivrs.helper";
test.describe("Revenue Protection — Aberration Entry By IVRS Negative", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);
  for (const negativeCase of aberrationEntryByIvrsNegativeCases) {
    test(
      negativeCase.testName,
      { tag: [...negativeCase.tags] },
      async ({ authenticatedApi, obs }) => {
        await applyAllureTestCaseId(negativeCase.testCaseId);
        const ivrsNo =
          negativeCase.ivrsNo.trim().length > 0
            ? negativeCase.ivrsNo
            : await resolveAberrationEntryIvrsForUpdate(authenticatedApi);
        const api = new AberrationEntryApi(authenticatedApi);
        const validation = new ValidationEngine(obs);
        const { rawResponse, responseBody } =
          await api.patchAberrationEntryByIvrs(
            ivrsNo,
            negativeCase.payload as AberrationEntryUpdatePayload,
          );
        const body = responseBody as RevenueErrorBody;
        validation.execute("Expected status", () => {
          const allowed = negativeCase.expectedStatuses as readonly number[];
          if (!allowed.includes(rawResponse.status())) {
            throw new Error(
              `Expected one of ${negativeCase.expectedStatuses.join(", ")} but got ${rawResponse.status()}`,
            );
          }
        });
        validation.execute("Rejected with error envelope", () =>
          RevenueCommonValidator.validateErrorEnvelope(
            rawResponse.status(),
            body,
            [negativeCase.expectedErrorCode],
          ),
        );
        validation.execute("ErrorResponseSchema", () =>
          assertZodSchema(ApiErrorResponseSchema, body),
        );

        validation.printSummary(negativeCase.testName, 0);
      },
    );
  }
});
