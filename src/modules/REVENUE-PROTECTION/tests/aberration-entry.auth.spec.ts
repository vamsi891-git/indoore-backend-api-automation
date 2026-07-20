import { expect } from "@playwright/test";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { ApiErrorResponseSchema } from "../../../core/schemas/api-response.schemas";
import { buildAberrationEntryQueryString } from "../Api/aberration-entry.api";
import { aberrationEntryDefaultQuery } from "../Data/aberration-entry.data";
import { aberrationEntryEenltmtDefaultQuery } from "../Data/aberration-entry-eenltmt.data";
import {
  RevenueCommonValidator,
  revenueProtectionAuthData,
  revenueProtectionPaths,
  type RevenueErrorBody,
} from "../Validator/revenue-common.validator";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";

const aberrationEntryUrl = `${revenueProtectionPaths.aberrationEntry}?${buildAberrationEntryQueryString(aberrationEntryDefaultQuery)}`;
const aberrationEntryEenltmtUrl = `${revenueProtectionPaths.aberrationEntryEenltmt}?${buildAberrationEntryQueryString(aberrationEntryEenltmtDefaultQuery)}`;

authTest.describe("Revenue Protection — Aberration Entry Auth Negative", () => {
  authTest.describe.configure({ mode: "serial" });
  authTest.setTimeout(180_000);

  authTest(
    "IND-REV-ABE-ENTRY-AUTH-001 — Request without Authorization header",
    { tag: ["@revenue-protection", "@aberration-entry", "@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      await applyAllureTestCaseId("IND-REV-ABE-ENTRY-AUTH-001");
      const validation = new ValidationEngine();
      const rawResponse = await RevenueCommonValidator.getUnauthenticated(
        unauthenticatedApi,
        aberrationEntryUrl,
      );
      const body = (await rawResponse.json().catch(() => ({}))) as RevenueErrorBody;
      validation.execute("Unauthorized", () =>
        RevenueCommonValidator.validateUnauthorizedError(rawResponse.status(), body),
      );
      validation.execute("ErrorResponseSchema", () =>
        assertZodSchema(ApiErrorResponseSchema, body),
      );
      validation.printSummary("Aberration Entry — Missing Auth", 0);
    },
  );

  authTest(
    "IND-REV-ABE-ENTRY-AUTH-002 — Invalid bearer token",
    { tag: ["@revenue-protection", "@aberration-entry", "@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      await applyAllureTestCaseId("IND-REV-ABE-ENTRY-AUTH-002");
      const validation = new ValidationEngine();
      const rawResponse = await RevenueCommonValidator.getUnauthenticated(
        unauthenticatedApi,
        aberrationEntryUrl,
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
      validation.execute("ErrorResponseSchema", () =>
        assertZodSchema(ApiErrorResponseSchema, body),
      );
      validation.printSummary("Aberration Entry — Invalid Token", 0);
    },
  );

  authTest(
    "IND-REV-ABE-ENTRY-AUTH-003 — Unsupported HTTP method",
    { tag: ["@revenue-protection", "@aberration-entry", "@negative", "@auth"] },
    async ({ unauthenticatedApi }) => {
      await applyAllureTestCaseId("IND-REV-ABE-ENTRY-AUTH-003");
      const validation = new ValidationEngine();
      const callers = RevenueCommonValidator.getDisallowedMethodCallers(
        unauthenticatedApi,
        revenueProtectionPaths.aberrationEntry,
      );
      for (const method of revenueProtectionAuthData.disallowedMethods) {
        const response = await callers[method]();
        validation.execute(`${method} rejected`, () =>
          RevenueCommonValidator.validateDisallowedMethodRejected(response.status()),
        );
      }
      validation.printSummary("Aberration Entry — Disallowed Methods", 0);
    },
  );
});

authTest.describe("Revenue Protection — Aberration Entry EENLTMT Auth Negative", () => {
  authTest.describe.configure({ mode: "serial" });
  authTest.setTimeout(180_000);

  authTest(
    "IND-REV-ABE-EEN-AUTH-001 — Request without Authorization header",
    {
      tag: [
        "@revenue-protection",
        "@aberration-entry-eenltmt",
        "@negative",
        "@auth",
      ],
    },
    async ({ unauthenticatedApi }) => {
      await applyAllureTestCaseId("IND-REV-ABE-EEN-AUTH-001");
      const validation = new ValidationEngine();
      const rawResponse = await RevenueCommonValidator.getUnauthenticated(
        unauthenticatedApi,
        aberrationEntryEenltmtUrl,
      );
      const body = (await rawResponse.json().catch(() => ({}))) as RevenueErrorBody;
      validation.execute("Unauthorized", () =>
        RevenueCommonValidator.validateUnauthorizedError(rawResponse.status(), body),
      );
      validation.execute("ErrorResponseSchema", () =>
        assertZodSchema(ApiErrorResponseSchema, body),
      );
      validation.printSummary("EENLTMT Aberration Entry — Missing Auth", 0);
    },
  );

  authTest(
    "IND-REV-ABE-EEN-AUTH-002 — Invalid bearer token",
    {
      tag: [
        "@revenue-protection",
        "@aberration-entry-eenltmt",
        "@negative",
        "@auth",
      ],
    },
    async ({ unauthenticatedApi }) => {
      await applyAllureTestCaseId("IND-REV-ABE-EEN-AUTH-002");
      const validation = new ValidationEngine();
      const rawResponse = await RevenueCommonValidator.getUnauthenticated(
        unauthenticatedApi,
        aberrationEntryEenltmtUrl,
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
      validation.execute("ErrorResponseSchema", () =>
        assertZodSchema(ApiErrorResponseSchema, body),
      );
      validation.printSummary("EENLTMT Aberration Entry — Invalid Token", 0);
    },
  );

  authTest(
    "IND-REV-ABE-EEN-AUTH-003 — Unsupported HTTP method",
    {
      tag: [
        "@revenue-protection",
        "@aberration-entry-eenltmt",
        "@negative",
        "@auth",
      ],
    },
    async ({ unauthenticatedApi }) => {
      await applyAllureTestCaseId("IND-REV-ABE-EEN-AUTH-003");
      const validation = new ValidationEngine();
      const callers = RevenueCommonValidator.getDisallowedMethodCallers(
        unauthenticatedApi,
        revenueProtectionPaths.aberrationEntryEenltmt,
      );
      for (const method of revenueProtectionAuthData.disallowedMethods) {
        const response = await callers[method]();
        validation.execute(`${method} rejected`, () =>
          RevenueCommonValidator.validateDisallowedMethodRejected(response.status()),
        );
      }
      validation.printSummary("EENLTMT Aberration Entry — Disallowed Methods", 0);
    },
  );
});
