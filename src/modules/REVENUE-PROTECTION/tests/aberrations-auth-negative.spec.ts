import { expect } from "@playwright/test";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { buildAberrationsQueryString } from "../Api/aberrations.api";
import { aberrationsDefaultQuery } from "../Data/aberrations.data";
import {
  RevenueCommonValidator,
  revenueProtectionAuthData,
  revenueProtectionPaths,
  type RevenueErrorBody,
} from "../Validator/revenue-common.validator";
const aberrationsUrl = `${revenueProtectionPaths.aberrations}?${buildAberrationsQueryString(
  aberrationsDefaultQuery,
)}`;
authTest.describe("Revenue Protection — Aberrations Auth Negative", () => {
  authTest.describe.configure({ mode: "serial" });
  authTest.setTimeout(180_000);
  authTest("Aberrations rejects missing auth",
    { tag: ["@revenue-protection", "@aberrations", "@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const rawResponse = await RevenueCommonValidator.getUnauthenticated(
        unauthenticatedApi,
        aberrationsUrl,
      );
      const body = (await rawResponse
        .json()
        .catch(() => ({}))) as RevenueErrorBody;
      validation.execute("Unauthorized", () =>
        RevenueCommonValidator.validateUnauthorizedError(
          rawResponse.status(),
          body,
        ),
      );
      validation.printSummary("Aberrations — Missing Auth", 0);
    },
  );
  authTest("Aberrations rejects invalid bearer token",
    { tag: ["@revenue-protection", "@aberrations", "@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const rawResponse = await RevenueCommonValidator.getUnauthenticated(
        unauthenticatedApi,
        aberrationsUrl,
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
        expect([
          revenueProtectionAuthData.expectedUnauthorizedCode,
          revenueProtectionAuthData.expectedInvalidTokenCode,
        ]).toContain(body.error?.code);
      });
      validation.printSummary("Aberrations — Invalid Token", 0);
    },
  );
  authTest("Aberrations rejects disallowed HTTP methods",
    { tag: ["@revenue-protection", "@aberrations", "@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const callers = RevenueCommonValidator.getDisallowedMethodCallers(
        unauthenticatedApi,
        revenueProtectionPaths.aberrations,
      );
      for (const method of revenueProtectionAuthData.disallowedMethods) {
        const response = await callers[method]();
        validation.execute(`${method} rejected`, () =>
          RevenueCommonValidator.validateDisallowedMethodRejected(
            response.status(),
          ),
        );
      }
      validation.printSummary("Aberrations — Disallowed Methods", 0);
    },
  );
});
