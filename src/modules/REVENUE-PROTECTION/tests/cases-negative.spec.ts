import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { ApiErrorResponseSchema } from "../../../core/schemas/api-response.schemas";
import { REVENUE_PROTECTION_CASES_PATH, buildCasesQueryString } from "../Api/cases.api";
import { casesDefaultQuery } from "../Data/cases.data";
import { casesNegativeCases } from "../Data/cases-negative.data";
import { RevenueCommonValidator,type RevenueErrorBody,} from "../Validator/revenue-common.validator";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { CasesMapper } from "../Mapper/cases.mapper";
import type { CasesRawData } from "../Mapper/cases.mapper";
import {
  buildRevenueProtectionUrl,
  getRevenueProtectionWithRetry,
} from "../utils/revenue-protection-request.helper";
test.describe("Revenue Protection — Cases Negative", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);
  for (const negativeCase of casesNegativeCases) {
    test(
      negativeCase.testName,
      { tag: negativeCase.tags },
      async ({ authenticatedApi }) => {
        await applyAllureTestCaseId(negativeCase.testCaseId);
        const validation = new ValidationEngine();
        const { response: rawResponse } = await getRevenueProtectionWithRetry(
          authenticatedApi,
          buildRevenueProtectionUrl(REVENUE_PROTECTION_CASES_PATH, negativeCase.params),
        );
        const body = (await rawResponse
          .json()
          .catch(() => ({}))) as RevenueErrorBody;
        validation.execute("Expected status", () => {
          if (!negativeCase.expectedStatuses.includes(rawResponse.status())) {
            throw new Error(
              `Expected one of ${negativeCase.expectedStatuses.join(", ")} but got ${rawResponse.status()}`,
            );
          }
        });
        if (negativeCase.outcome === "hard-reject") {
          validation.execute("Rejected with error envelope", () =>
            RevenueCommonValidator.validateErrorEnvelope(
              rawResponse.status(),
              body,
            ),
          );
          validation.execute("ErrorResponseSchema", () =>
            assertZodSchema(ApiErrorResponseSchema, body),
          );
        } else if (negativeCase.outcome === "empty-page") {
          validation.execute("Empty page beyond total", () => {
            expect(body.success).toBeTruthy();
            const mapped = CasesMapper.mapData(body.data as CasesRawData);
            expect(mapped.rows.length).toBe(0);
            expect(mapped.pagination.page).toBe(
              Number(negativeCase.params.page ?? 9999),
            );
            // Must not silently fall back to page 1 with data
            expect(mapped.pagination.page).not.toBe(1);
          });
        } else if (rawResponse.status() >= 400) {
          validation.execute("ErrorResponseSchema", () =>
            assertZodSchema(ApiErrorResponseSchema, body),
          );
        } else {
          validation.execute("Empty success grid", () =>
            RevenueCommonValidator.validateEmptySuccessGrid(
              rawResponse.status(),
              body,
            ),
          );
        }
        validation.printSummary(negativeCase.testName, 0);
      },
    );
  }

  test(
    "IND-RPT-NEG-014 — organisationLookupId does not bypass JWT data scope",
    { tag: ["@revenue-protection", "@cases", "@negative", "@auth"] },
    async ({ authenticatedApi }) => {
      await applyAllureTestCaseId("IND-RPT-NEG-014");
      const crossOrgId = process.env.RP_CROSS_CIRCLE_ORG_ID?.trim();
      test.skip(
        !crossOrgId,
        "Set RP_CROSS_CIRCLE_ORG_ID to exercise organisationLookupId on detail",
      );

      const validation = new ValidationEngine();
      const { response: baseline } = await getRevenueProtectionWithRetry(
        authenticatedApi,
        `${REVENUE_PROTECTION_CASES_PATH}?${buildCasesQueryString(casesDefaultQuery)}`,
      );
      const baselineBody = (await baseline
        .json()
        .catch(() => ({}))) as RevenueErrorBody;
      const baselineMapped = CasesMapper.mapData(
        baselineBody.data as CasesRawData,
      );

      const crossUrl = `${REVENUE_PROTECTION_CASES_PATH}?${buildCasesQueryString({
        ...casesDefaultQuery,
        organisationLookupId: Number(crossOrgId),
      })}`;
      const { response: rawResponse } = await getRevenueProtectionWithRetry(
        authenticatedApi,
        crossUrl,
      );
      const body = (await rawResponse
        .json()
        .catch(() => ({}))) as RevenueErrorBody;

      /**
       * Detail is scoped by JWT claims (DataScopeClaims), not by a foreign
       * organisationLookupId. Passing another org id must not expand results
       * beyond the caller's scope — expect 401/403, or 200 with the same
       * scoped total (param ignored), never a larger dataset.
       */
      validation.execute("Cross-org scope preserved", () => {
        if ([401, 403].includes(rawResponse.status())) {
          assertZodSchema(ApiErrorResponseSchema, body);
          return;
        }
        expect(rawResponse.status()).toBe(200);
        expect(body.success).toBeTruthy();
        const mapped = CasesMapper.mapData(body.data as CasesRawData);
        expect(mapped.pagination.total).toEqual(
          baselineMapped.pagination.total,
        );
      });
      validation.printSummary("Cases — Cross Circle Scope", 0);
    },
  );
});
