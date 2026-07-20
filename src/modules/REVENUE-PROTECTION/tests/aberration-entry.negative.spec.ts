import { expect } from "@playwright/test";
import { test } from "../../../fixtures/observability.fixture";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { ApiErrorResponseSchema } from "../../../core/schemas/api-response.schemas";
import { resolveAberrationEntryPath } from "../Api/aberration-entry.api";
import { aberrationEntryNegativeCases } from "../Data/aberration-entry-negative.data";
import { aberrationEntryEenltmtNegativeCases } from "../Data/aberration-entry-eenltmt-negative.data";
import {
  RevenueCommonValidator,
  type RevenueErrorBody,
} from "../Validator/revenue-common.validator";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { AberrationEntryMapper } from "../Mapper/aberration-entry.mapper";
import type { AberrationEntryRawData } from "../Mapper/aberration-entry.mapper";
import {
  buildRevenueProtectionUrl,
  getRevenueProtectionWithRetry,
} from "../utils/revenue-protection-request.helper";

test.describe("Revenue Protection — Aberration Entry Negative", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  for (const negativeCase of [
    ...aberrationEntryNegativeCases,
    ...aberrationEntryEenltmtNegativeCases,
  ]) {
    test(
      negativeCase.testName,
      { tag: [...negativeCase.tags] },
      async ({ authenticatedApi, obs }) => {
        await applyAllureTestCaseId(negativeCase.testCaseId);

        const validation = new ValidationEngine(obs);
        const { response: rawResponse } = await getRevenueProtectionWithRetry(
          authenticatedApi,
          buildRevenueProtectionUrl(
            resolveAberrationEntryPath(negativeCase.entryType),
            negativeCase.params,
          ),
        );
        const body = (await rawResponse.json().catch(() => ({}))) as RevenueErrorBody;

        validation.execute("Expected status", () => {
          const allowed = negativeCase.expectedStatuses as readonly number[];
          if (!allowed.includes(rawResponse.status())) {
            throw new Error(
              `Expected one of ${negativeCase.expectedStatuses.join(", ")} but got ${rawResponse.status()}`,
            );
          }
        });

        if (negativeCase.outcome === "hard-reject") {
          validation.execute("Rejected with error envelope", () =>
            RevenueCommonValidator.validateErrorEnvelope(rawResponse.status(), body),
          );
          validation.execute("ErrorResponseSchema", () =>
            assertZodSchema(ApiErrorResponseSchema, body),
          );
        } else if (negativeCase.outcome === "empty-page") {
          validation.execute("Empty page beyond total", () => {
            expect(body.success).toBeTruthy();
            const mapped = AberrationEntryMapper.mapData(body.data as AberrationEntryRawData);
            expect(mapped.rows.length).toBe(0);
            expect(mapped.pagination.page).toBe(Number(negativeCase.params.page ?? 9999));
            expect(mapped.pagination.page).not.toBe(1);
          });
        } else if (rawResponse.status() >= 400) {
          validation.execute("ErrorResponseSchema", () =>
            assertZodSchema(ApiErrorResponseSchema, body),
          );
        } else {
          validation.execute("Empty success grid", () =>
            RevenueCommonValidator.validateEmptySuccessGrid(rawResponse.status(), body),
          );
        }

        validation.printSummary(negativeCase.testName, 0);
      },
    );
  }
});
