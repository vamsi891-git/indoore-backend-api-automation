import { expect } from "@playwright/test";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { ApiErrorResponseSchema } from "../../../core/schemas/api-response.schemas";
import { buildCasesQueryString } from "../Api/cases.api";
import { casesDefaultQuery } from "../Data/cases.data";
import {RevenueCommonValidator,revenueProtectionAuthData,revenueProtectionPaths,type RevenueErrorBody,} from "../Validator/revenue-common.validator";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
const casesUrl = `${revenueProtectionPaths.cases}?${buildCasesQueryString(casesDefaultQuery,)}`;
authTest.describe("Revenue Protection — Cases Auth Negative", () => {
  authTest.describe.configure({ mode: "serial" });
  authTest.setTimeout(180_000);
  authTest("IND-RPT-NEG-011 — Cases rejects missing auth",
    { tag: ["@revenue-protection", "@cases", "@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      await applyAllureTestCaseId("IND-RPT-NEG-011");
      const validation = new ValidationEngine();
      const rawResponse = await RevenueCommonValidator.getUnauthenticated(unauthenticatedApi,casesUrl,);
      const body = (await rawResponse
        .json()
        .catch(() => ({}))) as RevenueErrorBody;
      validation.execute("Unauthorized", () =>
        RevenueCommonValidator.validateUnauthorizedError(rawResponse.status(),body,),
      );
      validation.execute("ErrorResponseSchema", () =>
        assertZodSchema(ApiErrorResponseSchema, body),
      );
      validation.printSummary("Cases — Missing Auth", 0);
    },
  );
  authTest("IND-RPT-NEG-012 — Cases rejects invalid bearer token",
    { tag: ["@revenue-protection", "@cases", "@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      await applyAllureTestCaseId("IND-RPT-NEG-012");
      const validation = new ValidationEngine();
      const rawResponse = await RevenueCommonValidator.getUnauthenticated(unauthenticatedApi,casesUrl,
        {
          headers: {
            Authorization: revenueProtectionAuthData.invalidBearerToken,
          },
        },
      );
      const body = (await rawResponse
        .json()
        .catch(() => ({}))) as RevenueErrorBody;
      validation.execute("Unauthorized / invalid token", () => {
        expect(rawResponse.status()).toBe(401);
        expect(body.success).toBeFalsy();
        expect([revenueProtectionAuthData.expectedUnauthorizedCode,revenueProtectionAuthData.expectedInvalidTokenCode,]).toContain(body.error?.code);
      });
      validation.execute("ErrorResponseSchema", () =>
        assertZodSchema(ApiErrorResponseSchema, body),
      );
      validation.printSummary("Cases — Invalid Token", 0);
    },
  );
  authTest("IND-RPT-NEG-013 — Cases rejects disallowed HTTP methods",
    { tag: ["@revenue-protection", "@cases", "@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      await applyAllureTestCaseId("IND-RPT-NEG-013");
      const validation = new ValidationEngine();
      const callers = RevenueCommonValidator.getDisallowedMethodCallers(unauthenticatedApi,revenueProtectionPaths.cases,);
      for (const method of revenueProtectionAuthData.disallowedMethods) {
        const response = await callers[method]();
        validation.execute(`${method} rejected`, () =>
          RevenueCommonValidator.validateDisallowedMethodRejected(response.status(),),
        );
      }
      validation.printSummary("Cases — Disallowed Methods", 0);
    },
  );
});
