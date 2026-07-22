import { expect } from "@playwright/test";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { ApiErrorResponseSchema } from "../../../core/schemas/api-response.schemas";
import { buildAtrZoneQueryString } from "../Api/atr-zone.api";
import { atrZoneDefaultQuery } from "../Data/atr-zone.data";
import {RevenueCommonValidator,revenueProtectionAuthData,revenueProtectionPaths, // ADD `atrZone` to this map — see note below
type RevenueErrorBody,
} from "../Validator/revenue-common.validator";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
const atrZoneUrl = `${revenueProtectionPaths.atrZone}?${buildAtrZoneQueryString(atrZoneDefaultQuery)}`;
authTest.describe("Revenue Protection — ATR Zone Auth Negative", () => {
  authTest.describe.configure({ mode: "serial" });
  authTest.setTimeout(180_000);
  authTest("IND-RPT-ATZ-NEG-011 — ATR Zone rejects missing auth",
    { tag: ["@revenue-protection", "@atr-zone", "@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      await applyAllureTestCaseId("IND-RPT-ATZ-NEG-011");
      const validation = new ValidationEngine();
      const rawResponse = await RevenueCommonValidator.getUnauthenticated(unauthenticatedApi, atrZoneUrl);
      const body = (await rawResponse.json().catch(() => ({}))) as RevenueErrorBody;
      validation.execute("Unauthorized", () =>
        RevenueCommonValidator.validateUnauthorizedError(rawResponse.status(), body),
      );
      validation.execute("ErrorResponseSchema", () => assertZodSchema(ApiErrorResponseSchema, body));
      validation.printSummary("ATR Zone — Missing Auth", 0);
    },
  );
  authTest("IND-RPT-ATZ-NEG-012 — ATR Zone rejects invalid bearer token",
    { tag: ["@revenue-protection", "@atr-zone", "@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      await applyAllureTestCaseId("IND-RPT-ATZ-NEG-012");
      const validation = new ValidationEngine();
      const rawResponse = await RevenueCommonValidator.getUnauthenticated(
        unauthenticatedApi,
        atrZoneUrl,
        { headers: { Authorization: revenueProtectionAuthData.invalidBearerToken } },
      );
      const body = (await rawResponse.json().catch(() => ({}))) as RevenueErrorBody;
      validation.execute("Unauthorized / invalid token", () => {
        expect(rawResponse.status()).toBe(401);
        expect(body.success).toBeFalsy();
        expect([
          revenueProtectionAuthData.expectedUnauthorizedCode,
          revenueProtectionAuthData.expectedInvalidTokenCode,
        ]).toContain(body.error?.code);
      });
      validation.execute("ErrorResponseSchema", () => assertZodSchema(ApiErrorResponseSchema, body));
      validation.printSummary("ATR Zone — Invalid Token", 0);
    },
  );
  authTest("IND-RPT-ATZ-NEG-013 — ATR Zone rejects disallowed HTTP methods",
    { tag: ["@revenue-protection", "@atr-zone", "@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      await applyAllureTestCaseId("IND-RPT-ATZ-NEG-013");
      const validation = new ValidationEngine();
      const callers = RevenueCommonValidator.getDisallowedMethodCallers(
        unauthenticatedApi,
        revenueProtectionPaths.atrZone,
      );
      for (const method of revenueProtectionAuthData.disallowedMethods) {
        const response = await callers[method]();
        validation.execute(`${method} rejected`, () =>
          RevenueCommonValidator.validateDisallowedMethodRejected(response.status()),
        );
      }
      validation.printSummary("ATR Zone — Disallowed Methods", 0);
    },
  );
});