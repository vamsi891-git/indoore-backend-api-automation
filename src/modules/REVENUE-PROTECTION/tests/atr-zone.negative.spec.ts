import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { ApiErrorResponseSchema } from "../../../core/schemas/api-response.schemas";
import { REVENUE_PROTECTION_ATRZONE_PATH } from "../Api/atr-zone.api";
import { atrZoneNegativeCases } from "../Data/atr-zone-negative.data";
import {RevenueCommonValidator,type RevenueErrorBody,} from "../Validator/revenue-common.validator";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { AtrZoneMapper } from "../Mapper/atr-zone.mapper";
import type { AtrZoneRawData } from "../Mapper/atr-zone.mapper";
import {buildRevenueProtectionUrl,getRevenueProtectionWithRetry,} from "../utils/revenue-protection-request.helper";
test.describe("Revenue Protection — ATR Zone Negative", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);
  for (const negativeCase of atrZoneNegativeCases) {
    test(negativeCase.testName, { tag: negativeCase.tags }, async ({ authenticatedApi }) => {
      await applyAllureTestCaseId(negativeCase.testCaseId);
      const validation = new ValidationEngine();
      const { response: rawResponse } = await getRevenueProtectionWithRetry(
        authenticatedApi,
        buildRevenueProtectionUrl(REVENUE_PROTECTION_ATRZONE_PATH, negativeCase.params),
      );
      const body = (await rawResponse.json().catch(() => ({}))) as RevenueErrorBody;
      validation.execute("Expected status", () => {
        if (!negativeCase.expectedStatuses.includes(rawResponse.status())) {
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
          const mapped = AtrZoneMapper.mapData(body.data as AtrZoneRawData);
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
    });
  }
});